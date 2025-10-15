"""
Script to create test users in the database
Run this once to set up test users
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import hash_password

async def create_test_users():
    """Create test users for the application"""
    
    test_users = [
        {
            "email": "person3@gmail.com",
            "username": "Person3",
            "password": "password123"
        },
        {
            "email": "person4@gmail.com",
            "username": "Person4",
            "password": "password123"
        },
        {
            "email": "bot@whatsease.com",
            "username": "AI Assistant",
            "password": ""  # No password for bot
        }
    ]
    
    async with AsyncSessionLocal() as session:
        for user_data in test_users:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create new user
            hashed_pwd = hash_password(user_data["password"]) if user_data["password"] else ""
            
            new_user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=hashed_pwd,
                is_online=False
            )
            
            session.add(new_user)
            print(f"Created user: {user_data['email']}")
        
        await session.commit()
        print("\n✅ Test users created successfully!")
        print("\nYou can now login with:")
        print("  Email: person1@gmail.com")
        print("  Password: password123")
        print("\n  Email: person2@gmail.com")
        print("  Password: password123")


if __name__ == "__main__":
    print("Creating test users...\n")
    asyncio.run(create_test_users())