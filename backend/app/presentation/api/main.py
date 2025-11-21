from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Optional
import traceback
import logging
from app.infrastructure.config import settings
from app.infrastructure.db.session import engine, Base
from app.infrastructure.auth.local_auth_provider import LocalAuthProvider
from app.infrastructure.payments.mock_payment_provider import MockPaymentProvider
from app.infrastructure.repositories.user_repository import SQLAlchemyUserRepository
from app.application.interfaces.auth_provider import AuthProvider
from app.application.interfaces.payment_provider import PaymentProvider
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db

logger = logging.getLogger(__name__)

# Global instances (in production, use proper DI container)
_auth_provider: Optional[AuthProvider] = None
_payment_provider: Optional[PaymentProvider] = None


def get_auth_provider_instance(db: AsyncSession = None) -> AuthProvider:
    """Get or create auth provider instance."""
    global _auth_provider
    if _auth_provider is None:
        # In a real app, we'd get the session from DI
        # For now, we'll create a repository factory that uses the current session
        # This is a simplified approach - in production use proper DI
        class AuthProviderFactory:
            def __init__(self):
                self._provider = None
            
            def get_provider(self, session: AsyncSession) -> AuthProvider:
                if self._provider is None:
                    user_repo = SQLAlchemyUserRepository(session)
                    self._provider = LocalAuthProvider(user_repo)
                return self._provider
        
        _auth_provider_factory = AuthProviderFactory()
        # We'll need to pass session when calling, but for now create a dummy one
        # In production, use proper DI container
        from app.infrastructure.db.session import AsyncSessionLocal
        async def get_provider():
            async with AsyncSessionLocal() as session:
                return _auth_provider_factory.get_provider(session)
        # For now, create a simple instance
        # This will be properly initialized in dependencies
        _auth_provider = None  # Will be created per request
    return _auth_provider


def get_payment_provider_instance() -> PaymentProvider:
    """Get or create payment provider instance."""
    global _payment_provider
    if _payment_provider is None:
        _payment_provider = MockPaymentProvider()
    return _payment_provider


app = FastAPI(
    title="Tesorero API",
    description="Team management platform API",
    version="1.0.0",
)

# CORS middleware
# Handle CORS origins - filter out wildcards as FastAPI doesn't support them directly
cors_origins = [origin for origin in settings.cors_origins_list if "*" not in origin]

# In development, allow all origins for easier testing
# In production, use specific origins from env
if settings.ENVIRONMENT == "development" or not cors_origins:
    # Allow all origins in development or if no specific origins configured
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Can't use credentials with wildcard
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    # Use specific origins in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Include routers
from app.presentation.api import auth, movements, collectas, dashboard, config, teams, campaigns, home, mas10, chat, members

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(movements.router, prefix=settings.API_V1_PREFIX)
app.include_router(collectas.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(config.router, prefix=settings.API_V1_PREFIX)
app.include_router(teams.router, prefix=settings.API_V1_PREFIX)
app.include_router(campaigns.router, prefix=settings.API_V1_PREFIX)
app.include_router(home.router, prefix=settings.API_V1_PREFIX)
app.include_router(mas10.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(members.router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log all errors."""
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
        }
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__,
        }
    )


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    # In production, use Alembic migrations instead
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "Tesorero API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}

