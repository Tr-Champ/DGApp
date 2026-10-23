from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate
from core.security import get_password_hash
import uuid

from models.order import Order
from models.cart import Cart

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(User).filter(User.email == email.strip().lower()).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        id=str(uuid.uuid4()),
        email=user.email.strip().lower(),
        password_hash=hashed_password,
        is_admin=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: str):
    # Cascade delete all orders and carts for the user
    db.query(Order).filter(Order.user_id == str(user_id)).delete()
    db.query(Cart).filter(Cart.user_id == str(user_id)).delete()
    user = db.query(User).filter(User.id == str(user_id)).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False