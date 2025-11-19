from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from app.infrastructure.db.session import get_db
from app.application.use_cases.movement_use_cases import CreateMovementUseCase, GetMovementsUseCase
from app.presentation.schemas.movement import MovementResponse, MovementCreateRequest
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.movement_repository import SQLAlchemyMovementRepository

router = APIRouter(prefix="/movements", tags=["movements"])


@router.get("", response_model=list[MovementResponse])
async def get_movements(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    tipo: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get movements for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyMovementRepository(db)
    use_case = GetMovementsUseCase(repository)
    
    movements = await use_case.execute(
        team_id=current_user.team_id,
        start_date=start_date,
        end_date=end_date,
        tipo=tipo,
        estado=estado,
    )
    
    return [
        MovementResponse(
            id=m.id,
            team_id=m.team_id,
            fecha=m.fecha,
            tipo=m.tipo,
            monto_bruto=m.monto_bruto,
            monto_fee=m.monto_fee,
            monto_neto=m.monto_neto,
            moneda=m.moneda,
            metodo_pago=m.metodo_pago,
            origen_tipo=m.origen_tipo,
            origen_id=m.origen_id,
            estado=m.estado,
            description=m.description,
            payment_provider=m.payment_provider,
        )
        for m in movements
    ]


@router.post("", response_model=MovementResponse)
async def create_movement(
    request: MovementCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new movement for the current user's team."""
    if not current_user.team_id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    repository = SQLAlchemyMovementRepository(db)
    use_case = CreateMovementUseCase(repository)
    
    movement = await use_case.execute(
        team_id=current_user.team_id,
        fecha=request.fecha,
        tipo=request.tipo,
        monto_bruto=request.monto_bruto,
        monto_fee=request.monto_fee,
        monto_neto=request.monto_neto,
        moneda=request.moneda,
        metodo_pago=request.metodo_pago,
        origen_tipo=request.origen_tipo,
        origen_id=request.origen_id,
        estado=request.estado,
        description=request.description,
        payment_provider=request.payment_provider,
    )
    
    return MovementResponse(
        id=movement.id,
        team_id=movement.team_id,
        fecha=movement.fecha,
        tipo=movement.tipo,
        monto_bruto=movement.monto_bruto,
        monto_fee=movement.monto_fee,
        monto_neto=movement.monto_neto,
        moneda=movement.moneda,
        metodo_pago=movement.metodo_pago,
        origen_tipo=movement.origen_tipo,
        origen_id=movement.origen_id,
        estado=movement.estado,
        description=movement.description,
        payment_provider=movement.payment_provider,
    )

