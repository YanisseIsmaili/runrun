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
    <div className="card bg-green-800 text-white border-green-700">
      {/* Header toujours visible */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-green-700">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="h-5 w-5 text-green-300" />
          <div>
            <h3 className="text-sm font-medium text-white">Configuration API</h3>
            <p className="text-xs text-green-300">
              {selectedApi ? `Connecté à: ${selectedApi.name}` : 'Aucune API sélectionnée'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedApi && (
            <div className="status-indicator status-connected">
              <div className="flex items-center space-x-1">
                <WifiIcon className="h-4 w-4" />
                <span className="text-xs">
                  {selectedApi.responseTime}ms
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon hover:bg-green-700 rounded text-green-300"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section étendue */}
      {isExpanded && (
        <div>
          {/* Actions */}
          <div className="px-4 py-3 border-b border-green-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">Serveurs disponibles</span>
                <span className="badge badge-success">
                  {availableCount}/{availableApis.length}
                </span>
              </div>
              {isScanning && (
                <ArrowPathIcon className="h-4 w-4 text-green-400 animate-spin" />
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={scanAvailableApis}
                disabled={isScanning}
                className="btn btn-success btn-sm"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scan en cours...' : 'Scanner réseau'}</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary btn-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                <span>Ajouter serveur</span>
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 border-b border-green-700 bg-green-700">
              <div className="space-y-2">
                <label className="form-label text-green-200">
                  Adresse IP ou nom d'hôte
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newApiInput}
                    onChange={(e) => setNewApiInput(e.target.value)}
                    placeholder="ex: 192.168.1.100 ou mon-serveur.local"
                    className="form-input flex-1 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomApi()}
                  />
                  <button
                    onClick={addCustomApi}
                    className="btn btn-success btn-sm"
                  >
                    Ajouter
                  </button>
                </div>
                <p className="text-xs text-green-300">
                  💡 Le port 5000 sera utilisé par défaut
                </p>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {availableApis.length === 0 ? (
              <div className="px-4 py-6 text-center text-green-200 text-sm">
                {isScanning ? 'Scan en cours...' : 'Aucune API trouvée'}
              </div>
            ) : (
              availableApis.map(api => (
                <div
                  key={api.id}
                  className={`px-4 py-3 hover:bg-green-700 cursor-pointer transition-colors border-b border-green-700 ${
                    selectedApi && selectedApi.id === api.id ? 'bg-green-600' : ''
                  }`}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getStatusIcon(api)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white truncate">
                            {api.name}
                          </span>
                          {api.isCustom && (
                            <span className="badge badge-primary text-xs">
                              Custom
                            </span>
                          )}
                          {selectedApi && selectedApi.id === api.id && (
                            <span className="badge badge-warning text-xs">
                              Actif
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-green-200 truncate">
                          {api.url}
                        </div>
                        <div className="text-xs text-green-300 truncate">
                          {api.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col items-end text-xs">
                        {api.responseTime > 0 && (
                          <span className={getResponseTimeColor(api.responseTime)}>
                            {api.responseTime}ms
                          </span>
                        )}
                        <span className="text-green-300 capitalize">
                          {api.status}
                        </span>
                      </div>
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="btn-icon hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors"
                          title="Supprimer cette API"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Info footer */}
          <div className="px-4 py-3 border-t border-green-700 text-xs text-green-300">
            💡 L'API sélectionnée sera utilisée par TOUTES les pages du site.
            <br />
            Configuration globale: {window.GLOBAL_API_CONFIG.baseURL || 'Aucune'}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiTargetSelector