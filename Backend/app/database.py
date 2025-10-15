"""
Database configuration and connection management
PostgreSQL with SQLAlchemy async
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.future import select
from typing import AsyncGenerator
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Create async engine
# PostgreSQL connection URL format:
# postgresql+asyncpg://user:password@host:port/database
DATABASE_URL = f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"

# Create engine with connection pooling
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.debug,  # Log SQL queries in debug mode
    pool_size=10,  # Number of connections to keep open
    max_overflow=20,  # Additional connections if pool is full
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create session factory
# Sessions are used to interact with the database
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
    autocommit=False,
    autoflush=False
)


# ============================================================================
# Database Functions
# ============================================================================

async def init_db():
    """
    Initialize database - create all tables
    
    This should be called when the application starts.
    """
    # Import models here to register them with Base.metadata
    from app.models import User, Message
    from datetime import datetime
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL tables created successfully")
    
    # Create bot user if it doesn't exist
    async with AsyncSessionLocal() as session:
        try:
            # Check if bot user exists
            result = await session.execute(
                select(User).where(User.email == "bot@whatsease.com")
            )
            bot_user = result.scalars().first()
            
            if not bot_user:
                # Create bot user
                bot_user = User(
                    email="bot@whatsease.com",
                    username="AI Assistant",
                    full_name="WhatsEase AI Assistant",
                    hashed_password="not_a_real_password_bot_cannot_login",
                    is_online=True,  # Bot is always online
                    is_active=True,
                    bio="I'm an AI assistant here to help you!",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(bot_user)
                await session.commit()
                logger.info("Bot user created successfully")
            else:
                # Ensure bot is always marked as online
                if not bot_user.is_online:
                    bot_user.is_online = True
                    await session.commit()
                logger.info("Bot user already exists")
                
        except Exception as e:
            logger.error(f"Error creating bot user: {e}")
            await session.rollback()
            raise


async def close_db():
    """
    Close database connection
    
    This should be called when the application shuts down.
    """
    await engine.dispose()
    logger.info("PostgreSQL connection closed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session
    
    Usage in routes:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            users = result.scalars().all()
            return users
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()