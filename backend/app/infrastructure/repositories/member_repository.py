from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.application.interfaces.repositories import MemberRepository
from app.domain.entities.member import Member
from app.infrastructure.db.models import MemberModel
from datetime import datetime


class SQLAlchemyMemberRepository(MemberRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: MemberModel) -> Member:
        return Member(
            id=model.id,
            team_id=model.team_id,
            userprofile_id=model.userprofile_id,
            name=model.name,
            email=model.email,
            status=model.status,
            subscription_link=model.subscription_link,
            subscription_status=model.subscription_status,
            date_created=model.date_created,
            date_updated=model.date_updated,
        )
    
    def _to_model(self, entity: Member) -> MemberModel:
        return MemberModel(
            id=entity.id,
            team_id=entity.team_id,
            userprofile_id=entity.userprofile_id,
            name=entity.name,
            email=entity.email,
            status=entity.status,
            subscription_link=entity.subscription_link,
            subscription_status=entity.subscription_status,
            date_created=entity.date_created or datetime.utcnow(),
            date_updated=entity.date_updated or datetime.utcnow(),
        )
    
    async def create(self, member: Member) -> Member:
        model = self._to_model(member)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, member_id: int) -> Optional[Member]:
        result = await self.session.execute(select(MemberModel).where(MemberModel.id == member_id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_team_id(self, team_id: int) -> List[Member]:
        result = await self.session.execute(select(MemberModel).where(MemberModel.team_id == team_id))
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]
    
    async def update(self, member: Member) -> Member:
        result = await self.session.execute(select(MemberModel).where(MemberModel.id == member.id))
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"Member with id {member.id} not found")
        
        model.name = member.name
        model.email = member.email
        model.status = member.status
        model.subscription_link = member.subscription_link
        model.subscription_status = member.subscription_status
        model.date_updated = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)







