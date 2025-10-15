"""
Authentication Service (PostgreSQL)
Handles user authentication, registration, and token management
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import bcrypt
import jwt
import logging

from app.models.user import User
from app.schema.user_schema import UserCreate, UserLogin
from app.config import settings

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service for user management"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        return encoded_jwt

    @staticmethod
    async def register_user(user_data: UserCreate, db: AsyncSession):
        """
        Register a new user
        
        Args:
            user_data: User registration data
            db: Database session
            
        Returns:
            User object
            
        Raises:
            HTTPException: If email or username already exists
        """
        # Check if email exists
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.warning(f"Registration attempt with existing email: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username exists
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        existing_username = result.scalar_one_or_none()
        
        if existing_username:
            logger.warning(f"Registration attempt with existing username: {user_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Hash password
        hashed_password = AuthService.hash_password(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            avatar_url=user_data.avatar_url,
            is_online=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.email}")
        return new_user

    @staticmethod
    async def authenticate_user(credentials: UserLogin, db: AsyncSession):
        """
        Authenticate user and return access token
        
        Args:
            credentials: Login credentials
            db: Database session
            
        Returns:
            Dict with access_token, token_type, and user info
            
        Raises:
            HTTPException: If credentials are invalid
        """
        # Log the login attempt
        logger.info(f"Login attempt for email: {credentials.email}")
        
        # Find user by email (case-insensitive)
        result = await db.execute(
            select(User).where(User.email.ilike(credentials.email))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"Login failed: User not found - {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please check your email or sign up."
            )
        
        # Verify password
        if not AuthService.verify_password(credentials.password, user.hashed_password):
            logger.warning(f"Login failed: Invalid password for {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
        
        # Update user's online status
        user.is_online = True
        user.last_seen = datetime.utcnow()
        await db.commit()
        
        # Create access token
        access_token = AuthService.create_access_token(
            data={"sub": user.email}
        )
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
                "is_online": user.is_online
            }
        }

    @staticmethod
    async def get_current_user(token: str, db: AsyncSession):
        """
        Get current user from JWT token
        
        Args:
            token: JWT access token
            db: Database session
            
        Returns:
            User object
            
        Raises:
            HTTPException: If token is invalid or user not found
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # Decode JWT token
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            email: str = payload.get("sub")
            
            if email is None:
                logger.error("Token payload missing 'sub' field")
                raise credentials_exception
                
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            raise credentials_exception
        
        # Get user from database
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            logger.error(f"User not found for token: {email}")
            raise credentials_exception
        
        return user

    @staticmethod
    async def logout_user(email: str, db: AsyncSession):
        """
        Logout user (mark as offline)
        
        Args:
            email: User email
            db: Database session
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            await db.commit()
            logger.info(f"User logged out: {email}")
        else:
            logger.warning(f"Logout attempt for non-existent user: {email}")