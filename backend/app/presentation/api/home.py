from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from app.infrastructure.db.session import get_db
from app.presentation.schemas.home import HomeMetricsResponse
from app.presentation.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.infrastructure.db.models import MemberModel
from app.infrastructure.repositories.team_repository import SQLAlchemyTeamRepository
from app.infrastructure.services.mas10_api_service import Mas10ApiService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/metrics", response_model=HomeMetricsResponse)
async def get_home_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get home page metrics for the current user's team."""
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have an associated team"
        )
    
    team_id = current_user.team_id
    
    # Initialize all counts to 0
    followers_count = 0
    socios_count = 0
    jugadores_count = 0
    jugadores_socios_count = 0
    jugadores_con_foto_count = 0
    
    # 1. Seguidores (followers) - get from Mas10 API data.followers
    # Try to get from Mas10 API first, fallback to database count
    try:
        repository = SQLAlchemyTeamRepository(db)
        team = await repository.get_by_id(team_id)
        
        if team:
            mas10_service = Mas10ApiService()
            DEFAULT_TEAM_USERNAME = "unionyjusticia1"
            username = team.mas10_username if team.mas10_username else DEFAULT_TEAM_USERNAME
            
            team_data = await mas10_service.get_team_data(username)
            
            if team_data and team_data.get("data"):
                followers_count = team_data["data"].get("followers", 0)
                logger.info(f"Got followers_count from Mas10: {followers_count}")
            else:
                logger.warning(f"Could not get Mas10 data, falling back to database count")
                # Fallback to database count
                try:
                    followers_result = await db.execute(
                        text("""
                            SELECT COUNT(*) 
                            FROM followers 
                            WHERE team_id = :team_id AND status = 'active'
                        """),
                        {"team_id": team_id}
                    )
                    followers_count = followers_result.scalar() or 0
                except Exception as e:
                    logger.error(f"Error counting followers from database: {e}")
                    await db.rollback()
                    followers_count = 0
        else:
            # Team not found, try database count
            try:
                followers_result = await db.execute(
                    text("""
                        SELECT COUNT(*) 
                        FROM followers 
                        WHERE team_id = :team_id AND status = 'active'
                    """),
                    {"team_id": team_id}
                )
                followers_count = followers_result.scalar() or 0
            except Exception as e:
                logger.error(f"Error counting followers from database: {e}")
                await db.rollback()
                followers_count = 0
    except Exception as e:
        logger.error(f"Error getting followers from Mas10: {e}")
        # Fallback to database count
        try:
            followers_result = await db.execute(
                text("""
                    SELECT COUNT(*) 
                    FROM followers 
                    WHERE team_id = :team_id AND status = 'active'
                """),
                {"team_id": team_id}
            )
            followers_count = followers_result.scalar() or 0
        except Exception as db_error:
            logger.error(f"Error counting followers from database: {db_error}")
            await db.rollback()
            followers_count = 0
    
    # 2. Socios (members) - count active members
    try:
        members_result = await db.execute(
            select(func.count())
            .select_from(MemberModel)
            .where(
                and_(
                    MemberModel.team_id == team_id,
                    MemberModel.status == 'active'
                )
            )
        )
        socios_count = members_result.scalar() or 0
    except Exception as e:
        logger.error(f"Error counting socios: {e}")
        await db.rollback()  # Rollback to clear failed transaction
        socios_count = 0
    
    # 3. Jugadores (players) - count from last tournament in Mas10 API
    jugadores_tournament_name = None
    jugadores_count = 0
    debug_steps = []  # Track each step for debugging
    try:
        # Rollback any previous failed transaction before starting
        await db.rollback()
        
        repository = SQLAlchemyTeamRepository(db)
        team = await repository.get_by_id(team_id)
        debug_steps.append(f"Step 1: Team lookup - found: {team is not None}")
        
        if not team:
            logger.warning(f"Team not found for team_id: {team_id}")
            debug_steps.append("Step 1: Team not found")
            jugadores_count = 0
        else:
            mas10_service = Mas10ApiService()
            DEFAULT_TEAM_USERNAME = "unionyjusticia1"
            username = team.mas10_username if team.mas10_username else DEFAULT_TEAM_USERNAME
            debug_steps.append(f"Step 2: Username determined - '{username}'")
            
            logger.info(f"Getting jugadores for username: '{username}', team_id: {team_id}")
            
            # Get team data to find the last tournament
            team_data = await mas10_service.get_team_data(username)
            debug_steps.append(f"Step 3: Team data - received: {team_data is not None}, has data: {team_data.get('data') is not None if team_data else False}")
            
            if not team_data or not team_data.get("data"):
                logger.warning(f"Could not get team data from Mas10 for username '{username}'")
                debug_steps.append("Step 3: No team data")
                jugadores_count = 0
            else:
                tournaments = team_data["data"].get("tournaments", [])
                debug_steps.append(f"Step 4: Tournaments - count: {len(tournaments)}")
                logger.info(f"Found {len(tournaments)} tournaments")
                
                if not tournaments or len(tournaments) == 0:
                    logger.warning(f"No tournaments found in team data for username '{username}'")
                    debug_steps.append("Step 4: No tournaments")
                    jugadores_count = 0
                else:
                    # Get the last tournament (last element in the array)
                    last_tournament = tournaments[-1]
                    tournament_id = last_tournament.get("id_tournament")
                    debug_steps.append(f"Step 5: Last tournament - id: {tournament_id}, index: {len(tournaments) - 1}")
                    logger.info(f"Using last tournament (index {len(tournaments) - 1}): tournament_id={tournament_id}")
                    
                    if not tournament_id:
                        logger.warning(f"No tournament_id found in last tournament")
                        debug_steps.append("Step 5: No tournament_id")
                        jugadores_count = 0
                    else:
                        # Get players from the last tournament
                        players_data = await mas10_service.get_team_players(username, tournament_id)
                        debug_steps.append(f"Step 6: Players data - received: {players_data is not None}")
                        logger.info(f"Players data received: {players_data is not None}")
                        
                        if not players_data:
                            logger.warning(f"No players_data returned from Mas10 for username '{username}', tournament_id {tournament_id}")
                            debug_steps.append("Step 6: No players_data")
                            jugadores_count = 0
                        elif not players_data.get("data"):
                            keys = list(players_data.keys()) if isinstance(players_data, dict) else 'not a dict'
                            logger.warning(f"players_data has no 'data' key. Keys: {keys}")
                            debug_steps.append(f"Step 6: players_data has no 'data' key. Keys: {keys}")
                            jugadores_count = 0
                        else:
                            # Use list_players_team instead of players
                            list_players_team = players_data["data"].get("list_players_team", [])
                            debug_steps.append(f"Step 7: list_players_team - type: {type(list_players_team).__name__}, length: {len(list_players_team) if isinstance(list_players_team, list) else 'N/A'}")
                            
                            if not isinstance(list_players_team, list):
                                logger.warning(f"list_players_team is not a list, type: {type(list_players_team)}")
                                debug_steps.append(f"Step 7: Not a list - type: {type(list_players_team).__name__}")
                                jugadores_count = 0
                            else:
                                jugadores_count = len(list_players_team)
                                debug_steps.append(f"Step 8: Success - count: {jugadores_count}")
                                
                                # Get tournament name for display
                                tournament_name = last_tournament.get("name_tournament", "")
                                name_league = last_tournament.get("name_league", "")
                                
                                # Format tournament name (e.g., "+35 - CLAUSURA 2025")
                                if tournament_name and name_league:
                                    jugadores_tournament_name = f"{name_league} - {tournament_name}"
                                elif tournament_name:
                                    jugadores_tournament_name = tournament_name
                                elif name_league:
                                    jugadores_tournament_name = name_league
                                
                                logger.info(f"Successfully got jugadores_count: {jugadores_count}, tournament name: {jugadores_tournament_name}")
    except Exception as e:
        logger.error(f"Error counting jugadores from Mas10: {e}", exc_info=True)
        debug_steps.append(f"Exception: {str(e)}")
        await db.rollback()  # Rollback to clear failed transaction
        jugadores_count = 0
    
    # 4. Jugadores que son socios - members with userprofile_id that are players
    try:
        jugadores_socios_result = await db.execute(
            text("""
                SELECT COUNT(DISTINCT m.id)
                FROM members m
                INNER JOIN userprofile up ON m.userprofile_id = up.id
                WHERE m.team_id = :team_id 
                AND m.status = 'active'
                AND (up.role::text LIKE '%player%' OR up.role IS NULL)
            """),
            {"team_id": team_id}
        )
        jugadores_socios_count = jugadores_socios_result.scalar() or 0
    except Exception as e:
        logger.error(f"Error counting jugadores que son socios: {e}")
        await db.rollback()
        # Fallback: count active members with userprofile_id
        try:
            fallback_result = await db.execute(
                select(func.count())
                .select_from(MemberModel)
                .where(
                    and_(
                        MemberModel.team_id == team_id,
                        MemberModel.status == 'active',
                        MemberModel.userprofile_id.isnot(None)
                    )
                )
            )
            jugadores_socios_count = fallback_result.scalar() or 0
        except Exception:
            await db.rollback()
            jugadores_socios_count = 0
    
    # 5. Jugadores con foto figura - players with avatar
    try:
        jugadores_con_foto_result = await db.execute(
            text("""
                SELECT COUNT(DISTINCT up.id)
                FROM userprofile up
                INNER JOIN members m ON m.userprofile_id = up.id
                WHERE m.team_id = :team_id 
                AND (up.role::text LIKE '%player%' OR up.role IS NULL)
                AND up.avatar IS NOT NULL
                AND up.avatar != ''
            """),
            {"team_id": team_id}
        )
        jugadores_con_foto_count = jugadores_con_foto_result.scalar() or 0
    except Exception as e:
        logger.error(f"Error counting jugadores con foto: {e}")
        await db.rollback()
        jugadores_con_foto_count = 0
    
    # Log final values before returning
    logger.info(f"Final metrics values - jugadores_count: {jugadores_count}, jugadores_tournament_name: {jugadores_tournament_name}")
    
    # Temporary debug info
    debug_info = {
        "jugadores_count": jugadores_count,
        "jugadores_tournament_name": jugadores_tournament_name,
        "debug_steps": debug_steps,
    }
    
    return HomeMetricsResponse(
        followers_count=followers_count,
        socios_count=socios_count,
        jugadores_count=jugadores_count,
        jugadores_socios_count=jugadores_socios_count,
        jugadores_con_foto_count=jugadores_con_foto_count,
        jugadores_tournament_name=jugadores_tournament_name,
        debug_info=debug_info,
    )

