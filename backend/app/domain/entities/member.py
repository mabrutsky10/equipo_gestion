from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Member:
    id: Optional[int]
    team_id: int
    userprofile_id: Optional[int]
    name: str
    email: Optional[str]
    status: str = "active"  # active, inactive
    subscription_link: Optional[str] = None
    subscription_status: str = "inactive"  # active, paused, cancelled, inactive
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def is_active(self) -> bool:
        return self.status == "active" and self.subscription_status == "active"







