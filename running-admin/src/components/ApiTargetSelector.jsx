// running-admin/src/components/ApiTargetSelector.jsx
import { useState, useEffect } from 'react'
import { 
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerIcon,
  WifiIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Configuration globale de l'API - accessible partout dans l'app
if (!window.GLOBAL_API_CONFIG) {
  window.GLOBAL_API_CONFIG = {
    baseURL: null,
    selectedApi: null,
    updateConfig: function(api) {
      this.baseURL = api ? api.url : null
      this.selectedApi = api
      
      // Mettre à jour axios instance si disponible
      if (window.api && api) {
        window.api.defaults.baseURL = api.url
        console.log('Configuration globale API mise à jour:', api.url)
      }
      
      // Sauvegarder dans localStorage pour persistance
      if (api) {
        localStorage.setItem('selected_api_config', JSON.stringify(api))
      } else {
        localStorage.removeItem('selected_api_config')
      }
      
      // Émettre un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('apiConfigChanged', { 
        detail: { api, baseURL: this.baseURL } 
      }))
    },
    
    getConfig: function() {
      return {
        baseURL: this.baseURL,
        selectedApi: this.selectedApi
      }
    }
  }
}

const ApiTargetSelector = ({ onApiChange, currentApi, showExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(showExpanded)
  const [availableApis, setAvailableApis] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedApi, setSelectedApi] = useState(currentApi || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiInput, setNewApiInput] = useState('')

  // APIs par défaut à scanner (toutes sur port 5000)
  const defaultApis = [
    { ip: '192.168.0.47', name: 'Dev' },
    { ip: '127.0.0.1', name: 'Loopback' },
    { ip: 'localhost', name: 'Serveur Principal' },
    { ip: '192.168.1.47', name: 'Serveur Alt' },
    { ip: '192.168.0.1', name: 'Gateway' },
    { ip: '10.0.0.1', name: 'VPN Gateway' }
  ]

  // Charger les APIs personnalisées depuis localStorage
  const [customApis, setCustomApis] = useState(() => {
    try {
      const stored = localStorage.getItem('custom_apis')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Charger la configuration API sauvegardée
  useEffect(() => {
    try {
      const savedApiConfig = localStorage.getItem('selected_api_config')
      if (savedApiConfig && !selectedApi) {
        const parsedConfig = JSON.parse(savedApiConfig)
        setSelectedApi(parsedConfig)
        window.GLOBAL_API_CONFIG.updateConfig(parsedConfig)
        if (onApiChange) {
          onApiChange(parsedConfig)
        }
      }
    } catch (error) {
      console.error('Erreur chargement config API:', error)
    }

    // Écouter les changements de configuration depuis d'autres composants
    const handleConfigChange = (event) => {
      setSelectedApi(event.detail.api)
    }

    window.addEventListener('apiConfigChanged', handleConfigChange)
    return () => window.removeEventListener('apiConfigChanged', handleConfigChange)
  }, [onApiChange, selectedApi])

  useEffect(() => {
    // Scan initial au chargement
    scanAvailableApis()
  }, [customApis])

  const testApiReachability = async (apiUrl) => {
    const startTime = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        return responseTime
      }
      return false
    } catch (error) {
      return false
    }
  }

  const scanAvailableApis = async () => {
    setIsScanning(true)
    const discoveredApis = []

    // Combiner les APIs par défaut et personnalisées
    const allApis = [
      ...defaultApis,
      ...customApis.map(custom => ({ ip: custom.ip, name: custom.name }))
    ]

    console.log('Scan des APIs sur port 5000...')

    for (const apiConfig of allApis) {
      try {
        const apiUrl = `http://${apiConfig.ip}:5000`
        const responseTime = await testApiReachability(apiUrl)
        
        discoveredApis.push({
          id: `${apiConfig.ip}:5000`,
          url: apiUrl,
          ip: apiConfig.ip,
          port: 5000,
          name: apiConfig.name,
          description: `API Running App sur ${apiConfig.ip}`,
          status: responseTime ? 'available' : 'unreachable',
          responseTime: responseTime || 0,
          isCustom: customApis.some(custom => custom.ip === apiConfig.ip)
        })

        if (responseTime) {
          console.log(`✅ ${apiConfig.name} (${apiConfig.ip}) - ${responseTime}ms`)
        }
      } catch (error) {
        console.error(`❌ Erreur scan ${apiConfig.name}:`, error)
        discoveredApis.push({
          id: `${apiConfig.ip}:5000`,
          url: `http://${apiConfig.ip}:5000`,
          ip: apiConfig.ip,
          port: 5000,
          name: apiConfig.name,
          description: `API Running App sur ${apiConfig.ip}`,
          status: 'error',
          responseTime: 0,
          isCustom: customApis.some(custom => custom.ip === apiConfig.ip)
        })
      }
    }

    // Trier par disponibilité puis par temps de réponse
    discoveredApis.sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1
      if (b.status === 'available' && a.status !== 'available') return 1
      if (a.status === 'available' && b.status === 'available') {
        return a.responseTime - b.responseTime
      }
      return a.name.localeCompare(b.name)
    })

    setAvailableApis(discoveredApis)
    setIsScanning(false)

    console.log(`Scan terminé: ${discoveredApis.filter(api => api.status === 'available').length}/${discoveredApis.length} APIs disponibles`)
  }

  const handleApiSelect = (api) => {
    console.log('Sélection API:', api.name, api.url)
    
    setSelectedApi(api)
    
    // Mettre à jour la configuration globale
    window.GLOBAL_API_CONFIG.updateConfig(api)
    
    // Notifier le parent
    if (onApiChange) {
      onApiChange(api)
    }

    // Mettre à jour axios si disponible
    if (window.api) {
      window.api.defaults.baseURL = api.url
      console.log('Instance axios mise à jour:', api.url)
    }
  }

  const addCustomApi = () => {
    if (!newApiInput.trim()) return

    const ip = newApiInput.trim()
    const customName = `Custom ${ip}`

    // Vérifier si l'IP existe déjà
    if (customApis.some(api => api.ip === ip)) {
      alert('Cette IP existe déjà dans la liste')
      return
    }

    const newCustomApis = [...customApis, { ip, name: customName }]
    setCustomApis(newCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(newCustomApis))

    setNewApiInput('')
    setShowAddForm(false)

    // Relancer le scan
    setTimeout(() => scanAvailableApis(), 100)
  }

  const removeCustomApi = (ip) => {
    const updatedCustomApis = customApis.filter(api => api.ip !== ip)
    setCustomApis(updatedCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))

    // Si l'API supprimée était sélectionnée, la désélectionner
    if (selectedApi && selectedApi.ip === ip) {
      setSelectedApi(null)
      window.GLOBAL_API_CONFIG.updateConfig(null)
      if (onApiChange) {
        onApiChange(null)
      }
    }

    // Mettre à jour la liste
    setAvailableApis(prev => prev.filter(api => api.ip !== ip))
  }

  const getStatusIcon = (api) => {
    switch (api.status) {
      case 'available':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />
      case 'unreachable':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-400" />
      case 'error':
        return <XMarkIcon className="h-4 w-4 text-red-400" />
      default:
        return <ServerIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getResponseTimeColor = (responseTime) => {
    if (responseTime <= 100) return 'text-green-400'
    if (responseTime <= 300) return 'text-yellow-400'
    return 'text-red-400'
  }

  const availableCount = availableApis.filter(api => api.status === 'available').length

  return (
    <div className="card bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white border-green-600 shadow-xl overflow-hidden">
      {/* Header toujours visible */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-green-600 bg-gradient-to-r from-green-700/50 to-green-600/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600/30 rounded-lg backdrop-blur-sm animate-pulse">
            <Cog6ToothIcon className="h-5 w-5 text-green-200" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Configuration API</h3>
            <p className="text-xs text-green-200 transition-all duration-300">
              {selectedApi ? `🟢 Connecté à: ${selectedApi.name}` : '🔴 Aucune API sélectionnée'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedApi && (
            <div className="px-3 py-1 bg-green-600/50 rounded-full backdrop-blur-sm animate-fade-in">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <WifiIcon className="h-4 w-4 text-green-200" />
                <span className="text-xs text-green-100 font-mono">
                  {selectedApi.responseTime}ms
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon hover:bg-green-600/50 rounded-lg text-green-200 hover:text-white transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          >
            <PencilIcon className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Section étendue */}
      {isExpanded && (
        <div className="animate-slide-in-left">
          {/* Actions */}
          <div className="px-4 py-3 border-b border-green-600 bg-gradient-to-r from-green-700/30 to-green-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">Serveurs disponibles</span>
                <div className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold animate-pulse">
                  {availableCount}/{availableApis.length}
                </div>
              </div>
              {isScanning && (
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className="h-4 w-4 text-green-300 animate-spin" />
                  <span className="text-xs text-green-200">Scanning...</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={scanAvailableApis}
                disabled={isScanning}
                className="btn bg-green-600 hover:bg-green-500 text-white btn-sm transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 transition-transform duration-300 ${isScanning ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span>{isScanning ? 'Scan en cours...' : '🔍 Scanner réseau'}</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn bg-blue-600 hover:bg-blue-500 text-white btn-sm transition-all duration-300 hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mr-1 transition-transform duration-300 hover:rotate-90" />
                <span>➕ Ajouter serveur</span>
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 border-b border-green-600 bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm animate-fade-in">
              <div className="space-y-3">
                <label className="form-label text-green-100 flex items-center space-x-2">
                  <ServerIcon className="h-4 w-4" />
                  <span>Adresse IP ou nom d'hôte</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newApiInput}
                    onChange={(e) => setNewApiInput(e.target.value)}
                    placeholder="ex: 192.168.1.100 ou mon-serveur.local"
                    className="form-input flex-1 text-sm bg-white/90 border-green-300 focus:border-green-400 focus:ring-green-200 transition-all duration-300 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomApi()}
                  />
                  <button
                    onClick={addCustomApi}
                    className="btn bg-green-600 hover:bg-green-500 text-white btn-sm transition-all duration-300 hover:scale-105"
                  >
                    ✅ Ajouter
                  </button>
                </div>
                <p className="text-xs text-green-200 flex items-center space-x-1">
                  <span className="animate-pulse">💡</span>
                  <span>Le port 5000 sera utilisé par défaut</span>
                </p>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-80 overflow-y-auto scrollbar-ultra-thin">
            {availableApis.length === 0 ? (
              <div className="px-4 py-8 text-center text-green-200 text-sm">
                {isScanning ? (
                  <div className="flex flex-col items-center space-y-3 animate-fade-in">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span>🔍 Recherche des serveurs...</span>
                  </div>
                ) : (
                  <div className="animate-pulse">
                    <ServerIcon className="h-8 w-8 mx-auto text-green-300 mb-2" />
                    <span>Aucune API trouvée</span>
                  </div>
                )}
              </div>
            ) : (
              availableApis.map((api, index) => (
                <div
                  key={api.id}
                  className={`px-4 py-3 hover:bg-gradient-to-r hover:from-green-600/30 hover:to-green-500/30 cursor-pointer transition-all duration-300 hover:scale-[1.01] border-b border-green-600/30 animate-slide-in-right backdrop-blur-sm ${
                    selectedApi && selectedApi.id === api.id ? 'bg-gradient-to-r from-green-500/40 to-green-400/40 border-l-4 border-l-green-300 shadow-lg' : ''
                  }`}
                  style={{animationDelay: `${index * 100}ms`}}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="transition-all duration-300 hover:scale-125 hover:rotate-12">
                        {getStatusIcon(api)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white truncate transition-all duration-300 hover:text-green-200">
                            {api.name}
                          </span>
                          {api.isCustom && (
                            <span className="px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full animate-pulse backdrop-blur-sm">
                              🔧 Custom
                            </span>
                          )}
                          {selectedApi && selectedApi.id === api.id && (
                            <span className="px-2 py-1 bg-green-400 text-green-900 text-xs rounded-full animate-fade-in font-bold">
                              ✨ Actif
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-green-200 truncate transition-all duration-300 hover:text-green-100 font-mono">
                          🌐 {api.url}
                        </div>
                        <div className="text-xs text-green-300 truncate transition-all duration-300">
                          📡 {api.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col items-end text-xs">
                        {api.responseTime > 0 && (
                          <div className="px-2 py-1 bg-black/20 rounded-full backdrop-blur-sm">
                            <span className={`transition-all duration-300 font-mono font-bold ${getResponseTimeColor(api.responseTime)}`}>
                              ⚡ {api.responseTime}ms
                            </span>
                          </div>
                        )}
                        <span className="text-green-200 capitalize text-xs mt-1 font-medium">
                          {api.status === 'available' ? '🟢 En ligne' : 
                           api.status === 'unreachable' ? '🟡 Inaccessible' : 
                           '🔴 Erreur'}
                        </span>
                      </div>
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="btn-icon hover:bg-red-500/80 rounded-lg text-red-300 hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-12 backdrop-blur-sm"
                          title="Supprimer cette API"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info footer */}
          <div className="px-4 py-3 border-t border-green-600 bg-gradient-to-r from-green-700/20 to-green-600/20 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-green-200">
              <div className="flex items-center space-x-2">
                <span className="animate-pulse">💡</span>
                <span>Configuration globale de l'application</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-300 font-mono">
                  🌐 {window.GLOBAL_API_CONFIG.baseURL || 'Aucune'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiTargetSelector