import { useState, useEffect, useMemo } from 'react'
import { movementService } from '../../services/movementService'

const Caja = () => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [openInfo, setOpenInfo] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = async () => {
    try {
      setLoading(true)
      const data = await movementService.getMovements({})
      // Validate and filter out invalid movements
      const validMovements = (Array.isArray(data) ? data : [])
        .filter((m) => {
          // Ensure movement has required fields
          return m && 
                 m.fecha && 
                 m.tipo && 
                 (m.monto_neto !== null && m.monto_neto !== undefined)
        })
        .map((m) => ({
          ...m,
          // Ensure monto_neto is a valid number
          monto_neto: Number(m.monto_neto) || 0,
        }))
      setMovements(validMovements)
    } catch (error) {
      console.error('Error loading movements:', error)
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'ARS') => {
    // Handle NaN, null, undefined, or invalid numbers
    const numAmount = Number(amount)
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(0)
    }
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(numAmount)
  }

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

  const walletDescriptions = {
    mas10: {
      title: 'Billetera +10',
      description: 'Esta billetera recolecta la cuota del socio o la cuota de los sponsors. El saldo se puede utilizar dentro del ecosistema +10 (productos y servicios de partners) con un fee del 10%. O bien extraer cash lo cual tiene un fee del 30%.',
    },
    efectivo: {
      title: 'Billetera Efectivo',
      description: 'Esta billetera es para llevar todos los registros de plata de la que ponen normalmente entre el equipo (que es con plata, obviamente efectiva) y se pueden armar colectas.',
    },
    manual: {
      title: 'Billetera Manual',
      description: 'Esta es una billetera configurable que se puede usar una cuenta de Mercado Pago o alias un banco y demás, también para hacer colectas de equipo. O lo que sea, siempre y cuando tenga unas vaquitas.',
    },
  }

  // Calculate balances for each wallet
  const wallets = useMemo(() => {
    const now = new Date()
    const selectedMonthDate = new Date(selectedMonth)
    const selectedMonthIndex = selectedMonthDate.getMonth()
    const selectedYear = selectedMonthDate.getFullYear()
    
    // Check if selected month is current month
    const isCurrentMonth = 
      selectedMonthIndex === now.getMonth() && 
      selectedYear === now.getFullYear()

    const filterByWallet = (movement, walletType) => {
      // Filter by payment provider/method
      if (walletType === 'mas10') {
        return (
          movement.payment_provider === 'mas10' ||
          movement.metodo_pago === 'mas10' ||
          movement.payment_provider?.toLowerCase().includes('mas10') ||
          movement.metodo_pago?.toLowerCase().includes('mas10')
        )
      } else if (walletType === 'efectivo') {
        return (
          movement.metodo_pago === 'efectivo' ||
          movement.metodo_pago === 'cash' ||
          movement.metodo_pago?.toLowerCase().includes('efectivo') ||
          movement.metodo_pago?.toLowerCase().includes('cash')
        )
      } else if (walletType === 'manual') {
        return (
          movement.metodo_pago === 'manual' ||
          movement.payment_provider === 'manual' ||
          (movement.payment_provider !== 'mas10' &&
           !movement.metodo_pago?.toLowerCase().includes('efectivo') &&
           !movement.metodo_pago?.toLowerCase().includes('cash'))
        )
      }
      return false
    }

    const calculateWallet = (walletType) => {
      const walletMovements = movements.filter((m) => filterByWallet(m, walletType))
      
      // Selected month movements
      const selectedMonthMovements = walletMovements.filter((m) => {
        const date = new Date(m.fecha)
        return date.getMonth() === selectedMonthIndex && date.getFullYear() === selectedYear
      })

      const incomeTypes = new Set(['cuota', 'colecta', 'aporte', 'sponsor'])
      
      // Helper function to safely parse numeric values
      const safeNumber = (value) => {
        const num = Number(value)
        return isNaN(num) || !isFinite(num) ? 0 : num
      }
      
      // Selected month
      const selectedIncome = selectedMonthMovements
        .filter((m) => incomeTypes.has(m.tipo))
        .reduce((sum, m) => {
          const amount = safeNumber(m.monto_neto)
          return sum + amount
        }, 0)
      const selectedExpenses = selectedMonthMovements
        .filter((m) => !incomeTypes.has(m.tipo))
        .reduce((sum, m) => {
          const amount = safeNumber(m.monto_neto)
          return sum + Math.abs(amount)
        }, 0)

      // Selected month balance (acumulado del mes)
      const selectedMonthBalance = safeNumber(selectedIncome) - safeNumber(selectedExpenses)

      // Separate incomes and expenses for selected month
      const incomes = selectedMonthMovements
        .filter((m) => incomeTypes.has(m.tipo))
        .map((m) => {
          const amount = safeNumber(m.monto_neto)
          return {
            ...m,
            amount: amount >= 0 ? amount : 0,
          }
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      const expenses = selectedMonthMovements
        .filter((m) => !incomeTypes.has(m.tipo))
        .map((m) => {
          const amount = safeNumber(m.monto_neto)
          return {
            ...m,
            amount: Math.abs(amount),
          }
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      return {
        selectedMonthBalance: safeNumber(selectedMonthBalance),
        selectedIncome: safeNumber(selectedIncome),
        selectedExpenses: safeNumber(selectedExpenses),
        incomes,
        expenses,
        isCurrentMonth,
      }
    }

    return {
      mas10: calculateWallet('mas10'),
      efectivo: calculateWallet('efectivo'),
      manual: calculateWallet('manual'),
    }
  }, [movements, selectedMonth])

  const InfoIcon = ({ walletKey }) => {
    const isOpen = openInfo === walletKey
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenInfo(isOpen ? null : walletKey)
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          aria-label="Información"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenInfo(null)}
            />
            <div className="absolute right-0 top-8 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                {walletDescriptions[walletKey]?.description}
              </div>
              <button
                onClick={() => setOpenInfo(null)}
                className="mt-3 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date)
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedMonth(newDate)
  }

  const WalletCard = ({ walletKey, wallet }) => {
    const walletInfo = walletDescriptions[walletKey]
    const monthName = formatMonthYear(selectedMonth)
    const isCurrentMonth = wallet.isCurrentMonth
    
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 relative overflow-visible">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{walletInfo.title}</h3>
          <InfoIcon walletKey={walletKey} />
        </div>

        {/* Balance Summary - Compact and narrow */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-6 max-w-xs">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Mes anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-medium text-gray-700 capitalize">
              {monthName}
            </div>
            <button
              onClick={() => navigateMonth('next')}
              disabled={isCurrentMonth}
              className={`transition-colors ${
                isCurrentMonth 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Mes siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Current Month Balance */}
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
            {isCurrentMonth ? 'Saldo Actual' : `Saldo ${monthName}`}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(wallet.selectedMonthBalance)}
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">
              Ingresos del mes: <span className="text-green-600 font-semibold">{formatCurrency(wallet.selectedIncome)}</span>
            </div>
            <div className="text-xs text-gray-600">
              Egresos del mes: <span className="text-red-600 font-semibold">{formatCurrency(wallet.selectedExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Income and Expense Columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Income Column */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-green-900">Ingresos</h4>
              <span className="text-sm font-semibold text-green-700">
                {formatCurrency(wallet.selectedIncome)}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {wallet.incomes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay ingresos</p>
              ) : (
                wallet.incomes.map((income) => (
                  <div
                    key={income.id}
                    className="bg-white rounded p-3 border border-green-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {getTipoLabel(income.tipo)}
                      </span>
                      <span className="text-sm font-semibold text-green-700">
                        +{formatCurrency(income.amount, income.moneda)}
                      </span>
                    </div>
                    {income.description && (
                      <p className="text-xs text-gray-600 mb-1">{income.description}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(income.fecha)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Column */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-red-900">Egresos</h4>
              <span className="text-sm font-semibold text-red-700">
                {formatCurrency(wallet.selectedExpenses)}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {wallet.expenses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay egresos</p>
              ) : (
                wallet.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white rounded p-3 border border-red-100"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {getTipoLabel(expense.tipo)}
                      </span>
                      <span className="text-sm font-semibold text-red-700">
                        -{formatCurrency(expense.amount, expense.moneda)}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-xs text-gray-600 mb-1">{expense.description}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(expense.fecha)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Skeleton Loading Component
  const CajaSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-5 bg-gray-200 rounded w-5"></div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-6 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded w-5"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-5"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-40"></div>
              <div className="h-3 bg-gray-100 rounded w-40"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-green-200 rounded w-24"></div>
                <div className="h-4 bg-green-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded p-3 border border-green-100">
                    <div className="h-4 bg-gray-100 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-red-200 rounded w-24"></div>
                <div className="h-4 bg-red-200 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded p-3 border border-red-100">
                    <div className="h-4 bg-gray-100 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return <CajaSkeleton />
  }

  return (
    <div>
      {/* Three Wallets */}
      <div className="grid grid-cols-1 gap-6">
        <WalletCard walletKey="mas10" wallet={wallets.mas10} />
        <WalletCard walletKey="efectivo" wallet={wallets.efectivo} />
        <WalletCard walletKey="manual" wallet={wallets.manual} />
      </div>
    </div>
  )
}

export default Caja
