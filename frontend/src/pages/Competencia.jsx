import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import ProximoPartido from './Competencia/ProximoPartido'
import UltimosResultados from './Competencia/UltimosResultados'
import Estadisticas from './Competencia/Estadisticas'

const competenciaSections = [
  {
    key: 'proximo-partido',
    title: 'Próximo partido',
    description: 'Información sobre el próximo encuentro del equipo.',
    element: <ProximoPartido />,
  },
  {
    key: 'ultimos-resultados',
    title: 'Últimos resultados',
    description: 'Historial de partidos y resultados recientes.',
    element: <UltimosResultados />,
  },
  {
    key: 'estadisticas',
    title: 'Estadísticas',
    description: 'Estadísticas y métricas de rendimiento del equipo.',
    element: <Estadisticas />,
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

const CompetenciaHome = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {competenciaSections.map((section) => (
      <SectionCard key={section.key} section={section} />
    ))}
  </div>
)

const Competencia = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Competencia</h1>
        <p className="text-gray-600 mt-1">
          Seguimiento de partidos, resultados y estadísticas del equipo.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {competenciaSections.map((section) => (
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
        <Route path="/" element={<CompetenciaHome />} />
        {competenciaSections.map((section) => (
          <Route key={section.key} path={section.key} element={section.element} />
        ))}
        <Route path="*" element={<Navigate to="proximo-partido" replace />} />
      </Routes>
    </div>
  )
}

export default Competencia

