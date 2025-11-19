from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime, timezone
import re
from app.application.interfaces.repositories import CampaignRepository
from app.domain.entities.campaign import Campaign


def _generate_landing_slug(team_name: str, team_id: int) -> str:
    """Generate a deterministic slug per team for the public landing."""
    base = team_name.lower().strip() if team_name else ""
    base = re.sub(r"[^a-z0-9]+", "-", base)
    base = base.strip("-") or f"equipo-{team_id}"
    return f"{base}-{team_id}"


def _normalize_prizes(prizes: Optional[List[Dict[str, Any]]]) -> Optional[List[Dict[str, Any]]]:
    """Ensure prizes are stored as plain dicts suitable for JSON serialization."""
    if not prizes:
        return None
    normalized: List[Dict[str, Any]] = []
    for prize in prizes:
        if prize is None:
            continue
        if hasattr(prize, "model_dump"):
            normalized.append({k: v for k, v in prize.model_dump().items() if v not in (None, "")})
        elif isinstance(prize, dict):
            normalized.append({k: v for k, v in prize.items() if v not in (None, "")})
    return normalized or None


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
        tournament_name: Optional[str] = None,
        team_photo_url: Optional[str] = None,
        alternative_amounts: Optional[list[Decimal]] = None,
        payment_method: str = "mercado_pago",
        mercado_pago_link: Optional[str] = None,
        raffle_prizes: Optional[List[Dict[str, Any]]] = None,
        status: str = "draft",
    ) -> Campaign:
        """Create or update a campaign."""
        # Check if a campaign already exists for this team
        existing_campaign = await self.repository.get_by_team_id(team_id)
        
        prize_payload = _normalize_prizes(raffle_prizes)

        if existing_campaign:
            previous_status = existing_campaign.status
            # Update existing campaign
            existing_campaign.team_name = team_name
            existing_campaign.team_logo = team_logo
            existing_campaign.team_bio = team_bio
            existing_campaign.tournament_name = tournament_name
            existing_campaign.team_photo_url = team_photo_url
            existing_campaign.monthly_amount = monthly_amount
            existing_campaign.currency = currency
            existing_campaign.alternative_amounts = alternative_amounts
            existing_campaign.payment_method = payment_method
            existing_campaign.mercado_pago_link = mercado_pago_link
            existing_campaign.raffle_prizes = prize_payload
            existing_campaign.status = status
            if not existing_campaign.landing_slug:
                existing_campaign.landing_slug = _generate_landing_slug(team_name, team_id)
            
            # Set date_published if status is being changed to published
            if status == "published" and previous_status != "published":
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
                tournament_name=tournament_name,
                team_photo_url=team_photo_url,
                monthly_amount=monthly_amount,
                currency=currency,
                alternative_amounts=alternative_amounts,
                payment_method=payment_method,
                mercado_pago_link=mercado_pago_link,
                raffle_prizes=prize_payload,
                landing_slug=_generate_landing_slug(team_name, team_id),
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

