from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TransactionCreate(BaseModel):
    type: str = Field(..., description="income | expense | transfer | personal | unknown")
    category: Optional[str] = None
    amount: float = Field(..., gt=0, description="จำนวนเงิน (บวกเสมอ)")
    currency: str = "THB"
    transaction_datetime: Optional[datetime] = None
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    bank_or_wallet: Optional[str] = None
    reference_no: Optional[str] = None
    note: Optional[str] = None
    project_id: Optional[str] = None
    document_id: Optional[str] = None
    account_id: Optional[str] = None
    party_id: Optional[str] = None
    tax_relevant: Optional[bool] = None
    withholding_tax_amount: Optional[float] = None
    vat_amount: Optional[float] = None
    source: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "type": "income",
                "category": "รายได้ฟรีแลนซ์",
                "amount": 50000.00,
                "transaction_datetime": "2026-07-03T10:00:00",
                "sender_name": "บริษัท ลูกค้า จำกัด",
                "bank_or_wallet": "KBANK",
                "note": "ค่าพัฒนาเว็บไซต์ — งวดที่ 2",
                "project_id": "uuid-here",
            }
        }


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    transaction_datetime: Optional[datetime] = None
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    bank_or_wallet: Optional[str] = None
    reference_no: Optional[str] = None
    note: Optional[str] = None
    project_id: Optional[str] = None
    document_id: Optional[str] = None
    account_id: Optional[str] = None
    party_id: Optional[str] = None
    tax_relevant: Optional[bool] = None
    withholding_tax_amount: Optional[float] = None
    vat_amount: Optional[float] = None
    source: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    type: str
    category: Optional[str] = None
    amount: float
    currency: str
    transaction_datetime: Optional[datetime] = None
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    bank_or_wallet: Optional[str] = None
    reference_no: Optional[str] = None
    note: Optional[str] = None
    confidence: float
    review_status: str
    duplicate_status: str
    project_id: Optional[str] = None
    document_id: Optional[str] = None
    account_id: Optional[str] = None
    party_id: Optional[str] = None
    tax_relevant: bool = False
    withholding_tax_amount: Optional[float] = None
    vat_amount: Optional[float] = None
    source: str = "manual"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
