from typing import Optional
from app.application.interfaces.auth_provider import AuthProvider
from app.application.interfaces.repositories import UserRepository
from app.domain.entities.user import User


class RegisterUserUseCase:
    def __init__(self, auth_provider: AuthProvider):
        self.auth_provider = auth_provider
    
    async def execute(self, email: str, password: str, **kwargs) -> User:
        return await self.auth_provider.register_user(email, password, **kwargs)


class AuthenticateUserUseCase:
    def __init__(self, auth_provider: AuthProvider):
        self.auth_provider = auth_provider
    
    async def execute(self, email: str, password: str) -> Optional[str]:
        return await self.auth_provider.authenticate_user(email, password)


class GetCurrentUserUseCase:
    def __init__(self, auth_provider: AuthProvider):
        self.auth_provider = auth_provider
    
    async def execute(self, token: str) -> Optional[User]:
        return await self.auth_provider.get_current_user(token)







