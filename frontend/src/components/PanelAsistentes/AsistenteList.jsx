import AsistenteCard from './AsistenteCard'

const AsistenteList = ({ assistants, onAssistantClick, selectedAssistantId }) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Selecciona un asistente</h2>
        <p className="text-gray-600 mt-1">Elige un asistente para comenzar una conversación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assistants.map((assistant) => (
          <AsistenteCard
            key={assistant.id}
            assistant={assistant}
            onClick={() => onAssistantClick(assistant.id)}
            isSelected={selectedAssistantId === assistant.id}
          />
        ))}
      </div>
    </div>
  )
}

export default AsistenteList

