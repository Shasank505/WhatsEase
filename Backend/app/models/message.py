"""
Message Model - PostgreSQL/SQLAlchemy
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MessageStatus(str, PyEnum):
    """
    Enum for message status
    """
    SENT = "Sent"
    DELIVERED = "Delivered"
    READ = "Read"


class Message(Base):
    """
    Message table model
    Stores all chat messages.
    """
    __tablename__ = "messages"
    __table_args__ = {'extend_existing': True}
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Message identification
    message_id = Column(String(36), unique=True, index=True, nullable=False)  # UUID
    
    # Message content - NOW WITH FOREIGN KEYS
    sender = Column(String(255), ForeignKey('users.email'), index=True, nullable=False)
    recipient = Column(String(255), ForeignKey('users.email'), index=True, nullable=False)
    content = Column(Text, nullable=False)
    
    # Message metadata
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.SENT, nullable=False)
    is_bot_response = Column(Boolean, default=False, nullable=False)
    
    # Message features
    reply_to = Column(String(36), nullable=True)  # message_id being replied to
    edited = Column(Boolean, default=False, nullable=False)
    edited_at = Column(DateTime, nullable=True)
    deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    sender_user = relationship("User", foreign_keys=[sender], back_populates="sent_messages")
    recipient_user = relationship("User", foreign_keys=[recipient], back_populates="received_messages")

    def __repr__(self):
        return f"<Message(id={self.id}, sender={self.sender}, recipient={self.recipient})>"