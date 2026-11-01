from datetime import datetime
from sqlalchemy import Column, Integer, String, DECIMAL, Boolean, DateTime, ForeignKey, JSON, func
from database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    items = Column(JSON, nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    paid = Column(Boolean, default=False)
    delivered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
