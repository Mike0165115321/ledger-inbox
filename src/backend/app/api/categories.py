"""
GET /api/categories — รายการหมวดหมู่ทั้งหมด
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Category
from ..schemas.category import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """List all categories, grouped by type."""
    return (
        db.query(Category)
        .order_by(Category.type, Category.name)
        .all()
    )
