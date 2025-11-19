import api from './api'

export const mas10Service = {
  getTeamData: async () => {
    const response = await api.get('/mas10/team-data')
    return response.data
  },
  getTeamPlayers: async (tournamentId) => {
    const response = await api.get('/mas10/team-players', {
      params: tournamentId ? { tournament_id: tournamentId } : undefined,
    })
    return response.data
  },
}

