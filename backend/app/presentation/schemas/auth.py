from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    userprofile_id: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: str
    userprofile_id: Optional[int]
    is_active: bool
    
    class Config:
        from_attributes = True

