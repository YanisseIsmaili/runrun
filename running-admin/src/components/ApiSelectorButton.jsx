// running-admin/src/components/ApiSelectorButton.jsx
import { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  CircleStackIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

import apiConfigUtils from '../utils/apiConfig'
import ApiConfigManager from './ApiConfigManager'

const ApiSelectorButton = ({ onApiChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [availableApis, setAvailableApis] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedApi, setSelectedApi] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiInput, setNewApiInput] = useState('')
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
  const [showConfigManager, setShowConfigManager] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef(null)

  // Configuration
  const [apiConfig] = useState(() => apiConfigUtils.getCompleteApiConfig())
  const defaultApis = apiConfig.defaultApis
  const defaultPort = apiConfig.config.defaultPort
  const apiTimeout = apiConfig.config.apiTimeout
  const [customApis, setCustomApis] = useState(() => apiConfig.customApis)

  // Drag & Drop
  const handleMouseDown = (e) => {
    if (e.target.closest('[data-drag-handle]')) {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 500, e.clientY - dragOffset.y))
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Configuration API
  useEffect(() => {
    const loadSelectedApi = () => {
      if (window.GLOBAL_API_CONFIG?.selectedApi) {
        setSelectedApi(window.GLOBAL_API_CONFIG.selectedApi)
      } else {
        try {
          const saved = localStorage.getItem('selected_api_config')
          if (saved) {
            const api = JSON.parse(saved)
            setSelectedApi(api)
            window.GLOBAL_API_CONFIG?.updateConfig(api)
          }
        } catch (error) {
          console.error('Erreur chargement API:', error)
        }
      }
    }

    loadSelectedApi()
    const handleConfigChange = (event) => setSelectedApi(event.detail.api)
    window.addEventListener('apiConfigChanged', handleConfigChange)
    return () => window.removeEventListener('apiConfigChanged', handleConfigChange)
  }, [])

  // Fermer menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-api-menu]') && 
          !buttonRef.current?.contains(event.target)) {
        setIsOpen(false)
        setShowAddForm(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    scanAvailableApis()
  }, [customApis])

  // Test API avancé
  const advancedApiTest = async (apiUrl) => {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), apiTimeout)

      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        try {
          const healthData = await response.json()
          const dbStatus = healthData.database || healthData.status
          const isDatabaseConnected = ['connected', 'healthy', 'success'].includes(dbStatus) ||
                                      healthData.database?.connected === true
          
          return {
            status: 'server_ok',
            serverAccessible: true,
            databaseConnected: isDatabaseConnected,
            responseTime,
            healthData,
            statusCode: response.status,
            details: isDatabaseConnected ? 'Serveur et DB OK' : 'Serveur OK, DB déconnectée',
            diagnosticLevel: 'full'
          }
        } catch {
          return {
            status: 'server_ok_json_error',
            serverAccessible: true,
            databaseConnected: false,
            responseTime,
            statusCode: response.status,
            details: 'Serveur accessible, JSON invalide',
            diagnosticLevel: 'partial'
          }
        }
      } else {
        return {
          status: 'server_error',
          serverAccessible: true,
          databaseConnected: false,
          responseTime,
          statusCode: response.status,
          details: `Erreur HTTP ${response.status}`,
          diagnosticLevel: 'server_only'
        }
      }
    } catch (error) {
      return {
        status: error.name === 'AbortError' ? 'timeout' : 'network_error',
        serverAccessible: false,
        databaseConnected: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        details: error.name === 'AbortError' ? 'Timeout serveur' : 'Erreur réseau',
        diagnosticLevel: 'network_only'
      }
    }
  }

  const scanAvailableApis = async () => {
    setIsScanning(true)
    const discoveredApis = []
    const allApis = [...defaultApis, ...customApis.map(c => ({ ip: c.ip, name: c.name }))]
    
    setScanProgress({ current: 0, total: allApis.length })

    for (let i = 0; i < allApis.length; i++) {
      const apiConfig = allApis[i]
      setScanProgress({ current: i + 1, total: allApis.length })
      
      try {
        const apiUrl = `http://${apiConfig.ip}:${defaultPort}`
        const testResult = await advancedApiTest(apiUrl)
        
        discoveredApis.push({
          id: `${apiConfig.ip}:${defaultPort}`,
          url: apiUrl,
          ip: apiConfig.ip,
          port: defaultPort,
          name: apiConfig.name,
          isCustom: customApis.some(c => c.ip === apiConfig.ip),
          ...testResult
        })
      } catch (error) {
        discoveredApis.push({
          id: `${apiConfig.ip}:${defaultPort}`,
          url: `http://${apiConfig.ip}:${defaultPort}`,
          ip: apiConfig.ip,
          port: defaultPort,
          name: apiConfig.name,
          status: 'critical_error',
          serverAccessible: false,
          databaseConnected: false,
          responseTime: 0,
          error: error.message,
          details: 'Erreur critique',
          diagnosticLevel: 'none',
          isCustom: customApis.some(c => c.ip === apiConfig.ip)
        })
      }
    }

    // Tri par priorité
    discoveredApis.sort((a, b) => {
      if (a.serverAccessible && a.databaseConnected && !(b.serverAccessible && b.databaseConnected)) return -1
      if (b.serverAccessible && b.databaseConnected && !(a.serverAccessible && a.databaseConnected)) return 1
      if (a.serverAccessible && !b.serverAccessible) return -1
      if (b.serverAccessible && !a.serverAccessible) return 1
      if (a.serverAccessible && b.serverAccessible) return a.responseTime - b.responseTime
      return a.name.localeCompare(b.name)
    })

    setAvailableApis(discoveredApis)
    setIsScanning(false)
  }

  const handleApiSelect = (api) => {
    setSelectedApi(api)
    setIsOpen(false)

    try {
      localStorage.setItem('selected_api_config', JSON.stringify(api))
      window.GLOBAL_API_CONFIG?.updateConfig(api)
      onApiChange?.(api)
      
      window.dispatchEvent(new CustomEvent('apiConfigChanged', { detail: { api } }))
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

    const newApi = { ip: newApiInput, name: `Custom ${newApiInput}` }
    const updated = [...customApis, newApi]
    setCustomApis(updated)
    localStorage.setItem('custom_apis', JSON.stringify(updated))
    setNewApiInput('')
    setShowAddForm(false)
  }

  const removeCustomApi = (ipToRemove) => {
    const updated = customApis.filter(api => api.ip !== ipToRemove)
    setCustomApis(updated)
    apiConfigUtils.saveCustomApis(updated)
  }

  // UI Helpers
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

  const getStatusBadge = (api) => {
    if (api.serverAccessible && api.databaseConnected) {
      return (
        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            ✓ FULL
          </span>
          <CircleStackIcon className="h-3 w-3 text-green-600" title="Base de données connectée" />
        </div>
      )
    } else if (api.serverAccessible && !api.databaseConnected) {
      return (
        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            ⚠ DB OFF
          </span>
          <CircleStackIcon className="h-3 w-3 text-red-600" title="Base de données déconnectée" />
        </div>
      )
    } else if (api.status === 'timeout') {
      return (
        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
            ⏱ TIMEOUT
          </span>
          <CircleStackIcon className="h-3 w-3 text-gray-400" title="Timeout - DB inconnue" />
        </div>
      )
    } else {
      return (
        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            ❌ OFF
          </span>
          <CircleStackIcon className="h-3 w-3 text-gray-400" title="Serveur inaccessible" />
        </div>
      )
    }
  }

  const availableCount = availableApis.filter(api => api.serverAccessible && api.databaseConnected).length
  const serverOnlyCount = availableApis.filter(api => api.serverAccessible && !api.databaseConnected).length

  // Calculer position initiale
  const getInitialPosition = () => {
    if (!buttonRef.current) return { x: 100, y: 100 }
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      x: Math.max(10, Math.min(window.innerWidth - 420, rect.left)),
      y: Math.max(10, Math.min(window.innerHeight - 520, rect.bottom + 8))
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bouton Principal */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!position.x && !position.y) {
            setPosition(getInitialPosition())
          }
          setIsOpen(!isOpen)
        }}
        className={`btn transition-all duration-300 w-full ${
          selectedApi?.serverAccessible && selectedApi?.databaseConnected
            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
            : selectedApi?.serverAccessible && !selectedApi?.databaseConnected
            ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg'
            : selectedApi
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg'
            : 'border-green-300 text-green-800 hover:bg-green-50 bg-white/90'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {selectedApi ? (
              <>
                {getApiStatusIcon(selectedApi)}
                <span className="text-sm font-medium">{selectedApi.name}</span>
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
              <CircleStackIcon className={`h-3 w-3 ${
                selectedApi.databaseConnected ? 'text-green-200' : 'text-red-300'
              }`} />
              <span className="text-xs text-green-200">{selectedApi.responseTime}ms</span>
            </div>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Menu Portail */}
      {isOpen && typeof document !== 'undefined' && 
        ReactDOM.createPortal(
          <div
            data-api-menu
            className="fixed z-[99999] w-[400px] card shadow-2xl animate-slide-in-left"
            style={{
              left: position.x,
              top: position.y,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Header Déplaçable */}
            <div 
              data-drag-handle
              className="card-header cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ServerIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Serveurs API</h3>
                    <div className="flex space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                        {availableCount} OK
                      </span>
                      {serverOnlyCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-600 text-white rounded-full">
                          {serverOnlyCount} DB-
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isScanning && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-600 font-medium">
                        {scanProgress.current}/{scanProgress.total}
                      </span>
                      <ArrowPathIcon className="h-4 w-4 text-green-600 animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      backgroundColor: 'white',
                      border: '3px solid #dc2626',
                      color: '#dc2626',
                      padding: '8px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(220,38,38,0.2)',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-red-50"
                    title="Fermer"
                  >
                    <XMarkIcon className="h-4 w-4" style={{ strokeWidth: 3 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-b border-green-100 bg-green-25 space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={scanAvailableApis}
                  disabled={isScanning}
                  className="btn bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white flex-1 transition-all duration-300"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scan...' : 'Scanner'}
                </button>
                
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{
                    backgroundColor: 'white',
                    border: '3px solid black',
                    color: 'black',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-gray-100"
                  title="Ajouter un serveur"
                >
                  <PlusIcon className="h-4 w-4" style={{ strokeWidth: 3 }} />
                </button>
                
                <button
                  onClick={() => setShowConfigManager(true)}
                  style={{
                    backgroundColor: '#2563eb',
                    border: '3px solid #1d4ed8',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(37,99,235,0.3)',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-blue-700"
                  title="Configuration"
                >
                  <Cog6ToothIcon className="h-4 w-4" style={{ strokeWidth: 3 }} />
                </button>
              </div>

              {/* Barre de progression */}
              {isScanning && scanProgress.total > 0 && (
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Formulaire d'ajout */}
            {showAddForm && (
              <div className="px-6 py-4 border-b border-green-100 bg-blue-25">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ajouter un serveur personnalisé
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="IP ou hostname..."
                      value={newApiInput}
                      onChange={(e) => setNewApiInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomApi()}
                      className="form-input flex-1"
                    />
                    <button
                      onClick={handleAddCustomApi}
                      style={{
                        backgroundColor: '#16a34a',
                        border: '3px solid #15803d',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(22,163,74,0.3)',
                        cursor: 'pointer'
                      }}
                      className="hover:bg-green-700"
                      title="Ajouter"
                    >
                      <PlusIcon className="h-4 w-4" style={{ strokeWidth: 3 }} />
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={{
                        backgroundColor: 'white',
                        border: '3px solid #dc2626',
                        color: '#dc2626',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(220,38,38,0.2)',
                        cursor: 'pointer'
                      }}
                      className="hover:bg-red-50"
                      title="Annuler"
                    >
                      <XMarkIcon className="h-4 w-4" style={{ strokeWidth: 3 }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des APIs */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {availableApis.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <ServerIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Aucune API trouvée</p>
                  <p className="text-xs text-gray-400 mt-1">Lancez un scan pour découvrir les serveurs</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {availableApis.map((api, index) => (
                    <div
                      key={api.id}
                      onClick={() => handleApiSelect(api)}
                      className={`p-4 cursor-pointer rounded-xl transition-all duration-200 border-2 animate-slide-in-left ${
                        selectedApi?.id === api.id
                          ? 'bg-green-50 border-green-500 shadow-md'
                          : 'hover:bg-gray-50 border-transparent hover:border-green-200'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getApiStatusIcon(api)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {api.name}
                              </span>
                              {getStatusBadge(api)}
                              {api.isCustom && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {api.ip}:{api.port}
                              {api.statusCode && (
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                  api.statusCode >= 200 && api.statusCode < 300 ? 'bg-green-100 text-green-700' :
                                  api.statusCode >= 400 && api.statusCode < 500 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  HTTP {api.statusCode}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{api.details}</div>
                            
                            {/* Diagnostic avancé DB */}
                            {api.healthData && (
                              <div className="text-xs mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-800">Diagnostic:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    api.databaseConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    DB: {api.healthData.database || 'Inconnue'}
                                  </span>
                                </div>
                                {api.healthData.status && (
                                  <div className="text-blue-700 text-xs mt-1">
                                    Status: {api.healthData.status}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Erreurs détaillées */}
                            {api.errorData && (
                              <div className="text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-red-800 font-medium">Erreur serveur:</div>
                                <div className="text-red-700 text-xs mt-1">
                                  {api.errorData.message || api.error || 'Erreur inconnue'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-3">
                          {api.serverAccessible && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3" />
                              <span className="font-medium">{api.responseTime}ms</span>
                            </div>
                          )}
                          
                          {api.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCustomApi(api.ip)
                              }}
                              style={{
                                backgroundColor: 'white',
                                border: '3px solid #dc2626',
                                color: '#dc2626',
                                padding: '6px',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(220,38,38,0.2)',
                                cursor: 'pointer'
                              }}
                              className="hover:bg-red-50"
                              title="Supprimer cette API personnalisée"
                            >
                              <XMarkIcon className="h-3 w-3" style={{ strokeWidth: 3 }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Statistiques */}
            <div className="card-footer">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{availableCount}</div>
                  <div className="text-xs text-gray-500">Complets</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">{serverOnlyCount}</div>
                  <div className="text-xs text-gray-500">Serveur OK</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {availableApis.length - availableCount - serverOnlyCount}
                  </div>
                  <div className="text-xs text-gray-500">Hors ligne</div>
                </div>
              </div>
              
              {!isScanning && availableApis.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-100 text-center">
                  <div className="text-xs text-gray-500">
                    Temps moyen: {Math.round(
                      availableApis.filter(api => api.responseTime).reduce((acc, api) => acc + api.responseTime, 0) / 
                      availableApis.filter(api => api.responseTime).length || 0
                    )}ms
                  </div>
                </div>
              )}
            </div>
          </div>
          , document.body)
      }
      
      {/* Gestionnaire de configuration */}
      {showConfigManager && (
        <ApiConfigManager 
          isOpen={showConfigManager} 
          onClose={() => setShowConfigManager(false)} 
        />
      )}
    </div>
  )
}

export default ApiSelectorButton