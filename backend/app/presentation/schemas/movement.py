from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


class MovementResponse(BaseModel):
    id: int
    team_id: int
    fecha: datetime
    tipo: str
    monto_bruto: Decimal
    monto_fee: Decimal
    monto_neto: Decimal
    moneda: str
    metodo_pago: str
    origen_tipo: str
    origen_id: Optional[int]
    estado: str
    description: Optional[str]
    payment_provider: str
    
    class Config:
        from_attributes = True


class MovementCreateRequest(BaseModel):
    fecha: datetime
    tipo: str
    monto_bruto: Decimal
    monto_fee: Decimal = Decimal("0")
    monto_neto: Decimal
    moneda: str = "ARS"
    metodo_pago: str = "manual"
    origen_tipo: str
    origen_id: Optional[int] = None
    estado: str = "confirmed"
    description: Optional[str] = None
    payment_provider: str = "manual"


class MovementFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    tipo: Optional[str] = None
    estado: Optional[str] = None

