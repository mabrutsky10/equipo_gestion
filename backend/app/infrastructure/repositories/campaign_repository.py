from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from decimal import Decimal
from datetime import datetime, timezone

from app.application.interfaces.repositories import CampaignRepository
from app.domain.entities.campaign import Campaign
from app.infrastructure.db.models import CampaignModel


class SQLAlchemyCampaignRepository(CampaignRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: CampaignModel) -> Campaign:
        """Convert database model to domain entity."""
        alternative_amounts = None
        if model.alternative_amounts:
            alternative_amounts = [Decimal(str(amt)) for amt in model.alternative_amounts]
        
        return Campaign(
            id=model.id,
            team_id=model.team_id,
            team_name=model.team_name,
            team_logo=model.team_logo,
            team_bio=model.team_bio,
            monthly_amount=Decimal(str(model.monthly_amount)),
            currency=model.currency,
            alternative_amounts=alternative_amounts,
            payment_method=model.payment_method,
            status=model.status,
            date_created=model.date_created,
            date_published=model.date_published,
            date_updated=model.date_updated,
        )
    
    def _to_model(self, entity: Campaign) -> CampaignModel:
        """Convert domain entity to database model."""
        alternative_amounts = None
        if entity.alternative_amounts:
            alternative_amounts = [float(amt) for amt in entity.alternative_amounts]
        
        return CampaignModel(
            id=entity.id,
            team_id=entity.team_id,
            team_name=entity.team_name,
            team_logo=entity.team_logo,
            team_bio=entity.team_bio,
            monthly_amount=entity.monthly_amount,
            currency=entity.currency,
            alternative_amounts=alternative_amounts,
            payment_method=entity.payment_method,
            status=entity.status,
            date_created=entity.date_created or datetime.now(timezone.utc),
            date_published=entity.date_published,
            date_updated=entity.date_updated or datetime.now(timezone.utc),
        )
    
    async def create(self, campaign: Campaign) -> Campaign:
        """Create a new campaign."""
        model = self._to_model(campaign)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, campaign_id: int) -> Optional[Campaign]:
        """Get campaign by ID."""
        result = await self.session.execute(
            select(CampaignModel).where(CampaignModel.id == campaign_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_team_id(self, team_id: int) -> Optional[Campaign]:
        """Get the current campaign for a team (prefer published, fallback to latest draft)."""
        # First try to get published campaign
        result = await self.session.execute(
            select(CampaignModel)
            .where(CampaignModel.team_id == team_id)
            .where(CampaignModel.status == "published")
            .order_by(desc(CampaignModel.date_published))
            .limit(1)
        )
        model = result.scalar_one_or_none()
        
        # If no published campaign, get latest draft
        if not model:
            result = await self.session.execute(
                select(CampaignModel)
                .where(CampaignModel.team_id == team_id)
                .where(CampaignModel.status == "draft")
                .order_by(desc(CampaignModel.date_updated))
                .limit(1)
            )
            model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def update(self, campaign: Campaign) -> Campaign:
        """Update an existing campaign."""
        result = await self.session.execute(
            select(CampaignModel).where(CampaignModel.id == campaign.id)
        )
        model = result.scalar_one()
        
        # Update fields
        model.team_name = campaign.team_name
        model.team_logo = campaign.team_logo
        model.team_bio = campaign.team_bio
        model.monthly_amount = campaign.monthly_amount
        model.currency = campaign.currency
        if campaign.alternative_amounts:
            model.alternative_amounts = [float(amt) for amt in campaign.alternative_amounts]
        else:
            model.alternative_amounts = None
        model.payment_method = campaign.payment_method
        model.status = campaign.status
        model.date_published = campaign.date_published
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_published_by_team_id(self, team_id: int) -> Optional[Campaign]:
        """Get the published (active) campaign for a team."""
        result = await self.session.execute(
            select(CampaignModel)
            .where(CampaignModel.team_id == team_id)
            .where(CampaignModel.status == "published")
            .order_by(desc(CampaignModel.date_published))
            .limit(1)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_all_by_team_id(self, team_id: int) -> List[Campaign]:
        """Get all campaigns for a team, ordered by date_published DESC or date_created DESC."""
        result = await self.session.execute(
            select(CampaignModel)
            .where(CampaignModel.team_id == team_id)
            .order_by(desc(CampaignModel.date_published), desc(CampaignModel.date_created))
        )
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]

