from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserResponse
from core.deps import get_current_user
from models.user import User
from crud.crud_user import delete_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = delete_user(db, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account, orders, cart, and all user info deleted successfully"}

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_by_id(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Account, orders, cart, and all user info deleted successfully"}