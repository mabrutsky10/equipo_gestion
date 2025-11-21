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
  getJugadoresLibres: async (params = {}) => {
    const { lat, lon, distance = 0, id = 0 } = params
    const queryParams = new URLSearchParams()
    
    if (lat !== undefined) queryParams.append('lat', lat)
    if (lon !== undefined) queryParams.append('lon', lon)
    queryParams.append('distance', distance)
    queryParams.append('id', id)
    
    const response = await api.get(`/mas10/jugadores-libres?${queryParams.toString()}`)
    return response.data
  },
}

