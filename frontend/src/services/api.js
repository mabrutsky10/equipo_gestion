import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession()
      if (session.tokens && session.tokens.accessToken) {
        const token = session.tokens.accessToken.toString()
        config.headers.Authorization = `Bearer ${token}`
        console.log('API Request:', config.url, 'Token present:', !!token)
      } else {
        console.warn('No token found in Cognito session')
      }
    } catch (error) {
      console.error('Error fetching auth session:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, 'Status:', response.status)
    return response
  },
  async (error) => {
    console.error('API Error:', error.config?.url, 'Status:', error.response?.status, 'Message:', error.message)
    if (error.response?.status === 401) {
      console.warn('Unauthorized response received. Staying on current page.')
    }
    return Promise.reject(error)
  }
)

export default api
