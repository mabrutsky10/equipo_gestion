import { useState, useEffect } from 'react'
import * as dashboardService from '../../services/dashboardService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const DashboardSocios = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    start_date: null,
    end_date: null,
  })

  useEffect(() => {
    loadStats()
  }, [filters])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardService.getStats(filters)
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  if (loading) {
    return <div className="p-8 text-center">Cargando estadísticas...</div>
  }

  if (!stats) {
    return <div className="p-8 text-center text-gray-500">No hay datos disponibles</div>
  }

  // Prepare data for charts
  const monthlyData = Object.entries(stats.monthly_data || {})
    .map(([month, data]) => ({
      month,
      ingresos: data.ingresos,
      egresos: data.egresos,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const ingresosByType = Object.entries(stats.ingresos_by_type || {}).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard Financiero</h2>
        <p className="text-gray-600 mt-1">Resumen financiero del equipo</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Ingresos</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(stats.total_ingresos)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Egresos</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(stats.total_egresos)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Balance Neto</h3>
          <p
            className={`text-2xl font-bold mt-2 ${
              stats.balance_neto >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(stats.balance_neto)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Socios Activos</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats.active_members} / {stats.total_members}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Income/Expenses Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ingresos vs Egresos Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
              <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Income by Type Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Ingresos por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ingresosByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ingresosByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardSocios

