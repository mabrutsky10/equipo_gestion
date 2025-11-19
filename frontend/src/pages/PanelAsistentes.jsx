import { useState, useEffect } from 'react'
import { teamService } from '../services/teamService'
import { chatService } from '../services/chatService'
import { getAssistantAvatar } from '../utils/imagePaths'
import AsistenteList from '../components/PanelAsistentes/AsistenteList'
import ChatWindow from '../components/PanelAsistentes/ChatWindow'

const PanelAsistentes = () => {
  const [teamName, setTeamName] = useState('')
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssistantId, setSelectedAssistantId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [team, assistantsData] = await Promise.all([
        teamService.getCurrentTeam(),
        chatService.getAssistants(),
      ])
      setTeamName(team.name)
      // Map avatar paths from backend to imported images
      const assistantsWithAvatars = assistantsData.map(assistant => ({
        ...assistant,
        avatar: getAssistantAvatar(assistant.id) || assistant.avatar,
      }))
      setAssistants(assistantsWithAvatars)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssistantClick = (assistantId) => {
    setSelectedAssistantId(assistantId)
  }

  const handleCloseChat = () => {
    setSelectedAssistantId(null)
  }

  const selectedAssistant = selectedAssistantId
    ? assistants.find(a => a.id === selectedAssistantId)
    : null

  return (
    <div className="p-6 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Asistentes
          {teamName && <span className="text-indigo-600 ml-2">- {teamName}</span>}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando asistentes...</div>
        </div>
      ) : (
        <>
          <AsistenteList 
            assistants={assistants} 
            onAssistantClick={handleAssistantClick}
            selectedAssistantId={selectedAssistantId}
          />
          
          {/* Chat Modal Overlay */}
          {selectedAssistant && (
            <div className="fixed inset-0 z-50 flex items-center justify-end p-6 pointer-events-none">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 pointer-events-auto transition-opacity"
                onClick={handleCloseChat}
              />
              
              {/* Chat Window */}
              <div className="relative w-full max-w-lg h-[calc(100vh-3rem)] pointer-events-auto animate-slide-in-right">
                <ChatWindow 
                  assistant={selectedAssistant}
                  assistants={assistants}
                  onClose={handleCloseChat}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PanelAsistentes

