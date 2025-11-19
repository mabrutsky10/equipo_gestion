from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.application.interfaces.repositories import TeamRepository
from app.domain.entities.team import Team
from app.infrastructure.db.models import TeamModel
from datetime import datetime


class SQLAlchemyTeamRepository(TeamRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: TeamModel) -> Team:
        return Team(
            id=model.id,
            name=model.name,
            currency_default=model.currency_default,
            mas10_team_id=model.mas10_team_id,
            mas10_username=model.mas10_username,
            level_id=model.level_id if model.level_id is not None else 0,
            date_created=model.date_created,
            date_updated=model.date_updated,
        )
    
    def _to_model(self, entity: Team) -> TeamModel:
        return TeamModel(
            id=entity.id,
            name=entity.name,
            currency_default=entity.currency_default,
            mas10_team_id=entity.mas10_team_id,
            mas10_username=entity.mas10_username,
            level_id=entity.level_id if entity.level_id is not None else 0,
            date_created=entity.date_created or datetime.utcnow(),
            date_updated=entity.date_updated or datetime.utcnow(),
        )
    
    async def create(self, team: Team) -> Team:
        model = self._to_model(team)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, team_id: int) -> Optional[Team]:
        result = await self.session.execute(select(TeamModel).where(TeamModel.id == team_id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_all(self) -> List[Team]:
        result = await self.session.execute(select(TeamModel))
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]
    
    async def update(self, team: Team) -> Team:
        """Update an existing team."""
        result = await self.session.execute(select(TeamModel).where(TeamModel.id == team.id))
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"Team with id {team.id} not found")
        
        model.name = team.name
        model.currency_default = team.currency_default
        model.mas10_team_id = team.mas10_team_id
        model.mas10_username = team.mas10_username
        model.level_id = team.level_id if team.level_id is not None else 0
        model.date_updated = datetime.utcnow()
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)



