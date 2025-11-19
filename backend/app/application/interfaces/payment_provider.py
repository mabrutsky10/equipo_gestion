from abc import ABC, abstractmethod
from typing import Optional
from decimal import Decimal


class PaymentProvider(ABC):
    """Interface for payment providers. Allows swapping implementations."""

    @abstractmethod
    async def create_subscription_link(
        self,
        entity_type: str,  # member, sponsor
        entity_id: int,
        amount: Decimal,
        currency: str,
        description: str,
    ) -> str:
        """Create a subscription payment link and return the URL."""
        pass

    @abstractmethod
    async def create_one_time_payment_link(
        self,
        collecta_id: int,
        amount: Optional[Decimal],
        currency: str,
        description: str,
    ) -> str:
        """Create a one-time payment link for a collecta."""
        pass

    @abstractmethod
    async def verify_payment(self, payment_id: str) -> dict:
        """Verify payment status. Returns dict with status, amount, etc."""
        pass







