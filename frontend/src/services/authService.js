import api from './api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  register: async (email, password, userprofileId = null) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      userprofile_id: userprofileId,
    })
    return response.data
  },
}







