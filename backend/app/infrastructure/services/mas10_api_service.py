import httpx
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

MAS10_BASE_URL = 'https://serviceweb.mas10.ar'
BACKOFFICE_BASE_URL = 'https://backoffice.mas10.ar'
FOLLOWERS_BASE_URL = 'https://followers.mas10.ar'
PROFILE_BASE_URL = 'https://profile.mas10.ar'


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
            
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
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
            
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
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
    
    async def search_profiles(
        self,
        username: Optional[str] = None,
        recommendation: bool = False,
        details: bool = True,
        page: int = 0,
        limit: int = 50,
    ) -> Optional[Dict[str, Any]]:
        """
        Search profiles using the followers stack /search-profiles endpoint.
        
        Args:
            username: Optional username to search for
            recommendation: Whether to get recommendations
            details: Whether to get detailed information
            page: Page number for pagination
            limit: Number of results per page (max 200)
            
        Returns:
            Profiles data dictionary or None if not found
        """
        try:
            url = f"{FOLLOWERS_BASE_URL}/search-profiles"
            params = {
                "page": page,
                "limit": min(limit, 200),  # Enforce max limit
            }
            
            if username:
                params["username"] = username
            if recommendation:
                params["recommendation"] = "true"
            if details:
                params["details"] = "true"
            
            logger.info(f"Mas10ApiService: Calling {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                logger.info(f"Mas10ApiService: Response status: {response.status_code}")
                
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Followers API returned error: {data}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error searching profiles: {e.response.status_code}. Response: {e.response.text[:200]}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error searching profiles: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error searching profiles: {e}", exc_info=True)
            return None
    
    async def get_profile_location(self, id_profile: int) -> Optional[Dict[str, Any]]:
        """
        Get location data for a profile using the profile stack /location endpoint.
        
        Args:
            id_profile: Profile ID
            
        Returns:
            Location data dictionary or None if not found
        """
        try:
            url = f"{PROFILE_BASE_URL}/location"
            params = {
                "id_profile": id_profile,
            }
            
            logger.info(f"Mas10ApiService: Calling {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                logger.info(f"Mas10ApiService: Response status: {response.status_code}")
                
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Profile API returned error: {data}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching location: {e.response.status_code}. Response: {e.response.text[:200]}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching location: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching location: {e}", exc_info=True)
            return None
    
    async def get_postulations_web(
        self,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        distance: int = 0,
        id: int = 0,
    ) -> Optional[Dict[str, Any]]:
        """
        Get postulations using the postulations-web endpoint (like radar.mas10.ar).
        
        Args:
            lat: Latitude
            lon: Longitude
            distance: Distance radius
            id: ID parameter for pagination
            
        Returns:
            Postulations data dictionary or None if not found
        """
        try:
            url = f"{MAS10_BASE_URL}/postulations-web"
            params = {
                "distance": distance,
                "id": id,
            }
            
            if lat is not None:
                params["lat"] = lat
            if lon is not None:
                params["lon"] = lon
            
            logger.info(f"Mas10ApiService: Calling {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                logger.info(f"Mas10ApiService: Response status: {response.status_code}")
                
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Postulations API returned error: {data}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching postulations: {e.response.status_code}. Response: {e.response.text[:200]}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching postulations: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching postulations: {e}", exc_info=True)
            return None
    
    async def search_complexs(
        self,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        nearest_cluster: int = 0,
        last_distance: int = 0,
        last_id: int = 0,
        limit: int = 10,
    ) -> Optional[Dict[str, Any]]:
        """
        Search complexes using the search-complexs endpoint (like radar.mas10.ar).
        
        Args:
            lat: Latitude
            lon: Longitude
            nearest_cluster: Nearest cluster parameter
            last_distance: Last distance for pagination
            last_id: Last ID for pagination
            limit: Number of results
            
        Returns:
            Complexes data dictionary or None if not found
        """
        try:
            url = f"{MAS10_BASE_URL}/search-complexs"
            params = {
                "nearestCluster": nearest_cluster,
                "lastDistance": last_distance,
                "lastId": last_id,
                "limit": limit,
            }
            
            if lat is not None:
                params["lat"] = lat
            if lon is not None:
                params["lon"] = lon
            
            logger.info(f"Mas10ApiService: Calling {url} with params: {params}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                logger.info(f"Mas10ApiService: Response status: {response.status_code}")
                
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("error", False):
                    logger.warning(f"Search complexs API returned error: {data}")
                    return None
                
                return data
                
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error searching complexs: {e.response.status_code}. Response: {e.response.text[:200]}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error searching complexs: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error searching complexs: {e}", exc_info=True)
            return None

