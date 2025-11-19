from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from app.application.interfaces.repositories import MovementRepository, MemberRepository
from app.domain.entities.movement import Movement


class GetDashboardStatsUseCase:
    def __init__(
        self,
        movement_repository: MovementRepository,
        member_repository: MemberRepository,
    ):
        self.movement_repository = movement_repository
        self.member_repository = member_repository
    
    async def execute(
        self,
        team_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict:
        if not start_date:
            start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if not end_date:
            end_date = datetime.utcnow()
        
        movements = await self.movement_repository.get_by_team_id(
            team_id=team_id,
            start_date=start_date,
            end_date=end_date,
        )
        
        members = await self.member_repository.get_by_team_id(team_id)
        
        # Calculate stats
        total_ingresos = Decimal("0")
        total_egresos = Decimal("0")
        ingresos_by_type: Dict[str, Decimal] = {}
        egresos_by_type: Dict[str, Decimal] = {}
        monthly_data: Dict[str, Dict[str, Decimal]] = {}
        
        active_members = sum(1 for m in members if m.is_active())
        inactive_members = len(members) - active_members
        
        for movement in movements:
            if movement.estado != "confirmed":
                continue
            
            month_key = movement.fecha.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"ingresos": Decimal("0"), "egresos": Decimal("0")}
            
            if movement.is_ingreso():
                total_ingresos += movement.monto_neto
                monthly_data[month_key]["ingresos"] += movement.monto_neto
                tipo = movement.tipo
                if tipo not in ingresos_by_type:
                    ingresos_by_type[tipo] = Decimal("0")
                ingresos_by_type[tipo] += movement.monto_neto
            elif movement.is_egreso():
                total_egresos += abs(movement.monto_neto)
                monthly_data[month_key]["egresos"] += abs(movement.monto_neto)
                tipo = movement.tipo
                if tipo not in egresos_by_type:
                    egresos_by_type[tipo] = Decimal("0")
                egresos_by_type[tipo] += abs(movement.monto_neto)
        
        balance_neto = total_ingresos - total_egresos
        
        # Convert to serializable format
        return {
            "total_ingresos": float(total_ingresos),
            "total_egresos": float(total_egresos),
            "balance_neto": float(balance_neto),
            "active_members": active_members,
            "inactive_members": inactive_members,
            "total_members": len(members),
            "ingresos_by_type": {k: float(v) for k, v in ingresos_by_type.items()},
            "egresos_by_type": {k: float(v) for k, v in egresos_by_type.items()},
            "monthly_data": {
                k: {"ingresos": float(v["ingresos"]), "egresos": float(v["egresos"])}
                for k, v in monthly_data.items()
            },
        }

