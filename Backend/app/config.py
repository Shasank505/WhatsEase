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
    app_name: str 
    app_version: str 
    debug: bool  # Set to False in production
    
    # Server Settings
    host: str 
    port: int 
    
    # Database Settings - PostgreSQL 
    postgres_user: str 
    postgres_password: str 
    postgres_host: str 
    postgres_port: int 
    postgres_db: str 
    
    # Choose database type: "mongodb" or "postgresql"
    database_type: str 
    
    # JWT Settings for Authentication
    # Secret key should be a random string - use: openssl rand -hex 32
    secret_key: str 
    algorithm: str 
    access_token_expire_minutes: int 
    
    # CORS Settings (Cross-Origin Resource Sharing)
    # This allows your frontend to communicate with your backend
    cors_origins: List[str]
    
    # WebSocket Settings
    websocket_ping_interval: int 
    websocket_ping_timeout: int    # Close connection if no response in 60s
    
    # Bot Settings
    bot_email: str 
    bot_name: str 
    bot_response_delay: float  # Simulate typing delay in seconds
    
    # Logging
    log_level: str  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
    log_file: str
    
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
