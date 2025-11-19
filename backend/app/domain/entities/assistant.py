from dataclasses import dataclass
from typing import Optional, List


@dataclass
class Assistant:
    id: str
    nombre: str
    rol: str
    descripcion: str
    avatar: Optional[str] = None
    functionalities: Optional[List['AssistantFunctionality']] = None


@dataclass
class AssistantFunctionality:
    id: Optional[int]
    assistant_id: str
    descripcion: str

