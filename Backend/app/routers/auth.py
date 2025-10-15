"""
Authentication Routes (PostgreSQL)

API endpoints for:
- User registration
- User login
- User logout
- Get current user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schema.user_schema import UserCreate, UserResponse, UserLogin
from app.services.auth_service import AuthService
from app.routers.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    """
    return await AuthService.register_user(user_data, db)


@router.post("/login")
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login and receive access token
    """
    return await AuthService.authenticate_user(credentials, db)


@router.post("/logout")
async def logout(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user (mark them offline)
    """
    await AuthService.logout_user(current_user.email, db)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user=Depends(get_current_user)
):
    """
    Get current user's information
    """
    return UserResponse.from_orm(current_user)


@router.get("/health")
async def auth_health():
    """
    Health check endpoint for authentication service
    """
    return {"status": "healthy", "service": "authentication"}
