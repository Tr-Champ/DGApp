from pydantic import BaseModel, ConfigDict
from typing import Dict, List, Any

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    price: float
    quantity: int
    info: Dict[str, Any] = {}
    images: List[str] = []