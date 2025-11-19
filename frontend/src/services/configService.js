import api from './api'

export const configService = {
  getConfigCuota: async () => {
    // team_id is automatically set from the logged-in user
    const response = await api.get('/config/cuota')
    return response.data
  },
  
  createOrUpdateConfigCuota: async (config) => {
    // team_id is automatically set from the logged-in user
    const response = await api.post('/config/cuota', config)
    return response.data
  },
}

