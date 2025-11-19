from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.application.interfaces.repositories import ChatRepository
from app.domain.entities.chat_message import ChatMessage
from app.domain.entities.assistant import Assistant, AssistantFunctionality
from app.infrastructure.db.models import ChatMessageModel, AssistantModel, AssistantFunctionalityModel


class SQLAlchemyChatRepository(ChatRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ChatMessageModel) -> ChatMessage:
        return ChatMessage(
            id=model.id,
            team_id=model.team_id,
            user_id=model.user_id,
            assistant_id=model.assistant_id,
            content=model.content,
            sender=model.sender,
            timestamp=model.timestamp,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
    
    def _to_model(self, entity: ChatMessage) -> ChatMessageModel:
        return ChatMessageModel(
            id=entity.id,
            team_id=entity.team_id,
            user_id=entity.user_id,
            assistant_id=entity.assistant_id,
            content=entity.content,
            sender=entity.sender,
            timestamp=entity.timestamp,
        )
    
    async def create(self, message: ChatMessage) -> ChatMessage:
        model = self._to_model(message)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def get_by_id(self, message_id: int) -> Optional[ChatMessage]:
        result = await self.session.execute(
            select(ChatMessageModel).where(ChatMessageModel.id == message_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def get_by_team_and_assistant(
        self, team_id: int, assistant_id: str, limit: Optional[int] = None
    ) -> List[ChatMessage]:
        query = (
            select(ChatMessageModel)
            .where(
                ChatMessageModel.team_id == team_id,
                ChatMessageModel.assistant_id == assistant_id
            )
            .order_by(desc(ChatMessageModel.timestamp))
        )
        
        if limit:
            query = query.limit(limit)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        return [self._to_entity(model) for model in models]
    
    def _assistant_to_entity(self, model: AssistantModel) -> Assistant:
        """Convert AssistantModel to Assistant entity."""
        functionalities = [
            AssistantFunctionality(
                id=func.id,
                assistant_id=func.assistant_id,
                descripcion=func.descripcion,
            )
            for func in model.functionalities
        ] if model.functionalities else []
        
        return Assistant(
            id=model.id,
            nombre=model.nombre,
            rol=model.rol,
            descripcion=model.descripcion,
            avatar=model.avatar,
            functionalities=functionalities,
        )
    
    async def get_assistants(self) -> List[Assistant]:
        """Get all assistants from database with their functionalities in specific order."""
        # Define the desired order
        desired_order = ['guillote', 'marta', 'kela', 'pela', 'chori']
        
        result = await self.session.execute(
            select(AssistantModel)
            .options(selectinload(AssistantModel.functionalities))
        )
        models = result.scalars().all()
        
        # Create a dictionary for quick lookup
        assistants_dict = {model.id: self._assistant_to_entity(model) for model in models}
        
        # Return assistants in the desired order
        ordered_assistants = []
        for assistant_id in desired_order:
            if assistant_id in assistants_dict:
                ordered_assistants.append(assistants_dict[assistant_id])
        
        # Add any assistants not in the desired order list (for future extensibility)
        for assistant_id, assistant in assistants_dict.items():
            if assistant_id not in desired_order:
                ordered_assistants.append(assistant)
        
        return ordered_assistants

