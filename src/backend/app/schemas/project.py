from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, description="ชื่อโปรเจกต์")
    client_name: Optional[str] = None
    status: str = "active"  # active | completed | archived
    started_at: Optional[date] = None
    ended_at: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[date] = None
    ended_at: Optional[date] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    client_name: Optional[str] = None
    status: str
    started_at: Optional[date] = None
    ended_at: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectWithStats(ProjectResponse):
    """Project + calculated financial stats."""
    total_income: float = 0.0
    total_expense: float = 0.0
    profit: float = 0.0
    transaction_count: int = 0
