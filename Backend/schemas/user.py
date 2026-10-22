from pydantic import BaseModel, EmailStr
from pydantic import ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    email: str
    is_admin: bool

class Token(BaseModel):
    access_token: str
    token_type: str