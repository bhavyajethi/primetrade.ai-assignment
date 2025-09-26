from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from config import settings
from db.database import get_db
from db import crud
from schemas import user as user_schemas

# Defines the path where the client sends the username/password for token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a JSON Web Token (JWT) with user data and expiration."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decodes the JWT and fetches the corresponding User from the database.
    This serves as the main dependency for protected endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        token_data = user_schemas.TokenData(user_id=int(user_id), role=role)
    except JWTError:
        raise credentials_exception

    user = db.query(crud.models.User).filter(crud.models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    
    # Attach role name directly to the user object for convenience
    setattr(user, "role_name", role)
    
    return user

def require_role(required_role: str):
    """
    Function for Role-Based Access Control (RBAC).
    Usage: Depends(require_role("admin"))
    """
    def role_checker(current_user: crud.models.User = Depends(get_current_user)):
        if current_user.role_name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required role: {required_role}"
            )
        return current_user
    return role_checker