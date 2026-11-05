from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..connection import get_db
from ..schemas import LoginRequest, TokenResponse
from ..controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate teacher or admin using username and password. Returns JWT token."""
    return auth_controller.login(payload, db)
