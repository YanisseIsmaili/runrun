// running-admin/src/utils/apiConfig.js
// Helper pour accéder facilement à la configuration API globale depuis n'importe où

/**
 * Obtient la configuration API actuelle
 * @returns {Object} { baseURL, selectedApi }
 */
export const getApiConfig = () => {
  if (window.GLOBAL_API_CONFIG) {
    return window.GLOBAL_API_CONFIG.getConfig()
  }
  return { baseURL: null, selectedApi: null }
}

/**
 * Obtient l'URL de base de l'API actuelle
 * @returns {string|null} URL de base ou null
 */
export const getApiBaseURL = () => {
  const config = getApiConfig()
  return config.baseURL
}

/**
 * Obtient l'API sélectionnée
 * @returns {Object|null} Objet API ou null
 */
export const getSelectedApi = () => {
  const config = getApiConfig()
  return config.selectedApi
}

/**
 * Vérifie si une API est configurée
 * @returns {boolean} true si une API est configurée
 */
export const hasApiConfig = () => {
  const config = getApiConfig()
  return config.baseURL !== null
}

/**
 * Construit une URL complète avec l'API configurée
 * @param {string} endpoint - L'endpoint à ajouter (ex: '/api/users')
 * @returns {string|null} URL complète ou null si pas d'API configurée
 */
export const buildApiUrl = (endpoint) => {
  const baseURL = getApiBaseURL()
  if (!baseURL) {
    console.warn('Aucune API configurée pour construire l\'URL:', endpoint)
    return null
  }
  
  // Nettoyer les slashes en double
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  
  return `${cleanBaseURL}${cleanEndpoint}`
}

/**
 * Hook React pour écouter les changements de configuration API
 * @param {Function} callback - Fonction appelée lors des changements
 */
export const useApiConfigListener = (callback) => {
  if (typeof window !== 'undefined') {
    const handleConfigChange = (event) => {
      callback(event.detail)
    }
    
    window.addEventListener('apiConfigChanged', handleConfigChange)
    
    // Cleanup function
    return () => {
      window.removeEventListener('apiConfigChanged', handleConfigChange)
    }
  }
  
  return () => {} // Fonction vide pour le cleanup
}

/**
 * Affiche les informations de debug de la configuration API
 */
export const debugApiConfig = () => {
  const config = getApiConfig()
  console.group('🌐 Configuration API Globale')
  console.log('Base URL:', config.baseURL)
  console.log('API sélectionnée:', config.selectedApi)
  console.log('Configurée:', hasApiConfig())
  if (config.selectedApi) {
    console.log('Nom:', config.selectedApi.name)
    console.log('IP:', config.selectedApi.ip)
    console.log('Statut:', config.selectedApi.status)
    console.log('Temps de réponse:', config.selectedApi.responseTime + 'ms')
  }
  console.groupEnd()
}

// Export par défaut d'un objet avec toutes les fonctions
const ApiConfig = {
  get: getApiConfig,
  getBaseURL: getApiBaseURL,
  getSelected: getSelectedApi,
  hasConfig: hasApiConfig,
  buildUrl: buildApiUrl,
  useListener: useApiConfigListener,
  debug: debugApiConfig
}

export default ApiConfig