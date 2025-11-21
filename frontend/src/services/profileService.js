import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const baseURL = import.meta.env.VITE_API_URL_PROFILE

const profileApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

profileApi.interceptors.request.use(
  async (config) => {
    if (!baseURL) {
      throw new Error('VITE_API_URL_PROFILE no está configurado')
    }
    try {
      const session = await fetchAuthSession()
      const token = session?.tokens?.accessToken?.toString()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error obteniendo token para profileApi:', error)
    }
    return config
  },
  (error) => Promise.reject(error)
)

const unwrap = async (promise) => {
  if (!baseURL) {
    throw new Error('VITE_API_URL_PROFILE no está configurado')
  }
  const response = await promise
  return response.data
}

export const profileService = {
  getProfile: () => unwrap(profileApi.get('/profile')),
  updateProfile: (payload) => unwrap(profileApi.put('/profile', payload)),
  registerProfile: (payload) => unwrap(profileApi.post('/register', payload)),
  getProfileLocation: (profileId, tableName = 'userprofile') =>
    unwrap(
      profileApi.get('/location', {
        params: {
          id_profile: profileId,
          table_name: tableName,
        },
      })
    ),
  saveLocation: (payload) => unwrap(profileApi.post('/location', payload)),
}

