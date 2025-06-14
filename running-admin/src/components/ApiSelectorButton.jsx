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
    setIsOpen(false)
    setShowAddForm(false)
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-400" />
        <span className="truncate">
          {selectedApi ? selectedApi.name : 'Choisir serveur API'}
        </span>
        {selectedApi && (
          <WifiIcon className={`h-4 w-4 ml-2 ${selectedApi.status === 'available' ? 'text-green-500' : 'text-red-500'}`} />
        )}
        <ChevronDownIcon className="h-4 w-4 ml-2" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Serveur API</span>
                <span className="text-xs text-gray-500">
                  ({availableCount}/{availableApis.length})
                </span>
              </div>
              {isScanning && (
                <ArrowPathIcon className="h-4 w-4 text-green-500 animate-spin" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={scanAvailableApis}
                disabled={isScanning}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Scanner</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                <PlusIcon className="h-3 w-3" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newApiInput}
                  onChange={(e) => setNewApiInput(e.target.value)}
                  placeholder="IP ou hostname"
                  className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomApi()}
                />
                <button
                  onClick={addCustomApi}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                >
                  ✓
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-64 overflow-y-auto">
            {availableApis.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                {isScanning ? 'Scan en cours...' : 'Aucune API trouvée'}
              </div>
            ) : (
              availableApis.map(api => (
                <div
                  key={api.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedApi?.id === api.id ? 'bg-green-50' : ''
                  }`}
                  onClick={() => handleApiSelect(api)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getStatusIcon(api)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {api.name}
                          </span>
                          {api.isCustom && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {api.url}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-xs">
                        {api.responseTime > 0 && (
                          <span className={getResponseTimeColor(api.responseTime)}>
                            {api.responseTime}ms
                          </span>
                        )}
                        <div className="text-gray-500 capitalize">
                          {api.status}
                        </div>
                      </div>
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
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
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600">
            💡 Port 5000 par défaut
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSelectorButton