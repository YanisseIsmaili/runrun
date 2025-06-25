// running-admin/src/contexts/ApiConfigContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

// Créer le contexte
const ApiConfigContext = createContext()

// Configuration par défaut
const DEFAULT_APIS = [
  { ip: "192.168.0.47", name: "Dev Server", port: 5000 },
  { ip: "127.0.0.1", name: "Loopback", port: 5000 },
  { ip: "localhost", name: "Serveur Principal", port: 5000 },
  { ip: "192.168.27.66", name: "Serveur Distant", port: 5000 },
  { ip: "192.168.0.1", name: "Gateway", port: 5000 },
  { ip: "10.0.0.1", name: "VPN Gateway", port: 5000 },
  { ip: "192.168.27.77", name: "API Yaniss", port: 5000 }
]

// Provider du contexte
export const ApiConfigProvider = ({ children }) => {
  const [selectedApi, setSelectedApi] = useState(null)
  const [availableApis, setAvailableApis] = useState(DEFAULT_APIS)
  const [isConfigured, setIsConfigured] = useState(false)
  const [customApis, setCustomApis] = useState([])

  // Charger la configuration au démarrage
  useEffect(() => {
    loadConfiguration()
  }, [])

  // Mettre à jour le statut configuré
  useEffect(() => {
    setIsConfigured(!!selectedApi)
    
    // Mettre à jour l'instance axios si API disponible
    if (selectedApi && window.api) {
      const baseURL = `http://${selectedApi.ip}:${selectedApi.port || 5000}`
      window.api.defaults.baseURL = baseURL
      console.log('🔧 API configurée:', baseURL)
    }
  }, [selectedApi])

  const loadConfiguration = () => {
    try {
      // Charger l'API sélectionnée
      const savedApi = localStorage.getItem('selected_api_config')
      if (savedApi) {
        const parsed = JSON.parse(savedApi)
        setSelectedApi(parsed)
        console.log('📂 Configuration API chargée:', parsed.name)
      }

      // Charger les APIs personnalisées
      const savedCustomApis = localStorage.getItem('custom_apis')
      if (savedCustomApis) {
        const parsed = JSON.parse(savedCustomApis)
        setCustomApis(parsed)
        setAvailableApis([...DEFAULT_APIS, ...parsed])
        console.log('📂 APIs personnalisées chargées:', parsed.length)
      }
    } catch (error) {
      console.error('❌ Erreur chargement configuration API:', error)
    }
  }

  const updateSelectedApi = (api) => {
    try {
      setSelectedApi(api)
      
      if (api) {
        // Sauvegarder dans localStorage
        localStorage.setItem('selected_api_config', JSON.stringify(api))
        
        // Générer l'URL complète
        const baseURL = `http://${api.ip}:${api.port || 5000}`
        api.url = baseURL
        
        console.log('✅ API sélectionnée:', api.name, baseURL)
      } else {
        localStorage.removeItem('selected_api_config')
        console.log('🔄 Configuration API réinitialisée')
      }

      // Émettre un événement global pour compatibilité
      window.dispatchEvent(new CustomEvent('apiConfigChanged', { 
        detail: { api, isConfigured: !!api } 
      }))

    } catch (error) {
      console.error('❌ Erreur mise à jour API:', error)
    }
  }

  const addCustomApi = (api) => {
    try {
      // Valider l'API
      if (!api.ip || !api.name) {
        throw new Error('IP et nom requis')
      }

      // Vérifier que l'IP n'existe pas déjà
      const exists = availableApis.some(existing => existing.ip === api.ip)
      if (exists) {
        throw new Error('Cette IP existe déjà')
      }

      const newApi = {
        ...api,
        port: api.port || 5000,
        isCustom: true
      }

      const updatedCustomApis = [...customApis, newApi]
      const updatedAvailableApis = [...DEFAULT_APIS, ...updatedCustomApis]

      setCustomApis(updatedCustomApis)
      setAvailableApis(updatedAvailableApis)

      // Sauvegarder
      localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
      
      console.log('✅ API personnalisée ajoutée:', newApi.name)
      return true
    } catch (error) {
      console.error('❌ Erreur ajout API personnalisée:', error)
      return false
    }
  }

  const removeCustomApi = (ip) => {
    try {
      const updatedCustomApis = customApis.filter(api => api.ip !== ip)
      const updatedAvailableApis = [...DEFAULT_APIS, ...updatedCustomApis]

      setCustomApis(updatedCustomApis)
      setAvailableApis(updatedAvailableApis)

      // Si l'API supprimée était sélectionnée, la désélectionner
      if (selectedApi && selectedApi.ip === ip) {
        updateSelectedApi(null)
      }

      // Sauvegarder
      localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
      
      console.log('🗑️ API personnalisée supprimée:', ip)
      return true
    } catch (error) {
      console.error('❌ Erreur suppression API personnalisée:', error)
      return false
    }
  }

  const testApiConnection = async (api) => {
    try {
      const baseURL = `http://${api.ip}:${api.port || 5000}`
      const startTime = performance.now()
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      const responseTime = Math.round(performance.now() - startTime)
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          responseTime,
          data,
          status: 'healthy'
        }
      } else {
        return {
          success: false,
          responseTime,
          status: 'error',
          error: `HTTP ${response.status}`
        }
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      }
    }
  }

  const getApiUrl = (endpoint = '') => {
    if (!selectedApi) {
      console.warn('⚠️ Aucune API configurée pour générer l\'URL')
      return null
    }
    
    const baseURL = `http://${selectedApi.ip}:${selectedApi.port || 5000}`
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    return `${baseURL}${cleanEndpoint}`
  }

  const resetConfiguration = () => {
    setSelectedApi(null)
    setCustomApis([])
    setAvailableApis(DEFAULT_APIS)
    setIsConfigured(false)
    
    localStorage.removeItem('selected_api_config')
    localStorage.removeItem('custom_apis')
    
    console.log('🔄 Configuration API réinitialisée')
  }

  const exportConfiguration = () => {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      selectedApi,
      customApis,
      settings: {
        defaultPort: 5000
      }
    }
  }

  const importConfiguration = (config) => {
    try {
      if (config.customApis) {
        setCustomApis(config.customApis)
        setAvailableApis([...DEFAULT_APIS, ...config.customApis])
        localStorage.setItem('custom_apis', JSON.stringify(config.customApis))
      }
      
      if (config.selectedApi) {
        updateSelectedApi(config.selectedApi)
      }
      
      console.log('✅ Configuration importée avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur import configuration:', error)
      return false
    }
  }

  // Valeurs du contexte
  const value = {
    // État
    selectedApi,
    availableApis,
    customApis,
    isConfigured,
    
    // Actions
    updateSelectedApi,
    addCustomApi,
    removeCustomApi,
    testApiConnection,
    getApiUrl,
    resetConfiguration,
    exportConfiguration,
    importConfiguration,
    
    // Utilitaires
    reloadConfiguration: loadConfiguration
  }

  return (
    <ApiConfigContext.Provider value={value}>
      {children}
    </ApiConfigContext.Provider>
  )
}

// Hook personnalisé pour utiliser le contexte
export const useApiConfig = () => {
  const context = useContext(ApiConfigContext)
  
  if (!context) {
    throw new Error('useApiConfig doit être utilisé dans un ApiConfigProvider')
  }
  
  return context
}

// Export par défaut
export default ApiConfigContext