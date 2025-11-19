from typing import Optional
from decimal import Decimal
from app.application.interfaces.repositories import ConfigCuotaRepository
from app.domain.entities.config_cuota import ConfigCuota


class CreateOrUpdateConfigCuotaUseCase:
    def __init__(self, config_cuota_repository: ConfigCuotaRepository):
        self.config_cuota_repository = config_cuota_repository
    
    async def execute(
        self,
        team_id: int,
        monto: Decimal,
        moneda: str = "ARS",
        provider: str = "manual",
        status: str = "active",
    ) -> ConfigCuota:
        existing = await self.config_cuota_repository.get_by_team_id(team_id)
        
        if existing:
            existing.monto = monto
            existing.moneda = moneda
            existing.provider = provider
            existing.status = status
            return await self.config_cuota_repository.update(existing)
        else:
            config = ConfigCuota(
                id=None,
                team_id=team_id,
                monto=monto,
                moneda=moneda,
                provider=provider,
                status=status,
            )
            return await self.config_cuota_repository.create(config)


class GetConfigCuotaUseCase:
    def __init__(self, config_cuota_repository: ConfigCuotaRepository):
        self.config_cuota_repository = config_cuota_repository
    
    async def execute(self, team_id: int) -> Optional[ConfigCuota]:
        return await self.config_cuota_repository.get_by_team_id(team_id)







