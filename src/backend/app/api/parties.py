"""
CRUD for /api/parties — คู่ค้า (ลูกค้า/vendor/ฯลฯ)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Party, Transaction
from ..schemas.party import PartyCreate, PartyUpdate, PartyResponse

router = APIRouter(prefix="/api/parties", tags=["parties"])


@router.get("", response_model=list[PartyResponse])
async def list_parties(
    type: Optional[str] = Query(None, description="client | vendor | middleman | platform | personal | government"),
    db: Session = Depends(get_db),
):
    """List all parties."""
    query = db.query(Party)
    if type:
        query = query.filter(Party.type == type)
    return query.order_by(Party.name).all()


@router.post("", response_model=PartyResponse, status_code=201)
async def create_party(data: PartyCreate, db: Session = Depends(get_db)):
    """Create a new party."""
    party = Party(**data.model_dump())
    db.add(party)
    db.commit()
    db.refresh(party)
    return party


@router.get("/{id}", response_model=PartyResponse)
async def get_party(id: str, db: Session = Depends(get_db)):
    """Get a single party by ID."""
    party = db.query(Party).filter(Party.id == id).first()
    if not party:
        raise HTTPException(status_code=404, detail="ไม่พบคู่ค้า")
    return party


@router.put("/{id}", response_model=PartyResponse)
async def update_party(id: str, data: PartyUpdate, db: Session = Depends(get_db)):
    """Update a party."""
    party = db.query(Party).filter(Party.id == id).first()
    if not party:
        raise HTTPException(status_code=404, detail="ไม่พบคู่ค้า")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(party, key, value)

    db.commit()
    db.refresh(party)
    return party


@router.delete("/{id}")
async def delete_party(id: str, db: Session = Depends(get_db)):
    """Delete a party. Transactions are NOT cascade-deleted — they become unassigned."""
    party = db.query(Party).filter(Party.id == id).first()
    if not party:
        raise HTTPException(status_code=404, detail="ไม่พบคู่ค้า")

    db.query(Transaction).filter(Transaction.party_id == id).update(
        {Transaction.party_id: None}
    )

    db.delete(party)
    db.commit()
    return {"message": "ลบคู่ค้าแล้ว"}
