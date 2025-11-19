from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional, List


class CampaignPrize(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    team_id: int
    team_name: str
    team_logo: Optional[str] = None
    team_bio: Optional[str] = None
    tournament_name: Optional[str] = None
    team_photo_url: Optional[str] = None
    monthly_amount: Decimal
    currency: str
    alternative_amounts: Optional[List[Decimal]] = None
    payment_method: str
    mercado_pago_link: Optional[str] = None
    raffle_prizes: Optional[List[CampaignPrize]] = None
    landing_slug: Optional[str] = None
    status: str
    date_created: datetime
    date_published: Optional[datetime] = None
    date_updated: datetime
    
    class Config:
        from_attributes = True


class CampaignCreateRequest(BaseModel):
    team_name: str
    team_logo: Optional[str] = None
    team_bio: Optional[str] = None
    tournament_name: Optional[str] = None
    team_photo_url: Optional[str] = None
    monthly_amount: Decimal
    currency: str = "ARS"
    alternative_amounts: Optional[List[Decimal]] = None
    payment_method: str = "mercado_pago"
    mercado_pago_link: Optional[str] = None
    raffle_prizes: Optional[List[CampaignPrize]] = None
    status: str = "draft"  # draft or published


class CampaignUpdateRequest(BaseModel):
    team_name: Optional[str] = None
    team_logo: Optional[str] = None
    team_bio: Optional[str] = None
    tournament_name: Optional[str] = None
    team_photo_url: Optional[str] = None
    monthly_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    alternative_amounts: Optional[List[Decimal]] = None
    payment_method: Optional[str] = None
    mercado_pago_link: Optional[str] = None
    raffle_prizes: Optional[List[CampaignPrize]] = None
    status: Optional[str] = None

