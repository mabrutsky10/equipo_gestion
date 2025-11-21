import { profileService } from './profileService'

const STORAGE_KEY_LOCATION = 'debug_location_cache'

const getStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Error leyendo location de localStorage:', error)
    return null
  }
}

const setStoredLocation = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(data || {}))
  } catch (error) {
    console.warn('Error guardando location en localStorage:', error)
  }
}

export const locationService = {
  async checkLocationStatus(profileId) {
    if (!profileId) {
      return { hasLocation: false }
    }

    const cached = getStoredLocation()
    if (cached?.id_profile === profileId) {
      return {
        hasLocation: Boolean(cached.latitude && cached.longitude),
        locationData: cached,
        source: 'cache',
      }
    }

    try {
      const response = await profileService.getProfileLocation(profileId, 'userprofile')
      const data = Array.isArray(response?.data)
        ? response.data[response.data.length - 1]
        : response?.data

      const hasLocation = Boolean(data?.latitude && data?.longitude)
      if (data) {
        setStoredLocation({ ...data, id_profile: profileId })
      }
      return {
        hasLocation,
        locationData: data,
        source: 'api',
      }
    } catch (error) {
      console.error('Error consultando ubicación de perfil:', error)
      return { hasLocation: false, error }
    }
  },

  async saveLocation(profileId, locationPayload) {
    if (!profileId) {
      throw new Error('profileId es requerido para guardar la ubicación')
    }
    const payload = {
      ...locationPayload,
      id_profile: profileId,
      table_name: 'userprofile',
    }
    const response = await profileService.saveLocation(payload)
    setStoredLocation({ ...payload, id_profile: profileId })
    return response
  },

  clearCache() {
    try {
      localStorage.removeItem(STORAGE_KEY_LOCATION)
    } catch (error) {
      console.warn('Error limpiando cache de location:', error)
    }
  },
}

