import { useMemo, useState } from 'react'
import defaultLogo from '../../assets/images/placeholders/default-team-logo.svg'
import defaultPhoto from '../../assets/images/placeholders/team-photo-silhouette.svg'

const defaultPrizes = [
  {
    title: 'Camiseta oficial',
    description: 'Sorteamos camisetas originales de clubes argentinos',
  },
  {
    title: 'Experiencia VIP',
    description: 'Viví un partido con tus ídolos desde el campo de juego',
  },
  {
    title: 'Premios sorpresa',
    description: 'Merchandising exclusivo y acceso a entrenamientos',
  },
]

const formatCurrency = (amount, currency = 'ARS') => {
  if (amount === null || amount === undefined) return '-'
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount)
  if (Number.isNaN(numeric)) {
    return '-'
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric)
}

const SociosLandingPreview = ({ campaign = {}, shareLink = '', variant = 'embedded' }) => {
  const [copied, setCopied] = useState(false)
  const currentShareLink =
    shareLink || (typeof window !== 'undefined' ? `${window.location.origin}/socios` : '')

  const teamLogo = campaign.team_logo || defaultLogo
  const teamPhoto = campaign.team_photo_url || defaultPhoto
  const rafflePrizes =
    campaign?.raffle_prizes && campaign.raffle_prizes.length > 0 ? campaign.raffle_prizes : defaultPrizes
  const mercadoPagoLink = campaign?.mercado_pago_link || ''

  const containerClass =
    variant === 'page'
      ? 'min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8'
      : 'bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 p-4 md:p-6'

  const innerClass = variant === 'page' ? 'max-w-6xl mx-auto space-y-8' : 'space-y-6'

  const shareLabel = useMemo(() => {
    if (!currentShareLink) return 'Aún sin link público'
    if (currentShareLink.length > 45) {
      return `${currentShareLink.slice(0, 45)}...`
    }
    return currentShareLink
  }, [currentShareLink])

  const handleCopy = async () => {
    if (!currentShareLink) return
    try {
      await navigator.clipboard.writeText(currentShareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('No se pudo copiar el link', err)
    }
  }

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {variant === 'page' && (
          <div className="text-center space-y-2">
            <p className="text-sm uppercase tracking-widest text-indigo-500 font-semibold">Campaña de Socios</p>
            <h1 className="text-4xl font-black text-slate-900">{campaign.team_name || 'Tu Club +10'}</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Activá la comunidad de tu equipo y financiá la temporada con cuotas sociales, sorteos y experiencias
              exclusivas para tu gente.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                <img src={teamLogo} alt="Escudo del equipo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Equipo oficial</p>
                <h2 className="text-2xl font-bold text-slate-900">{campaign.team_name || 'Nombre del equipo'}</h2>
                {campaign.tournament_name && (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-1">
                    Torneo {campaign.tournament_name}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-slate-700">
              <p className="text-sm font-semibold text-indigo-600 mb-1">Bio / Descripción</p>
              <p className="text-base">
                {campaign.team_bio || 'Contá quiénes son, su historia y por qué necesitan el apoyo de su gente.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <p className="text-sm text-slate-500">Cuota mensual</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(campaign.monthly_amount, campaign.currency)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Incluye acceso a sorteos y experiencias +10</p>
              </div>
              <div className="rounded-2xl border border-green-200 p-4 bg-green-50">
                <p className="text-sm text-green-600 font-semibold">Nivel 1 · Identidad Profesional</p>
                <p className="text-slate-800 mt-1 text-sm">
                  Puede activar socios, recibir pagos y sumar premios oficiales.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Link de Mercado Pago</p>
                  <p className="text-sm text-slate-500">Comparte este link para cobrar la cuota</p>
                </div>
                <a
                  href={mercadoPagoLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    mercadoPagoLink
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Ir al pago
                </a>
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3">
                <div className="truncate">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Landing pública</p>
                  <p className="font-medium text-slate-800 truncate">{shareLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 text-xs font-semibold rounded-full border border-slate-200 hover:bg-slate-100"
                  disabled={!currentShareLink}
                >
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="font-bold text-lg">🎁</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/70">Sorteos mensuales</p>
                  <h3 className="text-2xl font-bold">Premios para tu comunidad</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rafflePrizes.map((prize, index) => (
                  <div key={`${prize.title}-${index}`} className="bg-white/5 rounded-2xl p-4 space-y-1">
                    <p className="font-semibold">{prize.title}</p>
                    <p className="text-sm text-white/80">{prize.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative h-full">
              <img
                src={teamPhoto}
                alt="Foto del equipo"
                className="w-full h-full object-cover rounded-3xl border border-slate-200 shadow-md"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60">
                <p className="text-xs uppercase tracking-wide text-slate-500">Hacete socio +10</p>
                <p className="text-xl font-bold text-slate-900 mb-2">
                  Apoyá a {campaign.team_name || 'tu equipo'} con una cuota mensual
                </p>
                <a
                  href={mercadoPagoLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold rounded-xl ${
                    mercadoPagoLink ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {mercadoPagoLink ? 'Ir al formulario de pago' : 'Configura el link de pago'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SociosLandingPreview

