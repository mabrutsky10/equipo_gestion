from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from decimal import Decimal


@dataclass
class ConfigCuota:
    id: Optional[int]
    team_id: int
    monto: Decimal
    moneda: str = "ARS"
    provider: str = "manual"
    status: str = "active"  # active, inactive
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def is_active(self) -> bool:
        return self.status == "active"







