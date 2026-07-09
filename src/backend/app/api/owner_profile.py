"""
GET/PUT /api/owner-profile — ข้อมูลเจ้าของบัญชี (singleton)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import OwnerProfile
from ..schemas.owner_profile import OwnerProfileUpdate, OwnerProfileResponse

router = APIRouter(prefix="/api/owner-profile", tags=["owner-profile"])

SINGLETON_ID = "owner"


def _get_or_create(db: Session) -> OwnerProfile:
    profile = db.query(OwnerProfile).filter(OwnerProfile.id == SINGLETON_ID).first()
    if not profile:
        profile = OwnerProfile(id=SINGLETON_ID)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=OwnerProfileResponse)
async def get_owner_profile(db: Session = Depends(get_db)):
    """Get owner profile — creates a default (empty) row on first access."""
    return _get_or_create(db)


@router.put("", response_model=OwnerProfileResponse)
async def update_owner_profile(data: OwnerProfileUpdate, db: Session = Depends(get_db)):
    """Update owner profile."""
    profile = _get_or_create(db)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
