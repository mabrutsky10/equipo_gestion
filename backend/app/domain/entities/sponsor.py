from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Sponsor:
    id: Optional[int]
    team_id: int
    name: str
    email: Optional[str]
    subscription_link: Optional[str] = None
    subscription_status: str = "inactive"  # active, paused, cancelled, inactive
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def is_active(self) -> bool:
        return self.subscription_status == "active"







