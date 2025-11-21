from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.application.interfaces.repositories import UserRepository
from app.domain.entities.user import User
from app.infrastructure.db.models import UserModel


class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: UserModel) -> User:
        return User(
            id=model.id,
            userprofile_id=model.userprofile_id,
            email=model.email,
            hashed_password=model.hashed_password,
            is_active=model.is_active,
            team_id=model.team_id,
        )
    
    def _to_model(self, entity: User) -> UserModel:
        return UserModel(
            id=entity.id,
            userprofile_id=entity.userprofile_id,
            email=entity.email,
            hashed_password=entity.hashed_password,
            is_active=entity.is_active,
            team_id=entity.team_id,
        )
    
    async def create(self, user: User) -> User:
        model = self._to_model(user)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(select(UserModel).where(UserModel.email == email))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update_team_id(self, user_id: int, team_id: int) -> Optional[User]:
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        model = result.scalar_one_or_none()
        if not model:
            return None
        
        model.team_id = team_id
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)

