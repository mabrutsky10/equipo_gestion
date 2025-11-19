import api from './api'

export const memberService = {
  /**
   * Get all members with details (username, first_name, last_name from userprofile)
   * @returns {Promise<Array>} List of members with details
   */
  getMembersWithDetails: async () => {
    const response = await api.get('/members/with-details')
    return response.data
  },

  /**
   * Get payment evolution (cuotas) for a specific member
   * @param {number} memberId - Member ID
   * @returns {Promise<Object>} Member evolution with payments history
   */
  getMemberEvolution: async (memberId) => {
    const response = await api.get(`/members/${memberId}/evolution`)
    return response.data
  },
}

