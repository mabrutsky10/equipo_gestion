from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.application.use_cases.collecta_use_cases import CreateCollectaUseCase, GetCollectasUseCase
from app.presentation.schemas.collecta import CollectaResponse, CollectaCreateRequest
from app.presentation.api.dependencies import get_current_user, get_payment_provider
from app.domain.entities.user import User
from app.application.interfaces.payment_provider import PaymentProvider
from app.infrastructure.repositories.collecta_repository import SQLAlchemyCollectaRepository

router = APIRouter(prefix="/collectas", tags=["collectas"])


@router.get("", response_model=list[CollectaResponse])
async def get_collectas(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get collectas for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyCollectaRepository(db)
    use_case = GetCollectasUseCase(repository)
    
    collectas = await use_case.execute(current_user.team_id)
    
    return [
        CollectaResponse(
            id=c.id,
            team_id=c.team_id,
            title=c.title,
            description=c.description,
            is_public=c.is_public,
            link_public=c.link_public,
            status=c.status,
            date_created=c.date_created,
            date_end=c.date_end,
            invited_member_ids=c.invited_member_ids or [],
            invited_emails=c.invited_emails or [],
        )
        for c in collectas
    ]


@router.post("", response_model=CollectaResponse)
async def create_collecta(
    request: CollectaCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    payment_provider: PaymentProvider = Depends(get_payment_provider),
):
    """Create a new collecta for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyCollectaRepository(db)
    use_case = CreateCollectaUseCase(repository, payment_provider)
    
    collecta = await use_case.execute(
        team_id=current_user.team_id,
        title=request.title,
        description=request.description,
        is_public=request.is_public,
        invited_member_ids=request.invited_member_ids,
        invited_emails=request.invited_emails,
    )
    
    return CollectaResponse(
        id=collecta.id,
        team_id=collecta.team_id,
        title=collecta.title,
        description=collecta.description,
        is_public=collecta.is_public,
        link_public=collecta.link_public,
        status=collecta.status,
        date_created=collecta.date_created,
        date_end=collecta.date_end,
        invited_member_ids=collecta.invited_member_ids or [],
        invited_emails=collecta.invited_emails or [],
    )

