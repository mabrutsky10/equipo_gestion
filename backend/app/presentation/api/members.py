from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_
import logging
from app.infrastructure.db.session import get_db
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.member_repository import SQLAlchemyMemberRepository
from app.infrastructure.db.models import MovementModel
from app.presentation.schemas.member import (
    MemberWithDetailsResponse,
    MemberEvolutionResponse,
    PaymentRecord
)
from decimal import Decimal
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/members", tags=["members"])


@router.get("/with-details", response_model=List[MemberWithDetailsResponse])
async def get_members_with_details(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all members with username, name, and lastname from userprofile."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    try:
        # Query members with userprofile join
        query = text("""
            SELECT 
                m.id,
                m.team_id,
                m.userprofile_id,
                m.name,
                m.email,
                m.status,
                m.subscription_link,
                m.subscription_status,
                m.date_created,
                m.date_updated,
                up.username,
                up.first_name,
                up.last_name
            FROM members m
            LEFT JOIN userprofile up ON m.userprofile_id = up.id
            WHERE m.team_id = :team_id
            ORDER BY m.date_created DESC
        """)
        
        result = await db.execute(query, {"team_id": current_user.team_id})
        rows = result.fetchall()
        
        members = []
        for row in rows:
            try:
                # Use first_name and last_name from userprofile if available, otherwise use name from members
                display_name = row.name or ""
                first_name = row.first_name if row.first_name else None
                last_name = row.last_name if row.last_name else None
                
                # If we have first_name and last_name, combine them
                if first_name and last_name:
                    display_name = f"{first_name} {last_name}"
                elif first_name:
                    display_name = first_name
                elif last_name:
                    display_name = last_name
                
                members.append(MemberWithDetailsResponse(
                    id=row.id,
                    team_id=row.team_id,
                    userprofile_id=row.userprofile_id,
                    username=row.username,
                    first_name=first_name,
                    last_name=last_name,
                    name=display_name,
                    email=row.email,
                    status=row.status or "active",
                    subscription_link=row.subscription_link,
                    subscription_status=row.subscription_status or "inactive",
                    date_created=row.date_created,
                    date_updated=row.date_updated,
                ))
            except Exception as e:
                logger.error(f"Error processing member row {row.id if hasattr(row, 'id') else 'unknown'}: {e}")
                continue
        
        return members
    except Exception as e:
        logger.error(f"Error fetching members with details: {e}", exc_info=True)
        # Return empty list instead of raising exception to allow frontend to handle gracefully
        return []


@router.get("/{member_id}/evolution", response_model=MemberEvolutionResponse)
async def get_member_evolution(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment evolution (cuotas) for a specific member."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    # Verify member belongs to user's team
    member_repo = SQLAlchemyMemberRepository(db)
    member = await member_repo.get_by_id(member_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    if member.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member does not belong to your team"
        )
    
    # Get member details with userprofile
    query = text("""
        SELECT 
            m.id,
            m.name,
            up.username
        FROM members m
        LEFT JOIN userprofile up ON m.userprofile_id = up.id
        WHERE m.id = :member_id
    """)
    
    result = await db.execute(query, {"member_id": member_id})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    member_name = row.name
    username = row.username
    
    # Get all movements of type 'cuota' for this member
    movements_result = await db.execute(
        select(MovementModel)
        .where(
            and_(
                MovementModel.team_id == current_user.team_id,
                MovementModel.tipo == "cuota",
                MovementModel.origen_tipo == "member",
                MovementModel.origen_id == member_id
            )
        )
        .order_by(MovementModel.fecha.desc())
    )
    movements = movements_result.scalars().all()
    
    # Convert to PaymentRecord and calculate totals
    payments = []
    total_paid = Decimal("0.00")
    total_pending = Decimal("0.00")
    
    for movement in movements:
        payments.append(PaymentRecord(
            id=movement.id,
            fecha=movement.fecha,
            monto_bruto=Decimal(str(movement.monto_bruto)),
            monto_fee=Decimal(str(movement.monto_fee)),
            monto_neto=Decimal(str(movement.monto_neto)),
            estado=movement.estado,
            tipo=movement.tipo,
            description=movement.description,
        ))
        
        if movement.estado == "confirmed":
            total_paid += Decimal(str(movement.monto_neto))
        elif movement.estado == "pending":
            total_pending += Decimal(str(movement.monto_neto))
    
    return MemberEvolutionResponse(
        member_id=member_id,
        member_name=member_name,
        username=username,
        payments=payments,
        total_paid=total_paid,
        total_pending=total_pending,
    )

