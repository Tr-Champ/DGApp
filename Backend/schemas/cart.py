from pydantic import BaseModel, ConfigDict
from typing import List, Any

class CartUpdate(BaseModel):
    items: List[Any]
    total_price: float

class CartResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: str
    items: List[Any]
    total_price: float