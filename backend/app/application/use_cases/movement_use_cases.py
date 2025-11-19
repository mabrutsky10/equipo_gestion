from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.application.interfaces.repositories import MovementRepository
from app.domain.entities.movement import Movement


class CreateMovementUseCase:
    def __init__(self, movement_repository: MovementRepository):
        self.movement_repository = movement_repository
    
    async def execute(
        self,
        team_id: int,
        fecha: datetime,
        tipo: str,
        monto_bruto: Decimal,
        monto_fee: Decimal,
        monto_neto: Decimal,
        moneda: str,
        metodo_pago: str,
        origen_tipo: str,
        origen_id: Optional[int] = None,
        estado: str = "confirmed",
        description: Optional[str] = None,
        payment_provider: str = "manual",
    ) -> Movement:
        movement = Movement(
            id=None,
            team_id=team_id,
            fecha=fecha,
            tipo=tipo,
            monto_bruto=monto_bruto,
            monto_fee=monto_fee,
            monto_neto=monto_neto,
            moneda=moneda,
            metodo_pago=metodo_pago,
            origen_tipo=origen_tipo,
            origen_id=origen_id,
            estado=estado,
            description=description,
            payment_provider=payment_provider,
        )
        return await self.movement_repository.create(movement)


class GetMovementsUseCase:
    def __init__(self, movement_repository: MovementRepository):
        self.movement_repository = movement_repository
    
    async def execute(
        self,
        team_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tipo: Optional[str] = None,
        estado: Optional[str] = None,
    ) -> List[Movement]:
        return await self.movement_repository.get_by_team_id(
            team_id=team_id,
            start_date=start_date,
            end_date=end_date,
            tipo=tipo,
            estado=estado,
        )


class GetMovementByIdUseCase:
    def __init__(self, movement_repository: MovementRepository):
        self.movement_repository = movement_repository
    
    async def execute(self, movement_id: int) -> Optional[Movement]:
        return await self.movement_repository.get_by_id(movement_id)







