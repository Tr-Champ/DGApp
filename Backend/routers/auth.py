from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import (
    DeviceRegisterRequest,
    DeviceLoginRequest,
    DeviceRebindRequest,
    AuthResponse,
    UserResponse
)
from crud.crud_user import (
    get_user_by_email,
    get_user_by_device_token,
    create_user_with_device,
    rebind_user_device
)
from core.security import create_access_token

router = APIRouter()

def _generate_user_token(user) -> str:
    """Helper to generate JWT payload with userId, email, and isAdmin."""
    return create_access_token(data={
        "sub": user.email,
        "userId": str(user.id),
        "email": user.email,
        "isAdmin": bool(user.is_admin)
    })

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: DeviceRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account with a hardware-backed device_token.
    Customer by default (is_admin = False).
    """
    clean_email = body.email.strip().lower()
    clean_token = body.device_token.strip()

    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid hardware device token is required."
        )

    # Check if email is already taken
    existing_user = get_user_by_email(db, email=clean_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check if this physical device is already bound to another account
    existing_device = get_user_by_device_token(db, device_token=clean_token)
    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This device is already registered to another account. Use Rebind Device if you are switching accounts."
        )

    new_user = create_user_with_device(
        db=db,
        email=clean_email,
        device_token=clean_token,
        is_admin=bool(body.is_admin) if body.is_admin else False
    )

    jwt_token = _generate_user_token(new_user)

    return AuthResponse(
        success=True,
        token=jwt_token,
        access_token=jwt_token,
        token_type="bearer",
        user=UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            is_admin=bool(new_user.is_admin)
        ),
        message="Account registered successfully"
    )

@router.post("/login", response_model=AuthResponse)
def login(body: DeviceLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate using hardware-backed device_token verified by OS Lock (PIN/Pattern/Biometrics).
    """
    clean_token = body.device_token.strip()
    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unrecognized device"
        )

    user = get_user_by_device_token(db, device_token=clean_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unrecognized device"
        )

    jwt_token = _generate_user_token(user)

    return AuthResponse(
        success=True,
        token=jwt_token,
        access_token=jwt_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            is_admin=bool(user.is_admin)
        ),
        message="Login successful"
    )

@router.post("/rebind-device", response_model=AuthResponse)
def rebind_device(body: DeviceRebindRequest, db: Session = Depends(get_db)):
    """
    Device Recovery / Replacement:
    Claim/rebind an existing account to this new phone or cleared storage.
    """
    clean_email = body.email.strip().lower()
    clean_token = body.new_device_token.strip()

    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid new device token is required."
        )

    user = get_user_by_email(db, email=clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    # If new_device_token belongs to someone else, disassociate old entry
    conflicting_user = get_user_by_device_token(db, device_token=clean_token)
    if conflicting_user and conflicting_user.id != user.id:
        conflicting_user.device_token = f"revoked_{conflicting_user.id}_{clean_token[:8]}"
        db.commit()

    updated_user = rebind_user_device(db=db, user=user, new_device_token=clean_token)
    jwt_token = _generate_user_token(updated_user)

    return AuthResponse(
        success=True,
        token=jwt_token,
        access_token=jwt_token,
        token_type="bearer",
        user=UserResponse(
            id=str(updated_user.id),
            email=updated_user.email,
            is_admin=bool(updated_user.is_admin)
        ),
        message="Device rebound successfully"
    )