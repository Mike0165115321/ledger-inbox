"""
POST   /api/documents/upload            — อัปโหลดสลิป
GET    /api/documents                   — รายการเอกสารทั้งหมด
POST   /api/documents/{id}/process      — รัน Slip Reader pipeline
POST   /api/documents/{id}/retry-easyslip — manual EasySlip fallback
"""

import os
import hashlib
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Document
from ..schemas.document import DocumentResponse
from ..schemas.slip import SlipProcessResponse
from ..core.config import UPLOAD_DIR
from ..services.ollama_service import ollama
from ..services.slip_reader_service import slip_reader
from ..services.easy_slip_service import easy_slip
from ..agents.business_agent import run_pipeline, get_review_reasons

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a slip/document file."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"ไฟล์ประเภท {file.content_type} ไม่รองรับ (รองรับ: jpg, png, pdf)",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    sha256 = hashlib.sha256(content).hexdigest()

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        file_name=file.filename,
        file_type=ALLOWED_TYPES[file.content_type],
        file_path=file_path,
        file_sha256=sha256,
        file_size=len(content),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "file_name": doc.file_name,
        "status": doc.processing_status,
    }


@router.get("", response_model=list[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents, newest first."""
    return (
        db.query(Document)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.post("/{doc_id}/process", response_model=SlipProcessResponse)
async def process_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Run the Slip Reader pipeline on a document.

    Pipeline: health check → preprocess → Ollama → parse → validate
    If model not available → status = waiting_model
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    if doc.processing_status == "completed":
        return SlipProcessResponse(
            document_id=doc_id,
            processing_status="completed",
            error_message="Document already processed",
        )

    # Check model health
    if not ollama.is_running() or not ollama.is_model_available():
        doc.processing_status = "waiting_model"
        doc.error_message = "Local model unavailable — please start Ollama and download qwen3-vl"
        db.commit()
        return SlipProcessResponse(
            document_id=doc_id,
            processing_status="waiting_model",
            error_message=doc.error_message,
        )

    # Run pipeline
    try:
        doc.processing_status = "processing"
        db.commit()

        result = slip_reader.read(doc.file_path)

        doc.extracted_text = str(result.model_dump())
        doc.processing_status = "completed"
        doc.error_message = None
        db.commit()

        # Run Business Agent pipeline → classify + dedup + review decision + save transaction
        tx = run_pipeline(result, doc, db)

        return SlipProcessResponse(
            document_id=doc_id,
            transaction_id=tx.id,
            processing_status="completed",
            extraction=result,
            review_status=tx.review_status,
        )

    except Exception as e:
        doc.processing_status = "failed"
        doc.error_message = str(e)
        db.commit()
        return SlipProcessResponse(
            document_id=doc_id,
            processing_status="failed",
            error_message=str(e),
        )


@router.post("/{doc_id}/retry-easyslip", response_model=SlipProcessResponse)
async def retry_easyslip(
    doc_id: str,
    db: Session = Depends(get_db),
):
    """
    Manual EasySlip fallback — user must explicitly trigger.
    Never auto-fallback for privacy reasons.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    if not easy_slip.is_configured():
        raise HTTPException(
            status_code=400,
            detail="EasySlip API key not configured. Set EASYSLIP_API_KEY env variable.",
        )

    try:
        doc.processing_status = "processing"
        db.commit()

        result = easy_slip.read(doc.file_path)

        doc.extracted_text = str(result.model_dump())
        doc.processing_status = "completed"
        doc.error_message = None
        db.commit()

        # Run Business Agent pipeline
        tx = run_pipeline(result, doc, db)

        return SlipProcessResponse(
            document_id=doc_id,
            transaction_id=tx.id,
            processing_status="completed",
            extraction=result,
            review_status=tx.review_status,
        )

    except Exception as e:
        doc.processing_status = "failed"
        doc.error_message = str(e)
        db.commit()
        return SlipProcessResponse(
            document_id=doc_id,
            processing_status="failed",
            error_message=str(e),
        )
