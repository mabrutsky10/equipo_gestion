import httpx
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

MAS10_BASE_URL = 'https://serviceweb.mas10.ar'
BACKOFFICE_BASE_URL = 'https://backoffice.mas10.ar'


class Mas10ApiService:
    """Service for interacting with Mas10 API."""
    
    def __init__(self, base_url: str = MAS10_BASE_URL, timeout: float = 10.0):
        self.base_url = base_url
        self.timeout = timeout
    
    async def get_team_data(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get team data from Mas10 API.
        
        Args:
            username: Team username in Mas10
            
        Returns:
            Team data dictionary or None if not found
        """
        try:
            url = f"{self.base_url}/public-content-tables"
            params = {
                "username": username,
                "table": "team"
            }
            
            logger.info(f"Mas10ApiService: Calling {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                logger.info(f"Mas10ApiService: Response status: {response.status_code}")
                
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Mas10ApiService: Response data keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}")
                
                # Check if there's an error or no data
                if data.get("error", False):
                    logger.warning(f"Mas10 API returned error for username {username}: {data}")
                    return None
                
                # Check if data exists and has content
                if not data.get("data"):
                    logger.warning(f"No data returned for username {username}. Full response: {data}")
                    return None
                
                logger.info(f"Mas10ApiService: Successfully retrieved data for username {username}")
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching team data for {username}: {e.response.status_code}. Response: {e.response.text[:200]}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching team data for {username}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching team data for {username}: {e}", exc_info=True)
            return None
    
    async def get_team_players(self, username: str, tournament_id: int) -> Optional[Dict[str, Any]]:
        """
        Get team players from Mas10 API.
        
        Args:
            username: Team username in Mas10
            tournament_id: Tournament ID
            
        Returns:
            Players data dictionary or None if not found
        """
        try:
            url = f"{BACKOFFICE_BASE_URL}/team/perfil/players"
            params = {
                "username": username,
                "id_tournament": tournament_id
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Mas10 API returned error for players {username}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching players for {username}: {e.response.status_code}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching players for {username}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching players for {username}: {e}")
            return None
    
    async def get_team_matches(self, username: str, tournament_id: int, limit: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get team matches from Mas10 API.
        
        Args:
            username: Team username in Mas10
            tournament_id: Tournament ID
            limit: Whether to limit results
            
        Returns:
            Matches data dictionary or None if not found
        """
        try:
            url = f"{BACKOFFICE_BASE_URL}/team/perfil/matches"
            params = {
                "username": username,
                "id_tournament": tournament_id,
                "limit": str(limit).lower()
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Mas10 API returned error for matches {username}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching matches for {username}: {e.response.status_code}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching matches for {username}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching matches for {username}: {e}")
            return None

