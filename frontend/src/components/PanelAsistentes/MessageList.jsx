const MessageList = ({ messages, assistant }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No hay mensajes aún</p>
          <p className="text-sm text-gray-400">Comienza una conversación con {assistant.displayName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <p
              className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageList

