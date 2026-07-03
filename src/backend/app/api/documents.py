"""
POST   /api/documents/upload    — อัปโหลดสลิป + ประมวลผลด้วย EasySlip ทันที
GET    /api/documents           — รายการเอกสารทั้งหมด
"""

import os
import hashlib
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Document
from ..schemas.document import DocumentResponse
from ..schemas.slip import SlipProcessResponse
from ..core.config import UPLOAD_DIR
from ..services.easy_slip_service import easy_slip
from ..agents.business_agent import run_pipeline

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
    """Upload a slip and auto-process with EasySlip."""
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
        processing_status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Auto-process with EasySlip
    try:
        result = easy_slip.read(file_path)

        doc.extracted_text = str(result.model_dump())
        doc.processing_status = "completed"
        db.commit()

        # Run Business Agent → classify + dedup + review decision + save transaction
        tx = run_pipeline(result, doc, db)

        return SlipProcessResponse(
            document_id=doc.id,
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
            document_id=doc.id,
            processing_status="failed",
            error_message=str(e),
        )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents, newest first."""
    return (
        db.query(Document)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
