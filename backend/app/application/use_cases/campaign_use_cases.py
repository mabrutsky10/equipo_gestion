from typing import Optional
from decimal import Decimal
from datetime import datetime, timezone
from app.application.interfaces.repositories import CampaignRepository
from app.domain.entities.campaign import Campaign


class CreateOrUpdateCampaignUseCase:
    """Use case for creating or updating a campaign."""
    
    def __init__(self, repository: CampaignRepository):
        self.repository = repository
    
    async def execute(
        self,
        team_id: int,
        team_name: str,
        monthly_amount: Decimal,
        currency: str = "ARS",
        team_logo: Optional[str] = None,
        team_bio: Optional[str] = None,
        alternative_amounts: Optional[list[Decimal]] = None,
        payment_method: str = "mercado_pago",
        status: str = "draft",
    ) -> Campaign:
        """Create or update a campaign."""
        # Check if a campaign already exists for this team
        existing_campaign = await self.repository.get_by_team_id(team_id)
        
        if existing_campaign:
            # Update existing campaign
            existing_campaign.team_name = team_name
            existing_campaign.team_logo = team_logo
            existing_campaign.team_bio = team_bio
            existing_campaign.monthly_amount = monthly_amount
            existing_campaign.currency = currency
            existing_campaign.alternative_amounts = alternative_amounts
            existing_campaign.payment_method = payment_method
            existing_campaign.status = status
            
            # Set date_published if status is being changed to published
            if status == "published" and existing_campaign.status != "published":
                existing_campaign.date_published = datetime.now(timezone.utc)
            
            return await self.repository.update(existing_campaign)
        else:
            # Create new campaign
            new_campaign = Campaign(
                id=None,
                team_id=team_id,
                team_name=team_name,
                team_logo=team_logo,
                team_bio=team_bio,
                monthly_amount=monthly_amount,
                currency=currency,
                alternative_amounts=alternative_amounts,
                payment_method=payment_method,
                status=status,
                date_created=datetime.now(timezone.utc),
                date_published=datetime.now(timezone.utc) if status == "published" else None,
            )
            return await self.repository.create(new_campaign)


class GetCampaignUseCase:
    """Use case for getting a campaign."""
    
    def __init__(self, repository: CampaignRepository):
        self.repository = repository
    
    async def execute(self, team_id: int) -> Optional[Campaign]:
        """Get the current campaign for a team."""
        return await self.repository.get_by_team_id(team_id)


class PublishCampaignUseCase:
    """Use case for publishing a campaign."""
    
    def __init__(self, repository: CampaignRepository):
        self.repository = repository
    
    async def execute(self, team_id: int) -> Campaign:
        """Publish a campaign (change status from draft to published)."""
        campaign = await self.repository.get_by_team_id(team_id)
        
        if not campaign:
            raise ValueError("No campaign found for this team")
        
        if not campaign.can_publish():
            raise ValueError("Campaign cannot be published: missing required fields")
        
        campaign.status = "published"
        campaign.date_published = datetime.now(timezone.utc)
        
        return await self.repository.update(campaign)

