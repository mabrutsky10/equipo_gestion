from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


@dataclass
class Campaign:
    id: Optional[int]
    team_id: int
    team_name: str
    team_logo: Optional[str] = None
    team_bio: Optional[str] = None
    tournament_name: Optional[str] = None
    team_photo_url: Optional[str] = None
    monthly_amount: Decimal = Decimal("0.00")
    currency: str = "ARS"
    alternative_amounts: Optional[List[Decimal]] = None
    payment_method: str = "mercado_pago"
    mercado_pago_link: Optional[str] = None
    raffle_prizes: Optional[List[dict]] = None
    landing_slug: Optional[str] = None
    status: str = "draft"  # draft, published, inactive
    date_created: Optional[datetime] = None
    date_published: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def is_published(self) -> bool:
        """Check if the campaign is published."""
        return self.status == "published"

    def is_draft(self) -> bool:
        """Check if the campaign is a draft."""
        return self.status == "draft"

    def can_publish(self) -> bool:
        """Check if the campaign can be published (has required fields)."""
        return (
            self.team_name is not None
            and len(self.team_name.strip()) > 0
            and self.monthly_amount > 0
        )

