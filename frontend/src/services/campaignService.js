import api from './api'

/**
 * Campaign Service
 * 
 * This service handles operations related to member campaigns (Cuota Social Amateur / Socios Coquita).
 */
export const campaignService = {
  /**
   * Save a campaign as draft
   * @param {Object} campaignData - Campaign data including team info, amounts, payment method
   * @returns {Promise<Object>} Saved campaign data
   */
  saveDraft: async (campaignData) => {
    const response = await api.post('/campaigns/draft', campaignData)
    return response.data
  },

  /**
   * Publish a campaign
   * @param {Object} campaignData - Campaign data to publish
   * @returns {Promise<Object>} Published campaign data
   */
  publishCampaign: async (campaignData) => {
    const response = await api.post('/campaigns/publish', campaignData)
    return response.data
  },

  /**
   * Get current campaign for a team
   * @returns {Promise<Object|null>} Current campaign or null
   */
  getCurrentCampaign: async () => {
    try {
      const response = await api.get('/campaigns/current')
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Update an existing campaign
   * @param {number} campaignId - Campaign ID
   * @param {Object} campaignData - Updated campaign data
   * @returns {Promise<Object>} Updated campaign data
   */
  updateCampaign: async (campaignId, campaignData) => {
    const response = await api.put(`/campaigns/${campaignId}`, campaignData)
    return response.data
  },

  /**
   * Get active (published) campaign for team
   * @returns {Promise<Object|null>} Active campaign or null
   */
  getActiveCampaign: async () => {
    try {
      const response = await api.get('/campaigns/active')
      return response.data || null
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Get all campaigns (active and historical) for team
   * @returns {Promise<Array>} List of all campaigns
   */
  getAllCampaigns: async () => {
    const response = await api.get('/campaigns/all')
    return response.data
  },

  /**
   * Get public campaign by slug (no auth required)
   */
  getPublicCampaignBySlug: async (landingSlug) => {
    const response = await api.get(`/campaigns/public/by-slug/${landingSlug}`)
    return response.data
  },

  /**
   * Check if user can create campaigns based on team level
   * @returns {Promise<Object>} Access information with level_id and can_create_campaign
   */
  checkCampaignAccess: async () => {
    const response = await api.get('/campaigns/check-access')
    return response.data
  },
}

