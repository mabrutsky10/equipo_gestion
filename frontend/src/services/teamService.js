import api from './api'

export const teamService = {
  getCurrentTeam: async () => {
    const response = await api.get('/teams/current')
    return response.data
  },
}

