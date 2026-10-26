from typing import Optional, Any
from pydantic import BaseModel, EmailStr

class DeviceRegisterRequest(BaseModel):
    email: EmailStr
    device_token: str
    is_admin: Optional[bool] = False

class DeviceLoginRequest(BaseModel):
    device_token: str

class DeviceRebindRequest(BaseModel):
    email: EmailStr
    new_device_token: str

class UserResponse(BaseModel):
    id: Any
    email: str
    is_admin: bool

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    success: bool = True
    token: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserResponse] = None
    message: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"