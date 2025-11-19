import { useState, useEffect } from 'react'
import { campaignService } from '../../services/campaignService'
import { memberService } from '../../services/memberService'
import { teamService } from '../../services/teamService'
import SociosLandingPreview from '../SociosLanding/SociosLandingPreview'

const FinanzasSocios = () => {
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [historicalCampaigns, setHistoricalCampaigns] = useState([])
  const [campaignAccess, setCampaignAccess] = useState(null)
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberEvolution, setMemberEvolution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Check campaign access (includes level_id)
      const access = await campaignService.checkCampaignAccess()
      setCampaignAccess(access)

      // 2. Check if there's an active campaign
      let active = null
      try {
        active = await campaignService.getActiveCampaign()
        setActiveCampaign(active)
      } catch (err) {
        // No active campaign, that's OK
        setActiveCampaign(null)
      }

      // 3. Load historical campaigns
      try {
        const historical = await campaignService.getAllCampaigns()
        // Filter out the active campaign from historical list
        const activeId = active?.id
        setHistoricalCampaigns(
          historical.filter(c => c.status !== 'published' || c.id !== activeId)
        )
      } catch (err) {
        console.error('Error loading historical campaigns:', err)
        setHistoricalCampaigns([])
      }

      // 4. Load members with details
      try {
        const membersData = await memberService.getMembersWithDetails()
        setMembers(membersData)
      } catch (err) {
        console.error('Error loading members:', err)
        setMembers([])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberClick = async (memberId) => {
    try {
      const evolution = await memberService.getMemberEvolution(memberId)
      setMemberEvolution(evolution)
      setSelectedMember(memberId)
    } catch (err) {
      console.error('Error loading member evolution:', err)
      setError('Error al cargar la evolución del socio')
    }
  }

  const formatCurrency = (amount, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const normalizeToSlug = (value) => {
    if (!value) return ''
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const getLandingShareLink = (campaign) => {
    if (!campaign) return ''
    const slug = campaign.landing_slug || `${normalizeToSlug(campaign.team_name) || 'equipo'}-${campaign.team_id || 'demo'}`
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/equipos/${slug}/socios`
  }

  const handleCopyLandingLink = async (link) => {
    if (!link || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(link)
      setTimeout(() => setCopiedLink(''), 2000)
    } catch (err) {
      console.error('No se pudo copiar el link', err)
    }
  }

  const getMembersKPIMessage = () => {
    const membersCount = members.length
    const levelId = campaignAccess?.level_id ?? 0
    const hasActiveCampaign = activeCampaign !== null
    const membersNeeded = campaignAccess?.members_needed_for_next_level

    // Caso 1: 0 socios y nivel 0
    if (membersCount === 0 && levelId === 0) {
      return 'Solo los equipos nivel 1 pueden activar una campaña'
    }

    // Caso 2: 0 socios y nivel >= 1
    if (membersCount === 0 && levelId >= 1) {
      if (hasActiveCampaign) {
        return 'Sumá tu primer socio'
      } else {
        return 'Ya puedes activar campaña de socios'
      }
    }

    // Caso 3: Tiene socios - mostrar cuántos faltan para el siguiente nivel
    if (membersCount > 0 && membersNeeded !== null && membersNeeded !== undefined) {
      if (membersNeeded === 0) {
        return `¡Felicidades! Has alcanzado el siguiente nivel`
      } else {
        return `Te faltan ${membersNeeded} socio${membersNeeded !== 1 ? 's' : ''} para subir de nivel`
      }
    }

    // Fallback
    return `${membersCount} socio${membersCount !== 1 ? 's' : ''} registrado${membersCount !== 1 ? 's' : ''}`
  }

  // Skeleton Loading Component
  const SociosSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      {/* Active Campaign Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-40"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Create Campaign Form Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
        
        {/* Form Fields Skeleton */}
        <div className="space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded w-48"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-64 mt-1"></div>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div>
              <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="flex justify-between mt-1">
                <div className="h-3 bg-gray-100 rounded w-8"></div>
                <div className="h-3 bg-gray-100 rounded w-8"></div>
                <div className="h-3 bg-gray-100 rounded w-8"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-48 mt-1"></div>
            </div>
            
            <div>
              <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
              <div className="flex justify-between mt-1">
                <div className="h-3 bg-gray-100 rounded w-8"></div>
                <div className="h-3 bg-gray-100 rounded w-8"></div>
                <div className="h-3 bg-gray-100 rounded w-8"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-48 mt-1"></div>
            </div>
          </div>
          
          {/* Calculator Results Skeleton */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="h-6 bg-purple-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-purple-200 rounded w-40 mb-1"></div>
              <div className="h-3 bg-purple-100 rounded w-48"></div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="h-6 bg-purple-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-purple-200 rounded w-40 mb-1"></div>
              <div className="h-3 bg-purple-100 rounded w-48"></div>
            </div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-48"></div>
          </div>
          
          {/* Buttons Skeleton */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      </div>

      {/* Members List Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(6)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(6)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-20"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <SociosSkeleton />
  }

  const activeLandingLink = activeCampaign ? getLandingShareLink(activeCampaign) : ''

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Active Campaign Section */}
      {activeCampaign ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Campaña Activa
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Publicada
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Mensual
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(activeCampaign.monthly_amount, activeCampaign.currency)}
              </p>
            </div>

            {activeCampaign.alternative_amounts && activeCampaign.alternative_amounts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montos Alternativos
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeCampaign.alternative_amounts.map((amt, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                    >
                      {formatCurrency(amt, activeCampaign.currency)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <p className="text-gray-900 capitalize">
                {activeCampaign.payment_method.replace('_', ' ')}
              </p>
            </div>

            {activeCampaign.date_published && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Publicación
                </label>
                <p className="text-gray-900">{formatDate(activeCampaign.date_published)}</p>
              </div>
            )}

            {activeCampaign.mercado_pago_link && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Mercado Pago
                </label>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <span className="text-sm text-gray-700 break-all">{activeCampaign.mercado_pago_link}</span>
                  <a
                    href={activeCampaign.mercado_pago_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Abrir link
                  </a>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landing pública
              </label>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <span className="text-sm text-gray-700 break-all">
                  {activeLandingLink || 'Se generará automáticamente al publicar la campaña'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLandingLink(activeLandingLink)}
                    disabled={!activeLandingLink}
                    className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                  >
                    {copiedLink === activeLandingLink ? 'Copiado' : 'Copiar link'}
                  </button>
                  {activeLandingLink && (
                    <a
                      href={activeLandingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Abrir landing
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Vista previa pública</h3>
              <p className="text-sm text-gray-500">Compartí esta landing con tu comunidad para sumar socios.</p>
            </div>
            {activeLandingLink && (
              <a
                href={activeLandingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Ver landing pública
              </a>
            )}
          </div>
          <SociosLandingPreview campaign={activeCampaign} shareLink={activeLandingLink} variant="embedded" />
        </div>
        </>
      ) : (
        /* No Active Campaign - Show Create Form or Level Warning */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {campaignAccess?.can_create_campaign ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No hay campaña activa
              </h2>
              <p className="text-gray-600 mb-4">
                Tu equipo está en nivel {campaignAccess.level_id} y puede crear una campaña de socios.
              </p>
              <CreateCampaignForm
                onSuccess={() => {
                  loadData()
                }}
              />
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                Nivel Insuficiente
              </h2>
              <p className="text-yellow-800">
                {campaignAccess?.message || 'Necesitas nivel 1 para activar campaña de socios'}
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                Tu equipo está en nivel {campaignAccess?.level_id || 0}. Debes completar la identidad mínima del equipo para subir a nivel 1.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historical Campaigns */}
      {historicalCampaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Campañas Históricas
          </h2>
          <div className="space-y-3">
            {historicalCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(campaign.monthly_amount, campaign.currency)} / mes
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      campaign.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {campaign.status === 'published' ? 'Publicada' : campaign.status === 'draft' ? 'Borrador' : 'Inactiva'}
                  </span>
                </div>
                {campaign.date_published && (
                  <p className="text-xs text-gray-500">
                    Publicada: {formatDate(campaign.date_published)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members KPI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Socios
        </h2>
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-indigo-600 mb-2">
            {members.length}
          </div>
          <div className="text-sm text-gray-600">
            {getMembersKPIMessage()}
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Lista de Socios
        </h2>

        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay socios registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={selectedMember === member.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.first_name || member.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.last_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.subscription_status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.subscription_status === 'active' ? 'Activa' : member.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleMemberClick(member.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Ver evolución
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Evolution Modal */}
      {memberEvolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Evolución de Cuotas - {memberEvolution.member_name}
                </h3>
                {memberEvolution.username && (
                  <p className="text-sm text-gray-500">@{memberEvolution.username}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setMemberEvolution(null)
                  setSelectedMember(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-1">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(memberEvolution.total_paid)}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 mb-1">Total Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(memberEvolution.total_pending)}
                  </p>
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Historial de Pagos ({memberEvolution.payments.length})
              </h4>

              {memberEvolution.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay pagos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Monto Bruto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Monto Neto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {memberEvolution.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.fecha)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.monto_bruto)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(payment.monto_fee)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.monto_neto)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                payment.estado === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.estado === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payment.estado === 'confirmed' ? 'Confirmado' : payment.estado === 'pending' ? 'Pendiente' : 'Cancelado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Calculator logic from socios-coquitas-landing
const calculateResults = (indiceCoquita, jugadores, sociosPorJugador, cashoutPercentage = 0.70, creditoPercentage = 0.90) => {
  const sociosTotales = jugadores * sociosPorJugador
  const totalMensual = indiceCoquita * sociosTotales
  const cashout = totalMensual * cashoutPercentage
  const creditoVestuario = totalMensual * creditoPercentage
  
  return {
    sociosTotales,
    totalMensual,
    cashout,
    creditoVestuario,
  }
}

const formatCalculatorCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Create Campaign Form Component (Inline)
const CreateCampaignForm = ({ onSuccess }) => {
  const [teamInfo, setTeamInfo] = useState(null)
  const [monthlyAmount, setMonthlyAmount] = useState('3500')
  const [currency, setCurrency] = useState('ARS')
  const [alternativeAmounts, setAlternativeAmounts] = useState([])
  const [teamLogo, setTeamLogo] = useState('')
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('')
  const [teamBio, setTeamBio] = useState('')
  const [tournamentName, setTournamentName] = useState('')
  const [mercadoPagoLink, setMercadoPagoLink] = useState('')
  const [rafflePrizes, setRafflePrizes] = useState([{ id: Date.now(), title: '', description: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [jugadores, setJugadores] = useState(20)
  const [sociosPorJugador, setSociosPorJugador] = useState(7)

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const team = await teamService.getCurrentTeam()
        setTeamInfo(team)
      } catch (err) {
        console.error('Error al cargar el equipo', err)
      }
    }
    loadTeam()
  }, [])

  const indiceCoquita = parseFloat(monthlyAmount) || 0
  const calculatorResults = calculateResults(indiceCoquita, jugadores, sociosPorJugador)

  const filteredAlternativeAmounts = alternativeAmounts
    .filter((item) => item.amount)
    .map((item) => parseFloat(item.amount))

  const filteredPrizes = rafflePrizes
    .filter((item) => item.title || item.description)
    .map((item) => ({
      title: item.title,
      description: item.description,
    }))

  const slugifyTeam = () => {
    if (!teamInfo) return 'tu-equipo'
    const base = (teamInfo.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${base || 'equipo'}-${teamInfo.id || 'demo'}`
  }

  const previewShareLink =
    typeof window !== 'undefined' && teamInfo ? `${window.location.origin}/equipos/${slugifyTeam()}/socios` : ''

  const previewCampaign = {
    team_name: teamInfo?.name,
    team_logo: teamLogo,
    team_photo_url: teamPhotoUrl,
    team_bio: teamBio,
    tournament_name: tournamentName,
    monthly_amount: parseFloat(monthlyAmount) || 0,
    currency,
    mercado_pago_link: mercadoPagoLink,
    raffle_prizes: filteredPrizes,
  }

  const isValidUrl = (value) => {
    if (!value) return false
    try {
      const parsed = new URL(value)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  const handlePublish = async () => {
    if (!teamInfo) {
      setError('Todavía estamos cargando los datos del equipo.')
      return
    }
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) {
      setError('El monto mensual debe ser mayor a 0')
      return
    }
    if (!mercadoPagoLink) {
      setError('Agrega el link de Mercado Pago para cobrar la cuota')
      return
    }
    if (!isValidUrl(mercadoPagoLink)) {
      setError('El link de Mercado Pago no es válido')
      return
    }

    setSaving(true)
    setError('')
    try {
      await campaignService.publishCampaign({
        team_name: teamInfo.name,
        team_logo: teamLogo || null,
        team_bio: teamBio || null,
        tournament_name: tournamentName || null,
        team_photo_url: teamPhotoUrl || null,
        monthly_amount: parseFloat(monthlyAmount),
        currency,
        alternative_amounts: filteredAlternativeAmounts,
        payment_method: 'mercado_pago',
        mercado_pago_link: mercadoPagoLink,
        raffle_prizes: filteredPrizes.length ? filteredPrizes : null,
        status: 'published',
      })
      onSuccess()
    } catch (err) {
      console.error('Error saving campaign:', err)
      setError('No se pudo guardar la campaña. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrizeChange = (id, field, value) => {
    setRafflePrizes((prev) =>
      prev.map((prize) => (prize.id === id ? { ...prize, [field]: value } : prize))
    )
  }

  const handleAddPrize = () => {
    setRafflePrizes((prev) => [...prev, { id: Date.now(), title: '', description: '' }])
  }

  const handleRemovePrize = (id) => {
    setRafflePrizes((prev) => prev.filter((prize) => prize.id !== id))
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Crear Nueva Campaña</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configurá la información que se mostrará en tu landing pública y publicala cuando esté lista.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-900">Identidad del equipo</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del equipo</label>
              <input
                type="text"
                value={teamInfo?.name || 'Cargando...'}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Torneo / Competencia</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Ej: Liga +35 Clausura"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio / descripción del equipo
              </label>
              <textarea
                value={teamBio}
                onChange={(e) => setTeamBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Contá quiénes son, qué sueñan y para qué necesitan la campaña."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escudo / logo (URL)</label>
                <input
                  type="url"
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del equipo (URL)</label>
                <input
                  type="url"
                  value={teamPhotoUrl}
                  onChange={(e) => setTeamPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto de la cuota mensual *
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  min="0"
                  step="100"
                  className="sm:w-48 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="3500"
                  required
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="sm:w-32 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">Valor que aportará cada socio mensualmente</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montos alternativos opcionales
              </label>
              <div className="space-y-2">
                {alternativeAmounts.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        setAlternativeAmounts((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, amount: e.target.value } : i))
                        )
                      }}
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Monto adicional"
                    />
                    <button
                      type="button"
                      onClick={() => setAlternativeAmounts((prev) => prev.filter((i) => i.id !== item.id))}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAlternativeAmounts((prev) => [...prev, { id: Date.now(), amount: '' }])}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Agregar monto alternativo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Mercado Pago *</label>
              <input
                type="url"
                value={mercadoPagoLink}
                onChange={(e) => setMercadoPagoLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://www.mercadopago.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Es el link que usaremos para redirigir a tus socios al momento del cobro.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pago</label>
              <p className="text-xs text-gray-500 mb-3">En esta versión solo habilitamos Mercado Pago.</p>
              <div className="inline-flex items-center">
                <input type="radio" checked readOnly className="mr-2" />
                <span className="px-4 py-2 border border-indigo-500 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                  Mercado Pago
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-semibold text-gray-900">Premios de los sorteos</h4>
                <p className="text-sm text-gray-500">Mostralos en la landing para incentivar a tus socios.</p>
              </div>
              <button
                type="button"
                onClick={handleAddPrize}
                className="text-sm text-indigo-600 font-semibold hover:text-indigo-700"
              >
                + Agregar premio
              </button>
            </div>
            <div className="space-y-3">
              {rafflePrizes.map((prize) => (
                <div key={prize.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Título</label>
                      <input
                        type="text"
                        value={prize.title}
                        onChange={(e) => handlePrizeChange(prize.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Ej: Camiseta Oficial"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={prize.description}
                        onChange={(e) => handlePrizeChange(prize.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Ej: Sorteo mensual entre todos los socios"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => handleRemovePrize(prize.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Quitar premio
                    </button>
                  </div>
                </div>
              ))}
              {rafflePrizes.length === 0 && (
                <p className="text-sm text-gray-500">Aún no agregaste premios. Podés sumarlos más tarde.</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-900">Calculadora de impacto</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de jugadores</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={jugadores}
                  onChange={(e) => setJugadores(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>5</span>
                  <span className="font-semibold text-indigo-600">{jugadores}</span>
                  <span>30</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Socios por jugador</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={sociosPorJugador}
                  onChange={(e) => setSociosPorJugador(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span className="font-semibold text-indigo-600">{sociosPorJugador}</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            {indiceCoquita > 0 && jugadores >= 5 && sociosPorJugador > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs uppercase text-purple-500 font-semibold">Saldo mensual estimado</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCalculatorCurrency(calculatorResults.creditoVestuario)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Ingresos en la billetera +10</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs uppercase text-purple-500 font-semibold">Campaña anual</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCalculatorCurrency(calculatorResults.creditoVestuario * 12)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Saldo total en 12 meses</p>
                </div>
              </div>
            )}
          </section>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Publicando...' : 'Publicar campaña'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Vista previa de la landing</p>
              <p className="text-xs text-gray-500">Así se verá tu link público al compartirlo.</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">
              Live preview
            </span>
          </div>
          <SociosLandingPreview campaign={previewCampaign} shareLink={previewShareLink} variant="embedded" />
        </div>
      </div>
    </div>
  )
}

export default FinanzasSocios
