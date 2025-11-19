from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime


class DashboardStatsResponse(BaseModel):
    total_ingresos: float
    total_egresos: float
    balance_neto: float
    active_members: int
    inactive_members: int
    total_members: int
    ingresos_by_type: Dict[str, float]
    egresos_by_type: Dict[str, float]
    monthly_data: Dict[str, Dict[str, float]]


class DashboardFilterParams(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None







