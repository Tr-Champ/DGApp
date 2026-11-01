import uuid
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from models.cart import Cart

def _to_user_id(val: any):
    try:
        return int(val)
    except (ValueError, TypeError):
        return val

def get_cart_by_user(db: Session, user_id: any):
    uid = _to_user_id(user_id)
    cart = db.query(Cart).filter(Cart.user_id == uid).first()
    if not cart:
        cart = Cart(id=str(uuid.uuid4()), user_id=uid, items=[], total_price=0.0)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def update_cart(db: Session, user_id: any, items: list, total_price: float):
    cart = get_cart_by_user(db, user_id)
    cart.items = list(items)
    cart.total_price = total_price
    flag_modified(cart, "items")
    db.commit()
    db.refresh(cart)
    return cart

def clear_cart(db: Session, user_id: any):
    cart = get_cart_by_user(db, user_id)
    cart.items = []
    cart.total_price = 0.0
    flag_modified(cart, "items")
    db.commit()
    db.refresh(cart)
    return cart
