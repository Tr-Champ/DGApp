from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.order import OrderCreate, OrderResponse
from crud.crud_order import create_order, get_orders_by_user, get_all_orders, mark_order_delivered
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

@router.get("/all", response_model=List[OrderResponse])
def get_admin_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        return get_orders_by_user(db, user_id=current_user.id)
    return get_all_orders(db)

@router.patch("/{order_id}/deliver", response_model=OrderResponse)
def deliver_order(order_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = mark_order_delivered(
        db,
        order_id=order_id,
        user_id=current_user.id,
        is_admin=current_user.is_admin
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you are not authorized to update this order."
        )
    return order