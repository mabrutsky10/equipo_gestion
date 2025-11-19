from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    id: Optional[int]
    userprofile_id: Optional[int]
    email: str
    hashed_password: Optional[str] = None
    is_active: bool = True
    team_id: Optional[int] = None

