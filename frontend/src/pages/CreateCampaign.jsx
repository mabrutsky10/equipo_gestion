import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teamService } from '../services/teamService'
import { campaignService } from '../services/campaignService'
import emptyLogo from '../assets/images/empty-states/empty-logo.svg'

const CreateCampaign = () => {
  const navigate = useNavigate()
  
  // Team identity data
  const [teamName, setTeamName] = useState('')
  const [teamLogo, setTeamLogo] = useState(null)
  const [teamLogoPreview, setTeamLogoPreview] = useState(null)
  const [teamBio, setTeamBio] = useState('')
  
  // Campaign configuration
  const [monthlyAmount, setMonthlyAmount] = useState('3500')
  const [currency, setCurrency] = useState('ARS')
  const [alternativeAmounts, setAlternativeAmounts] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('mercado_pago')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teamLoading, setTeamLoading] = useState(true)
  const [showCalculatorPopup, setShowCalculatorPopup] = useState(false)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      setTeamLoading(true)
      const team = await teamService.getCurrentTeam()
      setTeamName(team.name || '')
      setCurrency(team.currency_default || 'ARS')
      
      // Try to load existing campaign
      try {
        const existingCampaign = await campaignService.getCurrentCampaign()
        if (existingCampaign) {
          setTeamName(existingCampaign.team_name || team.name || '')
          setTeamLogoPreview(existingCampaign.team_logo || null)
          setTeamBio(existingCampaign.team_bio || '')
          setMonthlyAmount(existingCampaign.monthly_amount?.toString() || '3500')
          setCurrency(existingCampaign.currency || 'ARS')
          if (existingCampaign.alternative_amounts && existingCampaign.alternative_amounts.length > 0) {
            setAlternativeAmounts(
              existingCampaign.alternative_amounts.map((amt, idx) => ({
                id: Date.now() + idx,
                amount: amt.toString()
              }))
            )
          }
          setPaymentMethod(existingCampaign.payment_method || 'mercado_pago')
        }
      } catch (campaignError) {
        // No existing campaign, that's fine
        console.log('No existing campaign found')
      }
    } catch (error) {
      console.error('Error loading team data:', error)
      setError('Error al cargar los datos del equipo')
    } finally {
      setTeamLoading(false)
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El logo no puede ser mayor a 5MB')
        return
      }
      setTeamLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddAlternativeAmount = () => {
    setAlternativeAmounts([...alternativeAmounts, { id: Date.now(), amount: '' }])
  }

  const handleRemoveAlternativeAmount = (id) => {
    setAlternativeAmounts(alternativeAmounts.filter(item => item.id !== id))
  }

  const handleAlternativeAmountChange = (id, value) => {
    setAlternativeAmounts(
      alternativeAmounts.map(item =>
        item.id === id ? { ...item, amount: value } : item
      )
    )
  }

  const validateForm = () => {
    if (!teamName.trim()) {
      setError('El nombre del equipo es requerido')
      return false
    }
    if (!monthlyAmount || parseFloat(monthlyAmount) < 3500) {
      setError('El monto mensual debe ser mayor o igual a 3500')
      return false
    }
    if (alternativeAmounts.some(item => item.amount && parseFloat(item.amount) <= 0)) {
      setError('Los montos alternativos deben ser mayores a 0')
      return false
    }
    return true
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const campaignData = {
        team_name: teamName,
        team_logo: teamLogoPreview, // For now, we'll store as base64. In production, upload to storage
        team_bio: teamBio,
        monthly_amount: parseFloat(monthlyAmount),
        currency,
        alternative_amounts: alternativeAmounts
          .filter(item => item.amount)
          .map(item => parseFloat(item.amount)),
        payment_method: paymentMethod,
        status: 'draft'
      }

      await campaignService.saveDraft(campaignData)
      
      // Show success message (could use a toast library)
      alert('Borrador guardado exitosamente')
    } catch (error) {
      console.error('Error saving draft:', error)
      setError('Error al guardar el borrador. Por favor, intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishCampaign = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const campaignData = {
        team_name: teamName,
        team_logo: teamLogoPreview,
        team_bio: teamBio,
        monthly_amount: parseFloat(monthlyAmount),
        currency,
        alternative_amounts: alternativeAmounts
          .filter(item => item.amount)
          .map(item => parseFloat(item.amount)),
        payment_method: paymentMethod,
        status: 'published'
      }

      await campaignService.publishCampaign(campaignData)
      
      // Show success message and redirect
      alert('Campaña publicada exitosamente')
      navigate('/dashboard/panel-socios')
    } catch (error) {
      console.error('Error publishing campaign:', error)
      setError('Error al publicar la campaña. Por favor, intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  if (teamLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando datos del equipo...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Creación de Campaña de Socios</h1>
        <p className="text-gray-600 mt-2">Configura la campaña de cuota social para tu equipo</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Team Identity Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Identidad del Equipo</h2>
        
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo del Equipo
            </label>
            <div className="flex items-center space-x-4">
              {teamLogoPreview ? (
                <img
                  src={teamLogoPreview}
                  alt="Team logo preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 overflow-hidden">
                  <img 
                    src={emptyLogo} 
                    alt="Sin logo" 
                    className="w-full h-full object-contain opacity-50"
                  />
                </div>
              )}
              <div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    {teamLogoPreview ? 'Cambiar logo' : 'Subir logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG o GIF. Máximo 5MB</p>
              </div>
            </div>
          </div>

          {/* Team Name */}
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nombre del equipo"
              required
            />
          </div>

          {/* Team Bio */}
          <div>
            <label htmlFor="teamBio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio / Descripción del Equipo
            </label>
            <textarea
              id="teamBio"
              value={teamBio}
              onChange={(e) => setTeamBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Breve descripción del equipo..."
            />
          </div>
        </div>
      </div>

      {/* Campaign Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de la Campaña de Socios</h2>
        
        <div className="space-y-6">
          {/* Monthly Amount */}
          <div>
            <label htmlFor="monthlyAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Monto de la Cuota Mensual *
            </label>
            <div className="flex space-x-4">
              <div className="w-32">
                <input
                  type="number"
                  id="monthlyAmount"
                  value={monthlyAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow integers (no decimals)
                    if (value === '' || /^\d+$/.test(value)) {
                      setMonthlyAmount(value)
                    }
                  }}
                  min="3500"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="3500"
                  required
                />
              </div>
              <div className="w-32">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-600">Cuota social mínima: 3500.</span>
              <button
                type="button"
                onClick={() => setShowCalculatorPopup(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 underline"
              >
                Calculadora Recaudadora
              </button>
            </div>
          </div>

          {/* Alternative Amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montos Alternativos Opcionales
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Puedes agregar montos adicionales que los socios pueden elegir (ej: +10%, +20%)
            </p>
            <div className="space-y-2">
              {alternativeAmounts.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow integers (no decimals)
                      if (value === '' || /^\d+$/.test(value)) {
                        handleAlternativeAmountChange(item.id, value)
                      }
                    }}
                    min="0"
                    step="100"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Monto adicional"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAlternativeAmount(item.id)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAlternativeAmount}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Agregar monto alternativo
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pago
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mercado_pago"
                  checked={paymentMethod === 'mercado_pago'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="px-4 py-2 border border-indigo-500 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                  Mercado Pago
                </span>
              </label>
              {/* Future payment methods can be added here */}
              {/* 
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 font-medium">
                  Stripe
                </span>
              </label>
              */}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Mercado Pago está seleccionado por defecto. Otras opciones estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || loading}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button
          type="button"
          onClick={handlePublishCampaign}
          disabled={saving || loading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Publicando...' : 'Publicar campaña'}
        </button>
      </div>

      {/* Calculator Popup */}
      {showCalculatorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Calculadora Recaudadora</h3>
              <button
                onClick={() => setShowCalculatorPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="text-center py-4">
              <p className="text-gray-700">Próximamente</p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowCalculatorPopup(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateCampaign

