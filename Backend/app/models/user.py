# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    full_name = Column(String(100), nullable=True)  # ADDED
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bio = Column(String(500), nullable=True)  # ADDED (from schema)
    is_active = Column(Boolean, default=True, nullable=False)  # ADDED (from schema)
    
    # Online status tracking
    is_online = Column(Boolean, default=False, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sent_messages = relationship(
        "Message",
        foreign_keys="Message.sender",
        back_populates="sender_user",
        lazy="dynamic"
    )
    received_messages = relationship(
        "Message",
        foreign_keys="Message.recipient",
        back_populates="recipient_user",
        lazy="dynamic"
    )

    def __repr__(self):
        return f"<User(email={self.email}, username={self.username}, is_online={self.is_online})>"