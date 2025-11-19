import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('API Request:', config.url, 'Token present:', !!token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('No token found in localStorage')
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
  (error) => {
    console.error('API Error:', error.config?.url, 'Status:', error.response?.status, 'Message:', error.message)
    if (error.response?.status === 401) {
      console.warn('Unauthorized - redirecting to login')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

