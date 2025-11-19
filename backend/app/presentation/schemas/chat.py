from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AssistantFunctionalityResponse(BaseModel):
    id: int
    assistant_id: str
    descripcion: str

    class Config:
        from_attributes = True


class AssistantResponse(BaseModel):
    id: str
    nombre: str
    rol: str
    descripcion: str
    avatar: Optional[str] = None
    functionalities: Optional[List[AssistantFunctionalityResponse]] = None

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    assistant_id: str
    content: str
    sender: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str


class SendMessageResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse

