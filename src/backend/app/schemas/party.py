from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PartyCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = "client"  # client | vendor | middleman | platform | personal | government
    tax_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    default_category: Optional[str] = None
    default_project_id: Optional[str] = None
    withholding_rate: Optional[float] = None
    notes: Optional[str] = None


class PartyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    default_category: Optional[str] = None
    default_project_id: Optional[str] = None
    withholding_rate: Optional[float] = None
    notes: Optional[str] = None


class PartyResponse(BaseModel):
    id: str
    name: str
    type: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    default_category: Optional[str] = None
    default_project_id: Optional[str] = None
    withholding_rate: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
