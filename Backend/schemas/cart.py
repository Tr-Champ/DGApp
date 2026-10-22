from pydantic import BaseModel
from typing import List, Any

class CartUpdate(BaseModel):
    items: List[Any]
    total_price: float

class CartResponse(BaseModel):
    id: str
    user_id: str
    items: List[Any]
    total_price: float

    class Config:
        from_attributes = True