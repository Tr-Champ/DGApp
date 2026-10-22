from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.cart import CartResponse, CartUpdate
from crud.crud_cart import get_cart_by_user, update_cart, clear_cart
from core.deps import get_current_user
from models.user import User

router = APIRouter()

@router.get("/", response_model=CartResponse)
def get_my_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_cart_by_user(db, user_id=current_user.id)

@router.put("/", response_model=CartResponse)
def update_my_cart(cart_data: CartUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_cart(db, user_id=current_user.id, items=cart_data.items, total_price=cart_data.total_price)

@router.delete("/", response_model=CartResponse)
def clear_my_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return clear_cart(db, user_id=current_user.id)