"""
POST   /api/documents/upload       — อัปโหลดสลิป 1 ไฟล์ → เข้า queue
POST   /api/documents/upload/batch — อัปโหลดหลายไฟล์พร้อมกัน → เข้า queue ทั้งหมด
GET    /api/documents              — รายการเอกสารทั้งหมด
GET    /api/documents/{id}/file    — serve รูปไฟล์สลิป
DELETE /api/documents/{id}         — ลบเอกสาร
"""

import os
import hashlib
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..db.database import get_db, SessionLocal
from ..db.models import Document, Transaction
from ..schemas.document import DocumentResponse, DocumentUpdate
from ..core.config import UPLOAD_DIR
from ..services.upload_queue import upload_queue

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
}


def _save_and_enqueue(file_content: bytes, filename: str, content_type: str, db: Session) -> dict:
    """บันทึกไฟล์ + สร้าง Document record + เข้า queue — ใช้ซ้ำได้ทั้ง single และ batch"""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"ไฟล์ประเภท {content_type} ไม่รองรับ (รองรับ: jpg, png, pdf)",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    safe_name = f"{timestamp}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    sha256 = hashlib.sha256(file_content).hexdigest()

    with open(file_path, "wb") as f:
        f.write(file_content)

    doc = Document(
        file_name=filename,
        file_type=ALLOWED_TYPES[content_type],
        file_path=file_path,
        file_sha256=sha256,
        file_size=len(file_content),
        processing_status="queued",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    queue_position = upload_queue.enqueue(
        doc_id=str(doc.id),
        file_path=file_path,
        db_session_factory=SessionLocal,
    )

    return {
        "document_id": str(doc.id),
        "file_name": filename,
        "processing_status": "queued",
        "queue_position": queue_position,
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """อัปโหลดสลิป 1 ไฟล์ — เข้า queue ทันที ไม่รอ Gemini"""
    content = await file.read()
    return _save_and_enqueue(content, file.filename, file.content_type, db)


@router.post("/upload/batch")
async def upload_documents_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """อัปโหลดหลายสลิปพร้อมกัน — ทั้งหมดเข้า queue ตามลำดับ"""
    results = []
    for file in files:
        content = await file.read()
        try:
            result = _save_and_enqueue(content, file.filename, file.content_type, db)
            results.append(result)
        except HTTPException as e:
            results.append({
                "file_name": file.filename,
                "processing_status": "error",
                "error": e.detail,
            })
    return {"queued": len([r for r in results if r.get("processing_status") == "queued"]),
            "items": results}


@router.get("", response_model=list[DocumentResponse], operation_id="list_documents")
async def list_documents(db: Session = Depends(get_db)):
    """รายการเอกสารทั้งหมด — เรียงล่าสุดก่อน"""
    return (
        db.query(Document)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(doc_id: str, data: DocumentUpdate, db: Session = Depends(get_db)):
    """แก้ไข document_type / project_id ของเอกสาร"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)

    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}/file")
async def get_document_file(doc_id: str, db: Session = Depends(get_db)):
    """Serve รูปภาพหรือไฟล์ของเอกสาร"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์")

    media_map = {"jpg": "image/jpeg", "png": "image/png", "pdf": "application/pdf"}
    media_type = media_map.get(doc.file_type, "application/octet-stream")
    return FileResponse(doc.file_path, media_type=media_type, filename=doc.file_name)


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """ลบเอกสารและยกเลิกการเชื่อมโยงกับ transaction"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    db.query(Transaction).filter(Transaction.document_id == doc_id).update(
        {Transaction.document_id: None}
    )

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return {"message": "ลบเอกสารแล้ว"}
