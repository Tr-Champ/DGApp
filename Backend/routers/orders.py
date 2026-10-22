from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.order import OrderCreate, OrderResponse
from crud.crud_order import create_order, get_orders_by_user
from crud.crud_cart import clear_cart
from core.deps import get_current_user
from models.user import User

router = APIRouter()

@router.post("/", response_model=OrderResponse)
def checkout_order(order_data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = create_order(db, user_id=current_user.id, order_data=order_data)
    clear_cart(db, user_id=current_user.id)
    return order

@router.get("/", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_orders_by_user(db, user_id=current_user.id)