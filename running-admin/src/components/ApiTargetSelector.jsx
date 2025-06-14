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
  PencilIcon
} from '@heroicons/react/24/outline'

const ApiTargetSelector = ({ onApiChange, currentApi }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableApis, setAvailableApis] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedApi, setSelectedApi] = useState(currentApi || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiInput, setNewApiInput] = useState('')

  // APIs par défaut à scanner (toutes sur port 5000)
  const defaultApis = [
    { ip: 'localhost', name: 'Local Dev' },
    { ip: '127.0.0.1', name: 'Loopback' },
    { ip: '192.168.0.47', name: 'Serveur Principal' },
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

  useEffect(() => {
    // Scan initial au chargement
    scanAvailableApis()
  }, [customApis])

  const scanAvailableApis = async () => {
    setIsScanning(true)
    const discoveredApis = []

    // Combiner les APIs par défaut et personnalisées
    const allApis = [
      ...defaultApis,
      ...customApis.map(custom => ({ ip: custom.ip, name: custom.name }))
    ]

    console.log('🔍 Scan des APIs sur port 5000...')

    for (const apiConfig of allApis) {
      try {
        const apiUrl = `http://${apiConfig.ip}:5000`
        const isReachable = await testApiReachability(apiUrl)
        
        discoveredApis.push({
          id: `${apiConfig.ip}:5000`,
          url: apiUrl,
          ip: apiConfig.ip,
          port: 5000,
          name: apiConfig.name,
          description: `API Running App sur ${apiConfig.ip}`,
          status: isReachable ? 'available' : 'unreachable',
          responseTime: isReachable ? isReachable.responseTime : 0,
          lastChecked: new Date(),
          isCustom: customApis.some(custom => custom.ip === apiConfig.ip)
        })
        
        if (isReachable) {
          console.log(`✅ Trouvé: ${apiUrl} (${isReachable.responseTime}ms)`)
        } else {
          console.log(`❌ Inaccessible: ${apiUrl}`)
        }
      } catch (error) {
        console.log(`⚠️ Erreur: ${apiConfig.ip}:5000`)
      }
    }

    // Trier : disponibles en premier, puis par temps de réponse
    discoveredApis.sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1
      if (a.status === 'available' && b.status === 'available') {
        return a.responseTime - b.responseTime
      }
      return 0
    })

    setAvailableApis(discoveredApis)
    
    // Auto-sélectionner la première API disponible si aucune n'est sélectionnée
    if (!selectedApi && discoveredApis.length > 0) {
      const defaultApi = discoveredApis.find(api => api.status === 'available') || discoveredApis[0]
      setSelectedApi(defaultApi)
      onApiChange?.(defaultApi)
    }

    setIsScanning(false)
    const availableCount = discoveredApis.filter(api => api.status === 'available').length
    console.log(`📡 Scan terminé: ${availableCount}/${discoveredApis.length} API(s) disponible(s)`)
  }

  const testApiReachability = async (apiUrl) => {
    const startTime = Date.now()
    
    try {
      // Test avec un endpoint de santé commun
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(3000) // 3 secondes de timeout
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return { available: true, responseTime }
      }
      
      return false
      
    } catch (error) {
      return false
    }
  }

  const handleApiSelect = (api) => {
    setSelectedApi(api)
    onApiChange?.(api)
    setIsExpanded(false)
    console.log('🎯 API sélectionnée:', api.url)
  }

  const addCustomApi = () => {
    if (!newApiInput.trim()) return

    // Vérifier si c'est une IP/hostname valide
    const ip = newApiInput.trim()
    if (customApis.some(custom => custom.ip === ip)) {
      alert('Cette API existe déjà')
      return
    }

    const newCustomApi = {
      ip: ip,
      name: `Custom ${ip}`,
      addedAt: new Date().toISOString()
    }

    const updatedCustomApis = [...customApis, newCustomApi]
    setCustomApis(updatedCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
    
    setNewApiInput('')
    setShowAddForm(false)
    
    console.log('➕ API ajoutée:', newCustomApi)
  }

  const removeCustomApi = (ip) => {
    const updatedCustomApis = customApis.filter(custom => custom.ip !== ip)
    setCustomApis(updatedCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
    
    // Si l'API supprimée était sélectionnée, désélectionner
    if (selectedApi?.ip === ip) {
      setSelectedApi(null)
      onApiChange?.(null)
    }
    
    console.log('➖ API supprimée:', ip)
  }

  const getStatusIcon = (api) => {
    if (api.status === 'available') {
      return <CheckCircleIcon className="h-4 w-4 text-green-400" />
    } else if (api.status === 'unreachable') {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
    } else {
      return <ServerIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getResponseTimeColor = (responseTime) => {
    if (responseTime === 0) return 'text-gray-400'
    if (responseTime < 100) return 'text-green-400'
    if (responseTime < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  const availableCount = availableApis.filter(api => api.status === 'available').length

  return (
    <div className="border-b border-green-800">
      {/* Header du sélecteur */}
      <div 
        className="px-4 py-3 cursor-pointer hover:bg-green-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GlobeAltIcon className="h-4 w-4 text-green-300" />
            <span className="text-sm font-medium text-white">
              API Selector
            </span>
            <span className="text-xs text-green-200">
              ({availableCount}/{availableApis.length})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isScanning && (
              <ArrowPathIcon className="h-4 w-4 text-green-300 animate-spin" />
            )}
            <WifiIcon className={`h-4 w-4 ${selectedApi?.status === 'available' ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
        </div>
        
        {/* API sélectionnée */}
        {selectedApi && (
          <div className="mt-1 text-xs text-green-200">
            <div className="truncate">
              {selectedApi.name} - {selectedApi.url}
            </div>
            {selectedApi.responseTime > 0 && (
              <div className={`${getResponseTimeColor(selectedApi.responseTime)}`}>
                Réponse: {selectedApi.responseTime}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel étendu */}
      {isExpanded && (
        <div className="bg-green-800 border-t border-green-700">
          {/* Contrôles */}
          <div className="px-4 py-2 border-b border-green-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={scanAvailableApis}
                  disabled={isScanning}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Scanner</span>
                </button>
                
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                >
                  <PlusIcon className="h-3 w-3" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <span className="text-xs text-green-200">
                Port 5000 uniquement
              </span>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 bg-green-900 border-b border-green-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newApiInput}
                  onChange={(e) => setNewApiInput(e.target.value)}
                  placeholder="IP ou hostname (ex: 192.168.1.100)"
                  className="flex-1 px-2 py-1 text-xs bg-white text-gray-900 border border-gray-300 rounded"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomApi()}
                />
                <button
                  onClick={addCustomApi}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-60 overflow-y-auto scrollbar-ultra-thin">
            {availableApis.length === 0 ? (
              <div className="px-4 py-3 text-center text-green-200 text-sm">
                {isScanning ? 'Scan en cours...' : 'Aucune API trouvée'}
              </div>
            ) : (
              availableApis.map(api => (
                <div
                  key={api.id}
                  className={`px-4 py-3 hover:bg-green-700 cursor-pointer transition-colors border-b border-green-700 ${
                    selectedApi?.id === api.id ? 'bg-green-600' : ''
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
                            <span className="text-xs bg-blue-600 text-white px-1 rounded">
                              Custom
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
                        <span className="text-green-300">
                          {api.status}
                        </span>
                      </div>
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white"
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

          {/* Info */}
          <div className="px-4 py-2 border-t border-green-700 text-xs text-green-300">
            💡 Toutes les APIs utilisent le port 5000. Cliquez pendant le scan pour changer d'API.
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiTargetSelector