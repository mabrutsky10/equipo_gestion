import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SociosLandingPreview from '../components/SociosLanding/SociosLandingPreview'
import { campaignService } from '../services/campaignService'

const PublicSociosLanding = () => {
  const { slug } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await campaignService.getPublicCampaignBySlug(slug)
        setCampaign(data)
      } catch (err) {
        console.error('Error fetching public campaign', err)
        setError('No encontramos la campaña de socios de este equipo.')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCampaign()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando campaña...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Campaña no disponible</h1>
          <p className="text-slate-600">{error || 'Este equipo aún no publicó su campaña de socios.'}</p>
        </div>
      </div>
    )
  }

  const publicSlug = campaign.landing_slug || slug
  const shareLink =
    typeof window !== 'undefined' ? `${window.location.origin}/equipos/${publicSlug}/socios` : ''

  return <SociosLandingPreview campaign={campaign} shareLink={shareLink} variant="page" />
}

export default PublicSociosLanding

