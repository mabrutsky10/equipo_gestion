from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.use_cases.config_cuota_use_cases import CreateOrUpdateConfigCuotaUseCase, GetConfigCuotaUseCase
from app.presentation.schemas.config_cuota import ConfigCuotaResponse, ConfigCuotaCreateRequest
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.config_cuota_repository import SQLAlchemyConfigCuotaRepository

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/cuota", response_model=Optional[ConfigCuotaResponse])
async def get_config_cuota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get monthly fee configuration for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyConfigCuotaRepository(db)
    use_case = GetConfigCuotaUseCase(repository)
    
    config = await use_case.execute(current_user.team_id)
    if not config:
        return None
    
    return ConfigCuotaResponse(
        id=config.id,
        team_id=config.team_id,
        monto=config.monto,
        moneda=config.moneda,
        provider=config.provider,
        status=config.status,
    )


@router.post("/cuota", response_model=ConfigCuotaResponse)
async def create_or_update_config_cuota(
    request: ConfigCuotaCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update monthly fee configuration for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyConfigCuotaRepository(db)
    use_case = CreateOrUpdateConfigCuotaUseCase(repository)
    
    config = await use_case.execute(
        team_id=current_user.team_id,
        monto=request.monto,
        moneda=request.moneda,
        provider=request.provider,
        status=request.status,
    )
    
    return ConfigCuotaResponse(
        id=config.id,
        team_id=config.team_id,
        monto=config.monto,
        moneda=config.moneda,
        provider=config.provider,
        status=config.status,
    )

