import { useState, useEffect } from 'react'
import { mas10Service } from '../services/mas10Service'

const Debugging = () => {
  const [mas10Data, setMas10Data] = useState(null)
  const [playersData, setPlayersData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMas10Data()
    loadPlayersData()
  }, [])

  const loadMas10Data = async () => {
    try {
      setLoading(true)
      const data = await mas10Service.getTeamData()
      setMas10Data(data)
      console.log('Mas10 data loaded:', data)
    } catch (err) {
      console.error('Error loading Mas10 data:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido'
      console.error('Error details:', errorMessage)
      // Only set error if it's not a 400 (user doesn't have team) or 404 (team not found in Mas10)
      if (err.response?.status !== 400 && err.response?.status !== 404) {
        setError(prev => prev ? `${prev}; Error en Mas10: ${errorMessage}` : `Error en Mas10: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPlayersData = async () => {
    try {
      const data = await mas10Service.getTeamPlayers()
      setPlayersData(data)
      console.log('Players data loaded:', data)
    } catch (err) {
      console.error('Error loading players data:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido'
      console.error('Error details:', errorMessage)
      // Only set error if it's not a 400 (user doesn't have team) or 404 (players not found)
      if (err.response?.status !== 400 && err.response?.status !== 404) {
        setError(prev => prev ? `${prev}; Error en jugadores: ${errorMessage}` : `Error en jugadores: ${errorMessage}`)
      }
    }
  }

  const renderJsonValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>
    }
    if (typeof value === 'object') {
      return (
        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-48">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>
    }
    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>
    }
    if (typeof value === 'string' && value.startsWith('http')) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {value}
        </a>
      )
    }
    return <span>{String(value)}</span>
  }

  const renderObject = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') {
      return null
    }

    return Object.entries(obj).map(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (value === null || value === undefined) {
        return (
          <div key={fullKey} className="mb-2 border-b border-gray-100 pb-2">
            <div className="text-sm font-semibold text-gray-700">{fullKey}:</div>
            <div className="text-gray-400 italic ml-4">null</div>
          </div>
        )
      }
      
      if (Array.isArray(value)) {
        return (
          <div key={fullKey} className="mb-4 border-b border-gray-200 pb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">{fullKey} (Array[{value.length}]):</div>
            <div className="ml-4">
              {value.map((item, index) => (
                <div key={index} className="mb-2 pl-4 border-l-2 border-gray-200">
                  {typeof item === 'object' ? renderObject(item, `${fullKey}[${index}]`) : renderJsonValue(item)}
                </div>
              ))}
            </div>
          </div>
        )
      }
      
      if (typeof value === 'object') {
        return (
          <div key={fullKey} className="mb-4 border-b border-gray-200 pb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">{fullKey}:</div>
            <div className="ml-4">{renderObject(value, fullKey)}</div>
          </div>
        )
      }
      
      return (
        <div key={fullKey} className="mb-2 border-b border-gray-100 pb-2">
          <div className="text-sm font-semibold text-gray-700">{fullKey}:</div>
          <div className="ml-4">{renderJsonValue(value)}</div>
        </div>
      )
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando datos de debugging...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Debugging - Mas10 API</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Mas10 Data */}
        {mas10Data && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de Mas10 (Team Data)</h2>
            <div className="space-y-4">
              {renderObject(mas10Data)}
            </div>
          </div>
        )}

        {!mas10Data && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">No se pudieron cargar los datos de Mas10</p>
          </div>
        )}

        {/* Players Data */}
        {playersData && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de Jugadores del Torneo</h2>
            <div className="space-y-4">
              {renderObject(playersData)}
            </div>
          </div>
        )}

        {!playersData && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No se pudieron cargar los datos de jugadores</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Debugging

