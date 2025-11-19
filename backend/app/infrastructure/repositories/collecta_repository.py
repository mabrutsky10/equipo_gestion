from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.application.interfaces.repositories import CollectaRepository
from app.domain.entities.collecta import Collecta
from app.infrastructure.db.models import CollectaModel, CollectaInvitedMemberModel
from datetime import datetime


class SQLAlchemyCollectaRepository(CollectaRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: CollectaModel, invited_member_ids: List[int] = None, invited_emails: List[str] = None) -> Collecta:
        return Collecta(
            id=model.id,
            team_id=model.team_id,
            title=model.title,
            description=model.description,
            is_public=model.is_public,
            link_public=model.link_public,
            status=model.status,
            date_created=model.date_created,
            date_end=model.date_end,
            date_updated=model.date_updated,
            invited_member_ids=invited_member_ids or [],
            invited_emails=invited_emails or [],
        )
    
    def _to_model(self, entity: Collecta) -> CollectaModel:
        return CollectaModel(
            id=entity.id,
            team_id=entity.team_id,
            title=entity.title,
            description=entity.description,
            is_public=entity.is_public,
            link_public=entity.link_public,
            status=entity.status,
            date_created=entity.date_created or datetime.utcnow(),
            date_end=entity.date_end,
            date_updated=entity.date_updated or datetime.utcnow(),
        )
    
    async def create(self, collecta: Collecta) -> Collecta:
        model = self._to_model(collecta)
        self.session.add(model)
        await self.session.flush()
        
        # Add invited members
        if collecta.invited_member_ids:
            for member_id in collecta.invited_member_ids:
                invited = CollectaInvitedMemberModel(
                    collecta_id=model.id,
                    member_id=member_id,
                )
                self.session.add(invited)
        
        if collecta.invited_emails:
            for email in collecta.invited_emails:
                invited = CollectaInvitedMemberModel(
                    collecta_id=model.id,
                    external_email=email,
                )
                self.session.add(invited)
        
        await self.session.commit()
        await self.session.refresh(model)
        
        # Fetch invited members
        result = await self.session.execute(
            select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == model.id)
        )
        invited_models = result.scalars().all()
        member_ids = [inv.member_id for inv in invited_models if inv.member_id]
        emails = [inv.external_email for inv in invited_models if inv.external_email]
        
        return self._to_entity(model, member_ids, emails)
    
    async def get_by_id(self, collecta_id: int) -> Optional[Collecta]:
        result = await self.session.execute(select(CollectaModel).where(CollectaModel.id == collecta_id))
        model = result.scalar_one_or_none()
        if not model:
            return None
        
        # Fetch invited members
        invited_result = await self.session.execute(
            select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == collecta_id)
        )
        invited_models = invited_result.scalars().all()
        member_ids = [inv.member_id for inv in invited_models if inv.member_id]
        emails = [inv.external_email for inv in invited_models if inv.external_email]
        
        return self._to_entity(model, member_ids, emails)
    
    async def get_by_team_id(self, team_id: int) -> List[Collecta]:
        result = await self.session.execute(select(CollectaModel).where(CollectaModel.team_id == team_id))
        models = result.scalars().all()
        
        collectas = []
        for model in models:
            invited_result = await self.session.execute(
                select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == model.id)
            )
            invited_models = invited_result.scalars().all()
            member_ids = [inv.member_id for inv in invited_models if inv.member_id]
            emails = [inv.external_email for inv in invited_models if inv.external_email]
            collectas.append(self._to_entity(model, member_ids, emails))
        
        return collectas
    
    async def update(self, collecta: Collecta) -> Collecta:
        result = await self.session.execute(select(CollectaModel).where(CollectaModel.id == collecta.id))
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"Collecta with id {collecta.id} not found")
        
        model.title = collecta.title
        model.description = collecta.description
        model.is_public = collecta.is_public
        model.link_public = collecta.link_public
        model.status = collecta.status
        model.date_end = collecta.date_end
        model.date_updated = datetime.utcnow()
        
        # Update invited members (delete old, add new)
        await self.session.execute(
            select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == collecta.id)
        )
        delete_result = await self.session.execute(
            select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == collecta.id)
        )
        for old_invited in delete_result.scalars().all():
            await self.session.delete(old_invited)
        
        # Add new invited members
        if collecta.invited_member_ids:
            for member_id in collecta.invited_member_ids:
                invited = CollectaInvitedMemberModel(
                    collecta_id=model.id,
                    member_id=member_id,
                )
                self.session.add(invited)
        
        if collecta.invited_emails:
            for email in collecta.invited_emails:
                invited = CollectaInvitedMemberModel(
                    collecta_id=model.id,
                    external_email=email,
                )
                self.session.add(invited)
        
        await self.session.commit()
        await self.session.refresh(model)
        
        # Fetch updated invited members
        invited_result = await self.session.execute(
            select(CollectaInvitedMemberModel).where(CollectaInvitedMemberModel.collecta_id == model.id)
        )
        invited_models = invited_result.scalars().all()
        member_ids = [inv.member_id for inv in invited_models if inv.member_id]
        emails = [inv.external_email for inv in invited_models if inv.external_email]
        
        return self._to_entity(model, member_ids, emails)







