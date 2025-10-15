"""
Configuration file for the WhatsEase Chat Application

This file handles all configuration settings using Pydantic's BaseSettings.
Pydantic automatically loads values from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import field_validator


class Settings(BaseSettings):
    """
    Application Settings Class
    
    This class inherits from BaseSettings which:
    1. Automatically reads from environment variables
    2. Validates the data types
    3. Provides default values
    4. Can read from a .env file
    """
    
    # Application Settings
    app_name: str = "WhatsEase Chat"
    app_version: str = "1.0.0"
    debug: bool = True  # Set to False in production
    
    # Server Settings
    host: str = "0.0.0.0"  # 0.0.0.0 means accessible from any network interface
    port: int = 8000
    
    # Database Settings - PostgreSQL 
    postgres_user: str = "postgres"
    postgres_password: str = "7600"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "Whatsease_db1"
    
    # Choose database type: "mongodb" or "postgresql"
    database_type: str = "postgresql"  
    
    # JWT Settings for Authentication
    # Secret key should be a random string - use: openssl rand -hex 32
    secret_key: str = "your-secret-key-change-this-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"  # HMAC with SHA-256 for JWT encoding
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # CORS Settings (Cross-Origin Resource Sharing)
    # This allows your frontend to communicate with your backend
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]
    
    # WebSocket Settings
    websocket_ping_interval: int = 25  # Ping clients every 25 seconds
    websocket_ping_timeout: int = 60   # Close connection if no response in 60s
    
    # Bot Settings
    bot_email: str = "bot@whatsease.com"
    bot_name: str = "WhatsEase AI Assistant"
    bot_response_delay: float = 0.5  # Simulate typing delay in seconds
    
    # Logging
    log_level: str = "INFO"  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
    log_file: str = "app.log"
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Convert comma-separated string to list or parse JSON-like list"""
        if isinstance(v, str):
            # Try to parse as JSON first
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            # If not JSON, treat as comma-separated
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    class Config:
        """
        Pydantic Config class
        
        env_file: tells Pydantic to look for a .env file
        case_sensitive: False means we can use lowercase in .env file
        """
        env_file = ".env"
        case_sensitive = False


# Create a single instance of settings
# This is imported throughout the application
settings = Settings()