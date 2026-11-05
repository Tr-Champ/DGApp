from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..auth import verify_password, get_password_hash, create_access_token
from ..models import User, Teacher
from ..schemas import LoginRequest, RegisterRequest, ResetPasswordRequest, TokenResponse


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


def register(payload: RegisterRequest, db: Session) -> TokenResponse:
    uname = payload.username.strip().lower()
    pwd = payload.password.strip()
    role = payload.role.strip().lower()
    if role not in ("admin", "teacher"):
        role = "teacher"

    if not uname or not pwd:
        raise HTTPException(status_code=400, detail="Username and password are required")

    existing = db.query(User).filter(User.username == uname).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username is already taken")

    teacher_id = payload.teacher_id
    if role == "teacher" and not teacher_id:
        teacher = db.query(Teacher).filter(
            (Teacher.full_name.ilike(f"%{uname}%")) | (Teacher.teacher_code.ilike(uname)) | (Teacher.email.ilike(f"{uname}%"))
        ).first()
        if teacher:
            teacher_id = teacher.id

    new_user = User(
        username=uname,
        password_hash=get_password_hash(pwd),
        role=role,
        teacher_id=teacher_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    teacher_name = None
    if new_user.teacher_id:
        t = db.query(Teacher).filter(Teacher.id == new_user.teacher_id).first()
        if t:
            teacher_name = t.full_name

    token = create_access_token(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        teacher_id=new_user.teacher_id,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        teacher_id=new_user.teacher_id,
        teacher_name=teacher_name,
    )


def reset_password(payload: ResetPasswordRequest, db: Session) -> dict:
    uname = payload.username.strip().lower()
    new_pwd = payload.new_password.strip()
    if not uname or not new_pwd:
        raise HTTPException(status_code=400, detail="Username and new password are required")

    user = db.query(User).filter(User.username == uname).first()
    if not user:
        teacher = db.query(Teacher).filter(
            (Teacher.email.ilike(uname)) | (Teacher.teacher_code.ilike(uname)) | (Teacher.full_name.ilike(uname))
        ).first()
        if teacher:
            user = db.query(User).filter(User.teacher_id == teacher.id).first()
            if not user:
                user = User(
                    username=teacher.full_name.lower().replace(" ", ""),
                    password_hash=get_password_hash(new_pwd),
                    role="teacher",
                    teacher_id=teacher.id,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                return {"status": "success", "message": f"Password reset successfully for {user.username}"}

    if not user:
        raise HTTPException(status_code=404, detail=f"User '{uname}' not found")

    user.password_hash = get_password_hash(new_pwd)
    db.commit()
    return {"status": "success", "message": f"Password reset successfully for {user.username}"}
