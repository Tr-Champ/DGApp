from pydantic import BaseModel, ConfigDict
from typing import Dict, List, Any, Optional

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    quantity: int = 0
    info: Optional[Dict[str, Any]] = {}
    images: Optional[List[str]] = []

class ProductCreate(ProductBase):
    id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    info: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None

class ProductResponse(ProductBase):
    model_config = {"from_attributes": True}

    id: str
