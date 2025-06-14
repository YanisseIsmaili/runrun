// running-admin/src/components/ApiSelectorButton.jsx
import { useState, useEffect, useRef } from 'react'
import { 
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerIcon,
  WifiIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

const ApiSelectorButton = ({ onApiChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [availableApis, setAvailableApis] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedApi, setSelectedApi] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiInput, setNewApiInput] = useState('')
  const dropdownRef = useRef(null)

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

  // Charger l'API sélectionnée depuis la config globale
  useEffect(() => {
    const loadSelectedApi = () => {
      if (window.GLOBAL_API_CONFIG && window.GLOBAL_API_CONFIG.selectedApi) {
        setSelectedApi(window.GLOBAL_API_CONFIG.selectedApi)
      } else {
        // Tenter de charger depuis localStorage
        try {
          const saved = localStorage.getItem('selected_api_config')
          if (saved) {
            const api = JSON.parse(saved)
            setSelectedApi(api)
            // Mettre à jour la config globale
            if (window.GLOBAL_API_CONFIG) {
              window.GLOBAL_API_CONFIG.updateConfig(api)
            }
          }
        } catch (error) {
          console.error('Erreur chargement API sauvegardée:', error)
        }
      }
    }

    loadSelectedApi()

    // Écouter les changements de configuration
    const handleConfigChange = (event) => {
      setSelectedApi(event.detail.api)
    }

    window.addEventListener('apiConfigChanged', handleConfigChange)
    return () => window.removeEventListener('apiConfigChanged', handleConfigChange)
  }, [])

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowAddForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setIsOpen(false)

    // Mettre à jour la configuration globale
    if (window.GLOBAL_API_CONFIG) {
      window.GLOBAL_API_CONFIG.updateConfig(api)
    }

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
      if (window.GLOBAL_API_CONFIG) {
        window.GLOBAL_API_CONFIG.updateConfig(null)
      }
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
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'unreachable':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
      case 'error':
        return <XMarkIcon className="h-4 w-4 text-red-500" />
      default:
        return <ServerIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getResponseTimeColor = (responseTime) => {
    if (responseTime <= 100) return 'text-green-600'
    if (responseTime <= 300) return 'text-yellow-600'
    return 'text-red-600'
  }

  const availableCount = availableApis.filter(api => api.status === 'available').length

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 w-full justify-between transition-all duration-300 hover:shadow-lg"
      >
        <span className="flex items-center text-sm font-medium">
          <GlobeAltIcon className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
          {selectedApi ? selectedApi.name : 'Choisir serveur API'}
        </span>
        <div className="flex items-center space-x-2">
          {selectedApi && (
            <div className="flex items-center space-x-1 animate-fade-in">
              <WifiIcon className={`h-4 w-4 transition-colors duration-300 ${
                selectedApi.status === 'available' ? 'text-green-200' : 'text-red-300'
              }`} />
              <span className="text-xs text-green-200">{selectedApi.responseTime}ms</span>
            </div>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 card border-green-200 shadow-xl animate-slide-in-left">
          
          {/* Header */}
          <div className="card-header bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-green-800">Serveur API</span>
                <span className="badge bg-green-600 text-white animate-pulse">
                  {availableCount}/{availableApis.length}
                </span>
              </div>
              {isScanning && (
                <ArrowPathIcon className="h-4 w-4 text-green-600 animate-spin" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-b border-green-100 bg-green-25">
            <div className="flex space-x-2">
              <button
                onClick={scanAvailableApis}
                disabled={isScanning}
                className="btn bg-green-600 hover:bg-green-700 text-white btn-sm transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3 w-3 mr-1 transition-transform duration-300 ${isScanning ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span>{isScanning ? 'Scan...' : 'Scanner'}</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn bg-blue-600 hover:bg-blue-700 text-white btn-sm transition-all duration-300 hover:scale-105"
              >
                <PlusIcon className="h-3 w-3 mr-1 transition-transform duration-300 hover:rotate-90" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 border-b border-green-100 bg-gradient-to-r from-green-50 to-blue-50 animate-fade-in">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newApiInput}
                  onChange={(e) => setNewApiInput(e.target.value)}
                  placeholder="IP ou nom d'hôte"
                  className="form-input flex-1 text-xs border-green-200 focus:border-green-500 focus:ring-green-200 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomApi()}
                />
                <button
                  onClick={addCustomApi}
                  className="btn bg-green-600 hover:bg-green-700 text-white btn-sm transition-all duration-300 hover:scale-105"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-64 overflow-y-auto scrollbar-ultra-thin">
            {availableApis.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm animate-pulse">
                {isScanning ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="ml-2">Scan en cours...</span>
                  </div>
                ) : 'Aucune API trouvée'}
              </div>
            ) : (
              availableApis.map((api, index) => (
                <div
                  key={api.id}
                  className={`px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 cursor-pointer border-b border-green-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm animate-slide-in-right ${
                    selectedApi && selectedApi.id === api.id ? 'bg-gradient-to-r from-green-100 to-green-200 border-l-4 border-l-green-500' : ''
                  }`}
                  style={{animationDelay: `${index * 50}ms`}}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="transition-transform duration-300 hover:scale-110">
                        {getStatusIcon(api)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate transition-colors duration-300">
                            {api.name}
                          </span>
                          {api.isCustom && (
                            <span className="badge bg-blue-500 text-white text-xs animate-pulse">
                              Custom
                            </span>
                          )}
                          {selectedApi && selectedApi.id === api.id && (
                            <span className="badge bg-green-500 text-white text-xs animate-fade-in">
                              ✓ Actif
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate transition-colors duration-300 hover:text-green-600">
                          {api.url}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-xs">
                        {api.responseTime > 0 && (
                          <span className={`transition-all duration-300 font-mono ${getResponseTimeColor(api.responseTime)}`}>
                            {api.responseTime}ms
                          </span>
                        )}
                        <div className="text-gray-500 capitalize text-xs">
                          {api.status}
                        </div>
                      </div>
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-all duration-300 hover:scale-110"
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
          <div className="card-footer text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-t border-green-200">
            <div className="flex items-center space-x-2">
              <span className="animate-pulse">💡</span>
              <span>Port 5000 par défaut • Configuration globale de l'application</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSelectorButton