from pydantic import BaseModel
from typing import List, Any, Union

class CartUpdate(BaseModel):
    items: List[Any]
    total_price: float

class CartResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    user_id: Union[str, int]
    items: List[Any]
    total_price: float
