import api from './api'

export const homeService = {
  getMetrics: async () => {
    const response = await api.get('/home/metrics')
    return response.data
  },
}

