from pydantic import BaseModel
from typing import Optional, Dict, Any


class HomeMetricsResponse(BaseModel):
    """Response model for home page metrics."""
    followers_count: int
    socios_count: int
    jugadores_count: int
    jugadores_socios_count: int
    jugadores_con_foto_count: int
    jugadores_tournament_name: Optional[str] = None
    debug_info: Optional[Dict[str, Any]] = None  # Temporary debug field

