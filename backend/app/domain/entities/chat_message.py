from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class ChatMessage:
    id: Optional[int]
    team_id: int
    user_id: int
    assistant_id: str
    content: str
    sender: str  # 'user' or 'assistant'
    timestamp: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

