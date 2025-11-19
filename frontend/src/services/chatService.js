import api from './api'

/**
 * Chat Service
 * 
 * This service handles operations related to chat with assistants.
 */
export const chatService = {
  /**
   * Get list of available assistants
   * @returns {Promise<Array>} List of assistants with nombre, rol, descripcion, avatar
   */
  getAssistants: async () => {
    const response = await api.get('/chat/assistants')
    return response.data
  },

  /**
   * Get messages for a specific assistant
   * @param {string} assistantId - Assistant ID
   * @returns {Promise<Array>} List of messages
   */
  getMessages: async (assistantId) => {
    const response = await api.get(`/chat/assistants/${assistantId}/messages`)
    return response.data
  },

  /**
   * Send a message to an assistant
   * @param {string} assistantId - Assistant ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Response with user message and assistant reply
   */
  sendMessage: async (assistantId, content) => {
    const response = await api.post(`/chat/assistants/${assistantId}/messages`, {
      content,
    })
    return response.data
  },
}

