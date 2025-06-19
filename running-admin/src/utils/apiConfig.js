// running-admin/src/utils/apiConfig.js
/**
 * Utilitaire pour charger la configuration des APIs depuis les variables d'environnement
 */

/**
 * Charge les APIs par défaut depuis l'environnement
 * @returns {Array} Liste des APIs par défaut
 */
export const getDefaultApis = () => {
  try {
    // Tentative de chargement depuis la variable JSON
    const defaultApisJson = import.meta.env.VITE_DEFAULT_APIS || import.meta.env.REACT_APP_DEFAULT_APIS
    if (defaultApisJson) {
      const parsed = JSON.parse(defaultApisJson)
      if (Array.isArray(parsed)) {
        console.log('✅ APIs chargées depuis les variables d\'environnement:', parsed.length, 'APIs')
        return parsed
      }
    }

    // Alternative : format simple
    const defaultApisSimple = import.meta.env.VITE_DEFAULT_APIS_SIMPLE || import.meta.env.REACT_APP_DEFAULT_APIS_SIMPLE
    if (defaultApisSimple) {
      const apis = defaultApisSimple.split(',').map(item => {
        const [ip, name] = item.split(':')
        return {
          ip: ip.trim(),
          name: name ? name.trim() : `API ${ip.trim()}`
        }
      })
      console.log('✅ APIs chargées depuis format simple:', apis.length, 'APIs')
      return apis
    }

    // Fallback vers la configuration par défaut
    console.log('⚠️ Variables d\'environnement non trouvées, utilisation de la config par défaut')
    return getDefaultFallbackApis()
    
  } catch (error) {
    console.error('❌ Erreur parsing des APIs depuis l\'environnement:', error)
    console.log('🔄 Utilisation de la configuration de secours')
    return getDefaultFallbackApis()
  }
}

/**
 * Configuration de secours si les variables d'environnement ne sont pas disponibles
 * @returns {Array} APIs par défaut en fallback
 */
const getDefaultFallbackApis = () => {
  return [
    { ip: '192.168.0.47', name: 'Dev Server' },
    { ip: '127.0.0.1', name: 'Loopback' },
    { ip: 'localhost', name: 'Serveur Principal' },
    { ip: '192.168.27.66', name: 'Serveur Distant' },
    { ip: '192.168.0.1', name: 'Gateway' },
    { ip: '10.0.0.1', name: 'VPN Gateway' },
    { ip: '192.168.27.77', name: 'API Yaniss' }
  ]
}

/**
 * Obtient le port par défaut depuis l'environnement
 * @returns {number} Port par défaut
 */
export const getDefaultPort = () => {
  const port = import.meta.env.VITE_DEFAULT_API_PORT || import.meta.env.REACT_APP_DEFAULT_API_PORT
  return port ? parseInt(port, 10) : 5000
}

/**
 * Obtient l'API sélectionnée par défaut
 * @returns {string|null} IP de l'API par défaut
 */
export const getDefaultSelectedApi = () => {
  return import.meta.env.VITE_DEFAULT_SELECTED_API || import.meta.env.REACT_APP_DEFAULT_SELECTED_API || null
}

/**
 * Obtient le timeout pour les tests API
 * @returns {number} Timeout en millisecondes
 */
export const getApiTimeout = () => {
  const timeout = import.meta.env.VITE_API_TIMEOUT || import.meta.env.REACT_APP_API_TIMEOUT
  return timeout ? parseInt(timeout, 10) : 5000
}

/**
 * Vérifie si le mode debug est activé
 * @returns {boolean} Mode debug activé
 */
export const isDebugMode = () => {
  return (import.meta.env.VITE_DEBUG_MODE || import.meta.env.REACT_APP_DEBUG_MODE) === 'true' || 
         import.meta.env.NODE_ENV === 'development'
}

/**
 * Obtient l'intervalle de monitoring automatique
 * @returns {number} Intervalle en secondes
 */
export const getMonitoringInterval = () => {
  const interval = import.meta.env.VITE_MONITORING_INTERVAL || import.meta.env.REACT_APP_MONITORING_INTERVAL
  return interval ? parseInt(interval, 10) * 1000 : 30000 // Convertir en ms
}

/**
 * Valide une configuration API
 * @param {Object} apiConfig Configuration à valider
 * @returns {boolean} Configuration valide
 */
export const validateApiConfig = (apiConfig) => {
  if (!apiConfig || typeof apiConfig !== 'object') {
    return false
  }
  
  if (!apiConfig.ip || typeof apiConfig.ip !== 'string') {
    return false
  }
  
  if (!apiConfig.name || typeof apiConfig.name !== 'string') {
    return false
  }
  
  // Validation basique de l'IP/hostname
  const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
  
  return ipPattern.test(apiConfig.ip) || hostnamePattern.test(apiConfig.ip)
}

/**
 * Filtre et valide la liste des APIs
 * @param {Array} apis Liste des APIs à valider
 * @returns {Array} APIs valides
 */
export const validateApiList = (apis) => {
  if (!Array.isArray(apis)) {
    console.error('❌ Configuration APIs invalide: doit être un tableau')
    return []
  }
  
  const validApis = apis.filter(api => {
    const isValid = validateApiConfig(api)
    if (!isValid) {
      console.warn('⚠️ Configuration API invalide ignorée:', api)
    }
    return isValid
  })
  
  console.log(`✅ ${validApis.length}/${apis.length} APIs validées`)
  return validApis
}

/**
 * Génère l'URL complète d'une API
 * @param {Object} apiConfig Configuration de l'API
 * @param {number} port Port (optionnel, utilise le port par défaut)
 * @returns {string} URL complète
 */
export const generateApiUrl = (apiConfig, port = null) => {
  const apiPort = port || getDefaultPort()
  return `http://${apiConfig.ip}:${apiPort}`
}

/**
 * Sauvegarde les APIs personnalisées dans localStorage
 * @param {Array} customApis APIs personnalisées
 */
export const saveCustomApis = (customApis) => {
  try {
    const validCustomApis = validateApiList(customApis)
    localStorage.setItem('custom_apis', JSON.stringify(validCustomApis))
    console.log('✅ APIs personnalisées sauvegardées:', validCustomApis.length)
  } catch (error) {
    console.error('❌ Erreur sauvegarde APIs personnalisées:', error)
  }
}

/**
 * Charge les APIs personnalisées depuis localStorage
 * @returns {Array} APIs personnalisées
 */
export const loadCustomApis = () => {
  try {
    const stored = localStorage.getItem('custom_apis')
    if (stored) {
      const parsed = JSON.parse(stored)
      const validApis = validateApiList(parsed)
      console.log('✅ APIs personnalisées chargées:', validApis.length)
      return validApis
    }
  } catch (error) {
    console.error('❌ Erreur chargement APIs personnalisées:', error)
  }
  return []
}

/**
 * Obtient la configuration complète avec APIs par défaut + personnalisées
 * @returns {Object} Configuration complète
 */
export const getCompleteApiConfig = () => {
  const defaultApis = validateApiList(getDefaultApis())
  const customApis = loadCustomApis()
  
  return {
    defaultApis,
    customApis,
    allApis: [...defaultApis, ...customApis.map(custom => ({ ...custom, isCustom: true }))],
    config: {
      defaultPort: getDefaultPort(),
      defaultSelectedApi: getDefaultSelectedApi(),
      apiTimeout: getApiTimeout(),
      debugMode: isDebugMode(),
      monitoringInterval: getMonitoringInterval()
    }
  }
}

/**
 * Recherche une API par IP dans la configuration
 * @param {string} ip IP à rechercher
 * @returns {Object|null} API trouvée ou null
 */
export const findApiByIp = (ip) => {
  const config = getCompleteApiConfig()
  return config.allApis.find(api => api.ip === ip) || null
}

/**
 * Debug de la configuration (mode développement uniquement)
 */
export const debugApiConfig = () => {
  if (!isDebugMode()) return
  
  console.group('🔧 Configuration APIs - Debug')
  const config = getCompleteApiConfig()
  
  console.log('📊 Statistiques:')
  console.log(`  - APIs par défaut: ${config.defaultApis.length}`)
  console.log(`  - APIs personnalisées: ${config.customApis.length}`)
  console.log(`  - Total: ${config.allApis.length}`)
  
  console.log('⚙️ Configuration:')
  console.log(`  - Port par défaut: ${config.config.defaultPort}`)
  console.log(`  - API par défaut: ${config.config.defaultSelectedApi || 'Aucune'}`)
  console.log(`  - Timeout: ${config.config.apiTimeout}ms`)
  console.log(`  - Mode debug: ${config.config.debugMode}`)
  console.log(`  - Intervalle monitoring: ${config.config.monitoringInterval/1000}s`)
  
  console.log('🌐 APIs disponibles:')
  config.allApis.forEach(api => {
    console.log(`  - ${api.name} (${api.ip}:${config.config.defaultPort})${api.isCustom ? ' [CUSTOM]' : ''}`)
  })
  
  console.groupEnd()
}

// Export par défaut avec toutes les fonctions utiles
export default {
  getDefaultApis,
  getDefaultPort,
  getDefaultSelectedApi,
  getApiTimeout,
  isDebugMode,
  getMonitoringInterval,
  validateApiConfig,
  validateApiList,
  generateApiUrl,
  saveCustomApis,
  loadCustomApis,
  getCompleteApiConfig,
  findApiByIp,
  debugApiConfig
}