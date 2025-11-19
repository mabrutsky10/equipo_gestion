import { useState, useRef, useEffect } from 'react'
import { chatService } from '../../services/chatService'
import { API_CONFIG } from '../../config/api'
import kelaAvatar from '../../assets/images/assistants/kela.png'
import ejemploKela from '../../assets/images/assistants/examples/ejemplo_kela.jpg'
import kelaBienvenida from '../../assets/audio/kela_bienvenida.mp3'

const ChatWindowKela = ({ assistant, assistants, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSendingAudio, setIsSendingAudio] = useState(false)
  const [isConvertingToVoice, setIsConvertingToVoice] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const hasStartedRef = useRef(false)
  const queueRef = useRef(Promise.resolve())

  const [mode, setMode] = useState('idle')
  const [profile, setProfile] = useState({
    position: undefined,
    foot: undefined,
    heightCm: undefined,
    weightKg: undefined,
    bio: undefined,
  })

  useEffect(() => {
    if (!assistant || assistant.id !== 'kela') {
      return
    }
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  // Inicio de flujo cuando se carga el chat
  useEffect(() => {
    if (assistant && assistant.id === 'kela' && !hasStartedRef.current && messages.length === 0 && !loading) {
      hasStartedRef.current = true
      const audioWelcome = {
        id: (Date.now() + 1).toString(),
        content: 'Audio de bienvenida ▶',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        audio: kelaBienvenida,
        audioType: 'audio/mpeg',
      }
      const question = {
        id: (Date.now() + 2).toString(),
        content: 'Como te contaba, por si no querés escuchar audios, soy Kela, periodista deportiva de Gol Popular, y quisiera entrevistarte como bienvenida a +10. ¿Qué preferís, lo hacemos chateando o me mandás audio?',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }
      queueBotMessage(audioWelcome)
      queueBotMessage(question)
      setMode('choose')
    }
  }, [assistant, messages.length, loading])

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
      
      // Si no hay mensajes, iniciar el flujo de bienvenida
      if (loadedMessages.length === 0) {
        hasStartedRef.current = false
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const queueBotMessage = (payload) => {
    queueRef.current = queueRef.current.then(async () => {
      setIsTyping(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const msg = typeof payload === 'string'
        ? {
            id: Date.now().toString(),
            content: payload,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
          }
        : { ...payload, id: Date.now().toString(), sender: 'assistant', timestamp: new Date().toISOString() }
      setMessages((prev) => [...prev, msg])
      setIsTyping(false)
    })
  }

  const startAudioFlow = () => {
    queueBotMessage('Excelente, enviame un audio contándome: Posición en la que jugás, pie dominante (zurdo, diestro o ambos), altura y peso, y una breve bio de presentación.')
    setMode('awaiting_audio')
  }

  const startChatFlow = () => {
    queueBotMessage('Arranquemos por tu posición. Elegí una: Arquero, Defensor, Mediocampista, Delantero.')
    setMode('chat_position')
  }

  const handleChooseMode = (selected) => {
    const userMessage = {
      id: Date.now().toString(),
      content: selected === 'audio' ? 'Prefiero enviar audio 🎤' : 'Prefiero chatear 💬',
      sender: 'user',
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    if (selected === 'audio') startAudioFlow()
    else startChatFlow()
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputText.trim()
    setInputText('')

    // Flujo chat guiado
    if (mode === 'chat_position') {
      const normalized = currentInput.toLowerCase()
      const valid = ['arquero', 'defensor', 'mediocampista', 'delantero']
      const match = valid.find((v) => normalized.includes(v))
      if (!match) {
        queueBotMessage('Elegí una opción válida: Arquero, Defensor, Mediocampista o Delantero.')
        return
      }
      setProfile((prev) => ({ ...prev, position: match.charAt(0).toUpperCase() + match.slice(1) }))
      queueBotMessage('Perfecto. ¿Cuál es tu pie dominante? Elegí: Zurdo, Diestro o Ambos.')
      setMode('chat_foot')
      return
    }
    if (mode === 'chat_foot') {
      const normalized = currentInput.toLowerCase()
      const valid = ['zurdo', 'diestro', 'ambos']
      const match = valid.find((v) => normalized.includes(v))
      if (!match) {
        queueBotMessage('Elegí entre: Zurdo, Diestro o Ambos.')
        return
      }
      setProfile((prev) => ({ ...prev, foot: match.charAt(0).toUpperCase() + match.slice(1) }))
      queueBotMessage('Decime tu altura en cm y peso en kg. Ej: 178 cm, 75 kg')
      setMode('chat_height_weight')
      return
    }
    if (mode === 'chat_height_weight') {
      const nums = currentInput.match(/\d{2,3}/g)
      if (!nums || nums.length < 2) {
        queueBotMessage('Necesito altura y peso en números. Ej: 180 y 78')
        return
      }
      const heightCm = parseInt(nums[0], 10)
      const weightKg = parseInt(nums[1], 10)
      setProfile((prev) => ({ ...prev, heightCm, weightKg }))
      queueBotMessage('Por último, escribí una breve bio de presentación.')
      setMode('chat_bio')
      return
    }
    if (mode === 'chat_bio') {
      const nextProfile = { ...profile, bio: currentInput }
      setProfile(nextProfile)
      queueBotMessage('Resumen de tus datos:')
      queueBotMessage(`Posición: ${nextProfile.position}\nPie: ${nextProfile.foot}\nAltura: ${nextProfile.heightCm} cm\nPeso: ${nextProfile.weightKg} kg\nBio: ${nextProfile.bio}`)
      queueBotMessage('¿Confirmás que guarde estos datos en tu perfil?')
      setMode('confirm_save')
      return
    }

    // Si no está en modo guiado, enviar mensaje normal
    if (!assistant) return
    try {
      const response = await chatService.sendMessage(assistant.id, currentInput)
      setMessages((prev) => [...prev, response.user_message, response.assistant_message])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result
        const userMessage = {
          id: Date.now().toString(),
          content: 'Imagen enviada',
          sender: 'user',
          timestamp: new Date().toISOString(),
          image: imageUrl,
        }
        setMessages((prev) => [...prev, userMessage])

        setTimeout(() => {
          const botMessage = {
            id: (Date.now() + 1).toString(),
            content: '¡Perfecto! Aquí tienes un ejemplo de mi trabajo como periodista deportiva:',
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            image: ejemploKela,
          }
          setMessages((prev) => [...prev, botMessage])
        }, 1000)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendExampleImage = () => {
    const botMessage = {
      id: Date.now().toString(),
      content: 'Aquí tienes un ejemplo de mi trabajo como periodista deportiva:',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      image: ejemploKela,
    }
    setMessages((prev) => [...prev, botMessage])
  }

  const startRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingTime(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
      }

      mediaRecorder.start(100)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          if (newTime >= 30) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setIsRecording(false)
      alert('No se pudo acceder al micrófono. Por favor, permite el acceso al micrófono.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioMessage = async () => {
    if (!audioBlob) return

    const audioUrl = URL.createObjectURL(audioBlob)
    const userMessage = {
      id: Date.now().toString(),
      content: 'Audio enviado',
      sender: 'user',
      timestamp: new Date().toISOString(),
      audio: audioUrl,
      audioType: 'audio/webm',
    }

    setMessages((prev) => [...prev, userMessage])
    setAudioBlob(null)
    setIsSendingAudio(true)

    try {
      const formData = new FormData()
      formData.append('voice_message', audioBlob, 'audio.webm')

      const response = await fetch(API_CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const mapped = {
          position: result.position || result.posicion,
          foot: result.foot || result.pie,
          heightCm: result.heightCm || result.altura || result.altura_cm,
          weightKg: result.weightKg || result.peso || result.peso_kg,
          bio: result.bio || result.descripcion,
        }
        setProfile((prev) => ({
          position: mapped.position ?? prev.position,
          foot: mapped.foot ?? prev.foot,
          heightCm: mapped.heightCm ? Number(mapped.heightCm) : prev.heightCm,
          weightKg: mapped.weightKg ? Number(mapped.weightKg) : prev.weightKg,
          bio: mapped.bio ?? prev.bio,
        }))
        const summary = `Esto entendí de tu audio:\nPosición: ${mapped.position ?? '—'}\nPie: ${mapped.foot ?? '—'}\nAltura: ${mapped.heightCm ?? '—'} cm\nPeso: ${mapped.weightKg ?? '—'} kg\nBio: ${mapped.bio ?? '—'}`
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: summary,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
          },
        ])
        queueBotMessage('¿Confirmás que guarde estos datos en tu perfil?')
        setMode('confirm_save')
      } else {
        const errorText = await response.text()
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: `Error al procesar el audio: ${errorText}. Por favor, inténtalo de nuevo.`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error al procesar audio:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un problema al procesar tu audio. Por favor, inténtalo de nuevo.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSendingAudio(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    setAudioBlob(null)
    setRecordingTime(0)
  }

  const convertLastMessageToVoice = async () => {
    const lastBotMessage = messages.filter((msg) => msg.sender === 'assistant').pop()

    if (!lastBotMessage) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'No hay mensajes de Kela para convertir a voz.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    setIsConvertingToVoice(true)

    try {
      const response = await fetch(API_CONFIG.ELEVENLABS_TTS_URL, {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: lastBotMessage.content,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        const audioMessage = {
          id: (Date.now() + 1).toString(),
          content: '🎤 Versión en audio del mensaje anterior',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          audio: audioUrl,
        }

        setMessages((prev) => [...prev, audioMessage])
      } else {
        const errorText = await response.text()
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          content: `Error al convertir a voz: ${errorText}. Por favor, inténtalo de nuevo.`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error al convertir texto a voz:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un problema al convertir el texto a voz. Por favor, inténtalo de nuevo.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsConvertingToVoice(false)
    }
  }

  if (!assistant || assistant.id !== 'kela') {
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
          <img
            src={kelaAvatar}
            alt="Kela"
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Kela
            </h3>
            <p className="text-xs text-white opacity-90">Periodista Deportiva</p>
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
                  {message.image && (
                    <div className="mt-2">
                      <img
                        src={message.image}
                        alt="Imagen"
                        className="max-w-full rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  {message.audio && (
                    <div className="mt-2">
                      <audio controls className="w-full rounded-lg">
                        <source src={message.audio} type={message.audioType || 'audio/mpeg'} />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                  )}
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
        {/* Selector de modo */}
        {mode === 'choose' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleChooseMode('audio')}
              className="bg-green-500 hover:bg-green-600 border-none rounded-lg text-white px-3 py-2 cursor-pointer transition-colors"
            >
              🎤 Audio
            </button>
            <button
              onClick={() => handleChooseMode('chat')}
              className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg text-white px-3 py-2 cursor-pointer transition-colors"
            >
              💬 Chat
            </button>
          </div>
        )}

        {/* Confirmaciones */}
        {(mode === 'confirm_save' || mode === 'confirm_market') && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                if (mode === 'confirm_save') {
                  queueBotMessage('Genial, guardo estos datos en tu perfil.')
                  queueBotMessage('¿Querés que te postule en el mercado de pases con estos datos?')
                  setMode('confirm_market')
                } else {
                  queueBotMessage('Perfecto. ¡Muchas gracias por la entrevista, a romperla! ⚽')
                  setMode('done')
                }
              }}
              className="bg-green-500 hover:bg-green-600 border-none rounded-lg text-white px-3 py-2 cursor-pointer transition-colors"
            >
              Sí
            </button>
            <button
              onClick={() => {
                if (mode === 'confirm_save') {
                  queueBotMessage('Listo, no guardo los datos.')
                  queueBotMessage('¿Querés que te postule en el mercado de pases con estos datos?')
                  setMode('confirm_market')
                } else {
                  queueBotMessage('Entendido. ¡Gracias por la entrevista!')
                  setMode('done')
                }
              }}
              className="bg-red-500 hover:bg-red-600 border-none rounded-lg text-white px-3 py-2 cursor-pointer transition-colors"
            >
              No
            </button>
          </div>
        )}

        {/* Entrada para flujo de chat */}
        <div className="flex gap-2 items-end mb-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={mode.startsWith('chat_') ? 'Escribe tu respuesta…' : 'Escribe tu mensaje…'}
            disabled={!mode.startsWith('chat_') && mode !== 'idle' && mode !== 'done'}
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm resize-none min-h-[40px] max-h-[100px]"
            style={{
              opacity: mode.startsWith('chat_') || mode === 'idle' || mode === 'done' ? 1 : 0.5,
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || (!mode.startsWith('chat_') && mode !== 'idle' && mode !== 'done')}
            className="bg-yellow-400 hover:bg-yellow-500 border-none rounded-xl text-white px-4 py-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>

        {/* Indicador de grabación */}
        {isRecording && (
          <div
            className="mb-2 p-3 rounded-xl flex items-center gap-3"
            style={{
              background:
                recordingTime === 0
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
            <div className="text-white text-sm font-semibold">
              {recordingTime === 0
                ? '🎤 Preparando micrófono...'
                : `🎤 Grabando... ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`}
            </div>
          </div>
        )}

        {/* Indicador de envío de audio */}
        {isSendingAudio && (
          <div className="mb-2 p-3 rounded-xl flex items-center gap-3 bg-blue-500">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.16s' }}></div>
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.32s' }}></div>
            </div>
            <div className="text-white text-sm font-semibold">📤 Enviando audio...</div>
          </div>
        )}

        {/* Indicador de conversión a voz */}
        {isConvertingToVoice && (
          <div className="mb-2 p-3 rounded-xl flex items-center gap-3 bg-orange-500">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.16s' }}></div>
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.32s' }}></div>
            </div>
            <div className="text-white text-sm font-semibold">🔊 Convirtiendo a voz...</div>
          </div>
        )}

        {/* Controles de grabación de audio */}
        {audioBlob && !isSendingAudio && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center gap-2">
            <audio controls className="flex-1 rounded-lg" style={{ height: '32px' }}>
              <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
            </audio>
            <button
              onClick={sendAudioMessage}
              disabled={isSendingAudio}
              className="bg-green-500 hover:bg-green-600 border-none rounded text-white px-3 py-1 text-xs cursor-pointer transition-all disabled:opacity-50"
            >
              Enviar
            </button>
            <button
              onClick={cancelRecording}
              disabled={isSendingAudio}
              className="bg-red-500 hover:bg-red-600 border-none rounded text-white px-3 py-1 text-xs cursor-pointer transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 justify-between flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg text-white px-3 py-2 text-xs cursor-pointer transition-all"
          >
            📷 Enviar Imagen
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSendingAudio || mode !== 'awaiting_audio'}
            className={`border-none rounded-lg text-white px-3 py-2 text-xs cursor-pointer transition-all flex items-center gap-1 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : isSendingAudio || mode !== 'awaiting_audio'
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRecording ? '⏹️ Parar' : isSendingAudio ? '⏳ Enviando...' : '🎤 Grabar'}
          </button>
          <button
            onClick={handleSendExampleImage}
            className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg text-white px-3 py-2 text-xs cursor-pointer transition-all"
          >
            🎨 Ver Ejemplo
          </button>
          <button
            onClick={convertLastMessageToVoice}
            disabled={isConvertingToVoice || messages.filter((msg) => msg.sender === 'assistant').length === 0}
            className={`border-none rounded-lg text-white px-3 py-2 text-xs cursor-pointer transition-all ${
              isConvertingToVoice || messages.filter((msg) => msg.sender === 'assistant').length === 0
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isConvertingToVoice ? '⏳ Convirtiendo...' : '🔊 Pasar a Voz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindowKela

