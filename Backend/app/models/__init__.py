# Remove any imports from message.py or user.py

# Just import the Base
from app.database import Base

# Import models directly (no circular imports)
from app.models.user import User
from app.models.message import Message, MessageStatus

__all__ = ["Base", "User", "Message", "MessageStatus"]