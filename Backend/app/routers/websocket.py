"""
WebSocket Routes - Updated to sync with database
Handles real-time chat and updates user online status in database.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from datetime import datetime
import uuid
import logging

from app.services.websocket_manager import manager, ws_handler
from app.services.bot_service import bot_service
from app.utils.security import get_user_email_from_token
from app.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat with database sync.
    """

    # Validate token
    user_email = get_user_email_from_token(token)
    if not user_email:
        await websocket.close(code=4001, reason="Invalid token")
        logger.warning(f"WebSocket connection rejected: Invalid token")
        return

    # Mark user as online in database
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    if user:
        user.is_online = True
        await db.commit()
        logger.info(f"User {user_email} marked as ONLINE in database")

    # Connect user via WebSocket manager
    await manager.connect(websocket, user_email)

    # Notify others that user is online
    await ws_handler.handle_user_status_change(user_email, is_online=True)

    # Send connection confirmation
    await websocket.send_json({
        "type": "connection_established",
        "data": {
            "user_email": user_email,
            "message": "Connected successfully"
        },
        "timestamp": datetime.utcnow().isoformat()
    })

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            message_data = data.get("data", {})

            if message_type == "new_message":
                await handle_new_message(user_email, message_data)

            elif message_type == "typing":
                recipient = message_data.get("recipient")
                is_typing = message_data.get("is_typing", False)
                if recipient:
                    await ws_handler.handle_typing_indicator(user_email, recipient, is_typing)

            elif message_type in ["mark_delivered", "mark_read"]:
                message_id = message_data.get("message_id")
                if message_id:
                    status = "Delivered" if message_type == "mark_delivered" else "Read"
                    sender_email = message_data.get("sender")
                    if sender_email:
                        await ws_handler.handle_message_status_update(message_id, status, sender_email)

            elif message_type == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })

            else:
                logger.warning(f"Unknown message type from {user_email}: {message_type}")
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": f"Unknown message type: {message_type}"},
                    "timestamp": datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user_email}")

    except Exception as e:
        logger.error(f"WebSocket error for {user_email}: {e}")

    finally:
        # Disconnect user from WebSocket manager
        await manager.disconnect(websocket)
        
        # Mark user as offline in database
        result = await db.execute(select(User).where(User.email == user_email))
        user = result.scalar_one_or_none()
        if user:
            user.is_online = False
            await db.commit()
            logger.info(f"🔌 User {user_email} marked as OFFLINE in database")
        
        # Notify others that user is offline
        await ws_handler.handle_user_status_change(user_email, is_online=False)


async def handle_new_message(sender_email: str, message_data: dict):
    """
    Handle new message sent via WebSocket in-memory.
    """
    recipient = message_data.get("recipient")
    content = message_data.get("content")
    reply_to = message_data.get("reply_to")

    if not recipient or not content:
        logger.warning(f"Invalid message data from {sender_email}")
        return

    # Check if recipient is the bot
    is_bot_message = recipient == settings.bot_email

    # Create message dict
    message_dict = {
        "message_id": str(uuid.uuid4()),
        "sender": sender_email,
        "recipient": recipient,
        "content": content.strip(),
        "timestamp": datetime.utcnow().isoformat(),
        "status": "Sent",
        "is_bot_response": False,
        "reply_to": reply_to,
        "edited": False,
        "deleted": False
    }

    # Send to recipient if online
    if manager.is_user_online(recipient):
        message_dict["status"] = "Delivered"
        await ws_handler.handle_new_message(message_dict, recipient)

    # Echo back to sender
    await ws_handler.handle_new_message(message_dict, sender_email)

    # If message is to bot, generate response
    if is_bot_message:
        await handle_bot_message(sender_email, content)


async def handle_bot_message(user_email: str, user_message: str):
    """
    Handle bot message in-memory.
    """
    bot_response = await bot_service.process_message(user_email, user_message)

    bot_message_dict = {
        "message_id": str(uuid.uuid4()),
        "sender": settings.bot_email,
        "recipient": user_email,
        "content": bot_response,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "Delivered",
        "is_bot_response": True,
        "reply_to": None,
        "edited": False,
        "deleted": False
    }

    # Send to user via WebSocket
    await ws_handler.handle_new_message(bot_message_dict, user_email)


@router.get("/status")
async def websocket_status():
    """
    Get WebSocket in-memory connection statistics.
    """
    return manager.get_statistics()