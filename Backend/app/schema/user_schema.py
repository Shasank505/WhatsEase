"""
User Schemas for API Request/Response validation (PostgreSQL version)

These schemas define what data the API accepts and returns.
They are separate from database models because:
- We don't expose sensitive fields (like hashed_password)
- We accept different data for creation vs updates
- We validate input before it reaches the database
"""

from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional
import re
import uuid


# =========================================================
#  Base Schema
# =========================================================
class UserBase(BaseModel):
    """
    Base user schema with common fields
    Other schemas inherit from this to avoid repetition.
    """
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)

    @validator('username')
    def username_alphanumeric(cls, v):
        """
        Custom validator for username.
        Ensures username only contains letters, numbers, and underscores.
        """
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v


# =========================================================
#  Create Schema
# =========================================================
class UserCreate(UserBase):
    """
    Schema for user registration (creating a new user)
    Includes password which we'll hash before storing.
    """
    password: str = Field(..., min_length=6, max_length=72)
    avatar_url: Optional[str] = None  # ADDED: Optional avatar URL

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "username": "new_user",
                "full_name": "New User",
                "password": "password123"
            }
        }


# =========================================================
#  Update Schema
# =========================================================
class UserUpdate(BaseModel):
    """
    Schema for updating user information
    All fields are optional because user might update only one field.
    """
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None

    @validator('username')
    def username_alphanumeric(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v


# =========================================================
#  Response Schema (Read Model)
# =========================================================
class UserResponse(UserBase):
    """
    Schema for user data returned by the API.
    No password field (for security).
    Includes read-only fields like timestamps.
    """
    id: int
    is_active: bool
    is_online: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "john_doe",
                "full_name": "John Doe",
                "is_active": True,
                "is_online": False,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T12:00:00"
            }
        }


# =========================================================
#  Login Schema
# =========================================================
class UserLogin(BaseModel):
    """
    Schema for user login
    """
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }


# =========================================================
#  List Schema
# =========================================================
class UserInList(BaseModel):
    """
    Simplified user info for user listings or search results
    """
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_online: bool

    class Config:
        from_attributes = True