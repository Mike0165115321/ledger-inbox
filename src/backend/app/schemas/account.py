from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, description="เช่น KBANK - Mike")
    type: str = "bank"  # bank | wallet | cash | promptpay
    bank_name: Optional[str] = None
    owner_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    is_active: bool = True


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    bank_name: Optional[str] = None
    owner_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    is_active: Optional[bool] = None


class AccountResponse(BaseModel):
    id: str
    name: str
    type: str
    bank_name: Optional[str] = None
    owner_name: Optional[str] = None
    account_number_masked: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
