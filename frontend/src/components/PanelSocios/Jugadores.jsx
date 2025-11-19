import { useEffect, useMemo, useState } from 'react'
import { mas10Service } from '../../services/mas10Service'
import defaultTeamLogo from '../../assets/images/placeholders/default-team-logo.svg'
import emptyMembers from '../../assets/images/empty-states/empty-members.svg'

const Jugadores = () => {
  const [tournaments, setTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)
  const [players, setPlayers] = useState([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournamentId) {
      loadPlayers(selectedTournamentId)
    }
  }, [selectedTournamentId])

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true)
      const data = await mas10Service.getTeamData()
      const tournamentList = data?.data?.tournaments || []

      setTournaments(tournamentList)

      if (tournamentList.length > 0) {
        const defaultTournament = tournamentList[tournamentList.length - 1]
        setSelectedTournamentId(defaultTournament.id_tournament)
      }
    } catch (err) {
      console.error('Error loading tournaments:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido'
      setError(`Error al cargar los torneos: ${errorMessage}`)
      setTournaments([])
    } finally {
      setLoadingTournaments(false)
    }
  }

  const loadPlayers = async (tournamentId) => {
    try {
      setLoadingPlayers(true)
      setError('')
      const response = await mas10Service.getTeamPlayers(tournamentId)
      const playersList = response?.data?.list_players_team || []
      setPlayers(playersList)
    } catch (err) {
      console.error('Error loading players:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido'
      setError(`Error al cargar los jugadores: ${errorMessage}`)
      setPlayers([])
    } finally {
      setLoadingPlayers(false)
    }
  }

  const selectedTournament = useMemo(
    () => tournaments.find(t => t.id_tournament === selectedTournamentId),
    [tournaments, selectedTournamentId]
  )

  const renderTournamentLabel = (tournament) => {
    if (!tournament) return 'Sin torneo'
    const league = tournament.name_league || ''
    const name = tournament.name_tournament || ''
    if (league && name) return `${league} - ${name}`
    return league || name || 'Sin nombre'
  }

  const handleTournamentClick = (tournamentId) => {
    if (tournamentId === selectedTournamentId) return
    setSelectedTournamentId(tournamentId)
  }

  const renderPlayerAvatar = (avatarUrl, name) => (
    <img
      src={avatarUrl || defaultTeamLogo}
      alt={name || 'Jugador'}
      className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
      onError={(e) => {
        e.target.onerror = null
        e.target.src = defaultTeamLogo
      }}
    />
  )

  const renderStat = (icon, value, label) => (
    <div className="flex items-center text-sm text-gray-600">
      <span className="text-base mr-1" aria-hidden="true">{icon}</span>
      <span className="font-semibold text-gray-900 mr-1">{value ?? 0}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Jugadores</h2>
          <p className="text-sm text-gray-500">Seleccioná la edición del torneo para ver el plantel.</p>
        </div>
      </div>

      {/* Tournament selector */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-3">Torneos</div>
        {loadingTournaments ? (
          <div className="text-gray-500 text-sm">Cargando torneos...</div>
        ) : tournaments.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {tournaments.map((tournament) => {
              const isActive = tournament.id_tournament === selectedTournamentId
              return (
                <button
                  key={tournament.id_tournament}
                  onClick={() => handleTournamentClick(tournament.id_tournament)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tournament.avatar ? (
                    <img
                      src={tournament.avatar}
                      alt={tournament.name_league || 'Torneo'}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-semibold uppercase">
                      {tournament.name_league?.charAt(0) || 'T'}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      {tournament.name_league || 'Torneo'}
                    </div>
                    <div className="text-xs text-gray-500">{renderTournamentLabel(tournament)}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No hay torneos disponibles.</div>
        )}
      </div>

      {selectedTournament && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
          Viendo jugadores de <strong>{renderTournamentLabel(selectedTournament)}</strong>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Players list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Plantel</h3>
            <p className="text-sm text-gray-500">
              {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
            </p>
          </div>
        </div>

        {loadingPlayers ? (
          <div className="p-8 text-center text-gray-500 text-sm">Cargando jugadores...</div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <img src={emptyMembers} alt="Sin jugadores" className="w-32 h-32 object-contain opacity-80" />
            <p className="text-gray-500">No se encontraron jugadores para este torneo.</p>
          </div>
        ) : (
          <div>
            <div className="px-6 py-3 border-b border-gray-100 hidden md:grid md:grid-cols-[2fr_1.5fr_0.5fr] text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div>Jugador</div>
              <div>Estadística</div>
              <div className="text-right pr-4">Posición</div>
            </div>
            {players.map((player, index) => (
              <div
                key={`${player.username || player.name || index}`}
                className="px-6 py-4 border-b border-gray-50 flex flex-col gap-4 hover:bg-gray-50 transition md:grid md:grid-cols-[2fr_1.5fr_0.5fr] md:items-center"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {renderPlayerAvatar(player.avatar, player.name)}
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">
                      {player.name || 'Sin nombre'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.username ? `@${player.username}` : 'Sin username'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-start md:gap-6">
                  {renderStat('⚽', player.goal, 'Goles')}
                  {renderStat('🟨', player.yellow_card, 'Amarillas')}
                  {renderStat('🟥', player.red_card, 'Rojas')}
                </div>
                <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full md:justify-self-end md:text-center">
                  {player.position || 'Sin posición'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Jugadores

