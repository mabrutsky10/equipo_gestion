import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Campana = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/dashboard/finanzas/socios', { replace: true })
  }, [navigate])

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Campañas de Socios</h2>
        <p className="text-gray-600 mb-6">
          La configuración de campañas ahora vive en la sección Finanzas → Socios. Estamos redirigiéndote allí para que continúes con la gestión desde el nuevo panel.
        </p>
        <Link
          to="/dashboard/finanzas/socios"
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          Ir a Finanzas → Socios
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Si no eres redirigido automáticamente, haz clic en el botón para continuar.
        </p>
      </div>
    </div>
  )
}

export default Campana



