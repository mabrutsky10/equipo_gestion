from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List


@dataclass
class Collecta:
    id: Optional[int]
    team_id: int
    title: str
    description: Optional[str]
    is_public: bool = True
    link_public: Optional[str] = None
    status: str = "active"  # active, closed, cancelled
    date_created: Optional[datetime] = None
    date_end: Optional[datetime] = None
    date_updated: Optional[datetime] = None
    invited_member_ids: Optional[List[int]] = None
    invited_emails: Optional[List[str]] = None

    def is_active(self) -> bool:
        return self.status == "active"







