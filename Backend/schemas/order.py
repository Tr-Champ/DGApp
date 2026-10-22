from pydantic import BaseModel, ConfigDict
from typing import List, Any
from datetime import datetime

class OrderCreate(BaseModel):
    id: str
    items: List[Any]
    total_price: float

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    items: List[Any]
    total_price: float
    paid: bool
    delivered: bool
    created_at: datetime