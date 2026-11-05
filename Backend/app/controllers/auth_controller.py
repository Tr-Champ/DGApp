from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..auth import verify_password, create_access_token
from ..models import User, Teacher
from ..schemas import LoginRequest, TokenResponse


def login(payload: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    teacher_name = None
    if user.teacher_id:
        teacher = db.query(Teacher).filter(Teacher.id == user.teacher_id).first()
        if teacher:
            teacher_name = teacher.full_name

    token = create_access_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        teacher_id=user.teacher_id,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=user.role,
        teacher_id=user.teacher_id,
        teacher_name=teacher_name,
    )
