import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HomeTemp = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth/login')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">+10 Gestión</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Bienvenido al panel</h1>
          <p className="text-gray-600 mt-2">
            Esta es una pantalla temporal mientras terminamos de configurar tu equipo.
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-6 text-left space-y-3">
          <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Tu sesión</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Usuario</p>
            <p className="text-base text-gray-900 font-medium">
              {user?.attributes?.email || user?.username || 'Usuario autenticado'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Estado</p>
            <p className="text-base text-gray-900 font-medium">Autenticado con AWS Cognito</p>
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl p-6 text-left">
          <p className="text-sm text-gray-600">
            Desde aquí podés acceder al panel completo cuando lo necesites. Los datos que ves a
            continuación no dependen de ningún equipo, por lo que es seguro permanecer en esta vista.
          </p>
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={handleGoToDashboard}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Ir al Dashboard completo
          </button>
          <button
            onClick={() => navigate('/debug')}
            className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-colors"
          >
            Debug
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomeTemp

