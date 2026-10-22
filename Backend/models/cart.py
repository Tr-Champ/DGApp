from sqlalchemy import Column, String, DECIMAL, ForeignKey, JSON
from database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    items = Column(JSON, default=[])
    total_price = Column(DECIMAL(10, 2), default=0.0)