from pydantic import BaseModel, ConfigDict
from typing import List, Any, Optional
from datetime import datetime

class OrderCreate(BaseModel):
    id: Optional[str] = None
    items: List[Any]
    total_price: float

class OrderResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: str
    items: List[Any]
    total_price: float
    paid: bool
    delivered: bool
    created_at: Optional[datetime] = None
