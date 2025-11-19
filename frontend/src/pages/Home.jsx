import { useState, useEffect } from 'react'
import { teamService } from '../services/teamService'
import { campaignService } from '../services/campaignService'
import { homeService } from '../services/homeService'
import { mas10Service } from '../services/mas10Service'
import emptyTeamImage from '../assets/images/empty-states/empty-team.svg'
import emptyLogo from '../assets/images/empty-states/empty-logo.svg'
import defaultTeamLogo from '../assets/images/placeholders/default-team-logo.svg'

const Home = () => {
  const [teamName, setTeamName] = useState('')
  const [teamLogo, setTeamLogo] = useState(null)
  const [teamBio, setTeamBio] = useState('')
  const [teamLevel, setTeamLevel] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [mas10Data, setMas10Data] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeamInfo()
    loadMetrics()
    loadMas10Data()
  }, [])

  const loadTeamInfo = async () => {
    try {
      setError('')
      
      // Get team basic info
      const team = await teamService.getCurrentTeam()
      setTeamName(team.name || '')
      
      // Set level information if available
      if (team.level) {
        setTeamLevel(team.level)
      }
      
      // Try to get campaign info (which has logo and bio)
      try {
        const campaign = await campaignService.getCurrentCampaign()
        if (campaign) {
          if (campaign.team_logo) {
            setTeamLogo(campaign.team_logo)
          }
          if (campaign.team_bio) {
            setTeamBio(campaign.team_bio)
          }
          // Use campaign team name if available
          if (campaign.team_name) {
            setTeamName(campaign.team_name)
          }
        }
      } catch (campaignError) {
        // Campaign not found is OK, we'll just show team name
        console.log('No campaign found, using team info only')
      }
    } catch (err) {
      console.error('Error loading team info:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error al cargar la información del equipo'
      setError(`Error al cargar la información del equipo: ${errorMessage}`)
    }
  }

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true)
      const metricsData = await homeService.getMetrics()
      console.log('Metrics data received:', metricsData)
      console.log('jugadores_count:', metricsData.jugadores_count)
      console.log('jugadores_tournament_name:', metricsData.jugadores_tournament_name)
      console.log('debug_info:', metricsData.debug_info)
      setMetrics(metricsData)
    } catch (err) {
      console.error('Error loading metrics:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido'
      console.error('Error details:', errorMessage)
      // Set default values to 0 instead of showing error
      setMetrics({
        followers_count: 0,
        socios_count: 0,
        jugadores_count: 0,
        jugadores_socios_count: 0,
        jugadores_con_foto_count: 0,
        jugadores_tournament_name: null,
      })
      // Only set error if it's not a 400 (user doesn't have team)
      if (err.response?.status !== 400) {
        setError(prev => prev ? `${prev}; Error en métricas: ${errorMessage}` : `Error en métricas: ${errorMessage}`)
      }
    } finally {
      setMetricsLoading(false)
    }
  }

  const loadMas10Data = async () => {
    try {
      setLoading(true)
      const data = await mas10Service.getTeamData()
      setMas10Data(data)
      
      // Update team name and logo from mas10 if available
      if (data?.data?.team_data) {
        const teamData = data.data.team_data
        if (teamData.name && !teamName) {
          setTeamName(teamData.name)
        }
        if (teamData.avatar && !teamLogo) {
          setTeamLogo(teamData.avatar)
        }
        if (teamData.info && !teamBio) {
          setTeamBio(teamData.info)
        }
      }
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


  const getPressActivityDescription = (value) => {
    switch (value) {
      case 1:
        return 'Muy baja'
      case 2:
        return 'Baja'
      case 3:
        return 'Moderada'
      case 4:
        return 'Alta'
      case 5:
        return 'PRO'
      case 0:
      default:
        return 'Sin actividad'
    }
  }

  // Get gallery image from mas10 data
  const getGalleryImage = () => {
    if (mas10Data?.data?.team_data?.gallery) {
      return mas10Data.data.team_data.gallery
    }
    // Return empty_team image if no gallery image available
    return emptyTeamImage
  }


  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando información del equipo...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Home del Equipo</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Seguidores */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Seguidores</div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">{metrics?.followers_count ?? 0}</div>
            )}
          </div>
          
          {/* Socios */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Socios</div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">{metrics?.socios_count ?? 0}</div>
            )}
          </div>
          
          {/* Jugadores */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Jugadores</div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{metrics?.jugadores_count ?? 0}</div>
                {metrics?.jugadores_tournament_name && (
                  <div className="text-xs text-gray-400 mt-1">{metrics.jugadores_tournament_name}</div>
                )}
              </>
            )}
          </div>
          
          {/* Actividad de Prensa */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Actividad de Prensa</div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{metrics?.jugadores_socios_count ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics ? getPressActivityDescription(metrics.jugadores_socios_count) : 'Sin actividad'}
                </div>
              </>
            )}
          </div>
          
          {/* Sponsors */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-gray-500 mb-1">Sponsors</div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">{metrics?.jugadores_con_foto_count ?? 0}</div>
            )}
          </div>
        </div>

        {/* Team Info */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Team Data */}
            <div>
              {/* Logo and Name */}
              <div className="mb-6 flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300 flex-shrink-0">
                  {teamLogo ? (
                    <img 
                      src={teamLogo} 
                      alt={teamName || 'Logo del equipo'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = defaultTeamLogo
                      }}
                    />
                  ) : (
                    <img 
                      src={emptyLogo} 
                      alt="Sin logo" 
                      className="w-full h-full object-contain opacity-50"
                    />
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {teamName || 'Sin nombre'}
                </div>
              </div>

              {/* Bio / Descripción del Equipo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / Descripción del Equipo
                </label>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {teamBio || (
                    <span className="text-gray-400 italic">
                      No hay descripción disponible. Puedes configurarla en la creación de campaña.
                    </span>
                  )}
                </div>
              </div>

              {/* Torneos */}
              {mas10Data?.data?.tournaments && mas10Data.data.tournaments.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Torneos
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {mas10Data.data.tournaments.map((tournament, index) => (
                      <div 
                        key={tournament.id_tournament || index}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {tournament.avatar && (
                          <img 
                            src={tournament.avatar} 
                            alt={tournament.name_league || 'Torneo'}
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {tournament.name_league || 'Sin nombre'}
                          </span>
                          {tournament.name_tournament && (
                            <span className="text-xs text-gray-600">
                              {tournament.name_tournament}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nivel del Equipo */}
              {teamLevel && (
                <div className="mb-6">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-700">Nivel {teamLevel.id}:</span>
                        <span className="text-sm font-medium text-gray-900">{teamLevel.nombre}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-indigo-700">Detalle:</span>
                        <span className="text-sm text-gray-700">{teamLevel.descripcion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

             {/* Right Column: Gallery Image */}
             <div>
               <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                 <img 
                   src={getGalleryImage()} 
                   alt={`Imagen de ${teamName || 'equipo'}`}
                   className="w-full h-auto object-cover"
                   onError={(e) => {
                     // Fallback to empty_team image if image fails to load
                     e.target.onerror = null
                     e.target.src = emptyTeamImage
                   }}
                 />
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Home


