import api from './api'

export const movementService = {
  getMovements: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.estado) params.append('estado', filters.estado)
    
    const queryString = params.toString()
    const url = queryString ? `/movements?${queryString}` : '/movements'
    console.log('Fetching movements from:', url)
    const response = await api.get(url)
    console.log('Movements response:', response)
    return response.data
  },
  
  createMovement: async (movement) => {
    // team_id is automatically set from the logged-in user
    const response = await api.post('/movements', movement)
    return response.data
  },
}

