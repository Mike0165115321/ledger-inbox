from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_path: str
    file_sha256: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime
    processing_status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
