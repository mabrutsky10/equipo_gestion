from pydantic import BaseModel
from decimal import Decimal


class ConfigCuotaResponse(BaseModel):
    id: int
    team_id: int
    monto: Decimal
    moneda: str
    provider: str
    status: str
    
    class Config:
        from_attributes = True


class ConfigCuotaCreateRequest(BaseModel):
    monto: Decimal
    moneda: str = "ARS"
    provider: str = "manual"
    status: str = "active"

