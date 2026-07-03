"""
SlipExtractionResult — output from Slip Reader (Qwen3-VL or EasySlip)

Used by Business Agent to create transactions.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SlipExtractionResult(BaseModel):
    """Structured output after slip reading."""

    amount: Optional[float] = Field(None, description="จำนวนเงินที่อ่านได้")
    currency: str = Field("THB", description="สกุลเงิน")
    transaction_datetime: Optional[datetime] = Field(None, description="วันที่-เวลาบนสลิป")
    sender_name: Optional[str] = Field(None, description="ชื่อผู้ส่งเงิน")
    receiver_name: Optional[str] = Field(None, description="ชื่อผู้รับเงิน")
    bank_or_wallet: Optional[str] = Field(None, description="ธนาคารหรือ Wallet")
    reference_no: Optional[str] = Field(None, description="เลขอ้างอิง / QR code")
    note: Optional[str] = Field(None, description="ข้อมูลเพิ่มเติมจากสลิป")
    confidence: float = Field(..., ge=0.0, le=1.0, description="ความมั่นใจของ AI 0.0-1.0")
    warnings: list[str] = Field(default_factory=list, description="คำเตือนจาก AI")

    def has_critical_missing_fields(self) -> bool:
        """Check if essential fields are missing."""
        missing = []
        if self.amount is None:
            missing.append("amount")
        if self.transaction_datetime is None:
            missing.append("date")
        if self.sender_name is None and self.receiver_name is None:
            missing.append("sender/receiver")
        return len(missing) > 0 or len(self.warnings) > 0

    def missing_fields(self) -> list[str]:
        """List which fields are missing."""
        missing = []
        if self.amount is None:
            missing.append("จำนวนเงิน (amount)")
        if self.transaction_datetime is None:
            missing.append("วันที่ (date)")
        if self.sender_name is None and self.receiver_name is None:
            missing.append("ชื่อผู้ส่ง/ผู้รับ (sender/receiver)")
        return missing


class SlipProcessResponse(BaseModel):
    """Response after processing a slip."""
    document_id: str
    transaction_id: Optional[str] = None
    processing_status: str  # completed | waiting_model | failed
    extraction: Optional[SlipExtractionResult] = None
    review_status: Optional[str] = None  # confirmed | pending
    error_message: Optional[str] = None
