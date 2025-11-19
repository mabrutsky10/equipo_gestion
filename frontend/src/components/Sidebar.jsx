import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { logout } = useAuth()

  const [openSection, setOpenSection] = useState(null)

  const menuItems = [
    { path: '/dashboard/dashboard', label: 'Dashboard', icon: '📊' },
    {
      label: 'Competencia',
      icon: '🏆',
      children: [
        { path: '/dashboard/competencia/proximo-partido', label: 'Próximo partido' },
        { path: '/dashboard/competencia/ultimos-resultados', label: 'Últimos resultados' },
        { path: '/dashboard/competencia/estadisticas', label: 'Estadísticas' },
      ],
    },
    {
      label: 'Plantel',
      icon: '👥',
      children: [
        { path: '/dashboard/talento/mercado', label: 'Mercado de pases y fichajes' },
        { path: '/dashboard/talento/jugadores', label: 'Jugadores' },
        { path: '/dashboard/talento/comision', label: 'Comisión, managers y profesionales' },
      ],
    },
    {
      label: 'Finanzas',
      icon: (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-green-600 text-green-600 text-sm font-semibold">
          $
        </span>
      ),
      children: [
        { path: '/dashboard/finanzas/caja', label: 'Caja' },
        { path: '/dashboard/finanzas/socios', label: 'Socios' },
        { path: '/dashboard/finanzas/sponsors', label: 'Sponsors' },
        { path: '/dashboard/finanzas/tiendas', label: 'Tiendas' },
      ],
    },
    {
      label: 'Prensa',
      icon: '🗞️',
      children: [
        { path: '/dashboard/comunicaciones/web', label: 'Web del equipo' },
        { path: '/dashboard/comunicaciones/prensa', label: 'Prensa' },
        { path: '/dashboard/comunicaciones/chats', label: 'Chats' },
      ],
    },
    { path: '/dashboard/asistentes', label: 'Asistentes', icon: '🤖' },
    { path: '/dashboard/prensa', label: 'Prensa', icon: '📰', disabled: true },
    { path: '/dashboard/config', label: 'Configuración', icon: '⚙️', disabled: true },
    { path: '/dashboard/debugging', label: 'Debugging', icon: '🐛' },
  ]

  const isActivePath = (path) => location.pathname.startsWith(path)
  useEffect(() => {
    const activeIndex = menuItems.findIndex(
      (item) => item.children && item.children.some((child) => isActivePath(child.path))
    )
    if (activeIndex !== -1) {
      setOpenSection(activeIndex)
    }
  }, [location.pathname])

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Tesorero</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={item.path || item.label}>
              {item.disabled ? (
                <div className="px-4 py-2 text-gray-500 cursor-not-allowed">
                  <span className="mr-2 inline-flex items-center">{item.icon}</span>
                  {item.label}
                </div>
              ) : item.children ? (
                <div>
                  <button
                    onClick={() => setOpenSection(openSection === index ? null : index)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700 ${
                      item.children.some((child) => isActivePath(child.path)) ? 'bg-gray-700' : ''
                    }`}
                  >
                    <span>
                      <span className="mr-2 inline-flex items-center">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-xs">{openSection === index ? '▲' : '▼'}</span>
                  </button>
                  {openSection === index && (
                    <ul className="mt-2 ml-4 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={`block px-3 py-2 rounded text-sm hover:bg-gray-700 ${
                              isActivePath(child.path) ? 'bg-gray-700' : 'text-gray-300'
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                    item.path && isActivePath(item.path) ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="mr-2 inline-flex items-center">{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default Sidebar




