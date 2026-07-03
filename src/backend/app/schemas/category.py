from pydantic import BaseModel
from datetime import datetime


class CategoryResponse(BaseModel):
    id: str
    name: str
    type: str  # income | expense
    created_at: datetime

    model_config = {"from_attributes": True}
