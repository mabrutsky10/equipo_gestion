import { useEffect, useMemo, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { locationService } from '../services/locationService'

const StatusBadge = ({ label, status }) => {
  const color =
    status === 'complete'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'pending'
        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
        : 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {label}
    </span>
  )
}

const LogEntry = ({ entry }) => {
  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-800">{entry.label}</p>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            entry.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {entry.success ? 'OK' : 'Error'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{dayjs(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
      {entry.request && (
        <pre className="bg-gray-50 text-xs rounded p-2 overflow-auto mb-2">
          {JSON.stringify(entry.request, null, 2)}
        </pre>
      )}
      {entry.response && (
        <pre className="bg-gray-50 text-xs rounded p-2 overflow-auto">
          {JSON.stringify(entry.response, null, 2)}
        </pre>
      )}
      {entry.error && (
        <div className="text-xs text-red-600 mt-2">
          {entry.error?.message || entry.error?.toString() || 'Error desconocido'}
        </div>
      )}
    </div>
  )
}

const DebugFlow = () => {
  const { user, logout } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [profile, setProfile] = useState(null)
  const [locationStatus, setLocationStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('flow')
  const [loading, setLoading] = useState(false)
  const [birthDateInput, setBirthDateInput] = useState('')
  const [locationInput, setLocationInput] = useState({ latitude: '', longitude: '' })
  const [errorMessage, setErrorMessage] = useState('')

  const recordLog = (entry) => {
    setLogs((prev) => [{ timestamp: new Date().toISOString(), ...entry }, ...prev].slice(0, 100))
  }

  const runWithLog = async (label, fn, requestPayload) => {
    try {
      const response = await fn()
      recordLog({ label, success: true, request: requestPayload, response })
      return response
    } catch (error) {
      recordLog({ label, success: false, request: requestPayload, error: error?.response?.data || error })
      throw error
    }
  }

  const fetchSessionInfo = async () => {
    const session = await runWithLog('fetchAuthSession()', async () => {
      const result = await fetchAuthSession()
      return {
        tokens: {
          accessTokenExpires: result?.tokens?.accessToken?.payload?.exp || null,
          idTokenExpires: result?.tokens?.idToken?.payload?.exp || null,
        },
      }
    })
    setSessionInfo(session)
  }

  const loadProfile = async () => {
    const response = await runWithLog('ProfileServices.getProfile()', () => profileService.getProfile())
    setProfile(response?.data || response)
    setBirthDateInput(response?.data?.birth_date || response?.birth_date || '')
  }

  const checkLocation = async (profileId) => {
    const status = await runWithLog('LocationServices.checkLocationStatus()', () =>
      locationService.checkLocationStatus(profileId)
    )
    setLocationStatus(status)
    if (status?.locationData) {
      setLocationInput({
        latitude: status.locationData.latitude || '',
        longitude: status.locationData.longitude || '',
      })
    }
  }

  const runInitialFlow = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      await fetchSessionInfo()
      await loadProfile()
    } catch (error) {
      setErrorMessage(error?.message || 'Error cargando perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runInitialFlow()
  }, [])

  useEffect(() => {
    if (profile?.id) {
      checkLocation(profile.id).catch((error) => {
        setErrorMessage(error?.message || 'Error consultando ubicación')
      })
    }
  }, [profile?.id])

  const handleBirthDateSubmit = async (event) => {
    event.preventDefault()
    if (!birthDateInput) return
    setLoading(true)
    try {
      await runWithLog('ProfileServices.updateProfile()', () =>
        profileService.updateProfile({
          ...profile,
          birth_date: birthDateInput,
        })
      )
      await loadProfile()
    } catch (error) {
      setErrorMessage(error?.message || 'Error actualizando fecha de nacimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSubmit = async (event) => {
    event.preventDefault()
    if (!profile?.id) return
    setLoading(true)
    try {
      await runWithLog('LocationServices.saveLocation()', () =>
        locationService.saveLocation(profile.id, locationInput)
      )
      await checkLocation(profile.id)
    } catch (error) {
      setErrorMessage(error?.message || 'Error guardando ubicación')
    } finally {
      setLoading(false)
    }
  }

  const birthDateComplete = Boolean(profile?.birth_date)
  const locationComplete = Boolean(locationStatus?.hasLocation)

  const envWarning = useMemo(() => {
    if (!import.meta.env.VITE_API_URL_PROFILE) {
      return 'VITE_API_URL_PROFILE no está configurado. Las llamadas reales al perfil no funcionarán.'
    }
    return null
  }, [])

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-gray-500 uppercase tracking-wide">Debugger de flujo (Cognito & Perfil)</p>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Debug del Usuario</h1>
        <p className="text-gray-600 max-w-3xl">
          Esta vista sigue el flujo detallado en <code>@flujo.txt</code>: verifica sesión, carga el perfil,
          comprueba datos obligatorios y la ubicación asociada. Cada servicio llamado se registra con su respuesta.
        </p>
        {envWarning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded">
            {envWarning}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{errorMessage}</div>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm uppercase">Sesión Cognito</h2>
            <StatusBadge label={sessionInfo ? 'Completado' : 'Pendiente'} status={sessionInfo ? 'complete' : 'pending'} />
          </div>
          <p className="text-sm text-gray-500">
            Ejecuta <code>fetchAuthSession()</code> y muestra expiraciones de tokens.
          </p>
          <button
            onClick={fetchSessionInfo}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Volver a validar
          </button>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm uppercase">Perfil</h2>
            <StatusBadge label={profile ? 'Cargado' : 'Pendiente'} status={profile ? 'complete' : 'pending'} />
          </div>
          <p className="text-sm text-gray-500">
            Consulta <code>ProfileServices.getProfile()</code> y verifica datos obligatorios.
          </p>
          <button onClick={loadProfile} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Recargar perfil
          </button>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm uppercase">Ubicación</h2>
            <StatusBadge
              label={locationComplete ? 'Completa' : 'Incompleta'}
              status={locationComplete ? 'complete' : 'pending'}
            />
          </div>
          <p className="text-sm text-gray-500">
            Usa <code>LocationServices.checkLocationStatus()</code> para validar coordenadas.
          </p>
          <button
            onClick={() => profile?.id && checkLocation(profile.id)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Comprobar ubicación
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Datos personales</h3>
            <StatusBadge
              label={birthDateComplete ? 'Completo' : 'Falta información'}
              status={birthDateComplete ? 'complete' : 'pending'}
            />
          </div>
          {profile ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="font-medium text-gray-800">
                  {profile.first_name || '—'} {profile.last_name || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Fecha de nacimiento</span>
                <span className="font-medium text-gray-800">
                  {profile.birth_date
                    ? new Date(profile.birth_date).toLocaleDateString('es-AR')
                    : 'Sin definir'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Perfil no disponible.</p>
          )}
          {!birthDateComplete && (
            <form className="space-y-3" onSubmit={handleBirthDateSubmit}>
              <label className="block text-sm font-medium text-gray-700">
                Completar fecha de nacimiento
                <input
                  type="date"
                  value={birthDateInput}
                  onChange={(e) => setBirthDateInput(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                disabled={loading}
              >
                Guardar fecha
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Ubicación del equipo</h3>
            <StatusBadge
              label={locationComplete ? 'Registrada' : 'Sin registrar'}
              status={locationComplete ? 'complete' : 'pending'}
            />
          </div>
          {locationStatus?.locationData ? (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Latitud</dt>
                <dd className="font-medium text-gray-900">{locationStatus.locationData.latitude || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Longitud</dt>
                <dd className="font-medium text-gray-900">{locationStatus.locationData.longitude || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Aún no hay coordenadas guardadas.</p>
          )}
          {!locationComplete && (
            <form className="space-y-3" onSubmit={handleLocationSubmit}>
              <label className="block text-sm font-medium text-gray-700">
                Latitud
                <input
                  type="text"
                  value={locationInput.latitude}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, latitude: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="-31.42008"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Longitud
                <input
                  type="text"
                  value={locationInput.longitude}
                  onChange={(e) => setLocationInput((prev) => ({ ...prev, longitude: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="-64.18877"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                disabled={loading}
              >
                Guardar ubicación
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 flex">
          <button
            className={`px-5 py-3 text-sm font-semibold ${
              activeTab === 'flow' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('flow')}
          >
            Detalle del flujo
          </button>
          <button
            className={`px-5 py-3 text-sm font-semibold ${
              activeTab === 'logs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            Logs de servicios ({logs.length})
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'flow' ? (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900">1. fetchAuthSession()</h4>
                <p>Obtiene tokens vigentes de Cognito.</p>
                {sessionInfo && (
                  <pre className="bg-gray-50 rounded p-3 mt-2 text-xs">
                    {JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">2. ProfileServices.getProfile()</h4>
                <p>Recupera datos personales, flags de onboarding y asociaciones a equipos.</p>
                {profile && (
                  <pre className="bg-gray-50 rounded p-3 mt-2 text-xs overflow-auto max-h-80">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">3. LocationServices.checkLocationStatus()</h4>
                <p>
                  Verifica si existe una ubicación asociada al perfil. Si no hay cache, consulta{' '}
                  <code>ProfileServices.getProfileLocation()</code>.
                </p>
                {locationStatus && (
                  <pre className="bg-gray-50 rounded p-3 mt-2 text-xs overflow-auto max-h-80">
                    {JSON.stringify(locationStatus, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-auto">
              {logs.length === 0 && <p className="text-sm text-gray-500">Todavía no hay logs.</p>}
              {logs.map((entry) => (
                <LogEntry key={entry.timestamp + entry.label} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-gray-500">
          Sesión actual: <strong>{user?.attributes?.email || user?.username || '—'}</strong>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runInitialFlow}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
          >
            Reiniciar flujo
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200"
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  )
}

export default DebugFlow

