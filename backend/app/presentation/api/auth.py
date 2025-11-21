from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.interfaces.auth_provider import AuthProvider
from app.presentation.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse
from app.presentation.api.dependencies import get_auth_provider
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    auth_provider: AuthProvider = Depends(get_auth_provider),
):
    """Login endpoint."""
    logger.info(f"Login attempt for email: {request.email}")
    try:
        token = await auth_provider.authenticate_user(request.email, request.password)
        if not token:
            logger.warning(f"Authentication failed for email: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        logger.info(f"Login successful for email: {request.email}")
        return LoginResponse(access_token=token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
        )


@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    auth_provider: AuthProvider = Depends(get_auth_provider),
):
    """Register endpoint."""
    try:
        user = await auth_provider.register_user(
            request.email,
            request.password,
            userprofile_id=request.userprofile_id,
        )
        return UserResponse(
            id=user.id,
            email=user.email,
            userprofile_id=user.userprofile_id,
            is_active=user.is_active,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

