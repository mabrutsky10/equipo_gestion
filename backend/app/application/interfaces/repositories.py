from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.domain.entities.team import Team
from app.domain.entities.member import Member
from app.domain.entities.sponsor import Sponsor
from app.domain.entities.collecta import Collecta
from app.domain.entities.movement import Movement
from app.domain.entities.config_cuota import ConfigCuota
from app.domain.entities.campaign import Campaign
from app.domain.entities.user import User
from app.domain.entities.chat_message import ChatMessage
from app.domain.entities.assistant import Assistant


class TeamRepository(ABC):
    @abstractmethod
    async def create(self, team: Team) -> Team:
        pass

    @abstractmethod
    async def get_by_id(self, team_id: int) -> Optional[Team]:
        pass

    @abstractmethod
    async def get_all(self) -> List[Team]:
        pass

    @abstractmethod
    async def update(self, team: Team) -> Team:
        pass


class MemberRepository(ABC):
    @abstractmethod
    async def create(self, member: Member) -> Member:
        pass

    @abstractmethod
    async def get_by_id(self, member_id: int) -> Optional[Member]:
        pass

    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> List[Member]:
        pass

    @abstractmethod
    async def update(self, member: Member) -> Member:
        pass


class SponsorRepository(ABC):
    @abstractmethod
    async def create(self, sponsor: Sponsor) -> Sponsor:
        pass

    @abstractmethod
    async def get_by_id(self, sponsor_id: int) -> Optional[Sponsor]:
        pass

    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> List[Sponsor]:
        pass

    @abstractmethod
    async def update(self, sponsor: Sponsor) -> Sponsor:
        pass


class CollectaRepository(ABC):
    @abstractmethod
    async def create(self, collecta: Collecta) -> Collecta:
        pass

    @abstractmethod
    async def get_by_id(self, collecta_id: int) -> Optional[Collecta]:
        pass

    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> List[Collecta]:
        pass

    @abstractmethod
    async def update(self, collecta: Collecta) -> Collecta:
        pass


class MovementRepository(ABC):
    @abstractmethod
    async def create(self, movement: Movement) -> Movement:
        pass

    @abstractmethod
    async def get_by_id(self, movement_id: int) -> Optional[Movement]:
        pass

    @abstractmethod
    async def get_by_team_id(
        self,
        team_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tipo: Optional[str] = None,
        estado: Optional[str] = None,
    ) -> List[Movement]:
        pass


class ConfigCuotaRepository(ABC):
    @abstractmethod
    async def create(self, config: ConfigCuota) -> ConfigCuota:
        pass

    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> Optional[ConfigCuota]:
        pass

    @abstractmethod
    async def update(self, config: ConfigCuota) -> ConfigCuota:
        pass


class CampaignRepository(ABC):
    @abstractmethod
    async def create(self, campaign: Campaign) -> Campaign:
        pass

    @abstractmethod
    async def get_by_id(self, campaign_id: int) -> Optional[Campaign]:
        pass

    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> Optional[Campaign]:
        """Get the current campaign for a team (usually the published one or latest draft)."""
        pass

    @abstractmethod
    async def update(self, campaign: Campaign) -> Campaign:
        pass
    
    @abstractmethod
    async def get_published_by_team_id(self, team_id: int) -> Optional[Campaign]:
        """Get the published (active) campaign for a team."""
        pass
    
    @abstractmethod
    async def get_published_by_slug(self, landing_slug: str) -> Optional[Campaign]:
        """Get the published campaign by its public slug."""
        pass
    
    @abstractmethod
    async def get_all_by_team_id(self, team_id: int) -> List[Campaign]:
        """Get all campaigns for a team."""
        pass


class UserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User:
        pass

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    async def update_team_id(self, user_id: int, team_id: int) -> Optional[User]:
        pass


class ChatRepository(ABC):
    @abstractmethod
    async def create(self, message: ChatMessage) -> ChatMessage:
        pass

    @abstractmethod
    async def get_by_id(self, message_id: int) -> Optional[ChatMessage]:
        pass

    @abstractmethod
    async def get_by_team_and_assistant(
        self, team_id: int, assistant_id: str, limit: Optional[int] = None
    ) -> List[ChatMessage]:
        pass

    @abstractmethod
    async def get_assistants(self) -> List[Assistant]:
        pass

