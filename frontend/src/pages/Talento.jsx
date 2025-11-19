import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import TalentoMercado from './TalentoMercado'
import PanelJugadores from './PanelJugadores'

const TalentoComision = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
      Comisión, managers y profesionales
    </h2>
    <p className="text-gray-600">
      Estamos trabajando en esta sección para centralizar el seguimiento de staff, managers y
      profesionales asociados al equipo.
    </p>
  </div>
)

const talentoSections = [
  {
    key: 'mercado',
    title: 'Mercado de pases y fichajes',
    description: 'Publicá búsquedas e invitá jugadores libres a tu equipo.',
    element: <TalentoMercado />,
  },
  {
    key: 'jugadores',
    title: 'Jugadores',
    description: 'Gestión del plantel y seguimiento de los jugadores del club.',
    element: <PanelJugadores />,
  },
  {
    key: 'comision',
    title: 'Comisión, managers y profesionales',
    description: 'Listado de staff, comisión directiva y profesionales externos.',
    element: <TalentoComision />,
  },
]

const SectionCard = ({ section }) => (
  <NavLink
    to={section.key}
    className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow block"
  >
    <div className="text-lg font-semibold text-gray-900 mb-1">{section.title}</div>
    <p className="text-sm text-gray-500 mb-3">{section.description}</p>
    <div className="text-sm text-green-600 font-semibold">Ver sección →</div>
  </NavLink>
)

const TalentoHome = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {talentoSections.map((section) => (
      <SectionCard key={section.key} section={section} />
    ))}
  </div>
)

const Talento = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Talento</h1>
        <p className="text-gray-600 mt-1">
          Administración centralizada de mercado, jugadores y staff del club.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {talentoSections.map((section) => (
          <NavLink
            key={section.key}
            to={section.key}
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`
            }
          >
            {section.title}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route path="/" element={<TalentoHome />} />
        {talentoSections.map((section) => (
          <Route key={section.key} path={section.key} element={section.element} />
        ))}
        <Route path="*" element={<Navigate to="mercado" replace />} />
      </Routes>
    </div>
  )
}

export default Talento

