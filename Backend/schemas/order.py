from pydantic import BaseModel
from typing import List, Any
from datetime import datetime

class OrderCreate(BaseModel):
    id: str
    items: List[Any]
    total_price: float

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[Any]
    total_price: float
    paid: bool
    delivered: bool
    created_at: datetime

    class Config:
        orm_mode = True