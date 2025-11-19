from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
from app.infrastructure.db.session import get_db
from app.application.use_cases.campaign_use_cases import (
    CreateOrUpdateCampaignUseCase,
    GetCampaignUseCase,
    PublishCampaignUseCase,
)
from app.presentation.schemas.campaign import CampaignResponse, CampaignCreateRequest
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.campaign_repository import SQLAlchemyCampaignRepository
from app.infrastructure.repositories.team_repository import SQLAlchemyTeamRepository
from app.infrastructure.repositories.member_repository import SQLAlchemyMemberRepository
from app.infrastructure.db.models import LevelModel
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _serialize_campaign(campaign) -> CampaignResponse:
    return CampaignResponse(
        id=campaign.id,
        team_id=campaign.team_id,
        team_name=campaign.team_name,
        team_logo=campaign.team_logo,
        team_bio=campaign.team_bio,
        tournament_name=campaign.tournament_name,
        team_photo_url=campaign.team_photo_url,
        monthly_amount=campaign.monthly_amount,
        currency=campaign.currency,
        alternative_amounts=campaign.alternative_amounts,
        payment_method=campaign.payment_method,
        mercado_pago_link=campaign.mercado_pago_link,
        raffle_prizes=campaign.raffle_prizes,
        landing_slug=campaign.landing_slug,
        status=campaign.status,
        date_created=campaign.date_created,
        date_published=campaign.date_published,
        date_updated=campaign.date_updated,
    )


@router.get("/current", response_model=CampaignResponse)
async def get_current_campaign(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current campaign for the current user's team."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyCampaignRepository(db)
    use_case = GetCampaignUseCase(repository)
    
    campaign = await use_case.execute(current_user.team_id)
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No campaign found for this team"
        )
    
    return _serialize_campaign(campaign)


@router.post("/draft", response_model=CampaignResponse)
async def save_campaign_draft(
    request: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a campaign as draft."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyCampaignRepository(db)
    use_case = CreateOrUpdateCampaignUseCase(repository)
    
    campaign = await use_case.execute(
        team_id=current_user.team_id,
        team_name=request.team_name,
        team_logo=request.team_logo,
        team_bio=request.team_bio,
        tournament_name=request.tournament_name,
        team_photo_url=request.team_photo_url,
        monthly_amount=request.monthly_amount,
        currency=request.currency,
        alternative_amounts=request.alternative_amounts,
        payment_method=request.payment_method,
        mercado_pago_link=request.mercado_pago_link,
        raffle_prizes=request.raffle_prizes,
        status="draft",  # Force draft status for this endpoint
    )
    
    return _serialize_campaign(campaign)


@router.post("/publish", response_model=CampaignResponse)
async def publish_campaign(
    request: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish a campaign (create or update and publish)."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyCampaignRepository(db)
    use_case = CreateOrUpdateCampaignUseCase(repository)
    
    campaign = await use_case.execute(
        team_id=current_user.team_id,
        team_name=request.team_name,
        team_logo=request.team_logo,
        team_bio=request.team_bio,
        tournament_name=request.tournament_name,
        team_photo_url=request.team_photo_url,
        monthly_amount=request.monthly_amount,
        currency=request.currency,
        alternative_amounts=request.alternative_amounts,
        payment_method=request.payment_method,
        mercado_pago_link=request.mercado_pago_link,
        raffle_prizes=request.raffle_prizes,
        status="published",  # Force published status for this endpoint
    )
    
    return _serialize_campaign(campaign)


@router.get("/active", response_model=Optional[CampaignResponse])
async def get_active_campaign(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the active (published) campaign for the current user's team."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    try:
        repository = SQLAlchemyCampaignRepository(db)
        campaign = await repository.get_published_by_team_id(current_user.team_id)
        
        if not campaign:
            return None
        
        return _serialize_campaign(campaign)
    except Exception as e:
        logger.error(f"Error fetching active campaign: {e}", exc_info=True)
        # Return None instead of raising exception to allow frontend to handle gracefully
        return None


@router.get("/all", response_model=List[CampaignResponse])
async def get_all_campaigns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all campaigns (active and historical) for the current user's team."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    try:
        repository = SQLAlchemyCampaignRepository(db)
        campaigns = await repository.get_all_by_team_id(current_user.team_id)
        
        if not campaigns:
            return []
        
        return [_serialize_campaign(campaign) for campaign in campaigns]
    except Exception as e:
        logger.error(f"Error fetching all campaigns: {e}", exc_info=True)
        # Return empty list instead of raising exception to allow frontend to handle gracefully
        return []


@router.get("/check-access")
async def check_campaign_access(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if user can create campaigns based on team level. Also returns next level info and members count."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    # Get team with level_id
    team_repo = SQLAlchemyTeamRepository(db)
    team = await team_repo.get_by_id(current_user.team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Get current level info
    current_level = None
    level_id = team.level_id if team.level_id is not None else 0
    
    try:
        if level_id > 0:
            result = await db.execute(
                select(LevelModel).where(LevelModel.id == level_id)
            )
            current_level = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error fetching current level: {e}")
        current_level = None
    
    # Get members count
    try:
        member_repo = SQLAlchemyMemberRepository(db)
        members = await member_repo.get_by_team_id(current_user.team_id)
        members_count = len(members) if members else 0
    except Exception as e:
        logger.error(f"Error fetching members: {e}")
        members_count = 0
    
    # Get next level info (if not at max level)
    next_level = None
    members_needed_for_next_level = None
    try:
        if level_id < 6:
            next_level_id = level_id + 1
            result = await db.execute(
                select(LevelModel).where(LevelModel.id == next_level_id)
            )
            next_level = result.scalar_one_or_none()
            if next_level and next_level.socios_desde is not None:
                members_needed_for_next_level = max(0, next_level.socios_desde - members_count)
    except Exception as e:
        logger.error(f"Error fetching next level: {e}")
        next_level = None
    
    can_create = level_id >= 1
    
    # Build response
    response = {
        "team_id": team.id,
        "level_id": level_id,
        "can_create_campaign": can_create,
        "message": "Necesitas nivel 1 para activar campaña de socios" if not can_create else None,
        "members_count": members_count,
        "members_needed_for_next_level": members_needed_for_next_level
    }
    
    # Add current_level if it exists
    if current_level:
        response["current_level"] = {
            "id": current_level.id,
            "nombre": current_level.nombre or "",
            "socios_desde": current_level.socios_desde if current_level.socios_desde is not None else 0
        }
    else:
        response["current_level"] = None
    
    # Add next_level if it exists
    if next_level:
        response["next_level"] = {
            "id": next_level.id,
            "nombre": next_level.nombre or "",
            "socios_desde": next_level.socios_desde if next_level.socios_desde is not None else 0
        }
    else:
        response["next_level"] = None
    
    return response


@router.get("/public/by-slug/{landing_slug}", response_model=CampaignResponse)
async def get_public_campaign_by_slug(
    landing_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint that returns the published campaign for a given slug."""
    repository = SQLAlchemyCampaignRepository(db)
    campaign = await repository.get_published_by_slug(landing_slug)
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    return _serialize_campaign(campaign)
