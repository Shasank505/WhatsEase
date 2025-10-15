"""
User Management Routes (PostgreSQL Version)

API endpoints for:
- Searching users
- Getting user profile
- Updating user profile
- Getting user list
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime
import logging

from app.database import get_db
from app.schema.user_schema import UserUpdate, UserResponse, UserInList
from app.routers.auth import get_current_user
from app.models.user import User
from app.utils.logger import log_user_activity

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search", response_model=List[UserInList])
async def search_users(
    query: str = Query(..., min_length=1, description="Search query (username or email)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for users by username or email
    - Case-insensitive
    - Excludes current user
    """

    stmt = (
        select(User)
        .where(
            and_(
                or_(
                    User.username.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%")
                ),
                User.email != current_user.email
            )
        )
        .limit(limit)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    log_user_activity(
        action="search_users",
        user_email=current_user.email,
        details={"query": query, "results_count": len(users)}
    )

    return [UserInList.from_orm(user) for user in users]


@router.get("/{user_email}", response_model=UserResponse)
async def get_user_profile(
    user_email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a user's profile by email
    """

    stmt = select(User).where(User.email == user_email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.from_orm(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the current user's profile.
    Only updates provided fields.
    """

    update_data = user_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

    # If username changed, check uniqueness
    if "username" in update_data:
        stmt = select(User).where(and_(User.username == update_data["username"], User.email != current_user.email))
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    for field, value in update_data.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    log_user_activity(
        action="profile_updated",
        user_email=current_user.email,
        details={"fields_updated": list(update_data.keys())}
    )

    return UserResponse.from_orm(current_user)


@router.get("/", response_model=List[UserInList])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    online_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of all users (excluding current user)
    """

    conditions = [User.email != current_user.email]
    if online_only:
        conditions.append(User.is_online == True)

    stmt = select(User).where(and_(*conditions)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return [UserInList.from_orm(user) for user in users]
