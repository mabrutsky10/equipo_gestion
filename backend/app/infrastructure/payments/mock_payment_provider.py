from typing import Optional
from decimal import Decimal
from app.application.interfaces.payment_provider import PaymentProvider


class MockPaymentProvider(PaymentProvider):
    """Mock payment provider for V1. Returns mock URLs."""
    
    async def create_subscription_link(
        self,
        entity_type: str,
        entity_id: int,
        amount: Decimal,
        currency: str,
        description: str,
    ) -> str:
        """Create a mock subscription payment link."""
        return f"https://mock-payment.example.com/subscription/{entity_type}/{entity_id}?amount={amount}&currency={currency}"
    
    async def create_one_time_payment_link(
        self,
        collecta_id: int,
        amount: Optional[Decimal],
        currency: str,
        description: str,
    ) -> str:
        """Create a mock one-time payment link."""
        amount_param = f"&amount={amount}" if amount else ""
        return f"https://mock-payment.example.com/collecta/{collecta_id}?currency={currency}{amount_param}"
    
    async def verify_payment(self, payment_id: str) -> dict:
        """Verify payment status (mock - always returns confirmed)."""
        return {
            "status": "confirmed",
            "amount": None,
            "currency": None,
            "payment_id": payment_id,
        }







