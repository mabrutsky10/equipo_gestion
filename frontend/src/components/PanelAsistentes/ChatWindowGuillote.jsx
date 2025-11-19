import { useState, useRef, useEffect } from 'react'
import { chatService } from '../../services/chatService'
import { getAssistantAvatar } from '../../utils/imagePaths'

const ChatWindowGuillote = ({ assistant, assistants, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const avatarUrl = getAssistantAvatar('guillote')

  useEffect(() => {
    if (!assistant || assistant.id !== 'guillote') {
      return
    }
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!assistant) return
    try {
      setLoading(true)
      const data = await chatService.getMessages(assistant.id)
      const loadedMessages = Array.isArray(data) ? data : []
      setMessages(loadedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const currentInput = inputText.trim()
    if (!currentInput || sending || !assistant) return

    const userMessage = {
      id: `temp-${Date.now()}`,
      content: currentInput,
      sender: 'user',
      assistant_id: assistant.id,
      timestamp: new Date().toISOString(),
      is_temp: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setSending(true)
    setIsTyping(true)

    try {
      const response = await chatService.sendMessage(assistant.id, currentInput)
      
      // Remove temp message and add real messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.is_temp || m.id !== userMessage.id)
        return [...filtered, response.user_message, response.assistant_message]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => !m.is_temp || m.id !== userMessage.id))
      
      // Show error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Lo siento, hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!assistant || assistant.id !== 'guillote') {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-2xl border-2 border-yellow-400">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 rounded-t-lg"
        style={{
          background: 'linear-gradient(135deg, #FFB400 0%, #6C3FF6 100%)',
        }}
      >
        <div className="flex items-center space-x-3 flex-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Guillote"
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-2 border-white">
              <span className="text-xl font-semibold text-white">G</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Guillote
            </h3>
            <p className="text-xs text-white opacity-90">Manager de jugadores</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-4 bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white text-xl cursor-pointer rounded-full w-8 h-8 flex items-center justify-center transition-all"
          aria-label="Cerrar chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-white text-gray-900 shadow-md'
                  }`}
                  style={{
                    borderRadius: message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-700' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.16s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.32s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex gap-2 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje…"
            disabled={sending}
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm resize-none min-h-[40px] max-h-[100px]"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending}
            className="bg-yellow-400 hover:bg-yellow-500 border-none rounded-xl text-white px-4 py-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindowGuillote

