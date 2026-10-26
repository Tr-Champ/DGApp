from sqlalchemy.orm import Session
from models.user import User
from models.order import Order
from models.cart import Cart

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(User).filter(User.email == email.strip().lower()).first()

def get_user_by_device_token(db: Session, device_token: str):
    if not device_token:
        return None
    return db.query(User).filter(User.device_token == device_token.strip()).first()

def get_user_by_id(db: Session, user_id):
    if user_id is None:
        return None
    try:
        int_id = int(user_id)
        return db.query(User).filter(User.id == int_id).first()
    except (ValueError, TypeError):
        return db.query(User).filter(User.id == user_id).first()

def create_user_with_device(db: Session, email: str, device_token: str, is_admin: bool = False):
    cleaned_email = email.strip().lower()
    cleaned_token = device_token.strip()
    db_user = User(
        email=cleaned_email,
        device_token=cleaned_token,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def rebind_user_device(db: Session, user: User, new_device_token: str):
    cleaned_token = new_device_token.strip()
    user.device_token = cleaned_token
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id):
    str_user_id = str(user_id)
    # Cascade delete all orders and carts for this user
    try:
        int_id = int(user_id)
        db.query(Order).filter((Order.user_id == str_user_id) | (Order.user_id == str(int_id))).delete(synchronize_session=False)
        db.query(Cart).filter((Cart.user_id == str_user_id) | (Cart.user_id == str(int_id))).delete(synchronize_session=False)
    except (ValueError, TypeError):
        db.query(Order).filter(Order.user_id == str_user_id).delete(synchronize_session=False)
        db.query(Cart).filter(Cart.user_id == str_user_id).delete(synchronize_session=False)

    user = get_user_by_id(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False