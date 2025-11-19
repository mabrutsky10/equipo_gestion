from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.application.interfaces.repositories import ConfigCuotaRepository
from app.domain.entities.config_cuota import ConfigCuota
from app.infrastructure.db.models import ConfigCuotaModel
from datetime import datetime


class SQLAlchemyConfigCuotaRepository(ConfigCuotaRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ConfigCuotaModel) -> ConfigCuota:
        return ConfigCuota(
            id=model.id,
            team_id=model.team_id,
            monto=model.monto,
            moneda=model.moneda,
            provider=model.provider,
            status=model.status,
            date_created=model.date_created,
            date_updated=model.date_updated,
        )
    
    def _to_model(self, entity: ConfigCuota) -> ConfigCuotaModel:
        return ConfigCuotaModel(
            id=entity.id,
            team_id=entity.team_id,
            monto=entity.monto,
            moneda=entity.moneda,
            provider=entity.provider,
            status=entity.status,
            date_created=entity.date_created or datetime.utcnow(),
            date_updated=entity.date_updated or datetime.utcnow(),
        )
    
    async def create(self, config: ConfigCuota) -> ConfigCuota:
        model = self._to_model(config)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_team_id(self, team_id: int) -> Optional[ConfigCuota]:
        result = await self.session.execute(select(ConfigCuotaModel).where(ConfigCuotaModel.team_id == team_id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def update(self, config: ConfigCuota) -> ConfigCuota:
        result = await self.session.execute(select(ConfigCuotaModel).where(ConfigCuotaModel.id == config.id))
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"ConfigCuota with id {config.id} not found")
        
        model.monto = config.monto
        model.moneda = config.moneda
        model.provider = config.provider
        model.status = config.status
        model.date_updated = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)







