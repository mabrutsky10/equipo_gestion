from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from app.infrastructure.db.session import get_db
from app.application.use_cases.dashboard_use_cases import GetDashboardStatsUseCase
from app.presentation.schemas.dashboard import DashboardStatsResponse
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.movement_repository import SQLAlchemyMovementRepository
from app.infrastructure.repositories.member_repository import SQLAlchemyMemberRepository

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    movement_repository = SQLAlchemyMovementRepository(db)
    member_repository = SQLAlchemyMemberRepository(db)
    use_case = GetDashboardStatsUseCase(movement_repository, member_repository)
    
    stats = await use_case.execute(
        team_id=current_user.team_id,
        start_date=start_date,
        end_date=end_date,
    )
    
    return DashboardStatsResponse(**stats)

