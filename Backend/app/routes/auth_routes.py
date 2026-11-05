from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import LoginRequest, RegisterRequest, ResetPasswordRequest, TokenResponse
from ..controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate teacher or admin using username and password. Returns JWT token."""
    return auth_controller.login(payload, db)


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with role ('admin' or 'teacher')."""
    return auth_controller.register(payload, db)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password after phone screen lock verification."""
    return auth_controller.reset_password(payload, db)
