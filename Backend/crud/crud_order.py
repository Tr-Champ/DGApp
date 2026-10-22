from sqlalchemy.orm import Session
from models.order import Order
from schemas.order import OrderCreate

def create_order(db: Session, user_id: str, order_data: OrderCreate):
    db_order = Order(
        id=order_data.id,
        user_id=user_id,
        items=order_data.items,
        total_price=order_data.total_price,
        paid=False,
        delivered=False
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_user(db: Session, user_id: str):
    return db.query(Order).filter(Order.user_id == user_id).all()