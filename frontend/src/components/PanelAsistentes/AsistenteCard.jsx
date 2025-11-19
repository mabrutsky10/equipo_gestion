import { useState } from 'react'
import { getAssistantAvatar } from '../../utils/imagePaths'

const AsistenteCard = ({ assistant, onClick, isSelected }) => {
  const [imageError, setImageError] = useState(false)
  // Use imported avatar from imagePaths if available, otherwise use backend avatar
  const avatarUrl = getAssistantAvatar(assistant.id) || assistant.avatar

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-all border-2 ${
        isSelected 
          ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200' 
          : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4">
        <div className="w-full sm:w-40 h-56 sm:h-auto rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={assistant.nombre || assistant.displayName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-4xl font-semibold text-indigo-600">
              {(assistant.nombre || assistant.displayName || 'A').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-gray-900">
            {assistant.nombre || assistant.displayName || assistant.name}
          </h3>
          {assistant.rol && (
            <p className="text-sm text-indigo-600 font-medium mt-1 uppercase tracking-wide">
              {assistant.rol}
            </p>
          )}
          {assistant.descripcion && (
            <p className="text-sm text-gray-500 mt-3 line-clamp-3">
              {assistant.descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AsistenteCard

