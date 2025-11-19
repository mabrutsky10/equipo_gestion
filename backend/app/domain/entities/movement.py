from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from decimal import Decimal


@dataclass
class Movement:
    id: Optional[int]
    team_id: int
    fecha: datetime
    tipo: str  # cuota, colecta, aporte, sponsor, fee, cashout
    monto_bruto: Decimal
    monto_neto: Decimal
    origen_tipo: str  # member, sponsor, collecta, manual, system
    monto_fee: Decimal = Decimal("0")
    moneda: str = "ARS"
    metodo_pago: str = "manual"
    origen_id: Optional[int] = None
    estado: str = "confirmed"  # confirmed, pending, cancelled
    description: Optional[str] = None
    payment_provider: str = "manual"
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None

    def is_ingreso(self) -> bool:
        return self.tipo in ["cuota", "colecta", "aporte", "sponsor"]

    def is_egreso(self) -> bool:
        return self.tipo in ["fee", "cashout"]

