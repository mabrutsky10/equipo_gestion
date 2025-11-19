import { useMemo, useState } from 'react'
import {
  Plus,
  MapPin,
  Clock,
  Shield,
  Users,
  Filter,
  X,
} from 'lucide-react'

const POSICIONES = ['Arquero', 'Defensor', 'Volante', 'Delantero']
const NIVELES = ['Recreativo', 'Amateur', 'Competitivo']
const DISPONIBILIDAD = ['Lunes a Viernes', 'Fines de Semana', 'Noches']
const ZONAS = ['Zona Norte', 'Zona Oeste', 'Zona Sur', 'Córdoba Capital']

const mockBusquedas = [
  {
    id: 1,
    posicion: 'Defensor central',
    nivel: 'Amateur',
    zona: 'Zona Norte (Avellaneda / Vicente López)',
    disponibilidad: 'Miércoles 21 hs',
    estado: 'Activa',
    notas: 'Buscamos un 2 con buen juego aéreo.',
  },
  {
    id: 2,
    posicion: 'Delantero 9',
    nivel: 'Competitivo',
    zona: 'Zona Oeste (Haedo / Ramos Mejía)',
    disponibilidad: 'Domingos 10 hs',
    estado: 'Pausada',
    notas: 'Ideal que juegue de espaldas y pivotee.',
  },
]

const mockJugadores = [
  {
    id: 1,
    nombre: 'Matías Ignacio Borgarello',
    edad: 33,
    username: '@chati777',
    avatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=200&h=200&q=80',
    posicion: 'DEF',
    nivel: 'Competitivo',
    disponibilidad: 'Miércoles • Noches',
    zona: 'Córdoba, Córdoba, Argentina',
    descripcion: 'Juego de central o lateral derecho. Busco zona Argüello o cercana.',
  },
  {
    id: 2,
    nombre: 'Luis Pereira',
    edad: 28,
    username: '@luiper10',
    avatar: null,
    posicion: 'VOL',
    nivel: 'Amateur',
    disponibilidad: 'Lunes / Martes',
    zona: 'Recoleta, CABA',
    descripcion: 'Mediocentro creativo, prioridad por partidos nocturnos.',
  },
  {
    id: 3,
    nombre: 'Sebastián Ramírez',
    edad: 24,
    username: '@ramirez24',
    avatar:
      'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=facearea&w=200&h=200&q=80',
    posicion: 'DEL',
    nivel: 'Recreativo',
    disponibilidad: 'Sábados tarde',
    zona: 'Lanús, Buenos Aires',
    descripcion: 'Extremo zurdo con llegada al gol, busco equipo en zona sur.',
  },
]

const MercadoDePasesPage = () => {
  const [busquedas, setBusquedas] = useState(mockBusquedas)
  const [jugadores] = useState(mockJugadores)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    posicion: '',
    nivel: '',
    zona: '',
    disponibilidad: '',
  })

  const filteredJugadores = useMemo(() => {
    return jugadores.filter((jugador) => {
      if (filters.posicion && jugador.posicion !== filters.posicion) return false
      if (filters.nivel && jugador.nivel !== filters.nivel) return false
      if (filters.zona && !jugador.zona.toLowerCase().includes(filters.zona.toLowerCase()))
        return false
      if (
        filters.disponibilidad &&
        !jugador.disponibilidad.toLowerCase().includes(filters.disponibilidad.toLowerCase())
      )
        return false
      return true
    })
  }, [jugadores, filters])

  const handleCrearBusqueda = (data) => {
    setBusquedas((prev) => [
      { id: prev.length + 1, estado: 'Activa', ...data },
      ...prev,
    ])
    setIsModalOpen(false)
  }

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Mercado de Pases</h1>
          <p className="text-gray-600">
            Buscá jugadores o encontrá futbolistas libres en tu zona.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl shadow-sm hover:bg-green-700 transition"
        >
          <Plus size={18} />
          Crear Búsqueda
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl(font-semibold text-gray-900">Mis Búsquedas</h2>
            <p className="text-sm text-gray-500">Publicaciones activas que ven los jugadores.</p>
          </div>
        </div>

        {busquedas.length === 0 ? (
          <EmptyState
            title="Todavía no publicaste búsquedas"
            description="Publicá qué perfil de jugador necesitás para que los futbolistas de +10 se postulen."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {busquedas.map((busqueda) => (
              <BusquedaCard
                key={busqueda.id}
                data={busqueda}
                onPause={() =>
                  setBusquedas((prev) =>
                    prev.map((item) =>
                      item.id === busqueda.id
                        ? { ...item, estado: item.estado === 'Activa' ? 'Pausada' : 'Activa' }
                        : item
                    )
                  )
                }
                onDelete={() =>
                  setBusquedas((prev) => prev.filter((item) => item.id !== busqueda.id))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Jugadores Libres</h2>
              <p className="text-sm text-gray-500">
                Conectá con futbolistas libres que quieren sumarse a un equipo.
              </p>
            </div>
          </div>
          <FiltrosJugadores filters={filters} onChange={setFilters} />
        </div>

        {filteredJugadores.length === 0 ? (
          <EmptyState
            title="No encontramos jugadores con esos filtros"
            description="Probá ajustando la búsqueda o ampliando el radio."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJugadores.map((jugador) => (
              <JugadorLibreCard key={jugador.id} data={jugador} />
            ))}
          </div>
        )}
      </section>

      <CrearBusquedaModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCrearBusqueda}
      />
    </div>
  )
}

const BusquedaCard = ({ data, onPause, onDelete }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col space-y-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{data.posicion}</h3>
        <p className="text-sm text-gray-500">{data.nivel}</p>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full ${
          data.estado === 'Activa'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {data.estado}
      </span>
    </div>

    <div className="space-y-2 text-sm text-gray-700">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-gray-400" />
        <span>{data.zona}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gray-400" />
        <span>{data.disponibilidad}</span>
      </div>
      <p className="text-gray-500 text-sm border-t border-gray-100 pt-3">{data.notas}</p>
    </div>

    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onPause}
        className="flex-1 bg-indigo-50 text-indigo-700 text-sm font-semibold py-2 rounded-xl hover:bg-indigo-100"
      >
        {data.estado === 'Activa' ? 'Pausar' : 'Reactivar'}
      </button>
      <button className="flex-1 border border-gray-200 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50">
        Editar
      </button>
      <button
        onClick={onDelete}
        className="flex-1 text-sm font-semibold text-red-500 hover:text-red-600"
      >
        Eliminar
      </button>
    </div>
  </div>
)

const JugadorLibreCard = ({ data }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <img
        src={
          data.avatar ||
          `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(
            data.nombre
          )}`
        }
        alt={data.nombre}
        className="w-16 h-16 rounded-full object-cover border border-gray-200"
      />
      <div>
        <div className="text-lg font-semibold text-gray-900">{data.nombre}</div>
        <div className="text-sm text-gray-500">{data.username}</div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 text-xs">
      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
        <Shield size={12} className="inline mr-1" />
        {data.posicion}
      </span>
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
        {data.nivel}
      </span>
      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
        <Clock size={12} />
        {data.disponibilidad}
      </span>
    </div>

    <div className="flex items-center gap-2 text-sm text-gray-600">
      <MapPin size={16} className="text-gray-400" />
      {data.zona}
    </div>

    <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{data.descripcion}</p>

    <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
      <button className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-xl shadow-sm hover:bg-green-700">
        Invitar
      </button>
      <button className="flex-1 border border-gray-200 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50">
        Ver Perfil
      </button>
      <button className="flex-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        Contactar
      </button>
    </div>
  </div>
)

const FiltrosJugadores = ({ filters, onChange }) => {
  const handleFilter = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm uppercase tracking-wide">
        <Filter size={16} />
        Filtros
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        <SelectField
          label="Posición"
          value={filters.posicion}
          options={['', ...POSICIONES]}
          onChange={(value) => handleFilter('posicion', value)}
        />
        <SelectField
          label="Nivel"
          value={filters.nivel}
          options={['', ...NIVELES]}
          onChange={(value) => handleFilter('nivel', value)}
        />
        <SelectField
          label="Zona"
          value={filters.zona}
          options={['', ...ZONAS]}
          onChange={(value) => handleFilter('zona', value)}
        />
        <SelectField
          label="Disponibilidad"
          value={filters.disponibilidad}
          options={['', ...DISPONIBILIDAD]}
          onChange={(value) => handleFilter('disponibilidad', value)}
        />
      </div>
    </div>
  )
}

const SelectField = ({ label, value, options, onChange }) => (
  <label className="text-sm font-medium text-gray-700 space-y-1">
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      {options.map((option) => (
        <option key={option || 'all'} value={option}>
          {option || 'Todos'}
        </option>
      ))}
    </select>
  </label>
)

const EmptyState = ({ title, description }) => (
  <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center gap-3 bg-gray-50/40">
    <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center text-3xl">
      📝
    </div>
    <div className="text-lg font-semibold text-gray-800">{title}</div>
    <p className="text-sm text-gray-500 max-w-md">{description}</p>
  </div>
)

const CrearBusquedaModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    posicion: '',
    nivel: '',
    disponibilidad: '',
    zona: '',
    notas: '',
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
    setForm({
      posicion: '',
      nivel: '',
      disponibilidad: '',
      zona: '',
      notas: '',
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Crear Búsqueda</h3>
            <p className="text-sm text-gray-500">
              Publicá qué tipo de jugador necesitás para tu plantel.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Posición"
              value={form.posicion}
              options={POSICIONES}
              onChange={(value) => handleChange('posicion', value)}
            />
            <SelectField
              label="Nivel"
              value={form.nivel}
              options={NIVELES}
              onChange={(value) => handleChange('nivel', value)}
            />
            <label className="text-sm font-medium text-gray-700 space-y-1">
              <span>Día y horario</span>
              <input
                type="text"
                value={form.disponibilidad}
                onChange={(e) => handleChange('disponibilidad', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Ej: Miércoles 21 hs"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 space-y-1">
              <span>Zona / Radio</span>
              <input
                type="text"
                value={form.zona}
                onChange={(e) => handleChange('zona', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Ej: Zona Norte (Olivos / Martínez)"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700 space-y-1">
            <span>Notas adicionales</span>
            <textarea
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Agregá detalles específicos del perfil que necesitás…"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-green-700"
            >
              Publicar búsqueda
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MercadoDePasesPage
export {
  MercadoDePasesPage,
  BusquedaCard,
  JugadorLibreCard,
  CrearBusquedaModal,
  FiltrosJugadores,
  EmptyState,
}

