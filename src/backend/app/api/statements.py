"""
POST /api/statements/import — นำเข้า bank statement CSV → pending transactions เข้า Review Queue

- เลือก account ว่า statement นี้เป็นของบัญชีไหน (ทิศเงินตีความจากมุมมองบัญชีนั้น)
- ไฟล์เดิม (SHA-256 ซ้ำ) นำเข้าซ้ำไม่ได้
- ทุกรายการเป็น review_status=pending, source=statement — คนต้องตรวจก่อนเข้าสมุดจริง
"""

import hashlib
import os
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..core.config import UPLOAD_DIR
from ..db.database import get_db
from ..db.models import Account, Document
from ..services.statement_service import import_rows, parse_statement_csv

router = APIRouter(prefix="/api/statements", tags=["statements"])


@router.post("/import")
async def import_statement(
    file: UploadFile = File(...),
    account_id: str = Form(...),
    db: Session = Depends(get_db),
):
    """นำเข้า statement CSV: parse → dedup → สร้าง pending transactions ผูกกับบัญชีที่เลือก"""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชี — สร้างบัญชีในหน้า Accounts ก่อน")

    filename = file.filename or "statement.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="รองรับเฉพาะไฟล์ .csv (PDF จะตามมาภายหลัง)")

    content = await file.read()
    sha256 = hashlib.sha256(content).hexdigest()

    existing = db.query(Document).filter(Document.file_sha256 == sha256).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"ไฟล์นี้เคยนำเข้าแล้ว ({existing.file_name})",
        )

    parsed = parse_statement_csv(content)
    if not parsed.rows:
        raise HTTPException(
            status_code=400,
            detail="อ่านรายการจากไฟล์ไม่ได้: " + ("; ".join(parsed.errors) or "ไม่พบแถวข้อมูล"),
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    file_path = os.path.join(UPLOAD_DIR, f"{timestamp}_{filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        file_name=filename,
        file_type="csv",
        file_path=file_path,
        file_sha256=sha256,
        file_size=len(content),
        processing_status="completed",
        document_type="statement",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    summary = import_rows(
        db,
        rows=parsed.rows,
        account_id=account.id,
        account_bank_name=account.bank_name or account.name,
        statement_document_id=doc.id,
    )

    return {
        "document_id": doc.id,
        "account": account.name,
        "total_rows": summary.total_rows,
        "created": summary.created,
        "skipped_duplicates": summary.skipped_duplicates,
        "suspected_duplicates": summary.suspected_duplicates,
        "parse_errors": parsed.errors,
        "message": (
            f"นำเข้า {summary.created} รายการ (ข้ามซ้ำ {summary.skipped_duplicates}, "
            f"สงสัยซ้ำ {summary.suspected_duplicates}) — รอตรวจใน Review Queue"
        ),
    }
