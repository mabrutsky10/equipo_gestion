from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
import logging
from app.infrastructure.db.session import get_db
from app.application.interfaces.repositories import ChatRepository
from app.application.use_cases.chat_use_cases import (
    GetAssistantsUseCase,
    GetMessagesUseCase,
    SendMessageUseCase,
)
from app.presentation.schemas.chat import (
    AssistantResponse,
    AssistantFunctionalityResponse,
    ChatMessageResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.infrastructure.repositories.chat_repository import SQLAlchemyChatRepository
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_repository(db: AsyncSession = Depends(get_db)) -> ChatRepository:
    return SQLAlchemyChatRepository(db)


@router.get("/assistants", response_model=List[AssistantResponse])
async def get_assistants(
    chat_repository: ChatRepository = Depends(get_chat_repository),
):
    """Get list of available assistants."""
    use_case = GetAssistantsUseCase(chat_repository)
    assistants = await use_case.execute()
    return [
        AssistantResponse(
            id=assistant.id,
            nombre=assistant.nombre,
            rol=assistant.rol,
            descripcion=assistant.descripcion,
            avatar=assistant.avatar,
            functionalities=[
                AssistantFunctionalityResponse(
                    id=func.id,
                    assistant_id=func.assistant_id,
                    descripcion=func.descripcion,
                )
                for func in (assistant.functionalities or [])
            ] if assistant.functionalities else None,
        )
        for assistant in assistants
    ]


@router.get("/assistants/{assistant_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    assistant_id: str,
    current_user: User = Depends(get_current_user),
    chat_repository: ChatRepository = Depends(get_chat_repository),
):
    """Get messages for a specific assistant conversation."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a team",
        )
    
    use_case = GetMessagesUseCase(chat_repository)
    messages = await use_case.execute(current_user.team_id, assistant_id)
    return [ChatMessageResponse(**msg.__dict__) for msg in messages]


@router.post("/assistants/{assistant_id}/messages", response_model=SendMessageResponse)
async def send_message(
    assistant_id: str,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    chat_repository: ChatRepository = Depends(get_chat_repository),
):
    """Send a message to an assistant and get a reply."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a team",
        )
    
    if not current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID is required",
        )
    
    try:
        use_case = SendMessageUseCase(chat_repository)
        user_message, assistant_message = await use_case.execute(
            current_user.team_id,
            current_user.id,
            assistant_id,
            request.content,
            userprofile_id=current_user.userprofile_id,
        )
        
        # Safely convert to response models
        try:
            user_msg_dict = user_message.__dict__ if hasattr(user_message, '__dict__') else {}
            assistant_msg_dict = assistant_message.__dict__ if hasattr(assistant_message, '__dict__') else {}
            
            return SendMessageResponse(
                user_message=ChatMessageResponse(**user_msg_dict),
                assistant_message=ChatMessageResponse(**assistant_msg_dict),
            )
        except Exception as conversion_error:
            logger.error(f"Error converting messages to response: {conversion_error}", exc_info=True)
            # Try to create minimal response
            return SendMessageResponse(
                user_message=ChatMessageResponse(
                    id=user_message.id if hasattr(user_message, 'id') else 0,
                    team_id=user_message.team_id if hasattr(user_message, 'team_id') else current_user.team_id,
                    user_id=user_message.user_id if hasattr(user_message, 'user_id') else current_user.id,
                    assistant_id=user_message.assistant_id if hasattr(user_message, 'assistant_id') else assistant_id,
                    content=user_message.content if hasattr(user_message, 'content') else request.content,
                    sender=user_message.sender if hasattr(user_message, 'sender') else 'user',
                    timestamp=user_message.timestamp if hasattr(user_message, 'timestamp') else datetime.utcnow(),
                ),
                assistant_message=ChatMessageResponse(
                    id=assistant_message.id if hasattr(assistant_message, 'id') else 0,
                    team_id=assistant_message.team_id if hasattr(assistant_message, 'team_id') else current_user.team_id,
                    user_id=assistant_message.user_id if hasattr(assistant_message, 'user_id') else current_user.id,
                    assistant_id=assistant_message.assistant_id if hasattr(assistant_message, 'assistant_id') else assistant_id,
                    content=assistant_message.content if hasattr(assistant_message, 'content') else "Lo siento, hubo un error al procesar tu mensaje.",
                    sender=assistant_message.sender if hasattr(assistant_message, 'sender') else 'assistant',
                    timestamp=assistant_message.timestamp if hasattr(assistant_message, 'timestamp') else datetime.utcnow(),
                ),
            )
    except Exception as e:
        logger.error(f"Error sending message to {assistant_id}: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

