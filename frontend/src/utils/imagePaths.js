/**
 * Centralized image imports for the application
 * This ensures consistent use of placeholder and empty state images
 * 
 * Note: In Vite, SVG files should be imported directly as modules
 */

// Placeholder images
import defaultTeamLogo from '../assets/images/placeholders/default-team-logo.svg'
import teamPhotoSilhouette from '../assets/images/placeholders/team-photo-silhouette.svg'

// Empty state images
import emptyLogo from '../assets/images/empty-states/empty-logo.svg'
import emptyMovements from '../assets/images/empty-states/empty-movements.svg'
import emptyMembers from '../assets/images/empty-states/empty-members.svg'
import emptyCampaign from '../assets/images/empty-states/empty-campaign.svg'
import emptyCollecta from '../assets/images/empty-states/empty-collecta.svg'

// Assistant avatars
import guilloteAvatar from '../assets/images/assistants/guillote.png'
import kelaAvatar from '../assets/images/assistants/kela.png'
import pelaAvatar from '../assets/images/assistants/pela.png'
import choriAvatar from '../assets/images/assistants/chori.png'
import martaAvatar from '../assets/images/assistants/marta.png'

export const imagePaths = {
  placeholders: {
    defaultTeamLogo,
    teamPhotoSilhouette,
  },
  emptyStates: {
    emptyLogo,
    emptyMovements,
    emptyMembers,
    emptyCampaign,
    emptyCollecta,
  },
  assistants: {
    guillote: guilloteAvatar,
    kela: kelaAvatar,
    pela: pelaAvatar,
    chori: choriAvatar,
    marta: martaAvatar,
  },
}

/**
 * Get placeholder image
 * @param {string} type - Type of placeholder ('defaultTeamLogo' | 'teamPhotoSilhouette')
 * @returns {string} Image path (imported module URL)
 */
export const getPlaceholderImage = (type) => {
  return imagePaths.placeholders[type] || imagePaths.placeholders.defaultTeamLogo
}

/**
 * Get empty state image
 * @param {string} type - Type of empty state ('emptyLogo' | 'emptyMovements' | 'emptyMembers' | 'emptyCampaign' | 'emptyCollecta')
 * @returns {string} Image path (imported module URL)
 */
export const getEmptyStateImage = (type) => {
  return imagePaths.emptyStates[type] || imagePaths.emptyStates.emptyLogo
}

/**
 * Get assistant avatar
 * @param {string} assistantId - Assistant ID ('guillote' | 'kela' | 'pela' | 'chori' | 'marta')
 * @returns {string} Image path (imported module URL)
 */
export const getAssistantAvatar = (assistantId) => {
  return imagePaths.assistants[assistantId] || null
}
