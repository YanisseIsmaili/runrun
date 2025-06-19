// running-admin/src/components/ApiSelectorButton.jsx
import { useState, useEffect, useRef } from 'react'
import { 
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  WifiIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  CircleStackIcon,
  NoSymbolIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const ApiSelectorButton = ({ onApiChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [availableApis, setAvailableApis] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedApi, setSelectedApi] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiInput, setNewApiInput] = useState('')
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const dropdownRef = useRef(null)

  // APIs par défaut à scanner (toutes sur port 5000)
  const defaultApis = [
    { ip: '192.168.0.47', name: 'Dev' },
    { ip: '127.0.0.1', name: 'Loopback' },
    { ip: 'localhost', name: 'Serveur Principal' },
    { ip: '192.168.27.66', name: 'Serveur Distant' },
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
        try {
          const saved = localStorage.getItem('selected_api_config')
          if (saved) {
            const api = JSON.parse(saved)
            setSelectedApi(api)
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
    scanAvailableApis()
  }, [customApis])

  /**
   * Test avancé de l'API avec diagnostic détaillé
   * @param {string} apiUrl - URL de l'API à tester
   * @returns {Object} Résultat détaillé du test
   */
  const advancedApiTest = async (apiUrl) => {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

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
        // Serveur accessible - analyser la réponse
        try {
          const healthData = await response.json()
          
          // Analyser le statut de la base de données
          const dbStatus = healthData.database || healthData.status
          const isDatabaseConnected = dbStatus === 'connected' || 
                                      dbStatus === 'healthy' || 
                                      dbStatus === 'success' ||
                                      (healthData.database && healthData.database.connected === true)
          
          return {
            status: 'server_ok',
            serverAccessible: true,
            databaseConnected: isDatabaseConnected,
            responseTime,
            healthData,
            statusCode: response.status,
            details: isDatabaseConnected ? 'Serveur et base de données OK' : 'Serveur OK mais base de données déconnectée',
            diagnosticLevel: 'full'
          }
        } catch (parseError) {
          // Réponse 200 mais JSON invalide
          return {
            status: 'server_ok_json_error',
            serverAccessible: true,
            databaseConnected: false,
            responseTime,
            statusCode: response.status,
            details: 'Serveur accessible mais réponse JSON invalide',
            diagnosticLevel: 'partial'
          }
        }
      } else if (response.status === 500) {
        // Serveur accessible mais erreur interne (probablement DB)
        try {
          const errorData = await response.json()
          return {
            status: 'server_error',
            serverAccessible: true,
            databaseConnected: false,
            responseTime,
            statusCode: response.status,
            errorData,
            details: 'Serveur accessible - Erreur interne (vérifiez la base de données)',
            diagnosticLevel: 'server_only'
          }
        } catch {
          return {
            status: 'server_error',
            serverAccessible: true,
            databaseConnected: false,
            responseTime,
            statusCode: response.status,
            details: 'Serveur accessible - Erreur 500 (probable problème DB)',
            diagnosticLevel: 'server_only'
          }
        }
      } else {
        // Autres codes d'erreur HTTP
        return {
          status: 'server_http_error',
          serverAccessible: true,
          databaseConnected: false,
          responseTime,
          statusCode: response.status,
          details: `Serveur accessible - Erreur HTTP ${response.status}`,
          diagnosticLevel: 'server_only'
        }
      }
      
    } catch (error) {
      // Erreur de connexion réseau
      if (error.name === 'AbortError') {
        return {
          status: 'timeout',
          serverAccessible: false,
          databaseConnected: false,
          responseTime: Date.now() - startTime,
          error: error.message,
          details: 'Timeout - Serveur non accessible (>5s)',
          diagnosticLevel: 'network_only'
        }
      } else if (error.message.includes('fetch')) {
        return {
          status: 'network_error',
          serverAccessible: false,
          databaseConnected: false,
          responseTime: Date.now() - startTime,
          error: error.message,
          details: 'Erreur réseau - Serveur non accessible',
          diagnosticLevel: 'network_only'
        }
      } else {
        return {
          status: 'unknown_error',
          serverAccessible: false,
          databaseConnected: false,
          responseTime: Date.now() - startTime,
          error: error.message,
          details: 'Erreur inconnue lors du test',
          diagnosticLevel: 'none'
        }
      }
    }
  }

  const scanAvailableApis = async () => {
    setIsScanning(true)
    setScanProgress({ current: 0, total: 0 })
    const discoveredApis = []

    // Combiner les APIs par défaut et personnalisées
    const allApis = [
      ...defaultApis,
      ...customApis.map(custom => ({ ip: custom.ip, name: custom.name }))
    ]

    setScanProgress({ current: 0, total: allApis.length })
    console.log('🔍 Scan avancé des APIs sur port 5000...')

    for (let i = 0; i < allApis.length; i++) {
      const apiConfig = allApis[i]
      setScanProgress({ current: i + 1, total: allApis.length })
      
      try {
        const apiUrl = `http://${apiConfig.ip}:5000`
        console.log(`🧪 Test ${apiConfig.name} (${apiConfig.ip})...`)
        
        const testResult = await advancedApiTest(apiUrl)
        
        discoveredApis.push({
          id: `${apiConfig.ip}:5000`,
          url: apiUrl,
          ip: apiConfig.ip,
          port: 5000,
          name: apiConfig.name,
          description: `API Running App sur ${apiConfig.ip}`,
          isCustom: customApis.some(custom => custom.ip === apiConfig.ip),
          ...testResult
        })

        // Log détaillé selon le résultat
        if (testResult.serverAccessible && testResult.databaseConnected) {
          console.log(`✅ ${apiConfig.name}: Serveur + DB OK (${testResult.responseTime}ms)`)
        } else if (testResult.serverAccessible && !testResult.databaseConnected) {
          console.log(`⚠️ ${apiConfig.name}: Serveur OK, DB déconnectée (${testResult.responseTime}ms)`)
        } else {
          console.log(`❌ ${apiConfig.name}: ${testResult.details}`)
        }

      } catch (error) {
        console.error(`💥 Erreur critique scan ${apiConfig.name}:`, error)
        discoveredApis.push({
          id: `${apiConfig.ip}:5000`,
          url: `http://${apiConfig.ip}:5000`,
          ip: apiConfig.ip,
          port: 5000,
          name: apiConfig.name,
          description: `API Running App sur ${apiConfig.ip}`,
          status: 'critical_error',
          serverAccessible: false,
          databaseConnected: false,
          responseTime: 0,
          error: error.message,
          details: 'Erreur critique pendant le test',
          diagnosticLevel: 'none',
          isCustom: customApis.some(custom => custom.ip === apiConfig.ip)
        })
      }
    }

    // Trier par priorité: OK complet > Serveur OK > Erreurs
    discoveredApis.sort((a, b) => {
      // Priorité 1: Serveur + DB OK
      if (a.serverAccessible && a.databaseConnected && !(b.serverAccessible && b.databaseConnected)) return -1
      if (b.serverAccessible && b.databaseConnected && !(a.serverAccessible && a.databaseConnected)) return 1
      
      // Priorité 2: Serveur OK (même si DB KO)
      if (a.serverAccessible && !b.serverAccessible) return -1
      if (b.serverAccessible && !a.serverAccessible) return 1
      
      // Priorité 3: Temps de réponse pour les OK
      if (a.serverAccessible && b.serverAccessible) {
        return a.responseTime - b.responseTime
      }
      
      // Sinon tri par nom
      return a.name.localeCompare(b.name)
    })

    setAvailableApis(discoveredApis)
    setIsScanning(false)
    setScanProgress({ current: 0, total: 0 })

    const okCount = discoveredApis.filter(api => api.serverAccessible && api.databaseConnected).length
    const serverOnlyCount = discoveredApis.filter(api => api.serverAccessible && !api.databaseConnected).length
    const offlineCount = discoveredApis.filter(api => !api.serverAccessible).length
    
    console.log(`🏁 Scan terminé: ${okCount} OK complets, ${serverOnlyCount} serveur seul, ${offlineCount} hors ligne`)
  }

  const handleApiSelect = (api) => {
    console.log('Sélection API:', api)
    setSelectedApi(api)
    setIsOpen(false)

    // Sauvegarder la sélection
    try {
      localStorage.setItem('selected_api_config', JSON.stringify(api))
      if (window.GLOBAL_API_CONFIG) {
        window.GLOBAL_API_CONFIG.updateConfig(api)
      }
      if (onApiChange) {
        onApiChange(api)
      }
      
      // Émettre un événement global
      window.dispatchEvent(new CustomEvent('apiConfigChanged', { 
        detail: { api } 
      }))
    } catch (error) {
      console.error('Erreur sauvegarde API:', error)
    }
  }

  const handleAddCustomApi = () => {
    if (!newApiInput.trim()) return

    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/

    if (!ipPattern.test(newApiInput) && !hostnamePattern.test(newApiInput)) {
      alert('Veuillez entrer une adresse IP ou hostname valide')
      return
    }

    if (customApis.some(api => api.ip === newApiInput)) {
      alert('Cette API est déjà dans la liste')
      return
    }

    const newApi = {
      ip: newApiInput,
      name: `Custom ${newApiInput}`
    }

    const updatedCustomApis = [...customApis, newApi]
    setCustomApis(updatedCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
    setNewApiInput('')
    setShowAddForm(false)
  }

  const removeCustomApi = (ipToRemove) => {
    const updatedCustomApis = customApis.filter(api => api.ip !== ipToRemove)
    setCustomApis(updatedCustomApis)
    localStorage.setItem('custom_apis', JSON.stringify(updatedCustomApis))
  }

  /**
   * Obtient l'icône appropriée selon l'état de l'API avec diagnostic avancé
   */
  const getApiStatusIcon = (api) => {
    if (api.serverAccessible && api.databaseConnected) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    } else if (api.serverAccessible && !api.databaseConnected) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
    } else if (api.status === 'timeout') {
      return <ClockIcon className="h-4 w-4 text-orange-500" />
    } else {
      return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
    }
  }

  /**
   * Obtient la couleur du texte selon l'état avec nuances
   */
  const getApiStatusColor = (api) => {
    if (api.serverAccessible && api.databaseConnected) {
      return 'text-green-600'
    } else if (api.serverAccessible && !api.databaseConnected) {
      return 'text-yellow-600'
    } else if (api.status === 'timeout') {
      return 'text-orange-600'
    } else {
      return 'text-red-600'
    }
  }

  /**
   * Obtient le badge de statut avec détails avancés
   */
  const getStatusBadge = (api) => {
    if (api.serverAccessible && api.databaseConnected) {
      return <span className="badge bg-green-500 text-white">✓ OK</span>
    } else if (api.serverAccessible && !api.databaseConnected) {
      return <span className="badge bg-yellow-500 text-white">⚠ DB</span>
    } else if (api.status === 'timeout') {
      return <span className="badge bg-orange-500 text-white">⏱ TIME</span>
    } else if (api.status === 'network_error') {
      return <span className="badge bg-red-500 text-white">🌐 NET</span>
    } else {
      return <span className="badge bg-gray-500 text-white">❌ OFF</span>
    }
  }

  /**
   * Obtient le badge de diagnostic technique
   */
  const getDiagnosticBadge = (api) => {
    if (!api.diagnosticLevel) return null

    const badges = {
      'full': <span className="badge bg-blue-500 text-white text-xs">🔍 Full</span>,
      'partial': <span className="badge bg-purple-500 text-white text-xs">⚡ Partial</span>,
      'server_only': <span className="badge bg-orange-500 text-white text-xs">🖥️ Server</span>,
      'network_only': <span className="badge bg-red-500 text-white text-xs">📡 Network</span>,
      'none': <span className="badge bg-gray-500 text-white text-xs">❓ None</span>
    }

    return badges[api.diagnosticLevel] || null
  }

  const availableCount = availableApis.filter(api => api.serverAccessible && api.databaseConnected).length
  const serverOnlyCount = availableApis.filter(api => api.serverAccessible && !api.databaseConnected).length

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn transition-all duration-300 w-full ${
          selectedApi && selectedApi.serverAccessible && selectedApi.databaseConnected
            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            : selectedApi && selectedApi.serverAccessible && !selectedApi.databaseConnected
            ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
            : selectedApi
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
            : 'border-green-300 text-green-800 hover:bg-green-50'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {selectedApi ? (
              <>
                {getApiStatusIcon(selectedApi)}
                <span className="text-sm font-medium">
                  {selectedApi.name}
                </span>
              </>
            ) : (
              <>
                <ServerIcon className="h-4 w-4" />
                <span className="text-sm">Sélectionner API</span>
              </>
            )}
          </div>
          
          {selectedApi && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <CircleStackIcon className={`h-3 w-3 ${
                  selectedApi.databaseConnected ? 'text-green-200' : 'text-red-300'
                }`} />
                <span className="text-xs text-green-200">{selectedApi.responseTime}ms</span>
              </div>
            </div>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-96 card border-green-200 shadow-xl animate-slide-in-left">
          
          {/* Header avec compteurs */}
          <div className="card-header bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-green-800">Serveurs API</span>
                <div className="flex space-x-1">
                  <span className="badge bg-green-600 text-white">{availableCount} OK</span>
                  {serverOnlyCount > 0 && (
                    <span className="badge bg-yellow-600 text-white">{serverOnlyCount} DB-</span>
                  )}
                </div>
              </div>
              {isScanning && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600">
                    {scanProgress.current}/{scanProgress.total}
                  </span>
                  <ArrowPathIcon className="h-4 w-4 text-green-600 animate-spin" />
                </div>
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
                className="btn border-green-300 text-green-700 hover:bg-green-50 btn-sm"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Ajouter
              </button>
            </div>

            {/* Barre de progression du scan */}
            {isScanning && scanProgress.total > 0 && (
              <div className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="px-4 py-3 border-b border-green-100 bg-blue-25">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="IP ou hostname..."
                  value={newApiInput}
                  onChange={(e) => setNewApiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomApi()}
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={handleAddCustomApi}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white btn-sm"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn border-gray-300 text-gray-600 hover:bg-gray-50 btn-sm"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Liste des APIs */}
          <div className="max-h-72 overflow-y-auto">
            {availableApis.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <NoSymbolIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucune API trouvée</p>
                <p className="text-xs text-gray-400">Lancez un scan pour découvrir les serveurs</p>
              </div>
            ) : (
              availableApis.map((api) => (
                <div
                  key={api.id}
                  onClick={() => handleApiSelect(api)}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 ${
                    selectedApi && selectedApi.id === api.id
                      ? 'bg-green-50 border-l-green-500'
                      : 'hover:bg-gray-50 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getApiStatusIcon(api)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getApiStatusColor(api)}`}>
                            {api.name}
                          </span>
                          {getStatusBadge(api)}
                          {getDiagnosticBadge(api)}
                          {api.isCustom && (
                            <span className="badge bg-blue-500 text-white">Custom</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {api.ip}:{api.port}
                          {api.statusCode && (
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              api.statusCode >= 200 && api.statusCode < 300 ? 'bg-green-100 text-green-700' :
                              api.statusCode >= 400 && api.statusCode < 500 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              HTTP {api.statusCode}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {api.details}
                        </div>
                        {/* Informations de diagnostic avancées */}
                        {api.healthData && (
                          <div className="text-xs text-blue-600 mt-1">
                            🔍 DB: {api.healthData.database || 'N/A'} | 
                            Status: {api.healthData.status || 'N/A'}
                          </div>
                        )}
                        {api.errorData && (
                          <div className="text-xs text-red-600 mt-1">
                            ❌ Erreur: {api.errorData.message || api.error || 'Inconnue'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {api.serverAccessible && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          <span>{api.responseTime}ms</span>
                        </div>
                      )}
                      
                      {api.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomApi(api.ip)
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Supprimer cette API personnalisée"
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

          {/* Footer avec légende et statistiques avancées */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
            {/* Statistiques détaillées */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-green-600">{availableCount}</div>
                <div className="text-gray-500">Complets</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{serverOnlyCount}</div>
                <div className="text-gray-500">Serveur OK</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">
                  {availableApis.length - availableCount - serverOnlyCount}
                </div>
                <div className="text-gray-500">Hors ligne</div>
              </div>
            </div>

            {/* Légende des états */}
            <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>DB déconnectée</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Timeout</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Hors ligne</span>
                </div>
              </div>
              
              {/* Temps de scan */}
              {!isScanning && availableApis.length > 0 && (
                <div className="text-gray-400">
                  Scan: {Math.round(availableApis.reduce((acc, api) => acc + (api.responseTime || 0), 0) / availableApis.length)}ms moy.
                </div>
              )}
            </div>

            {/* Indicateur de qualité du scan */}
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Qualité du diagnostic:</span>
                <div className="flex space-x-1">
                  {availableApis.filter(api => api.diagnosticLevel === 'full').length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {availableApis.filter(api => api.diagnosticLevel === 'full').length} Complets
                    </span>
                  )}
                  {availableApis.filter(api => api.diagnosticLevel === 'partial').length > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {availableApis.filter(api => api.diagnosticLevel === 'partial').length} Partiels
                    </span>
                  )}
                  {availableApis.filter(api => api.diagnosticLevel === 'server_only').length > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {availableApis.filter(api => api.diagnosticLevel === 'server_only').length} Serveur
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSelectorButton