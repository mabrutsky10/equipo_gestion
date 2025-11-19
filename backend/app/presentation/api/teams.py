from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.infrastructure.db.session import get_db
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.team_repository import SQLAlchemyTeamRepository
from app.infrastructure.db.models import LevelModel
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/teams", tags=["teams"])


class LevelInfo(BaseModel):
    id: int
    nombre: str
    descripcion: str
    socios_desde: Optional[int] = 0
    
    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: int
    name: str
    currency_default: str
    level: Optional[LevelInfo] = None


@router.get("/current", response_model=TeamResponse)
async def get_current_team(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's team information."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyTeamRepository(db)
    team = await repository.get_by_id(current_user.team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Get level information
    level_info = None
    if team.level_id is not None:
        result = await db.execute(
            select(LevelModel).where(LevelModel.id == team.level_id)
        )
        level_model = result.scalar_one_or_none()
        if level_model:
            level_info = LevelInfo(
                id=level_model.id,
                nombre=level_model.nombre,
                descripcion=level_model.descripcion,
                socios_desde=level_model.socios_desde or 0
            )
    
    return TeamResponse(
        id=team.id,
        name=team.name,
        currency_default=team.currency_default,
        level=level_info,
    )

