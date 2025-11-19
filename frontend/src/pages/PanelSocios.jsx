import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import DashboardSocios from '../components/PanelSocios/DashboardSocios'
import Campana from '../components/PanelSocios/Campana'
import { teamService } from '../services/teamService'

const PanelSocios = () => {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamName()
  }, [])

  const loadTeamName = async () => {
    try {
      const team = await teamService.getCurrentTeam()
      setTeamName(team.name)
    } catch (error) {
      console.error('Error loading team:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Socios
          {teamName && <span className="text-indigo-600 ml-2">- {teamName}</span>}
        </h1>
      </div>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { to: 'campana', label: 'Campaña' },
            { to: 'dashboard', label: 'Dashboard' },
          ].map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route path="campana" element={<Campana />} />
        <Route path="dashboard" element={<DashboardSocios />} />
        <Route path="*" element={<Navigate to="campana" replace />} />
      </Routes>
    </div>
  )
}

export default PanelSocios

