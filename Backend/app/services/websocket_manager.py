from fastapi import WebSocket
from typing import Dict, Set, Optional, List
from datetime import datetime
import logging
from app.utils.logger import log_websocket_event
from app.models.message import MessageStatus

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for all users"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_user_map: Dict[WebSocket, str] = {}
        self.total_connections = 0
        self.total_messages_sent = 0

    async def connect(self, websocket: WebSocket, user_email: str):
        await websocket.accept()
        self.active_connections.setdefault(user_email, set()).add(websocket)
        self.connection_user_map[websocket] = user_email
        self.total_connections += 1

        log_websocket_event(
            event="user_connected",
            user_email=user_email,
            details={
                "total_connections": len(self.active_connections[user_email]),
                "total_users_online": len(self.active_connections)
            }
        )
        logger.info(f"✅ User {user_email} connected. Active connections: {self.get_connection_count()}")

    async def disconnect(self, websocket: WebSocket):
        user_email = self.connection_user_map.get(websocket)
        if user_email:
            self.active_connections[user_email].discard(websocket)
            if not self.active_connections[user_email]:
                del self.active_connections[user_email]
            del self.connection_user_map[websocket]

            log_websocket_event(
                event="user_disconnected",
                user_email=user_email,
                details={"remaining_connections": self.get_connection_count()}
            )
            logger.info(f"🔌 User {user_email} disconnected. Active connections: {self.get_connection_count()}")

    async def send_personal_message(self, message: dict, user_email: str):
        if user_email in self.active_connections:
            for connection in self.active_connections[user_email].copy():
                try:
                    await connection.send_json(message)
                    self.total_messages_sent += 1
                except Exception as e:
                    logger.error(f"Error sending message to {user_email}: {e}")
                    await self.disconnect(connection)

    async def broadcast(self, message: dict, exclude_user: Optional[str] = None):
        for user_email, _ in self.active_connections.items():
            if exclude_user and user_email == exclude_user:
                continue
            await self.send_personal_message(message, user_email)

    def is_user_online(self, user_email: str) -> bool:
        return user_email in self.active_connections and len(self.active_connections[user_email]) > 0

    def get_online_users(self) -> List[str]:
        return list(self.active_connections.keys())

    def get_connection_count(self) -> int:
        return sum(len(connections) for connections in self.active_connections.values())

    def get_statistics(self) -> dict:
        return {
            "total_users_online": len(self.active_connections),
            "total_active_connections": self.get_connection_count(),
            "total_connections_lifetime": self.total_connections,
            "total_messages_sent": self.total_messages_sent,
            "online_users": self.get_online_users()
        }


manager = ConnectionManager()


class WebSocketMessageHandler:
    """Handles sending different WebSocket message types"""

    @staticmethod
    async def handle_new_message(data: dict, recipient_email: str):
        message = {
            "type": "new_message",
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.send_personal_message(message, recipient_email)
        log_websocket_event(event="message_sent_via_websocket", user_email=recipient_email, details={"message_id": data.get("message_id")})

    @staticmethod
    async def handle_message_status_update(message_id: str, new_status: MessageStatus, sender_email: str):
        message = {
            "type": "message_status_update",
            "data": {"message_id": message_id, "status": new_status},
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.send_personal_message(message, sender_email)

    @staticmethod
    async def handle_typing_indicator(sender_email: str, recipient_email: str, is_typing: bool):
        message = {
            "type": "typing_indicator",
            "data": {"user_email": sender_email, "is_typing": is_typing},
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.send_personal_message(message, recipient_email)

    @staticmethod
    async def handle_user_status_change(user_email: str, is_online: bool):
        message = {
            "type": "user_status_change",
            "data": {"user_email": user_email, "is_online": is_online},
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast(message, exclude_user=user_email)

    @staticmethod
    async def handle_message_deleted(message_id: str, recipient_email: str):
        message = {"type": "message_deleted", "data": {"message_id": message_id}, "timestamp": datetime.utcnow().isoformat()}
        await manager.send_personal_message(message, recipient_email)

    @staticmethod
    async def handle_message_edited(message_data: dict, recipient_email: str):
        message = {"type": "message_edited", "data": message_data, "timestamp": datetime.utcnow().isoformat()}
        await manager.send_personal_message(message, recipient_email)


ws_handler = WebSocketMessageHandler()
