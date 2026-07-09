from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OwnerProfileUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class OwnerProfileResponse(BaseModel):
    id: str
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}
