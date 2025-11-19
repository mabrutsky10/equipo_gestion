import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import CuentaCorriente from '../components/Finanzas/CuentaCorriente'
import Caja from '../components/Finanzas/Caja'
import FinanzasSocios from '../components/Finanzas/Socios'
import FinanzasSponsors from '../components/Finanzas/Sponsors'

const financeSections = [
  {
    key: 'caja',
    title: 'Caja',
    description: 'Resumen del flujo de ingresos y egresos.',
    details: [
      { label: 'Saldo disponible', value: '$0' },
      { label: 'Ingresos del mes', value: '$0' },
      { label: 'Egresos del mes', value: '$0' },
    ],
    component: <Caja />,
    hasSubmenu: true,
    submenuItems: [
      { key: 'socio', label: 'Socio' },
      { key: 'patrocinador', label: 'Patrocinador' },
    ],
  },
  {
    key: 'socios',
    title: 'Socios',
    description: 'Estado actual de los socios al día.',
    details: [
      { label: 'Socios', value: '0' },
      { label: 'Socios con deuda', value: '0' },
      { label: 'Cuotas del mes', value: '$0' },
    ],
    component: <FinanzasSocios />,
  },
  {
    key: 'sponsors',
    title: 'Sponsors',
    description: 'Seguimiento de acuerdos comerciales y patrocinios.',
    details: [
      { label: 'Sponsors', value: '0' },
      { label: 'Campañas vigentes', value: '0' },
      { label: 'Ingresos por sponsors', value: '$0' },
    ],
    component: <FinanzasSponsors />,
  },
  {
    key: 'tiendas',
    title: 'Tiendas',
    description: 'Integraciones con tiendas y productos oficiales.',
    details: [
      { label: 'Tiendas conectadas', value: '0' },
      { label: 'Productos activos', value: '0' },
      { label: 'Ventas del mes', value: '$0' },
    ],
  },
]

const SectionCard = ({ section }) => (
  <NavLink
    to={section.key}
    className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow block"
  >
    <div className="text-lg font-semibold text-gray-900 mb-1">{section.title}</div>
    <p className="text-sm text-gray-500 mb-4">{section.description}</p>
    <div className="text-sm text-green-600 font-medium">Ver sección →</div>
  </NavLink>
)

const SectionDetail = ({ section }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
    <div className="mb-4">
      <div className="text-2xl font-semibold text-gray-900">{section.title}</div>
      <p className="text-gray-600 mt-1">{section.description}</p>
    </div>
    <div className="space-y-3">
      {section.details.map((item) => (
        <div key={item.label} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
          <span className="text-sm text-gray-500">{item.label}</span>
          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
)

const FinanzasHome = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {financeSections.map((section) => (
      <SectionCard key={section.key} section={section} />
    ))}
  </div>
)

const Finanzas = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-gray-600 mt-1">
          Administración centralizada de caja, socios, sponsors y tiendas.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {financeSections.map((section) => (
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
        <Route path="/" element={<FinanzasHome />} />
        {financeSections.map((section) => (
          <Route
            key={section.key}
            path={section.key}
            element={section.component || <SectionDetail section={section} />}
          />
        ))}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  )
}

export default Finanzas

