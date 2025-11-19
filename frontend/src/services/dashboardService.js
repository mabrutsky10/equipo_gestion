import api from './api'

export const dashboardService = {
  getStats: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    
    const response = await api.get(`/dashboard/stats?${params.toString()}`)
    return response.data
  },
}

