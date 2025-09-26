import re
from pydantic import BaseModel, EmailStr, field_validator

#  Base Schemas 

class UserBase(BaseModel):
    email: EmailStr

class RoleBase(BaseModel):
    name: str

#  Schemas for Creating/Logging In 

class UserCreate(BaseModel):
    email: str
    password: str

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(UserBase):
    password: str

#  Response Schemas 

class Role(RoleBase):
    id: int
    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    # Include Role for the response
    role: Role

    class Config:
        # Use from_attributes for SQLAlchemy compatibility (formerly orm_mode = True)
        from_attributes = True

#  Token Schemas 

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int | None = None
    role: str | None = None # Role will be stored in the JWT payload