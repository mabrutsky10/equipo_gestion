from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from jose.exceptions import JWTError
import bcrypt
import logging
from app.application.interfaces.auth_provider import AuthProvider
from app.domain.entities.user import User
from app.infrastructure.config import settings
from app.application.interfaces.repositories import UserRepository

logger = logging.getLogger(__name__)


class LocalAuthProvider(AuthProvider):
    """Local authentication provider using JWT and database."""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        # bcrypt has a 72 byte limit, truncate if necessary
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password using bcrypt."""
        # bcrypt has a 72 byte limit, truncate if necessary
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        try:
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False
    
    def _create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.AUTH_ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET_KEY, algorithm=settings.AUTH_ALGORITHM)
        return encoded_jwt
    
    async def register_user(self, email: str, password: str, **kwargs) -> User:
        """Register a new user."""
        # Check if user exists
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        hashed_password = self._hash_password(password)
        
        # Create user
        user = User(
            id=None,
            userprofile_id=kwargs.get("userprofile_id"),
            email=email,
            hashed_password=hashed_password,
            is_active=True,
        )
        
        return await self.user_repository.create(user)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Authenticate user and return JWT token if successful."""
        user = await self.user_repository.get_by_email(email)
        if not user or not user.is_active:
            return None
        
        if not user.hashed_password:
            return None
        
        if not self._verify_password(password, user.hashed_password):
            return None
        
        # Create token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
        }
        token = self._create_access_token(token_data)
        return token
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from token."""
        try:
            payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.AUTH_ALGORITHM])
            user_id_str = payload.get("sub")
            if user_id_str is None:
                logger.warning("Token payload missing 'sub' field")
                return None
            user_id: int = int(user_id_str)
        except (JWTError, ValueError) as e:
            logger.warning(f"JWT decode error: {e}")
            return None
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            logger.warning(f"User with id {user_id} not found")
        return user
    
    async def refresh_token(self, token: str) -> Optional[str]:
        """Refresh an expired token."""
        try:
            payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.AUTH_ALGORITHM], options={"verify_exp": False})
            user_id: int = int(payload.get("sub"))
            if user_id is None:
                return None
        except JWTError:
            return None
        
        user = await self.user_repository.get_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        # Create new token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
        }
        new_token = self._create_access_token(token_data)
        return new_token

