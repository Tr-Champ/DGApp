import uuid
from sqlalchemy.orm import Session
from models.order import Order
from schemas.order import OrderCreate

def create_order(db: Session, user_id: str, order_data: OrderCreate):
    order_id = order_data.id if order_data.id else str(uuid.uuid4())
    db_order = Order(
        id=order_id,
        user_id=str(user_id),
        items=order_data.items,
        total_price=order_data.total_price,
        paid=True,
        delivered=False
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_user(db: Session, user_id: str):
    return db.query(Order).filter(Order.user_id == str(user_id)).order_by(Order.created_at.desc()).all()

def get_all_orders(db: Session):
    return db.query(Order).order_by(Order.created_at.desc()).all()

def mark_order_delivered(db: Session, order_id: str, user_id: str = None, is_admin: bool = False):
    query = db.query(Order).filter(Order.id == str(order_id))
    if not is_admin and user_id:
        query = query.filter(Order.user_id == str(user_id))
    order = query.first()
    if order:
        order.delivered = True
        db.commit()
        db.refresh(order)
    return order