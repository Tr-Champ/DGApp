import uuid
from sqlalchemy.orm import Session
from models.order import Order
from models.product import Product
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

    # Decrement quantities and delete product if copies run out (quantity <= 0)
    if order_data.items and isinstance(order_data.items, list):
        for item in order_data.items:
            if not isinstance(item, dict) or item.get('is_customer_info'):
                continue
            prod_id = item.get('product_id') or item.get('id')
            qty = int(item.get('quantity') or 1)
            if prod_id:
                product = db.query(Product).filter(Product.id == str(prod_id)).first()
                if product:
                    new_qty = (product.quantity or 0) - qty
                    if new_qty <= 0:
                        db.delete(product)
                    else:
                        product.quantity = new_qty

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