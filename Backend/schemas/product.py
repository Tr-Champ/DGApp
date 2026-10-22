from pydantic import BaseModel
from typing import Dict, List, Any

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    quantity: int
    info: Dict[str, Any] = {}
    images: List[str] = []

    class Config:
        orm_mode = True