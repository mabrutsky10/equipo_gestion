from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.interfaces.auth_provider import AuthProvider
from app.presentation.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse
from app.presentation.api.dependencies import get_auth_provider

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    auth_provider: AuthProvider = Depends(get_auth_provider),
):
    """Login endpoint."""
    token = await auth_provider.authenticate_user(request.email, request.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return LoginResponse(access_token=token)


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

