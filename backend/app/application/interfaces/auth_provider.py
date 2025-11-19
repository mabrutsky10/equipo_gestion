from abc import ABC, abstractmethod
from typing import Optional
from app.domain.entities.user import User


class AuthProvider(ABC):
    """Interface for authentication providers. Allows swapping implementations."""

    @abstractmethod
    async def register_user(self, email: str, password: str, **kwargs) -> User:
        """Register a new user."""
        pass

    @abstractmethod
    async def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Authenticate user and return JWT token if successful."""
        pass

    @abstractmethod
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from token."""
        pass

    @abstractmethod
    async def refresh_token(self, token: str) -> Optional[str]:
        """Refresh an expired token."""
        pass







