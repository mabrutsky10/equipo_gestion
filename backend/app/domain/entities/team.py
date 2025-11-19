from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Team:
    id: Optional[int]
    name: str
    currency_default: str = "ARS"
    mas10_team_id: Optional[int] = None
    mas10_username: Optional[str] = None
    level_id: int = 0
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def __post_init__(self):
        if self.currency_default is None:
            self.currency_default = "ARS"
        if self.level_id is None:
            self.level_id = 0



