// running-admin/src/utils/globalApiConfig.js
// Configuration globale de l'API pour toute l'application

import { useState, useEffect } from 'react'

class GlobalApiConfig {
  constructor() {
    this.baseURL = null
    this.selectedApi = null
    this.listeners = new Set()
    
    // Initialiser depuis localStorage si disponible
    this.loadFromStorage()
    
    // Exposer globalement
    if (typeof window !== 'undefined') {
      window.GLOBAL_API_CONFIG = this
    }
  }

  /**
   * Charge la configuration depuis localStorage
   */
  loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem('selected_api_config')
      if (savedConfig) {
        const api = JSON.parse(savedConfig)
        this.updateConfig(api, false) // false = ne pas sauvegarder à nouveau
      }
    } catch (error) {
      console.error('Erreur chargement config API depuis localStorage:', error)
    }
  }

  /**
   * Met à jour la configuration API
   * @param {Object|null} api - Objet API ou null pour réinitialiser
   * @param {boolean} saveToStorage - Sauvegarder dans localStorage (défaut: true)
   */
  updateConfig(api, saveToStorage = true) {
    const previousApi = this.selectedApi
    
    this.baseURL = api ? api.url : null
    this.selectedApi = api
    
    console.log('Configuration API mise à jour:', {
      previous: previousApi ? previousApi.name : 'Aucune',
      current: api ? api.name : 'Aucune',
      url: this.baseURL
    })
    
    // Mettre à jour axios instance si disponible
    if (typeof window !== 'undefined' && window.api && api) {
      window.api.defaults.baseURL = api.url
      console.log('Instance axios mise à jour:', api.url)
    }
    
    // Sauvegarder dans localStorage
    if (saveToStorage) {
      if (api) {
        localStorage.setItem('selected_api_config', JSON.stringify(api))
      } else {
        localStorage.removeItem('selected_api_config')
      }
    }
    
    // Notifier tous les listeners
    this.notifyListeners({ api, baseURL: this.baseURL, previous: previousApi })
    
    // Émettre un événement global pour compatibilité
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apiConfigChanged', { 
        detail: { api, baseURL: this.baseURL, previous: previousApi } 
      }))
    }
  }

  /**
   * Obtient la configuration actuelle
   * @returns {Object} Configuration actuelle
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      selectedApi: this.selectedApi,
      isConfigured: this.baseURL !== null
    }
  }

  /**
   * Obtient l'URL de base actuelle
   * @returns {string|null} URL de base ou null
   */
  getBaseURL() {
    return this.baseURL
  }

  /**
   * Obtient l'API sélectionnée
   * @returns {Object|null} API sélectionnée ou null
   */
  getSelectedApi() {
    return this.selectedApi
  }

  /**
   * Vérifie si une API est configurée
   * @returns {boolean} true si configurée
   */
  isConfigured() {
    return this.baseURL !== null
  }

  /**
   * Construit une URL complète avec l'API configurée
   * @param {string} endpoint - Endpoint à ajouter
   * @returns {string|null} URL complète ou null
   */
  buildUrl(endpoint) {
    if (!this.baseURL) {
      console.warn('Aucune API configurée pour construire l\'URL:', endpoint)
      return null
    }
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
    
    return `${cleanBaseURL}${cleanEndpoint}`
  }

  /**
   * Ajoute un listener pour les changements de configuration
   * @param {Function} callback - Fonction à appeler lors des changements
   * @returns {Function} Fonction de cleanup
   */
  addListener(callback) {
    this.listeners.add(callback)
    
    // Retourner une fonction de cleanup
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notifie tous les listeners
   * @param {Object} data - Données du changement
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Erreur dans listener API config:', error)
      }
    })
  }

  /**
   * Réinitialise la configuration
   */
  reset() {
    this.updateConfig(null)
  }

  /**
   * Test de connectivité à l'API configurée
   * @returns {Promise<boolean>} true si l'API répond
   */
  async testConnection() {
    if (!this.baseURL) {
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error('Erreur test connexion API:', error)
      return false
    }
  }

  /**
   * Affiche les informations de debug
   */
  debug() {
    console.group('Configuration API Globale - Debug')
    console.log('Base URL:', this.baseURL)
    console.log('API sélectionnée:', this.selectedApi)
    console.log('Configurée:', this.isConfigured())
    console.log('Listeners actifs:', this.listeners.size)
    
    if (this.selectedApi) {
      console.log('Détails API:')
      console.log('  - Nom:', this.selectedApi.name)
      console.log('  - IP:', this.selectedApi.ip)
      console.log('  - Port:', this.selectedApi.port)
      console.log('  - Statut:', this.selectedApi.status)
      console.log('  - Temps de réponse:', this.selectedApi.responseTime + 'ms')
      console.log('  - Custom:', this.selectedApi.isCustom)
    }
    
    console.groupEnd()
  }

  /**
   * Exporte la configuration pour sauvegarde/import
   * @returns {Object} Configuration exportée
   */
  export() {
    return {
      selectedApi: this.selectedApi,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  }

  /**
   * Importe une configuration
   * @param {Object} config - Configuration à importer
   * @returns {boolean} true si import réussi
   */
  import(config) {
    try {
      if (config.selectedApi) {
        this.updateConfig(config.selectedApi)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur import configuration API:', error)
      return false
    }
  }
}

// Hook React pour utiliser la configuration API
export const useApiConfig = () => {
  const [config, setConfig] = useState(() => globalApiConfig.getConfig())

  useEffect(() => {
    const cleanup = globalApiConfig.addListener((data) => {
      setConfig(globalApiConfig.getConfig())
    })

    return cleanup
  }, [])

  return {
    ...config,
    updateConfig: (api) => globalApiConfig.updateConfig(api),
    reset: () => globalApiConfig.reset(),
    testConnection: () => globalApiConfig.testConnection(),
    buildUrl: (endpoint) => globalApiConfig.buildUrl(endpoint)
  }
}

// Créer l'instance globale
const globalApiConfig = new GlobalApiConfig()

// Exports
export default globalApiConfig
export { GlobalApiConfig }