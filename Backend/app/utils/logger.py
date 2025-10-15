"""
Logging configuration and utilities

This module sets up structured logging for the application.
Logs help us:
- Debug issues
- Monitor application health
- Track user activities
- Audit security events
"""

import logging
import sys
from datetime import datetime
from typing import Optional
from app.config import settings


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds colors to console output
    
    Makes logs easier to read during development.
    """
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset color
    }
    
    def format(self, record):
        """
        Format log record with colors
        
        Args:
            record: LogRecord object
            
        Returns:
            Formatted string with colors
        """
        # Get color for this log level
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        
        # Add color to level name
        record.levelname = f"{color}{record.levelname}{self.COLORS['RESET']}"
        
        # Format the record
        return super().format(record)


def setup_logging():
    """
    Configure logging for the application
    
    Sets up:
    - Console handler (colored output for development)
    - File handler (persistent logs)
    - Log format and level
    """
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.log_level))
    
    # Remove existing handlers to avoid duplicates
    logger.handlers = []
    
    # Console handler (for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_formatter = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler (for production)
    file_handler = logging.FileHandler(settings.log_file)
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    return logger


def log_user_activity(
    action: str,
    user_email: str,
    details: Optional[dict] = None,
    level: str = "INFO"
):
    """
    Log user activities
    
    Args:
        action: What action was performed (e.g., "login", "send_message")
        user_email: Who performed the action
        details: Additional context
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    logger = logging.getLogger("user_activity")
    
    # Build log message
    message = f"Action: {action} | User: {user_email}"
    if details:
        message += f" | Details: {details}"
    
    # Log at appropriate level
    log_func = getattr(logger, level.lower())
    log_func(message)


def log_bot_activity(
    action: str,
    user_email: str,
    bot_response: Optional[str] = None,
    details: Optional[dict] = None
):
    """
    Log bot interactions
    
    Args:
        action: Bot action (e.g., "responded", "intent_detected")
        user_email: User interacting with bot
        bot_response: What the bot said
        details: Additional context
    """
    logger = logging.getLogger("bot_activity")
    
    message = f"Bot Action: {action} | User: {user_email}"
    if bot_response:
        # Truncate long responses
        truncated = bot_response[:100] + "..." if len(bot_response) > 100 else bot_response
        message += f" | Response: {truncated}"
    if details:
        message += f" | Details: {details}"
    
    logger.info(message)


def log_websocket_event(
    event: str,
    user_email: Optional[str] = None,
    details: Optional[dict] = None
):
    """
    Log WebSocket events
    
    Args:
        event: Event type (e.g., "connected", "disconnected", "message_sent")
        user_email: User involved in the event
        details: Additional context
    """
    logger = logging.getLogger("websocket")
    
    message = f"WebSocket Event: {event}"
    if user_email:
        message += f" | User: {user_email}"
    if details:
        message += f" | Details: {details}"
    
    logger.info(message)


def log_security_event(
    event: str,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None
):
    """
    Log security-related events
    
    Args:
        event: Security event (e.g., "failed_login", "token_expired")
        user_email: User involved
        ip_address: Source IP address
        details: Additional context
    """
    logger = logging.getLogger("security")
    
    message = f"Security Event: {event}"
    if user_email:
        message += f" | User: {user_email}"
    if ip_address:
        message += f" | IP: {ip_address}"
    if details:
        message += f" | Details: {details}"
    
    # Security events are always logged as WARNING or higher
    logger.warning(message)


# Initialize logging when module is imported
setup_logging()


