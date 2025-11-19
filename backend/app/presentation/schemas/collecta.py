from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CollectaResponse(BaseModel):
    id: int
    team_id: int
    title: str
    description: Optional[str]
    is_public: bool
    link_public: Optional[str]
    status: str
    date_created: datetime
    date_end: Optional[datetime]
    invited_member_ids: List[int] = []
    invited_emails: List[str] = []
    
    class Config:
        from_attributes = True


class CollectaCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = True
    invited_member_ids: Optional[List[int]] = None
    invited_emails: Optional[List[str]] = None

