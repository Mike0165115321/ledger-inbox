"""
CRUD for /api/accounts — บัญชีธนาคาร/wallet ที่เป็นของเรา
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Account, Transaction
from ..schemas.account import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountResponse], operation_id="list_accounts")
async def list_accounts(
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """List all accounts."""
    query = db.query(Account)
    if is_active is not None:
        query = query.filter(Account.is_active == is_active)
    return query.order_by(Account.name).all()


@router.post("", response_model=AccountResponse, status_code=201)
async def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    """Create a new account."""
    account = Account(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{id}", response_model=AccountResponse, operation_id="get_account")
async def get_account(id: str, db: Session = Depends(get_db)):
    """Get a single account by ID."""
    account = db.query(Account).filter(Account.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชี")
    return account


@router.put("/{id}", response_model=AccountResponse)
async def update_account(id: str, data: AccountUpdate, db: Session = Depends(get_db)):
    """Update an account."""
    account = db.query(Account).filter(Account.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชี")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{id}")
async def delete_account(id: str, db: Session = Depends(get_db)):
    """Delete an account. Transactions are NOT cascade-deleted — they become unassigned."""
    account = db.query(Account).filter(Account.id == id).first()
    if not account:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชี")

    db.query(Transaction).filter(Transaction.account_id == id).update(
        {Transaction.account_id: None}
    )

    db.delete(account)
    db.commit()
    return {"message": "ลบบัญชีแล้ว"}
