from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.application.interfaces.repositories import MovementRepository
from app.domain.entities.movement import Movement
from app.infrastructure.db.models import MovementModel


class SQLAlchemyMovementRepository(MovementRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: MovementModel) -> Movement:
        return Movement(
            id=model.id,
            team_id=model.team_id,
            fecha=model.fecha,
            tipo=model.tipo,
            monto_bruto=model.monto_bruto,
            monto_fee=model.monto_fee,
            monto_neto=model.monto_neto,
            moneda=model.moneda,
            metodo_pago=model.metodo_pago,
            origen_tipo=model.origen_tipo,
            origen_id=model.origen_id,
            estado=model.estado,
            description=model.description,
            payment_provider=model.payment_provider,
            date_created=model.date_created,
            date_updated=model.date_updated,
        )
    
    def _to_model(self, entity: Movement) -> MovementModel:
        return MovementModel(
            id=entity.id,
            team_id=entity.team_id,
            fecha=entity.fecha or datetime.utcnow(),
            tipo=entity.tipo,
            monto_bruto=entity.monto_bruto,
            monto_fee=entity.monto_fee,
            monto_neto=entity.monto_neto,
            moneda=entity.moneda,
            metodo_pago=entity.metodo_pago,
            origen_tipo=entity.origen_tipo,
            origen_id=entity.origen_id,
            estado=entity.estado,
            description=entity.description,
            payment_provider=entity.payment_provider,
            date_created=entity.date_created or datetime.utcnow(),
            date_updated=entity.date_updated or datetime.utcnow(),
        )
    
    async def create(self, movement: Movement) -> Movement:
        model = self._to_model(movement)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, movement_id: int) -> Optional[Movement]:
        result = await self.session.execute(select(MovementModel).where(MovementModel.id == movement_id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_team_id(
        self,
        team_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tipo: Optional[str] = None,
        estado: Optional[str] = None,
    ) -> List[Movement]:
        query = select(MovementModel).where(MovementModel.team_id == team_id)
        
        if start_date:
            query = query.where(MovementModel.fecha >= start_date)
        if end_date:
            query = query.where(MovementModel.fecha <= end_date)
        if tipo:
            query = query.where(MovementModel.tipo == tipo)
        if estado:
            query = query.where(MovementModel.estado == estado)
        
        query = query.order_by(MovementModel.fecha.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]







