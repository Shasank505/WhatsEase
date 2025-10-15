"""
Message Schemas for API Request/Response validation (PostgreSQL version)

These define what data the API accepts and returns.
They ensure data consistency and security.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum



class MessageStatus(str, Enum):
    SENT = "Sent"
    DELIVERED = "Delivered"
    READ = "Read"


# =========================================================
# Base Schema
# =========================================================
class MessageBase(BaseModel):
    """
    Base schema for shared fields between messages.
    """
    content: str = Field(..., min_length=1, max_length=2000)
    is_bot_response: bool = False
    reply_to: Optional[str] = None  # Changed to str for message_id


# =========================================================
# Create Schema
# =========================================================
class MessageCreate(BaseModel):
    """
    Schema for creating a new message.
    """
    recipient: str  # Email of recipient
    content: str = Field(..., min_length=1, max_length=2000)
    reply_to: Optional[str] = None  # message_id being replied to

    class Config:
        json_schema_extra = {
            "example": {
                "recipient": "user@example.com",
                "content": "Hello! How are you?",
                "reply_to": None
            }
        }


# =========================================================
# Update Schema
# =========================================================
class MessageUpdate(BaseModel):
    """
    Schema for editing an existing message.
    """
    content: str = Field(..., min_length=1, max_length=2000)

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Updated message content"
            }
        }


# =========================================================
# Status Update Schema
# =========================================================
class MessageStatusUpdate(BaseModel):
    """
    Schema for updating message status (Delivered/Read)
    """
    status: MessageStatus

    class Config:
        json_schema_extra = {
            "example": {
                "status": "Read"
            }
        }


# =========================================================
# Response Schema (Read Model)
# =========================================================
class MessageResponse(BaseModel):
    """
    Schema for messages returned by the API.
    """
    message_id: str
    sender: str  # Email
    recipient: str  # Email
    content: str
    timestamp: datetime
    status: str
    is_bot_response: bool
    reply_to: Optional[str] = None
    edited: bool
    edited_at: Optional[datetime] = None
    deleted: bool

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "message_id": "550e8400-e29b-41d4-a716-446655440000",
                "sender": "sender@example.com",
                "recipient": "recipient@example.com",
                "content": "Hey! Are you coming to the meeting?",
                "timestamp": "2024-01-15T10:30:00",
                "status": "Delivered",
                "is_bot_response": False,
                "reply_to": None,
                "edited": False,
                "edited_at": None,
                "deleted": False
            }
        }


# =========================================================
# Conversation Response Schema
# =========================================================
class ConversationResponse(BaseModel):
    """
    Schema for conversation between two users
    """
    participant1: str  # Email
    participant2: str  # Email
    messages: List[MessageResponse]
    total_count: int
    unread_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "participant1": "user1@example.com",
                "participant2": "user2@example.com",
                "messages": [],
                "total_count": 25,
                "unread_count": 3
            }
        }


# =========================================================
# Chat List Item Schema
# =========================================================
class ChatListItem(BaseModel):
    """
    Schema for individual chat in chat list
    """
    other_user_email: str
    other_user_username: str
    other_user_avatar: Optional[str] = None
    last_message: str
    last_message_time: Optional[datetime] = None
    unread_count: int
    is_online: bool

    class Config:
        json_schema_extra = {
            "example": {
                "other_user_email": "friend@example.com",
                "other_user_username": "friend_user",
                "other_user_avatar": None,
                "last_message": "See you tomorrow!",
                "last_message_time": "2024-01-15T14:30:00",
                "unread_count": 2,
                "is_online": True
            }
        }


# =========================================================
# Message Search Query Schema
# =========================================================
class MessageSearchQuery(BaseModel):
    """
    Schema for searching messages
    """
    query: str = Field(..., min_length=1, max_length=200)
    user_email: Optional[str] = None  # Search messages with specific user
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "query": "meeting",
                "user_email": "user@example.com",
                "limit": 20,
                "offset": 0
            }
        }