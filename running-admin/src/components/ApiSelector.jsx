// running-admin/src/components/ApiSelector.jsx
import { useState, useEffect } from 'react'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  WifiIcon,
  SignalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import apiScanner from '../services/apiScanner'
import ApiTargetSelector from './ApiTargetSelector'

const ApiSelector = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [apis, setApis] = useState(new Map())
  const [selectedApi, setSelectedApi] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [serverHealth, setServerHealth] = useState(null)
  const [lastScan, setLastScan] = useState(null)
  const [targetApi, setTargetApi] = useState(null)

  useEffect(() => {
    // Scan initial
    performScan()
    
    // Health check périodique
    const healthInterval = setInterval(checkServerHealth, 10000)
    
    return () => clearInterval(healthInterval)
  }, [])

  // Quand l'API cible change, refaire un scan
  useEffect(() => {
    if (targetApi) {
      performScan()
    }
  }, [targetApi])

  const performScan = async () => {
    setIsScanning(true)
    try {
      // Utiliser l'API cible si définie
      if (targetApi) {
        apiScanner.setBaseUrl(targetApi.url)
      }
      const results = await apiScanner.scanAvailableApis()
      setApis(results)
      setLastScan(new Date())
    } catch (error) {
      console.error('Erreur lors du scan:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleApiTargetChange = (newTargetApi) => {
    setTargetApi(newTargetApi)
    console.log('🎯 Nouvelle API cible sélectionnée:', newTargetApi.url)
  }

  const checkServerHealth = async () => {
    const isHealthy = await apiScanner.quickHealthCheck()
    setServerHealth(isHealthy)
  }

  const handleApiSelect = (apiPath) => {
    const api = apis.get(apiPath)
    setSelectedApi(api)
    
    // Optionnel: déclencher une action avec l'API sélectionnée
    console.log('API sélectionnée:', api)
  }

  const testApi = async (apiPath) => {
    try {
      const result = await apiScanner.testSpecificApi(apiPath)
      // Mettre à jour l'affichage
      setApis(new Map(apiScanner.discoveredApis))
      console.log('Test API:', apiPath, result)
    } catch (error) {
      console.error('Erreur test API:', error)
    }
  }

  const getStatusIcon = (api) => {
    if (!api.available) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
    
    if (api.responseTime < 200) {
      return <WifiIcon className="h-4 w-4 text-green-500" />
    } else if (api.responseTime < 500) {
      return <SignalIcon className="h-4 w-4 text-yellow-500" />
    } else {
      return <ClockIcon className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (api) => {
    if (!api.available) return 'text-red-600'
    if (api.responseTime < 200) return 'text-green-600'
    if (api.responseTime < 500) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const apisByCategory = apiScanner.getApisByCategory()
  const availableCount = apiScanner.getAvailableCount()
  const totalCount = apiScanner.getTotalCount()

  return (
    <div className="border-t border-green-800 mt-auto">
      {/* Sélecteur d'API cible */}
      <ApiTargetSelector 
        onApiChange={handleApiTargetChange}
        currentApi={targetApi}
      />
      
      {/* Header avec indicateurs */}
      <div 
        className="px-4 py-3 cursor-pointer hover:bg-green-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              serverHealth ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-sm font-medium text-white">
              API Request Scanner ({availableCount}/{totalCount})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isScanning && (
              <ArrowPathIcon className="h-4 w-4 text-green-300 animate-spin" />
            )}
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-green-300" />
            ) : (
              <ChevronUpIcon className="h-4 w-4 text-green-300" />
            )}
          </div>
        </div>
        
        {selectedApi && (
          <div className="mt-1 text-xs text-green-200 truncate">
            Sélectionnée: {selectedApi.path}
          </div>
        )}
      </div>

      {/* Panel étendu */}
      {isExpanded && (
        <div className="bg-green-800 max-h-96 overflow-y-auto scrollbar-thin">
          {/* Contrôles */}
          <div className="px-4 py-2 border-b border-green-700">
            <div className="flex items-center justify-between">
              <button
                onClick={performScan}
                disabled={isScanning}
                className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Scanner les APIs</span>
              </button>
              
              {lastScan && (
                <span className="text-xs text-green-200">
                  {lastScan.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Liste des APIs par catégorie */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {Object.entries(apisByCategory).map(([category, categoryApis]) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-1 bg-green-700 text-xs font-medium text-green-200">
                  {category} ({categoryApis.filter(api => api.available).length}/{categoryApis.length})
                </div>
                
                {categoryApis.map(api => (
                  <div 
                    key={api.path}
                    className={`px-4 py-2 border-b border-green-700 hover:bg-green-700 cursor-pointer transition-colors ${
                      selectedApi?.path === api.path ? 'bg-green-600' : ''
                    }`}
                    onClick={() => handleApiSelect(api.path)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getStatusIcon(api)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">
                            {api.method} {api.path}
                          </div>
                          <div className="text-xs text-green-200 truncate">
                            {api.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {api.available && (
                          <span className={`text-xs ${getStatusColor(api)}`}>
                            {api.responseTime}ms
                          </span>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            testApi(api.path)
                          }}
                          className="p-1 hover:bg-green-600 rounded"
                          title="Tester cette API"
                        >
                          <PlayIcon className="h-3 w-3 text-green-300" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Détails supplémentaires */}
                    {selectedApi?.path === api.path && (
                      <div className="mt-2 pt-2 border-t border-green-600">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-green-200">Status:</span>
                            <span className={`ml-1 ${getStatusColor(api)}`}>
                              {api.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-green-200">Auth:</span>
                            <span className="ml-1 text-white">
                              {api.requiresAuth ? 'Requis' : 'Non'}
                            </span>
                          </div>
                          {api.lastChecked && (
                            <div className="col-span-2">
                              <span className="text-green-200">Testé:</span>
                              <span className="ml-1 text-white">
                                {api.lastChecked.toLocaleString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Debug button */}
          <div className="px-4 py-2 border-t border-green-700">
            <button
              onClick={() => apiScanner.exportScanResults()}
              className="text-xs text-green-300 hover:text-white"
            >
              📊 Exporter scan des requêtes (console)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSelector