"""
AI Bot Service - Handles bot responses
"""

import logging
from typing import Dict
from datetime import datetime
import random

logger = logging.getLogger(__name__)


class BotService:
    """
    AI Bot service for generating automated responses
    """
    
    def __init__(self):
        self.conversation_history: Dict[str, list] = {}
        logger.info("BotService initialized")
    
    async def process_message(self, user_email: str, message: str) -> str:
        """
        Process user message and generate bot response
        
        Args:
            user_email: Email of the user sending the message
            message: The message content
            
        Returns:
            Bot response string
        """
        try:
            # Store conversation history
            if user_email not in self.conversation_history:
                self.conversation_history[user_email] = []
            
            self.conversation_history[user_email].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.utcnow()
            })
            
            # Generate response based on message content
            response = self._generate_response(message)
            
            # Store bot response in history
            self.conversation_history[user_email].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.utcnow()
            })
            
            logger.info(f"Bot responded to {user_email}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing bot message: {e}")
            return "I apologize, but I encountered an error. Please try again."
    
    def _generate_response(self, message: str) -> str:
        """
        Generate a response based on the message content
        
        This is a simple rule-based bot. In production, you would integrate
        with an actual AI service like OpenAI, Claude, or a custom model.
        """
        message_lower = message.lower()
        
        # Greeting responses
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings']):
            return random.choice([
                "Hello! 👋 How can I assist you today?",
                "Hi there! How are you doing?",
                "Hey! What can I help you with?",
                "Greetings! How may I help you today?"
            ])
        
        # How are you responses
        if any(phrase in message_lower for phrase in ['how are you', 'how are u', 'how r you']):
            return random.choice([
                "I'm doing great, thank you for asking! 😊 How about you?",
                "I'm functioning perfectly! How can I help you?",
                "I'm excellent! What brings you here today?",
                "I'm wonderful! What would you like to chat about?"
            ])
        
        # Help responses
        if any(word in message_lower for word in ['help', 'assist', 'support']):
            return ("I'm here to help! I can:\n"
                   "• Answer your questions\n"
                   "• Provide information\n"
                   "• Have a friendly conversation\n"
                   "• Assist with various tasks\n\n"
                   "What would you like to know?")
        
        # Time/Date responses
        if any(word in message_lower for word in ['time', 'date', 'today', 'day']):
            now = datetime.utcnow()
            return f"The current UTC time is {now.strftime('%H:%M:%S')} and today is {now.strftime('%A, %B %d, %Y')}."
        
        # Thank you responses
        if any(word in message_lower for word in ['thank', 'thanks', 'thx']):
            return random.choice([
                "You're welcome! 😊",
                "Happy to help!",
                "My pleasure!",
                "Anytime! Is there anything else I can help with?"
            ])
        
        # Goodbye responses
        if any(word in message_lower for word in ['bye', 'goodbye', 'see you', 'farewell']):
            return random.choice([
                "Goodbye! Have a great day! 👋",
                "See you later! Take care!",
                "Farewell! Come back anytime!",
                "Bye! It was nice chatting with you!"
            ])
        
        # Weather (placeholder)
        if 'weather' in message_lower:
            return "I don't have access to real-time weather data, but I recommend checking a weather service for accurate information! ☀️"
        
        # Name question
        if any(phrase in message_lower for phrase in ['what is your name', 'your name', 'who are you']):
            return "I'm WhatsEase AI Assistant! 🤖 I'm here to help you with various tasks and have friendly conversations."
        
        # Capabilities
        if any(word in message_lower for word in ['what can you do', 'capabilities', 'features']):
            return ("I can help you with:\n"
                   "• Answering general questions\n"
                   "• Providing information and explanations\n"
                   "• Having casual conversations\n"
                   "• Offering suggestions and advice\n"
                   "• And much more!\n\n"
                   "Just ask me anything!")
        
        # Jokes
        if 'joke' in message_lower:
            jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻",
                "Why don't eggs tell jokes? They'd crack each other up! 🥚",
                "What did one wall say to the other? I'll meet you at the corner! 🧱"
            ]
            return random.choice(jokes)
        
        # Positive feedback
        if any(word in message_lower for word in ['good', 'great', 'awesome', 'excellent', 'amazing']):
            return random.choice([
                "I'm glad you think so! 😊",
                "That's wonderful to hear!",
                "Thank you! That's very kind!",
                "Awesome! What else can I help with?"
            ])
        
        # Negative feedback
        if any(word in message_lower for word in ['bad', 'terrible', 'awful', 'hate', 'stupid']):
            return random.choice([
                "I'm sorry to hear that. How can I make things better?",
                "I apologize if something went wrong. How can I assist you?",
                "I understand your frustration. Let me help you with that."
            ])
        
        # Questions
        if message_lower.endswith('?'):
            return random.choice([
                "That's an interesting question! Could you provide more details so I can give you a better answer?",
                "I'd be happy to help with that! Can you tell me more about what you're looking for?",
                "Let me think about that... Could you elaborate a bit more?",
                "Great question! I'll need a bit more context to give you the best answer."
            ])
        
        # Default response
        return random.choice([
            "That's interesting! Tell me more about that.",
            "I see! How can I help you with that?",
            "Interesting point! What would you like to know?",
            "I understand. Is there something specific you'd like help with?",
            "Got it! What else would you like to discuss?",
            "I'm here to help! Could you clarify what you need assistance with?"
        ])
    
    def get_conversation_history(self, user_email: str, limit: int = 10) -> list:
        """
        Get conversation history for a user
        
        Args:
            user_email: Email of the user
            limit: Maximum number of messages to return
            
        Returns:
            List of conversation messages
        """
        if user_email not in self.conversation_history:
            return []
        
        return self.conversation_history[user_email][-limit:]
    
    def clear_conversation_history(self, user_email: str):
        """
        Clear conversation history for a user
        
        Args:
            user_email: Email of the user
        """
        if user_email in self.conversation_history:
            del self.conversation_history[user_email]
            logger.info(f"Cleared conversation history for {user_email}")


# Create singleton instance
bot_service = BotService()