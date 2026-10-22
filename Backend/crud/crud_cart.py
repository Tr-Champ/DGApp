from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from models.cart import Cart
import uuid

def get_cart_by_user(db: Session, user_id: str):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(id=str(uuid.uuid4()), user_id=user_id, items=[], total_price=0.0)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def update_cart(db: Session, user_id: str, items: list, total_price: float):
    cart = get_cart_by_user(db, user_id)
    cart.items = list(items)
    cart.total_price = total_price
    flag_modified(cart, "items")
    db.commit()
    db.refresh(cart)
    return cart

def clear_cart(db: Session, user_id: str):
    cart = get_cart_by_user(db, user_id)
    cart.items = []
    cart.total_price = 0.0
    flag_modified(cart, "items")
    db.commit()
    db.refresh(cart)
    return cart