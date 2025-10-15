from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func
from datetime import datetime
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.schema.message_schema import (
    MessageCreate, MessageUpdate, MessageResponse, MessageStatusUpdate,
    ConversationResponse, ChatListItem
)
from app.routers.dependencies import get_current_user
from app.services.bot_service import bot_service

router = APIRouter()


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if message_data.recipient == current_user.email:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    result = await db.execute(select(User).where(User.email == message_data.recipient))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    message = Message(
        message_id=str(uuid.uuid4()),
        sender=current_user.email,
        recipient=message_data.recipient,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        status="Sent",
        reply_to=message_data.reply_to,
        edited=False,
        deleted=False
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.get("/conversation/{other_user_email}", response_model=ConversationResponse)
async def get_conversation(
    other_user_email: str, 
    limit: int = 50, 
    offset: int = 0,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == other_user_email))
    other_user = result.scalar_one_or_none()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    messages_result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender == current_user.email, Message.recipient == other_user_email),
                and_(Message.sender == other_user_email, Message.recipient == current_user.email)
            ),
            Message.deleted == False
        )
        .order_by(Message.timestamp.desc())
        .offset(offset)
        .limit(limit)
    )
    messages = messages_result.scalars().all()

    total_count_result = await db.execute(
        select(func.count(Message.id))
        .where(
            or_(
                and_(Message.sender == current_user.email, Message.recipient == other_user_email),
                and_(Message.sender == other_user_email, Message.recipient == current_user.email)
            ),
            Message.deleted == False
        )
    )
    total_count = total_count_result.scalar()

    unread_count_result = await db.execute(
        select(func.count(Message.id))
        .where(
            Message.sender == other_user_email,
            Message.recipient == current_user.email,
            Message.status != "Read",
            Message.deleted == False
        )
    )
    unread_count = unread_count_result.scalar()

    return ConversationResponse(
        participant1=current_user.email,
        participant2=other_user_email,
        messages=messages,
        total_count=total_count,
        unread_count=unread_count
    )


@router.put("/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: str, 
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.message_id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(404, "Message not found")
    if message.sender != current_user.email:
        raise HTTPException(403, "You can only edit your own messages")

    message.content = message_update.content
    message.edited = True
    message.edited_at = datetime.utcnow()
    await db.commit()
    await db.refresh(message)
    return message


@router.patch("/{message_id}/status", response_model=MessageResponse)
async def update_message_status(
    message_id: str, 
    status_update: MessageStatusUpdate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.message_id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(404, "Message not found")
    if message.recipient != current_user.email:
        raise HTTPException(403, "You can only update status of messages sent to you")

    message.status = status_update.status
    await db.commit()
    await db.refresh(message)
    return message


@router.delete("/{message_id}")
async def delete_message(
    message_id: str, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.message_id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(404, "Message not found")
    if message.sender != current_user.email:
        raise HTTPException(403, "You can only delete your own messages")

    message.deleted = True
    await db.commit()
    return {"message": "Message deleted successfully"}


@router.get("/chats", response_model=List[ChatListItem])
async def get_chat_list(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    sent_users_result = await db.execute(
        select(Message.recipient).where(
            Message.sender == current_user.email,
            Message.deleted == False
        ).distinct()
    )
    sent_users = {row[0] for row in sent_users_result.all()}

    received_users_result = await db.execute(
        select(Message.sender).where(
            Message.recipient == current_user.email,
            Message.deleted == False
        ).distinct()
    )
    received_users = {row[0] for row in received_users_result.all()}

    user_emails = sent_users.union(received_users)

    chat_list = []
    for email in user_emails:
        last_msg_result = await db.execute(
            select(Message).where(
                or_(
                    and_(Message.sender == current_user.email, Message.recipient == email),
                    and_(Message.sender == email, Message.recipient == current_user.email)
                ),
                Message.deleted == False
            ).order_by(Message.timestamp.desc()).limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        unread_count_result = await db.execute(
            select(func.count(Message.id)).where(
                Message.sender == email,
                Message.recipient == current_user.email,
                Message.status != "Read",
                Message.deleted == False
            )
        )
        unread_count = unread_count_result.scalar()

        user_info_result = await db.execute(select(User).where(User.email == email))
        user_info = user_info_result.scalar_one_or_none()

        chat_list.append(ChatListItem(
            other_user_email=email,
            other_user_username=user_info.username if user_info else "",
            other_user_avatar=user_info.avatar_url if user_info else None,
            last_message=last_msg.content if last_msg else "",
            last_message_time=last_msg.timestamp if last_msg else None,
            unread_count=unread_count,
            is_online=user_info.is_online if user_info else False
        ))
    
    chat_list.sort(key=lambda x: x.last_message_time or datetime.min, reverse=True)
    return chat_list


@router.post("/bot", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def chat_with_bot(
    message_data: MessageCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Send message to AI bot and get response
    """
    # Get bot response
    bot_response_text = await bot_service.process_message(
        current_user.email, 
        message_data.content
    )
    
    # Save user message
    user_message = Message(
        message_id=str(uuid.uuid4()),
        sender=current_user.email,
        recipient="bot@whatsease.com",
        content=message_data.content,
        timestamp=datetime.utcnow(),
        status="Read",
        is_bot_response=False,
        edited=False,
        deleted=False
    )
    db.add(user_message)
    
    # Save bot response
    bot_message = Message(
        message_id=str(uuid.uuid4()),
        sender="bot@whatsease.com",
        recipient=current_user.email,
        content=bot_response_text,
        timestamp=datetime.utcnow(),
        status="Delivered",
        is_bot_response=True,
        edited=False,
        deleted=False
    )
    db.add(bot_message)
    
    await db.commit()
    await db.refresh(bot_message)
    
    return bot_message