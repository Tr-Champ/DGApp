from sqlalchemy import Column, String, DECIMAL, Integer, JSON
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, default=0)
    info = Column(JSON, default={})
    images = Column(JSON, default=[])