import { useState, useEffect, useMemo } from 'react'
import { movementService } from '../../services/movementService'
import emptyMovements from '../../assets/images/empty-states/empty-movements.svg'

const incomeTypes = new Set(['cuota', 'colecta', 'aporte', 'sponsor'])

const CuentaCorriente = () => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    start_date: null,
    end_date: null,
    tipo: '',
    estado: '',
  })
  const [viewMode, setViewMode] = useState('split')
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'manual',
  })
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false)

  useEffect(() => {
    loadMovements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.start_date, filters.end_date, filters.tipo, filters.estado])

  const loadMovements = async () => {
    try {
      setLoading(true)
      const data = await movementService.getMovements(filters)
      setMovements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading movements:', error)
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return

    try {
      setSubmittingExpense(true)
      const amount = parseFloat(newExpense.amount)
      await movementService.createMovement({
        fecha: newExpense.date,
        tipo: 'cashout',
        monto_bruto: amount,
        monto_fee: 0,
        monto_neto: amount,
        moneda: 'ARS',
        metodo_pago: newExpense.method,
        origen_tipo: 'manual',
        origen_id: null,
        estado: 'confirmed',
        description: newExpense.description || 'Egreso manual',
        payment_provider: 'manual',
      })
      setNewExpense({
        description: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        method: 'manual',
      })
      setExpenseModalOpen(false)
      await loadMovements()
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('No se pudo registrar el egreso.')
    } finally {
      setSubmittingExpense(false)
    }
  }

  const formatCurrency = (amount, currency = 'ARS') =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-AR')

  const getTipoLabel = (tipo) => {
    const labels = {
      cuota: 'Cuota',
      colecta: 'Colecta',
      aporte: 'Aporte',
      sponsor: 'Sponsor',
      fee: 'Fee',
      cashout: 'Cashout',
    }
    return labels[tipo] || tipo
  }

  const summary = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonth = previousMonthDate.getMonth()
    const previousYear = previousMonthDate.getFullYear()

    let currentBalance = 0
    let previousBalance = 0
    let currentIncome = 0
    let currentExpenses = 0

    movements.forEach((movement) => {
      const date = new Date(movement.fecha)
      const amount = movement.monto_neto
      const isIncome = incomeTypes.has(movement.tipo) || amount > 0
      const signedAmount = isIncome ? amount : -amount

      if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
        currentBalance += signedAmount
        if (isIncome) currentIncome += amount
        else currentExpenses += amount
      } else if (date.getFullYear() === previousYear && date.getMonth() === previousMonth) {
        previousBalance += signedAmount
      }
    })

    return {
      currentBalance,
      previousBalance,
      currentIncome,
      currentExpenses,
    }
  }, [movements])

  const incomes = movements.filter((movement) => incomeTypes.has(movement.tipo))
  const expenses = movements.filter((movement) => !incomeTypes.has(movement.tipo))

  return (
    <div>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Saldo actual</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.currentBalance)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ingresos del mes:{' '}
            <span className="text-green-600 font-semibold">
              {formatCurrency(summary.currentIncome)}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Egresos del mes:{' '}
            <span className="text-red-600 font-semibold">
              {formatCurrency(summary.currentExpenses)}
            </span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Saldo mes anterior</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.previousBalance)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Balance comparado:{' '}
            <span
              className={
                summary.currentBalance >= summary.previousBalance
                  ? 'text-green-600 font-semibold'
                  : 'text-red-600 font-semibold'
              }
            >
              {formatCurrency(summary.currentBalance - summary.previousBalance)}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DateField
            label="Fecha desde"
            value={filters.start_date}
            onChange={(value) => setFilters({ ...filters, start_date: value })}
          />
          <DateField
            label="Fecha hasta"
            value={filters.end_date}
            onChange={(value) => setFilters({ ...filters, end_date: value })}
          />
          <SelectField
            label="Tipo"
            value={filters.tipo}
            options={[
              { value: '', label: 'Todos' },
              { value: 'cuota', label: 'Cuota' },
              { value: 'colecta', label: 'Colecta' },
              { value: 'aporte', label: 'Aporte' },
              { value: 'sponsor', label: 'Sponsor' },
              { value: 'fee', label: 'Fee' },
              { value: 'cashout', label: 'Cashout' },
            ]}
            onChange={(value) => setFilters({ ...filters, tipo: value })}
          />
          <SelectField
            label="Estado"
            value={filters.estado}
            options={[
              { value: '', label: 'Todos' },
              { value: 'confirmed', label: 'Confirmado' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
            onChange={(value) => setFilters({ ...filters, estado: value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          {[
            { key: 'split', label: 'Ingresos vs. Egresos' },
            { key: 'list', label: 'Cuenta Corriente' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setViewMode(option.key)}
              className={`px-4 py-1 text-sm font-medium rounded-full ${
                viewMode === option.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpenseModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors"
        >
          Registrar gasto
        </button>
      </div>

      {viewMode === 'split' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
            <ColumnList
              title="Ingresos"
              color="green"
              items={incomes}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              getTipoLabel={getTipoLabel}
            />
            <div className="flex flex-col gap-4">
                  <ColumnList
                    title="Egresos (Gastos)"
                    color="red"
                    items={expenses}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getTipoLabel={getTipoLabel}
                    action={
                      <button
                        type="button"
                        onClick={() => setExpenseModalOpen(true)}
                        className="text-sm font-semibold text-green-600 hover:text-green-700"
                      >
                        Registrar gasto
                      </button>
                    }
                  />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Cargando movimientos...</div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center">
              <img
                src={emptyMovements}
                alt="Sin movimientos"
                className="mx-auto mb-4 max-w-xs opacity-50"
              />
              <p className="text-gray-500">No hay movimientos para mostrar</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Tipo', 'Origen', 'Monto Neto', 'Método', 'Estado'].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        header === 'Monto Neto' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => {
                  const isNegative = !incomeTypes.has(movement.tipo)
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(movement.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTipoLabel(movement.tipo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.origen_tipo} {movement.origen_id || ''}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          isNegative ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {isNegative ? '-' : '+'}
                        {formatCurrency(movement.monto_neto, movement.moneda)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.metodo_pago}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            movement.estado === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : movement.estado === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {movement.estado}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      <ExpenseModal
        open={isExpenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        submittingExpense={submittingExpense}
        handleAddExpense={handleAddExpense}
      />
    </div>
  )
}

const DateField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    />
  </div>
)

const SelectField = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

const ColumnList = ({ title, color, items, formatDate, formatCurrency, getTipoLabel, action }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            color === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {items.length}
        </span>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    <div className="space-y-3 max-h-[450px] overflow-auto pr-1">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Sin registros</p>
      ) : (
        items.map((movement) => (
          <div
            key={movement.id}
            className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{getTipoLabel(movement.tipo)}</p>
              <p className="text-xs text-gray-500">{formatDate(movement.fecha)}</p>
            </div>
            <p
              className={`text-sm font-semibold ${
                color === 'green' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(movement.monto_neto, movement.moneda)}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
)

const ExpenseForm = ({ newExpense, setNewExpense, submittingExpense, handleAddExpense, onCancel }) => (
  <form onSubmit={handleAddExpense} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
      <input
        type="text"
        value={newExpense.description}
        onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        placeholder="Ej: Compra de indumentaria"
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={newExpense.amount}
          onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense((prev) => ({ ...prev, date: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
    </div>
    <div className="flex justify-end gap-2">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
      )}
      <button
        type="submit"
        disabled={submittingExpense}
        className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
      >
        {submittingExpense ? 'Registrando...' : 'Agregar gasto'}
      </button>
    </div>
  </form>
)

const ExpenseModal = ({
  open,
  onClose,
  newExpense,
  setNewExpense,
  submittingExpense,
  handleAddExpense,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          X
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Registrar gasto</h3>
        <ExpenseForm
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          submittingExpense={submittingExpense}
          handleAddExpense={handleAddExpense}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

export default CuentaCorriente

