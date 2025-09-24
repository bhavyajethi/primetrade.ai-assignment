from pydantic import BaseModel, EmailStr

# --- Base Schemas ---

class UserBase(BaseModel):
    email: EmailStr

class RoleBase(BaseModel):
    name: str

# --- Schemas for Creating/Logging In ---

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

# --- Response Schemas ---

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

# --- Token Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int | None = None
    role: str | None = None # Role will be stored in the JWT payload