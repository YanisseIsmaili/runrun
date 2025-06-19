// running-admin/src/components/DebugPanel.jsx - VERSION ULTRA AMÉLIORÉE
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'
import {
  BugAntIcon,
  CommandLineIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ServerIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const DebugPanel = () => {
  const { user, isAuthenticated } = useAuth()
  const { isConfigured, selectedApi } = useApiConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('console')
  const [autoScroll, setAutoScroll] = useState(true)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [logLevel, setLogLevel] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalLogs: 0,
    errors: 0,
    warnings: 0,
    successes: 0,
    sessionStart: Date.now()
  })
  const [systemMetrics, setSystemMetrics] = useState({
    memory: 0,
    localStorage: 0,
    apiCalls: 0,
    responseTime: 0
  })
  const [apiHealthHistory, setApiHealthHistory] = useState([])
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)
  
  const consoleRef = useRef(null)
  const metricsIntervalRef = useRef(null)
  const healthCheckIntervalRef = useRef(null)

  // Auto-scroll et mise à jour des stats
  useEffect(() => {
    if (autoScroll && consoleRef.current && !isPaused) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
    
    const errorCount = logs.filter(log => log.type === 'error').length
    const warningCount = logs.filter(log => log.type === 'warning').length
    const successCount = logs.filter(log => log.type === 'success').length
    
    setStats(prev => ({
      ...prev,
      totalLogs: logs.length,
      errors: errorCount,
      warnings: warningCount,
      successes: successCount
    }))
  }, [logs, autoScroll, isPaused])

  // Monitoring système
  useEffect(() => {
    if (monitoringEnabled) {
      startSystemMonitoring()
    } else {
      stopSystemMonitoring()
    }
    
    return () => stopSystemMonitoring()
  }, [monitoringEnabled])

  // Fonctions utilitaires
  const addLog = (message, type = 'info', category = 'general', data = null) => {
    if (isPaused) return
    
    const timestamp = new Date().toLocaleTimeString('fr-FR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
    
    const log = { 
      id: Date.now() + Math.random(),
      message, 
      type, 
      category,
      timestamp,
      fullDate: new Date().toISOString(),
      data: data || null,
      stack: type === 'error' ? new Error().stack : null
    }
    
    setLogs(prev => [...prev.slice(-499), log]) // Garder max 500 logs
    
    // Log dans la vraie console aussi
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[DEBUG PANEL ${category.toUpperCase()}] ${message}`, data || '')
  }

  const clearLogs = () => {
    setLogs([])
    addLog('🧹 Console vidée - Session redémarrée', 'info', 'system')
    setStats(prev => ({ ...prev, sessionStart: Date.now() }))
  }

  const downloadLogs = () => {
    const logContent = logs.map(log => {
      let content = `[${log.fullDate}] [${log.category.toUpperCase()}] [${log.type.toUpperCase()}] ${log.message}`
      if (log.data) {
        content += `\nDATA: ${JSON.stringify(log.data, null, 2)}`
      }
      if (log.stack && log.type === 'error') {
        content += `\nSTACK: ${log.stack}`
      }
      return content
    }).join('\n\n')
    
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    addLog('📥 Logs téléchargés avec succès', 'success', 'system')
  }

  const startSystemMonitoring = () => {
    addLog('🚀 Monitoring système activé', 'info', 'system')
    
    // Métriques système toutes les 5 secondes
    metricsIntervalRef.current = setInterval(() => {
      updateSystemMetrics()
    }, 5000)
    
    // Health check API toutes les 30 secondes
    if (selectedApi?.url) {
      healthCheckIntervalRef.current = setInterval(() => {
        performHealthCheck()
      }, 30000)
    }
  }

  const stopSystemMonitoring = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current)
      metricsIntervalRef.current = null
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
    }
    addLog('⏹️ Monitoring système arrêté', 'info', 'system')
  }

  const updateSystemMetrics = () => {
    try {
      // Calcul de l'usage mémoire approximatif
      const memUsage = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null

      // Calcul de l'usage localStorage
      let localStorageSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length
        }
      }

      setSystemMetrics({
        memory: memUsage,
        localStorage: Math.round(localStorageSize / 1024), // KB
        apiCalls: systemMetrics.apiCalls,
        responseTime: systemMetrics.responseTime
      })

      // Log si utilisation élevée
      if (memUsage && memUsage.used > memUsage.limit * 0.8) {
        addLog(`⚠️ Utilisation mémoire élevée: ${memUsage.used}MB/${memUsage.limit}MB`, 'warning', 'system')
      }
      
      if (localStorageSize > 5 * 1024 * 1024) { // > 5MB
        addLog(`⚠️ LocalStorage volumineux: ${Math.round(localStorageSize / 1024 / 1024)}MB`, 'warning', 'system')
      }
    } catch (error) {
      addLog(`❌ Erreur monitoring: ${error.message}`, 'error', 'system')
    }
  }

  const performHealthCheck = async () => {
    if (!selectedApi?.url) return
    
    try {
      const startTime = performance.now()
      const response = await fetch(`${selectedApi.url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(10000)
      })
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      const healthData = {
        timestamp: Date.now(),
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        statusCode: response.status
      }

      if (response.ok) {
        const data = await response.json()
        healthData.data = data
        addLog(`💚 Health Check OK (${responseTime}ms) - DB: ${data.database || 'N/A'}`, 'success', 'api', data)
      } else {
        addLog(`💔 Health Check Failed (${response.status}) - ${responseTime}ms`, 'error', 'api')
      }

      setApiHealthHistory(prev => [...prev.slice(-19), healthData]) // Garder 20 derniers checks
      setSystemMetrics(prev => ({ ...prev, responseTime }))
      
    } catch (error) {
      addLog(`💥 Health Check Error: ${error.message}`, 'error', 'api')
      setApiHealthHistory(prev => [...prev.slice(-19), {
        timestamp: Date.now(),
        status: 'error',
        error: error.message
      }])
    }
  }

  // Tests avancés
  const runAdvancedApiTest = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    addLog('🚀 Début du diagnostic API avancé...', 'info', 'api')
    
    const endpoints = [
      { name: 'Health Check', endpoint: '/api/health', method: 'GET', critical: true },
      { name: 'Authentication', endpoint: '/api/auth/validate', method: 'GET', auth: true },
      { name: 'Routes', endpoint: '/api/routes', method: 'GET', auth: true },
      { name: 'Users', endpoint: '/api/users', method: 'GET', auth: true },
      { name: 'Statistics', endpoint: '/api/stats', method: 'GET', auth: true },
      { name: 'System Info', endpoint: '/api/system/info', method: 'GET', auth: true }
    ]

    let successCount = 0
    let totalTests = endpoints.length

    for (const test of endpoints) {
      try {
        addLog(`🧪 Test ${test.name}...`, 'info', 'api')
        const startTime = performance.now()
        
        let response
        const headers = {}
        
        if (test.auth) {
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
        }

        if (test.endpoint === '/api/health') {
          response = await fetch(`${selectedApi?.url || ''}${test.endpoint}`)
        } else {
          response = await fetch(`${selectedApi?.url || ''}${test.endpoint}`, {
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            signal: AbortSignal.timeout(10000)
          })
        }

        const endTime = performance.now()
        const responseTime = Math.round(endTime - startTime)

        if (response.ok) {
          const data = await response.json()
          addLog(`✅ ${test.name} OK (${responseTime}ms) - Status: ${response.status}`, 'success', 'api', data)
          successCount++
        } else if (response.status === 401 && test.auth) {
          addLog(`🔒 ${test.name} - Protection JWT active (${responseTime}ms)`, 'info', 'api')
          successCount++ // Considéré comme un succès
        } else {
          const errorText = await response.text()
          addLog(`❌ ${test.name} Failed - ${response.status} (${responseTime}ms)`, 'error', 'api', { status: response.status, error: errorText })
        }

        setSystemMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }))
        
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        addLog(`💥 ${test.name} Error: ${error.message}`, 'error', 'api', { error: error.message, stack: error.stack })
      }
    }

    const successRate = Math.round((successCount / totalTests) * 100)
    const resultType = successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error'
    addLog(`🏁 Tests terminés: ${successCount}/${totalTests} réussis (${successRate}%)`, resultType, 'api')
    
    setIsRunningTests(false)
  }

  const runAuthTest = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    addLog('🔐 Diagnostic d\'authentification...', 'info', 'auth')
    
    try {
      // Test 1: Vérification token
      addLog('🎫 Vérification du token...', 'info', 'auth')
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addLog('❌ Aucun token trouvé', 'error', 'auth')
        return
      }
      
      addLog(`✅ Token trouvé: ${token.substring(0, 20)}...`, 'success', 'auth')
      
      // Test 2: Validation token
      const response = await api.auth.validateToken()
      if (response.data.status === 'success') {
        const userData = response.data.data.user
        addLog(`✅ Token valide - User: ${userData.username} (${userData.email})`, 'success', 'auth', userData)
        addLog(`👑 Privilèges: ${userData.is_admin ? 'Admin' : 'User'} | Actif: ${userData.is_active}`, 'info', 'auth')
      } else {
        addLog('❌ Token invalide', 'error', 'auth')
      }
      
      // Test 3: Permissions
      addLog('🛡️ Test des permissions...', 'info', 'auth')
      try {
        await api.users.getAll({ limit: 1 })
        addLog('✅ Accès API users autorisé', 'success', 'auth')
      } catch (error) {
        if (error.response?.status === 401) {
          addLog('❌ Accès API users refusé - Token expiré', 'error', 'auth')
        } else if (error.response?.status === 403) {
          addLog('⚠️ Accès API users refusé - Permissions insuffisantes', 'warning', 'auth')
        } else {
          addLog(`❌ Erreur test permissions: ${error.message}`, 'error', 'auth')
        }
      }
      
    } catch (error) {
      addLog(`💥 Erreur diagnostic auth: ${error.message}`, 'error', 'auth', { error: error.message, stack: error.stack })
    } finally {
      setIsRunningTests(false)
    }
  }

  const runSystemDiagnostic = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    addLog('🔧 Diagnostic système...', 'info', 'system')
    
    try {
      // Test navigateur
      addLog(`🌐 Navigateur: ${navigator.userAgent}`, 'info', 'system')
      addLog(`📱 Platform: ${navigator.platform}`, 'info', 'system')
      addLog(`🌍 Langue: ${navigator.language}`, 'info', 'system')
      
      // Test connexion
      addLog(`📶 En ligne: ${navigator.onLine ? 'Oui' : 'Non'}`, navigator.onLine ? 'success' : 'error', 'system')
      
      // Test stockage
      const storageTest = {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB
      }
      
      Object.entries(storageTest).forEach(([key, value]) => {
        addLog(`💾 ${key}: ${value ? 'Disponible' : 'Indisponible'}`, value ? 'success' : 'error', 'system')
      })
      
      // Test performance
      if (performance.memory) {
        const mem = performance.memory
        addLog(`🧠 Mémoire JS: ${Math.round(mem.usedJSHeapSize/1024/1024)}MB utilisés / ${Math.round(mem.jsHeapSizeLimit/1024/1024)}MB limite`, 'info', 'system')
      }
      
      // Test config API
      addLog(`⚙️ API configurée: ${isConfigured ? 'Oui' : 'Non'}`, isConfigured ? 'success' : 'warning', 'system')
      if (selectedApi) {
        addLog(`🎯 API sélectionnée: ${selectedApi.name} (${selectedApi.url})`, 'info', 'system', selectedApi)
      }
      
      // Test authentification
      addLog(`🔐 Authentifié: ${isAuthenticated ? 'Oui' : 'Non'}`, isAuthenticated ? 'success' : 'warning', 'system')
      if (user) {
        addLog(`👤 Utilisateur: ${user.username} (${user.email})`, 'info', 'system', user)
      }
      
    } catch (error) {
      addLog(`💥 Erreur diagnostic système: ${error.message}`, 'error', 'system')
    } finally {
      setIsRunningTests(false)
    }
  }

  // Filtrage des logs
  const filteredLogs = logs.filter(log => {
    const matchesTab = activeTab === 'console' || log.category === activeTab
    const matchesLevel = logLevel === 'all' || log.type === logLevel
    const matchesSearch = !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesLevel && matchesSearch
  })

  // Formattage des logs
  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-900/30 text-green-300 border-l-green-500'
      case 'error': return 'bg-red-900/30 text-red-300 border-l-red-500'
      case 'warning': return 'bg-yellow-900/30 text-yellow-300 border-l-yellow-500'
      default: return 'text-green-400 border-l-blue-500'
    }
  }

  // Composant de métriques en temps réel
  const MetricsDisplay = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-gray-800 p-2 rounded">
        <div className="text-gray-400">Session</div>
        <div className="text-green-400">{Math.round((Date.now() - stats.sessionStart) / 1000)}s</div>
      </div>
      <div className="bg-gray-800 p-2 rounded">
        <div className="text-gray-400">Logs</div>
        <div className="text-blue-400">{stats.totalLogs}</div>
      </div>
      <div className="bg-gray-800 p-2 rounded">
        <div className="text-gray-400">Erreurs</div>
        <div className="text-red-400">{stats.errors}</div>
      </div>
      <div className="bg-gray-800 p-2 rounded">
        <div className="text-gray-400">API Calls</div>
        <div className="text-yellow-400">{systemMetrics.apiCalls}</div>
      </div>
      {systemMetrics.memory && (
        <div className="bg-gray-800 p-2 rounded col-span-2">
          <div className="text-gray-400">Mémoire JS</div>
          <div className="text-purple-400">{systemMetrics.memory.used}MB / {systemMetrics.memory.limit}MB</div>
        </div>
      )}
    </div>
  )

  // Affichage conditionnel en dev seulement
  if (import.meta.env.NODE_ENV === 'production') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-500 text-white px-3 py-1 rounded text-xs">
          Debug Panel désactivé en production
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bouton Debug avec indicateurs visuels */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn transition-all duration-300 shadow-lg ${
          isOpen 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : stats.errors > 0
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : stats.warnings > 0
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
            : logs.length > 0
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
        title="Debug Panel - Console de développement"
      >
        <BugAntIcon className="h-4 w-4 mr-2" />
        🔧 Debug
        {!isOpen && (
          <div className="flex ml-2 space-x-1">
            {stats.errors > 0 && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full animate-bounce">
                {stats.errors}
              </span>
            )}
            {stats.warnings > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                {stats.warnings}
              </span>
            )}
            {logs.length > 0 && stats.errors === 0 && stats.warnings === 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {logs.length}
              </span>
            )}
          </div>
        )}
      </button>
      
      {/* Panel Debug Principal */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[36rem] h-[40rem] bg-gray-900 border-2 border-green-500 rounded-xl shadow-2xl animate-scale-in overflow-hidden flex flex-col">
          
          {/* Header avancé */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center space-x-3">
              <CommandLineIcon className="h-5 w-5 text-green-400" />
              <div>
                <h3 className="font-semibold text-green-400">Debug Console</h3>
                <div className="text-xs text-gray-400">
                  Session: {Math.round((Date.now() - stats.sessionStart) / 1000)}s | 
                  Logs: {stats.totalLogs} | 
                  Erreurs: {stats.errors}
                </div>
              </div>
              <div className="flex space-x-1">
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  DEV
                </span>
                {monitoringEnabled && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Contrôles rapides */}
              <button
                onClick={() => setMonitoringEnabled(!monitoringEnabled)}
                className={`p-1.5 rounded ${monitoringEnabled ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                title={monitoringEnabled ? 'Arrêter monitoring' : 'Démarrer monitoring'}
              >
                {monitoringEnabled ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
              </button>
              
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-1.5 rounded ${isPaused ? 'bg-orange-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                title={isPaused ? 'Reprendre logs' : 'Mettre en pause'}
              >
                {isPaused ? <PlayIcon className="h-3 w-3" /> : <PauseIcon className="h-3 w-3" />}
              </button>
              
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1.5 rounded ${autoScroll ? 'bg-green-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                title={autoScroll ? 'Désactiver auto-scroll' : 'Activer auto-scroll'}
              >
                {autoScroll ? <EyeIcon className="h-3 w-3" /> : <EyeSlashIcon className="h-3 w-3" />}
              </button>
              
              {logs.length > 0 && (
                <>
                  <button
                    onClick={downloadLogs}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                    title="Télécharger logs"
                  >
                    <ArrowDownTrayIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={clearLogs}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                    title="Vider console"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </>
              )}
              
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
                title="Fermer"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          {/* Onglets et filtres */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
            <div className="flex space-x-1">
              {[
                { id: 'console', label: 'Console', icon: CommandLineIcon },
                { id: 'auth', label: 'Auth', icon: ShieldCheckIcon },
                { id: 'api', label: 'API', icon: ServerIcon },
                { id: 'system', label: 'System', icon: CpuChipIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white'
                      : 'hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                  {tab.id !== 'console' && (
                    <span className="bg-gray-600 text-white px-1 rounded-full text-xs">
                      {logs.filter(log => log.category === tab.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Filtres niveau */}
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 w-24"
              />
              
              {/* Timestamps */}
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={`p-1 text-xs rounded ${showTimestamps ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                title="Afficher/masquer timestamps"
              >
                <ClockIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Boutons d'action rapide */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-850">
            <div className="flex space-x-1">
              <button
                onClick={runAdvancedApiTest}
                disabled={isRunningTests}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
              >
                <ServerIcon className="h-3 w-3" />
                <span>Test API</span>
                {isRunningTests && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
              </button>
              
              <button
                onClick={runAuthTest}
                disabled={isRunningTests}
                className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
              >
                <ShieldCheckIcon className="h-3 w-3" />
                <span>Test Auth</span>
              </button>
              
              <button
                onClick={runSystemDiagnostic}
                disabled={isRunningTests}
                className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded disabled:opacity-50"
              >
                <CpuChipIcon className="h-3 w-3" />
                <span>Diagnostic</span>
              </button>
              
              <button
                onClick={performHealthCheck}
                disabled={isRunningTests}
                className="flex items-center space-x-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded disabled:opacity-50"
              >
                <FireIcon className="h-3 w-3" />
                <span>Health</span>
              </button>
            </div>
            
            <div className="text-xs text-gray-400">
              {filteredLogs.length !== logs.length && `${filteredLogs.length}/${logs.length} logs`}
            </div>
          </div>

          {/* Zone principale */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Console principale */}
            <div className="flex-1 flex flex-col">
              {/* Zone de logs */}
              <div 
                ref={consoleRef}
                className="flex-1 overflow-y-auto p-2 bg-gray-900 font-mono text-xs space-y-1"
              >
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <CommandLineIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Console vide</p>
                      <p className="text-xs mt-1">
                        {logs.length === 0 ? 'Exécutez des tests pour voir les logs' : 'Aucun log ne correspond aux filtres'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`border-l-2 pl-2 py-1 rounded-r ${getLogColor(log.type)} hover:bg-gray-800/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg leading-none">{getLogIcon(log.type)}</span>
                            {showTimestamps && (
                              <span className="text-gray-500 text-xs">[{log.timestamp}]</span>
                            )}
                            <span className="text-gray-400 text-xs uppercase">[{log.category}]</span>
                          </div>
                          <div className="mt-1 break-words">{log.message}</div>
                          
                          {/* Données additionnelles */}
                          {log.data && (
                            <details className="mt-1">
                              <summary className="text-gray-400 cursor-pointer text-xs hover:text-gray-300">
                                📊 Données ({typeof log.data === 'object' ? Object.keys(log.data).length + ' propriétés' : typeof log.data})
                              </summary>
                              <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </details>
                          )}
                          
                          {/* Stack trace pour les erreurs */}
                          {log.stack && log.type === 'error' && (
                            <details className="mt-1">
                              <summary className="text-red-400 cursor-pointer text-xs hover:text-red-300">
                                🔍 Stack Trace
                              </summary>
                              <pre className="mt-1 p-2 bg-red-900/20 rounded text-xs overflow-x-auto text-red-300">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Barre de statut */}
              <div className="p-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span>📊 Total: {stats.totalLogs}</span>
                    <span className="text-green-400">✅ {stats.successes}</span>
                    <span className="text-yellow-400">⚠️ {stats.warnings}</span>
                    <span className="text-red-400">❌ {stats.errors}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isPaused && <span className="text-orange-400">⏸️ PAUSE</span>}
                    {!autoScroll && <span className="text-blue-400">📌 FIXED</span>}
                    {monitoringEnabled && <span className="text-green-400 animate-pulse">🔴 LIVE</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel latéral de métriques */}
            <div className="w-48 border-l border-gray-700 bg-gray-850 p-2 space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <ChartBarIcon className="h-3 w-3 mr-1" />
                  Métriques Session
                </h4>
                <MetricsDisplay />
              </div>

              {/* API Health History */}
              {apiHealthHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center">
                    <FireIcon className="h-3 w-3 mr-1" />
                    API Health
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {apiHealthHistory.slice(-10).map((health, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className={health.status === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                          {health.status === 'healthy' ? '🟢' : '🔴'}
                        </span>
                        <span className="text-gray-400">
                          {health.responseTime ? `${health.responseTime}ms` : 'Error'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(health.timestamp).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos système */}
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <Cog6ToothIcon className="h-3 w-3 mr-1" />
                  Système
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">API:</span>
                    <span className={isConfigured ? 'text-green-400' : 'text-red-400'}>
                      {isConfigured ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auth:</span>
                    <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                      {isAuthenticated ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Online:</span>
                    <span className={navigator.onLine ? 'text-green-400' : 'text-red-400'}>
                      {navigator.onLine ? '✓' : '✗'}
                    </span>
                  </div>
                  {systemMetrics.localStorage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage:</span>
                      <span className="text-blue-400">{systemMetrics.localStorage}KB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  Actions
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => addLog('🎯 Test manuel ajouté', 'info', 'manual')}
                    className="w-full text-left text-xs text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-700"
                  >
                    + Ajouter log test
                  </button>
                  <button
                    onClick={() => {
                      console.clear()
                      addLog('🧹 Console navigateur vidée', 'info', 'system')
                    }}
                    className="w-full text-left text-xs text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-700"
                  >
                    🧹 Clear console
                  </button>
                  <button
                    onClick={() => {
                      const memory = performance.memory
                      if (memory) {
                        addLog(`🧠 Mémoire: ${Math.round(memory.usedJSHeapSize/1024/1024)}MB`, 'info', 'system', memory)
                      }
                    }}
                    className="w-full text-left text-xs text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-gray-700"
                  >
                    📊 Check mémoire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel