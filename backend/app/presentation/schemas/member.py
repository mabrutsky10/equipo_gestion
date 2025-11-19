from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class MemberWithDetailsResponse(BaseModel):
    id: int
    team_id: int
    userprofile_id: Optional[int] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: str
    email: Optional[str] = None
    status: str
    subscription_link: Optional[str] = None
    subscription_status: str
    date_created: datetime
    date_updated: datetime
    
    class Config:
        from_attributes = True


class PaymentRecord(BaseModel):
    id: int
    fecha: datetime
    monto_bruto: Decimal
    monto_fee: Decimal
    monto_neto: Decimal
    estado: str
    tipo: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class MemberEvolutionResponse(BaseModel):
    member_id: int
    member_name: str
    username: Optional[str] = None
    payments: List[PaymentRecord]
    total_paid: Decimal
    total_pending: Decimal
    
    class Config:
        from_attributes = True

