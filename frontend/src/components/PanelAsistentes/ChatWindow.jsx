import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { chatService } from '../../services/chatService'
import { getAssistantAvatar } from '../../utils/imagePaths'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatWindowKela from './ChatWindowKela'
import ChatWindowGuillote from './ChatWindowGuillote'
import ChatWindowPela from './ChatWindowPela'
import ChatWindowChori from './ChatWindowChori'

const TEAM_LEVELS = [
  {
    id: 0,
    name: 'Equipo con Identidad en Configuración',
    description: 'Aún NO puede activar socios. Debe completar identidad mínima.',
  },
  {
    id: 1,
    name: 'Equipo con Identidad Profesional',
    description: 'Puede activar socios y recibir pagos.',
  },
  {
    id: 2,
    name: 'Equipo +10 Socios Iniciales',
    description: 'Equipo con socios y asistentes profesionales.',
  },
  {
    id: 3,
    name: 'Equipo +10 LAP (Like a Pro)',
    description: 'Equipo consolidado. Prensa, Sponsors, Socios.',
  },
  {
    id: 4,
    name: 'Equipo Embajador',
    description: 'Desbloquea comunicación avanzada.',
  },
  {
    id: 5,
    name: 'Equipo Pro+',
    description: 'Mejora de beneficios económicos.',
  },
  {
    id: 6,
    name: 'Equipo Ícono del Fútbol Amateur',
    description: 'Máximo nivel.',
  },
]

const ChatWindow = ({ assistant, assistants, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [imageError, setImageError] = useState(false)
  const messagesEndRef = useRef(null)
  const introTimeoutsRef = useRef([])
  const introInProgressRef = useRef(false)

  // Use imported avatar from imagePaths if available, otherwise use backend avatar
  const avatarUrl = assistant ? (getAssistantAvatar(assistant.id) || assistant.avatar) : null

  // Si es Kela, usar el componente especializado
  if (assistant?.id === 'kela') {
    return <ChatWindowKela assistants={assistants} assistant={assistant} onClose={onClose} />
  }

  // Si es Guillote, usar el componente especializado
  if (assistant?.id === 'guillote') {
    return <ChatWindowGuillote assistants={assistants} assistant={assistant} onClose={onClose} />
  }

  // Si es Pela, usar el componente especializado
  if (assistant?.id === 'pela') {
    return <ChatWindowPela assistants={assistants} assistant={assistant} onClose={onClose} />
  }

  // Si es Chori, usar el componente especializado
  if (assistant?.id === 'chori') {
    return <ChatWindowChori assistants={assistants} assistant={assistant} onClose={onClose} />
  }

  useEffect(() => {
    if (!assistant) return
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    introTimeoutsRef.current.forEach(clearTimeout)
    introTimeoutsRef.current = []
    introInProgressRef.current = false
    return () => {
      introTimeoutsRef.current.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id])

  useEffect(() => {
    if (
      !loading &&
      assistant?.id === 'marta' &&
      messages.length === 0 &&
      !introInProgressRef.current
    ) {
      runMartaIntroScript()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, assistant?.id, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!assistant) return
    try {
      setLoading(true)
      const data = await chatService.getMessages(assistant.id)
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (text) => {
    if (!text.trim() || sending || !assistant) return

    const newMessage = {
      id: `temp-${Date.now()}`,
      content: text,
      sender: 'user',
      assistant_id: assistant.id,
      timestamp: new Date().toISOString(),
      is_temp: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setSending(true)

    try {
      const response = await chatService.sendMessage(assistant.id, text)
      
      // Remove temp message and add real messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.is_temp || m.id !== newMessage.id)
        return [...filtered, response.user_message, response.assistant_message]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => !m.is_temp || m.id !== newMessage.id))
    } finally {
      setSending(false)
    }
  }

  const runMartaIntroScript = () => {
    introInProgressRef.current = true
    const script = getMartaScript()
    let delay = 500

    script.forEach((text, index) => {
      const timeout = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `marta-intro-${Date.now()}-${index}`,
            content: text,
            sender: 'assistant',
            assistant_id: assistant.id,
            timestamp: new Date().toISOString(),
          },
        ])
        if (index === script.length - 1) {
          introInProgressRef.current = false
        }
      }, delay)
      introTimeoutsRef.current.push(timeout)
      delay += 1800
    })
  }

  const getMartaScript = () => {
    const greeting = [
      '¡Hola! Soy Marta, tu manager de equipos.',
      'Voy a acompañarte para que el club suba de nivel. Repasemos rápidamente cómo están ordenados los equipos en +10:',
    ]
    const levelBlurbs = TEAM_LEVELS.map(
      (level) =>
        `Nivel ${level.id} — ${level.name}\n${level.description}`
    )
    const closing = [
      'Cada escalón desbloquea nuevas herramientas y beneficios. Decime en qué nivel estás o qué requisitos te faltan y lo vemos juntas.',
    ]
    return [...greeting, ...levelBlurbs, ...closing]
  }

  if (!assistant) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-50 rounded-t-lg">
        <div className="flex items-center space-x-3 flex-1">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={assistant.nombre || assistant.displayName}
              className="w-12 h-12 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xl font-semibold text-indigo-600">
                {(assistant.nombre || assistant.displayName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {assistant.nombre || assistant.displayName || assistant.name}
            </h3>
            {assistant.rol && (
              <p className="text-xs text-indigo-600 font-medium">{assistant.rol}</p>
            )}
            {assistant.descripcion && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{assistant.descripcion}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Cerrar chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Cargando mensajes...</div>
          </div>
        ) : (
          <MessageList messages={messages} assistant={assistant} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <MessageInput onSend={handleSendMessage} disabled={sending} />
      </div>
    </div>
  )
}

export default ChatWindow

