"""
Main application file - Entry point for WhatsEase Chat Application

Rewritten for PostgreSQL using SQLAlchemy async ORM
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import get_db, AsyncSessionLocal  # Fixed import

# Import routers
from app.routers import auth, users, messages
try:
    from app.routers import websocket
except ImportError:
    # If websocket.py doesn't exist, try websocket_endpoint.py
    try:
        from app.routers import websocket_endpoint as websocket
    except ImportError:
        websocket = None  # WebSocket router not available

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager - startup & shutdown
    """
    logger.info("Starting WhatsEase Chat Application...")

    # Startup: Initialize PostgreSQL
    from app.database import init_db
    await init_db()

    logger.info("Application startup complete")
    yield

    logger.info("Shutting down WhatsEase Chat Application...")
    # Shutdown: Close PostgreSQL pool
    from app.database import close_db
    await close_db()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A real-time chat application with AI bot integration",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
     allow_origins=[ "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # React default
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",  # Alternative Vite port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root health check
@app.get("/")
async def root():
    return {
        "message": "Welcome to WhatsEase Chat API",
        "status": "active",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation disabled in production",
    }


# PostgreSQL health check
@app.get("/health")
async def health_check():
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
        logger.error(f"Database health check failed: {e}")

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "version": settings.app_version,
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
if websocket:
    app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])