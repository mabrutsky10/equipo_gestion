from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_db
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.repositories.team_repository import SQLAlchemyTeamRepository
from app.infrastructure.services.mas10_api_service import Mas10ApiService
from typing import Any, Dict, Optional, List
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mas10", tags=["mas10"])

# Default fallback username
DEFAULT_TEAM_USERNAME = "unionyjusticia1"


@router.get("/team-data")
async def get_team_data_from_mas10(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get team data from Mas10 API.
    Always uses mas10_username from the team (or 'unionyjusticia1' as fallback if not set).
    """
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    # Get team from database
    repository = SQLAlchemyTeamRepository(db)
    team = await repository.get_by_id(current_user.team_id)
    
    logger.info(f"Fetching team data for team_id: {current_user.team_id}")
    
    if not team:
        logger.error(f"Team with id {current_user.team_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {current_user.team_id} not found"
        )
    
    logger.info(f"Team found: id={team.id}, name={team.name}, mas10_username={team.mas10_username}, mas10_team_id={team.mas10_team_id}")
    
    # Initialize Mas10 service
    mas10_service = Mas10ApiService()
    
    # Always use mas10_username if available, otherwise use default fallback
    # Never use team name as username - always use mas10_username or fallback
    # If mas10_username is not set, use the default fallback
    username = team.mas10_username if team.mas10_username else DEFAULT_TEAM_USERNAME
    
    # Log which username is being used
    logger.info(f"Using mas10_username: '{username}' (team.mas10_username: {team.mas10_username}, fallback: {DEFAULT_TEAM_USERNAME})")
    
    # Get team data using mas10_username (or fallback)
    logger.info(f"Calling Mas10 API with username: '{username}'")
    team_data = await mas10_service.get_team_data(username)
    
    logger.info(f"Mas10 API response: {team_data is not None}")
    
    # If no results, return error
    if not team_data:
        logger.error(f"No data returned from Mas10 API for username '{username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team data not found in Mas10 API for username '{username}'. Please verify the username is correct."
        )
    
    # Extract mas10_team_id and username from response
    # mas10_team_id should be the same as team_data.id from the service response
    mas10_team_id = None
    mas10_username_from_response = None
    
    if team_data and team_data.get("data"):
        data_obj = team_data["data"]
        team_data_obj = data_obj.get("team_data")
        
        if team_data_obj:
            # mas10_team_id is the id from team_data (team_data.id)
            mas10_team_id = team_data_obj.get("id")
            # username can be in team_data.username or we use the username we queried with
            mas10_username_from_response = team_data_obj.get("username") or username
    
    # Update team with mas10 data if we got valid data
    if mas10_team_id is not None or mas10_username_from_response:
        if mas10_team_id is not None:
            team.mas10_team_id = mas10_team_id
        if mas10_username_from_response:
            team.mas10_username = mas10_username_from_response
        await repository.update(team)
    
    return team_data


@router.get("/team-players")
async def get_team_players_from_mas10(
    tournament_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get team players from Mas10 API for the last tournament.
    Always uses mas10_username from the team (or 'unionyjusticia1' as fallback if not set).
    """
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    # Get team from database
    repository = SQLAlchemyTeamRepository(db)
    team = await repository.get_by_id(current_user.team_id)
    
    logger.info(f"Fetching team players for team_id: {current_user.team_id}")
    
    if not team:
        logger.error(f"Team with id {current_user.team_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {current_user.team_id} not found"
        )
    
    # Initialize Mas10 service
    mas10_service = Mas10ApiService()
    
    # Always use mas10_username if available, otherwise use default fallback
    username = team.mas10_username if team.mas10_username else DEFAULT_TEAM_USERNAME
    
    logger.info(f"Using mas10_username: '{username}' for players")
    
    # Get team data to find the last tournament
    team_data = await mas10_service.get_team_data(username)
    
    if not team_data or not team_data.get("data"):
        logger.error(f"No team data returned from Mas10 API for username '{username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team data not found in Mas10 API for username '{username}'"
        )
    
    tournaments = team_data["data"].get("tournaments", [])
    
    if not tournaments or len(tournaments) == 0:
        logger.warning(f"No tournaments found for username '{username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No tournaments found for team '{username}'"
        )
    
    # Determine tournament to use
    selected_tournament = None
    selected_index = None
    
    if tournament_id:
        for index, tournament in enumerate(tournaments):
            if tournament.get("id_tournament") == tournament_id:
                selected_tournament = tournament
                selected_index = index
                break
        if not selected_tournament:
            logger.warning(f"Tournament with id {tournament_id} not found for username '{username}'")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tournament with id {tournament_id} not found for team '{username}'"
            )
    else:
        selected_tournament = tournaments[-1]
        selected_index = len(tournaments) - 1
        tournament_id = selected_tournament.get("id_tournament")
    
    if not tournament_id:
        logger.warning(f"No tournament_id found in selected tournament for username '{username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No tournament_id found in selected tournament"
        )
    
    logger.info(f"Getting players for tournament_id: {tournament_id}, username: '{username}'")
    
    # Get players from the last tournament
    players_data = await mas10_service.get_team_players(username, tournament_id)
    
    if not players_data:
        logger.error(f"No players data returned from Mas10 API for username '{username}', tournament_id {tournament_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Players data not found in Mas10 API for username '{username}', tournament_id {tournament_id}"
        )
    
    # Add tournament info to the response for debugging
    players_data["tournament_info"] = {
        "tournament_id": tournament_id,
        "tournament_name": selected_tournament.get("name_tournament", "") if selected_tournament else "",
        "name_league": selected_tournament.get("name_league", "") if selected_tournament else "",
        "tournament_index": selected_index,
        "total_tournaments": len(tournaments),
    }
    
    return players_data


class JugadorLibreResponse(BaseModel):
    """Response model for free players (jugadores libres)."""
    nombre: str
    username: str
    posicion: Optional[str] = None
    ubicacion: Optional[str] = None
    descripcion: Optional[str] = None
    avatar: Optional[str] = None


class JugadoresLibresResponse(BaseModel):
    """Response model containing jugadores libres and pagination info."""
    jugadores: List[JugadorLibreResponse]
    has_more: bool = False
    next_distance: Optional[float] = None
    next_id: Optional[int] = None


@router.get("/jugadores-libres", response_model=JugadoresLibresResponse)
async def get_jugadores_libres(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    distance: int = Query(0, ge=0, description="Distance radius"),
    id: int = Query(0, ge=0, description="ID parameter for pagination"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JugadoresLibresResponse:
    """
    Get free players (jugadores libres) using the postulations-web endpoint from radar.mas10.ar.
    Returns an array with: nombre, username, posicion, ubicacion, descripcion.
    """
    try:
        mas10_service = Mas10ApiService()
        
        # Get default location from team if available
        default_lat = lat
        default_lon = lon
        
        if default_lat is None or default_lon is None:
            # Try to get team location as default
            if current_user.team_id:
                repository = SQLAlchemyTeamRepository(db)
                team = await repository.get_by_id(current_user.team_id)
                # For now, using default coordinates (Córdoba, Argentina)
                # TODO: Get actual team location if available in team model
                if default_lat is None:
                    default_lat = -31.42008329999999  # Default: Córdoba
                if default_lon is None:
                    default_lon = -64.1887761  # Default: Córdoba
            else:
                # Default coordinates if no team
                if default_lat is None:
                    default_lat = -31.42008329999999  # Default: Córdoba
                if default_lon is None:
                    default_lon = -64.1887761  # Default: Córdoba
        
        # Calculate pagination parameters
        # Based on radar.mas10.ar, pagination uses distance and id
        pagination_distance = distance
        pagination_id = id
        
        # Call postulations-web endpoint
        postulations_data = await mas10_service.get_postulations_web(
            lat=default_lat,
            lon=default_lon,
            distance=pagination_distance,
            id=pagination_id,
        )
        
        if not postulations_data or not postulations_data.get("data"):
            logger.warning("No postulations data returned from postulations-web")
            return JugadoresLibresResponse(jugadores=[], has_more=False, next_distance=pagination_distance, next_id=pagination_id)
        
        postulations_container = postulations_data.get("data") or {}
        postulations = postulations_container.get("postulations", [])
        jugadores_libres = []
        filtered_postulations: List[Dict[str, Any]] = []
        
        # Process each postulation (only users)
        for postulation in postulations:
            if postulation.get("type") != "user":
                continue
            
            filtered_postulations.append(postulation)
            
            first_name = (postulation.get("first_name") or "").strip()
            last_name = (postulation.get("last_name") or "").strip()
            nombre = (f"{first_name} {last_name}".strip()) or postulation.get("username") or "Sin nombre"
            username = postulation.get("username") or postulation.get("user") or ""
            posicion = postulation.get("position") or None
            descripcion = (postulation.get("comment_info") or postulation.get("bio") or postulation.get("description") or "").strip() or None
            
            # Build ubicacion from location dict
            location_info = postulation.get("location") or {}
            parts = [
                location_info.get("locality"),
                location_info.get("province"),
                location_info.get("country"),
            ]
            ubicacion = ", ".join([part for part in parts if part]) or None
            
            avatar = (
                postulation.get("avatar")
                or postulation.get("avatar_100")
                or postulation.get("avatar_50")
            )
            
            jugador = JugadorLibreResponse(
                nombre=nombre,
                username=username,
                posicion=posicion,
                ubicacion=ubicacion,
                descripcion=descripcion,
                avatar=avatar,
            )
            jugadores_libres.append(jugador)
        
        has_more = bool(postulations_container.get("has_more"))
        next_distance = pagination_distance
        next_id = pagination_id
        
        if filtered_postulations:
            last_postulation = filtered_postulations[-1]
            next_distance = last_postulation.get("distance", pagination_distance)
            next_id = last_postulation.get("id", pagination_id)
        
        logger.info(f"Returning {len(jugadores_libres)} jugadores libres")
        return JugadoresLibresResponse(
            jugadores=jugadores_libres,
            has_more=has_more,
            next_distance=next_distance,
            next_id=next_id,
        )
        
    except Exception as e:
        logger.error(f"Error fetching jugadores libres: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching jugadores libres: {str(e)}"
        )

