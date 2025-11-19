import Jugadores from '../components/PanelSocios/Jugadores'
import { teamService } from '../services/teamService'
import { useState, useEffect } from 'react'

const PanelJugadores = () => {
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
          Jugadores
          {teamName && <span className="text-indigo-600 ml-2">- {teamName}</span>}
        </h1>
      </div>
      
      <Jugadores />
    </div>
  )
}

export default PanelJugadores

