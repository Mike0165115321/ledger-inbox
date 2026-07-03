"""
CRUD for /api/transactions
รองรับ filter: type, project_id, month
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Transaction
from ..schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
)

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    type: Optional[str] = Query(None, description="income | expense | transfer | personal | unknown"),
    project_id: Optional[str] = Query(None),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    review_status: Optional[str] = Query(None, description="pending | confirmed | edited | rejected"),
    db: Session = Depends(get_db),
):
    """List transactions with optional filters."""
    query = db.query(Transaction)

    if type:
        query = query.filter(Transaction.type == type)
    if project_id:
        query = query.filter(Transaction.project_id == project_id)
    if month:
        # Filter by YYYY-MM prefix on transaction_datetime (ISO string)
        query = query.filter(
            Transaction.transaction_datetime.like(f"{month}%")
        )
    if review_status:
        query = query.filter(Transaction.review_status == review_status)

    return query.order_by(Transaction.transaction_datetime.desc()).all()


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction manually."""
    tx = Transaction(**data.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(id: str, db: Session = Depends(get_db)):
    """Get a single transaction by ID."""
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    return tx


@router.put("/{id}", response_model=TransactionResponse)
async def update_transaction(
    id: str, data: TransactionUpdate, db: Session = Depends(get_db)
):
    """Update a transaction."""
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tx, key, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{id}")
async def delete_transaction(id: str, db: Session = Depends(get_db)):
    """Delete a transaction."""
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    db.delete(tx)
    db.commit()
    return {"message": "ลบรายการแล้ว"}


@router.post("/{id}/confirm", response_model=TransactionResponse)
async def confirm_transaction(id: str, db: Session = Depends(get_db)):
    """Confirm a pending transaction — move from Review Queue to confirmed."""
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    tx.review_status = "confirmed"
    db.commit()
    db.refresh(tx)
    return tx


@router.post("/{id}/reject")
async def reject_transaction(id: str, db: Session = Depends(get_db)):
    """Reject a pending transaction — mark as rejected."""
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="ไม่พบรายการ")
    tx.review_status = "rejected"
    db.commit()
    return {"message": "ปฏิเสธรายการแล้ว"}
