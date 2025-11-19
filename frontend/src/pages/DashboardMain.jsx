import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { teamService } from '../services/teamService'
import { homeService } from '../services/homeService'
import { dashboardService } from '../services/dashboardService'
import { campaignService } from '../services/campaignService'
import { mas10Service } from '../services/mas10Service'
import { chatService } from '../services/chatService'
import { getAssistantAvatar } from '../utils/imagePaths'
import defaultTeamLogo from '../assets/images/placeholders/default-team-logo.svg'
import emptyLogo from '../assets/images/empty-states/empty-logo.svg'

const DashboardMain = () => {
  const [teamName, setTeamName] = useState('')
  const [teamLogo, setTeamLogo] = useState(null)
  const [teamLevel, setTeamLevel] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [assistants, setAssistants] = useState([])
  const [assistantsLoading, setAssistantsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    competencia: {
      proximoPartido: 'vs. Rival FC',
      ultimoResultado: '2-1',
      estadisticas: '3°',
    },
    prensa: {
      webEquipo: 'En construcción',
      prensa: 'Sin novedades',
      chats: '0 activos',
    },
    mercado: {
      mercadoPases: '2',
      jugadores: '0',
      empleados: '8',
    },
    finanzas: {
      caja: '$0',
      sociosActivos: 0,
      sponsorsActivos: 0,
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load team name and level
      const team = await teamService.getCurrentTeam()
      setTeamName(team.name || '')
      
      // Set level information if available
      if (team.level) {
        setTeamLevel(team.level)
      }
      
      // Try to get campaign info (which has logo)
      try {
        const campaign = await campaignService.getCurrentCampaign()
        if (campaign && campaign.team_logo) {
          setTeamLogo(campaign.team_logo)
        }
        // Use campaign team name if available
        if (campaign && campaign.team_name) {
          setTeamName(campaign.team_name)
        }
      } catch (campaignError) {
        // Campaign not found is OK
        console.log('No campaign found, using team info only')
      }

      await loadMas10Data()
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      loadMetrics()
      loadAssistants()
      loadStats()
    }
  }

  const loadMas10Data = async () => {
    try {
      const data = await mas10Service.getTeamData()
      
      // Update team name and logo from mas10 if available
      if (data?.data?.team_data) {
        const teamData = data.data.team_data
        if (teamData.name && !teamName) {
          setTeamName(teamData.name)
        }
        if (teamData.avatar && !teamLogo) {
          setTeamLogo(teamData.avatar)
        }
      }
      
      // Load tournaments
      if (data?.data?.tournaments && Array.isArray(data.data.tournaments)) {
        setTournaments(data.data.tournaments)
      }
    } catch (err) {
      console.error('Error loading Mas10 data:', err)
      // Not critical, continue without Mas10 data
    }
  }

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true)
      const metricsData = await homeService.getMetrics()
      setMetrics(metricsData)
    } catch (err) {
      console.error('Error loading metrics:', err)
      // Set default values to 0
      setMetrics({
        followers_count: 0,
        socios_count: 0,
        jugadores_count: 0,
        jugadores_socios_count: 0,
        jugadores_con_foto_count: 0,
        jugadores_tournament_name: null,
      })
    } finally {
      setMetricsLoading(false)
    }
  }

  const loadAssistants = async () => {
    try {
      setAssistantsLoading(true)
      const assistantsData = await chatService.getAssistants()
      // Map avatar paths from backend to imported images
      const assistantsWithAvatars = assistantsData.map(assistant => ({
        ...assistant,
        avatar: getAssistantAvatar(assistant.id) || assistant.avatar,
      }))
      setAssistants(assistantsWithAvatars)
    } catch (err) {
      console.error('Error loading assistants:', err)
      setAssistants([])
    } finally {
      setAssistantsLoading(false)
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

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const stats = await dashboardService.getStats()
      setData({
        competencia: {
          proximoPartido: 'vs. Rival FC', // TODO: Get from Mas10 API
          ultimoResultado: '2-1', // TODO: Get from Mas10 API
          estadisticas: '3°', // TODO: Get from Mas10 API
        },
        prensa: {
          webEquipo: 'En construcción',
          prensa: 'Sin novedades',
          chats: '0 activos',
        },
        mercado: {
          mercadoPases: '2', // TODO: Get from market API
          jugadores: '0', // TODO
          empleados: '8', // TODO: Get from employees API
        },
        finanzas: {
          caja: `$${stats.balance_neto?.toLocaleString('es-AR') || '0'}`,
        },
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const AssistantCard = ({ assistant }) => {
    const [imageError, setImageError] = useState(false)
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 h-full">
          <div className="w-24 h-24 sm:w-32 sm:h-36 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
            {assistant.avatar && !imageError ? (
              <img
                src={assistant.avatar}
                alt={assistant.nombre || assistant.displayName || assistant.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-3xl font-semibold text-gray-500">
                {(assistant.nombre || assistant.displayName || assistant.name || 'A').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
            <div className="text-lg font-semibold text-gray-900">
              {assistant.nombre || assistant.displayName || assistant.name}
            </div>
            {assistant.rol && (
              <div className="text-sm text-gray-500 mt-1">
                {assistant.rol}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const DashboardCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-4 bg-gray-100 rounded"></div>
        ))}
      </div>
      <div className="pt-4 border-t border-gray-100">
        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
      </div>
    </div>
  )

  const MetricCardSkeleton = () => (
    <>
      <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="animate-pulse h-10 bg-gray-200 rounded mb-2"></div>
      <div className="animate-pulse h-3 bg-gray-100 rounded w-2/3"></div>
    </>
  )

  const HeaderSkeleton = () => (
    <div className="flex items-center gap-4 animate-pulse w-full">
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      <div className="flex-1 h-5 bg-gray-200 rounded"></div>
      <div className="w-32 h-4 bg-gray-100 rounded hidden sm:block"></div>
    </div>
  )

  const DashboardCard = ({ icon, title, items, tournaments, linkText = 'Ver más →', linkTo }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="text-3xl mr-3 text-green-600">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4 mb-6">
        {items.map((item, index) => {
          const Wrapper = item.path ? Link : 'div'
          const wrapperProps = item.path
            ? {
                to: item.path,
                className:
                  'flex justify-between items-center text-sm text-gray-600 hover:text-green-600 transition-colors',
              }
            : { className: 'flex justify-between items-center' }

          return (
            <Wrapper key={index} {...wrapperProps}>
              <span className="text-sm">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </Wrapper>
          )
        })}
      </div>
      
      {/* Tournaments Section */}
      {tournaments && tournaments.length > 0 && (
        <div className="mb-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {tournaments.map((tournament, index) => (
              <div 
                key={tournament.id_tournament || index}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
              >
                {tournament.avatar && (
                  <img 
                    src={tournament.avatar} 
                    alt={tournament.name_league || 'Torneo'}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 leading-tight">
                    {tournament.name_league || 'Sin nombre'}
                  </span>
                  {tournament.name_tournament && (
                    <span className="text-xs text-gray-600 leading-tight">
                      {tournament.name_tournament}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-gray-200">
        {linkTo ? (
          <Link to={linkTo} className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors">
            {linkText}
          </Link>
        ) : (
          <span className="text-sm text-gray-400 cursor-default">{linkText}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Team Header - Small and subtle */}
      <div className="mb-4 flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        {loading ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 flex-shrink-0">
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
            
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-gray-900 truncate">
                {teamName || 'Sin nombre'}
              </div>
            </div>
            
            {teamLevel && (
              <div className="flex items-center gap-3 text-sm ml-auto">
                <div className="text-gray-600">
                  <span className="font-medium">Nivel {teamLevel.id}:</span>
                  <span className="ml-1 text-gray-900">{teamLevel.nombre}</span>
                </div>
                <div className="text-gray-500">•</div>
                <div className="text-gray-600">
                  <span className="text-gray-700">{teamLevel.descripcion}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Metrics Cards - Same as Home */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Seguidores */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Seguidores</div>
          {metricsLoading ? (
            <MetricCardSkeleton />
          ) : (
            <div className="text-3xl font-bold text-gray-900">{metrics?.followers_count ?? 0}</div>
          )}
        </div>
        
        {/* Socios */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Socios</div>
          {metricsLoading ? (
            <MetricCardSkeleton />
          ) : (
            <div className="text-3xl font-bold text-gray-900">{metrics?.socios_count ?? 0}</div>
          )}
        </div>
        
        {/* Jugadores */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Jugadores</div>
          {metricsLoading ? (
            <MetricCardSkeleton />
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
            <MetricCardSkeleton />
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
            <MetricCardSkeleton />
          ) : (
            <div className="text-3xl font-bold text-gray-900">{metrics?.jugadores_con_foto_count ?? 0}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <DashboardCardSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            <DashboardCard
              icon="🏆"
              title="Competencia"
              items={[
                { label: 'Próximo partido', value: data.competencia.proximoPartido, path: '/dashboard/competencia/proximo-partido' },
                { label: 'Último resultado', value: data.competencia.ultimoResultado, path: '/dashboard/competencia/ultimos-resultados' },
                { label: 'Estadísticas', value: data.competencia.estadisticas, path: '/dashboard/competencia/estadisticas' },
              ]}
              tournaments={tournaments}
              linkTo="/dashboard/competencia/proximo-partido"
            />

            <DashboardCard
              icon="🗞️"
              title="Prensa y Comunicaciones"
              items={[
                { label: 'Web del equipo', value: data.prensa.webEquipo, path: '/dashboard/comunicaciones/web' },
                { label: 'Prensa', value: data.prensa.prensa, path: '/dashboard/comunicaciones/prensa' },
                { label: 'Chats', value: data.prensa.chats, path: '/dashboard/comunicaciones/chats' },
              ]}
              linkTo="/dashboard/comunicaciones/web"
            />

            <DashboardCard
              icon="👥"
              title="Plantel"
              items={[
                {
                  label: 'Mercado de pases y fichajes',
                  value: data.mercado.mercadoPases,
                  path: '/dashboard/talento/mercado',
                },
                { label: 'Jugadores', value: data.mercado.jugadores, path: '/dashboard/talento/jugadores' },
                {
                  label: 'Comisión, managers y profesionales',
                  value: data.mercado.empleados,
                  path: '/dashboard/talento/comision',
                },
              ]}
              linkTo="/dashboard/talento/mercado"
            />

            <DashboardCard
              icon="$"
              title="Finanzas"
              items={[
                { label: 'Caja', value: data.finanzas.caja, path: '/dashboard/finanzas/caja' },
                {
                  label: 'Socios',
                  value: metricsLoading ? '—' : metrics?.socios_count ?? 0,
                  path: '/dashboard/finanzas/socios',
                },
                {
                  label: 'Sponsors',
                  value: metricsLoading ? '—' : metrics?.jugadores_con_foto_count ?? 0,
                  path: '/dashboard/finanzas/sponsors',
                },
              ]}
              linkTo="/dashboard/finanzas/caja"
            />
          </>
        )}
      </div>

      {/* Assistants Cards - Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        {assistantsLoading ? (
          <>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 h-40 flex flex-col items-center justify-center animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-2xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </>
        ) : (
          assistants.slice(0, 5).map((assistant) => (
            <AssistantCard 
              key={assistant.id} 
              assistant={assistant}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default DashboardMain

