from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..auth import verify_password, get_password_hash, create_access_token
from ..models import User, Teacher
from ..schemas import LoginRequest, TokenResponse


def login(payload: LoginRequest, db: Session) -> TokenResponse:
    uname = payload.username.strip().lower()
    pwd = payload.password.strip()

    # 1. Admin login fallback & auto-creation
    if uname == "admin" and pwd == "admin123":
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="admin",
                teacher_id=None,
            )
            try:
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = db.query(User).filter(User.username == "admin").first()

        user_id = user.id if user else 999
        token = create_access_token(
            user_id=user_id,
            username="admin",
            role="admin",
            teacher_id=None,
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            username="admin",
            role="admin",
            teacher_id=None,
            teacher_name="Institutional Administrator",
        )

    # 2. Query existing user by username
    user = db.query(User).filter(User.username == uname).first()

    # 3. If teacher user doesn't exist yet, check if teacher exists in teachers table
    if not user and pwd == "teacher123":
        # Search by teacher full name or code
        teacher = db.query(Teacher).filter(
            (Teacher.full_name.ilike(f"%{uname}%")) | (Teacher.teacher_code.ilike(uname))
        ).first()
        if teacher:
            new_user = User(
                username=uname,
                password_hash=get_password_hash("teacher123"),
                role="teacher",
                teacher_id=teacher.id,
            )
            try:
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user = new_user
            except Exception:
                db.rollback()
                user = db.query(User).filter(User.username == uname).first()

    if not user or not verify_password(pwd, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    teacher_name = None
    if user.teacher_id:
        t = db.query(Teacher).filter(Teacher.id == user.teacher_id).first()
        if t:
            teacher_name = t.full_name

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
