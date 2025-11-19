import { useState, useEffect } from 'react'
import { campaignService } from '../../services/campaignService'

const FinanzasSponsors = () => {
  const [campaignAccess, setCampaignAccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Check campaign access (includes level_id)
      const access = await campaignService.checkCampaignAccess()
      setCampaignAccess(access)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Skeleton Loading Component
  const SponsorsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
  )

  if (loading) {
    return <SponsorsSkeleton />
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Sponsors Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {campaignAccess?.can_create_campaign ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No hay sponsors activos
            </h2>
            <p className="text-gray-600 mb-4">
              Tu equipo está en nivel {campaignAccess.level_id} y puede activar sponsors.
            </p>
            <button
              onClick={() => {
                // TODO: Implementar funcionalidad de crear sponsor
                console.log('Crear sponsor')
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Activar Sponsors
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Nivel Insuficiente
            </h2>
            <p className="text-yellow-800">
              {campaignAccess?.message ? campaignAccess.message.replace('campaña de socios', 'sponsors') : 'Necesitas nivel 1 para activar sponsors'}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Tu equipo está en nivel {campaignAccess?.level_id || 0}. Debes completar la identidad mínima del equipo para subir a nivel 1.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FinanzasSponsors

