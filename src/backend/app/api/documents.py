"""
POST /api/documents/upload  — อัปโหลดสลิป (เก็บไฟล์, ยังไม่ใช้ AI)
GET  /api/documents         — รายการเอกสารทั้งหมด
"""

import os
import hashlib
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Document
from ..schemas.document import DocumentResponse
from ..core.config import UPLOAD_DIR

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
    """Upload a slip/document file. No AI extraction yet (Week 2)."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"ไฟล์ประเภท {file.content_type} ไม่รองรับ (รองรับ: jpg, png, pdf)",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Generate safe filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()

    # Calculate SHA-256 for future dedup
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
