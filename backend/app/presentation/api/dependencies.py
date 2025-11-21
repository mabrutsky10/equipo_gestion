from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.interfaces.auth_provider import AuthProvider
from app.domain.entities.user import User
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def get_auth_provider(db: AsyncSession = Depends(get_db)) -> AuthProvider:
    """Dependency to get auth provider. Uses Cognito for authentication."""
    from app.infrastructure.repositories.user_repository import SQLAlchemyUserRepository
    from app.infrastructure.auth.cognito_auth_provider import CognitoAuthProvider
    user_repo = SQLAlchemyUserRepository(db)
    return CognitoAuthProvider(user_repo)


def get_payment_provider():
    """Dependency to get payment provider."""
    from app.presentation.api.main import get_payment_provider_instance
    return get_payment_provider_instance()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    auth_provider: AuthProvider = Depends(get_auth_provider),
) -> User:
    """Dependency to get current authenticated user."""
    token = None
    
    # Try to get token from HTTPBearer
    if credentials:
        token = credentials.credentials
    # Fallback: try to get from Authorization header directly
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        logger.warning("No token provided in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user = await auth_provider.get_current_user(token)
        if not user:
            logger.warning(f"Could not validate token: user not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        logger.error(f"Error validating token: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

