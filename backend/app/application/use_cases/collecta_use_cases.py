from typing import List, Optional
from app.application.interfaces.repositories import CollectaRepository
from app.application.interfaces.payment_provider import PaymentProvider
from app.domain.entities.collecta import Collecta
from decimal import Decimal


class CreateCollectaUseCase:
    def __init__(
        self,
        collecta_repository: CollectaRepository,
        payment_provider: PaymentProvider,
    ):
        self.collecta_repository = collecta_repository
        self.payment_provider = payment_provider
    
    async def execute(
        self,
        team_id: int,
        title: str,
        description: Optional[str],
        is_public: bool,
        invited_member_ids: Optional[List[int]] = None,
        invited_emails: Optional[List[str]] = None,
    ) -> Collecta:
        collecta = Collecta(
            id=None,
            team_id=team_id,
            title=title,
            description=description,
            is_public=is_public,
            link_public=None,
            status="active",
            invited_member_ids=invited_member_ids or [],
            invited_emails=invited_emails or [],
        )
        
        # Create payment link
        link = await self.payment_provider.create_one_time_payment_link(
            collecta_id=0,  # Will be updated after creation
            amount=None,
            currency="ARS",
            description=title,
        )
        collecta.link_public = link
        
        created = await self.collecta_repository.create(collecta)
        
        # Update link with actual collecta_id if needed
        if "0" in link:
            new_link = await self.payment_provider.create_one_time_payment_link(
                collecta_id=created.id,
                amount=None,
                currency="ARS",
                description=title,
            )
            created.link_public = new_link
            created = await self.collecta_repository.update(created)
        
        return created


class GetCollectasUseCase:
    def __init__(self, collecta_repository: CollectaRepository):
        self.collecta_repository = collecta_repository
    
    async def execute(self, team_id: int) -> List[Collecta]:
        return await self.collecta_repository.get_by_team_id(team_id)


class GetCollectaByIdUseCase:
    def __init__(self, collecta_repository: CollectaRepository):
        self.collecta_repository = collecta_repository
    
    async def execute(self, collecta_id: int) -> Optional[Collecta]:
        return await self.collecta_repository.get_by_id(collecta_id)







