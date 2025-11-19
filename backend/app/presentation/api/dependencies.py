from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.interfaces.auth_provider import AuthProvider
from app.domain.entities.user import User

security = HTTPBearer()


def get_auth_provider(db: AsyncSession = Depends(get_db)) -> AuthProvider:
    """Dependency to get auth provider. In a real app, this would be injected via DI."""
    from app.infrastructure.repositories.user_repository import SQLAlchemyUserRepository
    from app.infrastructure.auth.local_auth_provider import LocalAuthProvider
    user_repo = SQLAlchemyUserRepository(db)
    return LocalAuthProvider(user_repo)


def get_payment_provider():
    """Dependency to get payment provider."""
    from app.presentation.api.main import get_payment_provider_instance
    return get_payment_provider_instance()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_provider: AuthProvider = Depends(get_auth_provider),
) -> User:
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    user = await auth_provider.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

