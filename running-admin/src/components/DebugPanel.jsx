// running-admin/src/components/DebugPanel.jsx - VERSION AMÉLIORÉE AVEC CONSOLE
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
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const DebugPanel = () => {
  const { user, isAuthenticated } = useAuth()
  const { isConfigured, selectedApi } = useApiConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('console') // console, auth, api, system
  const [autoScroll, setAutoScroll] = useState(true)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const consoleRef = useRef(null)

  // Auto-scroll vers le bas quand de nouveaux logs arrivent
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Fonction pour ajouter des logs avec types et couleurs
  const addLog = (message, type = 'info', category = 'general') => {
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
      fullDate: new Date().toISOString()
    }
    
    setLogs(prev => [...prev, log])
    console.log(`[DEBUG PANEL ${category.toUpperCase()}] ${message}`)
  }

  // Test d'authentification complet
  const runAuthTest = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    addLog('🔐 Début des tests d\'authentification...', 'info', 'auth')
    
    try {
      // Test 1: Connexion API
      addLog('📡 Test de connexion API...', 'info', 'auth')
      await api.auth.testConnection()
      addLog('✅ API accessible et fonctionnelle', 'success', 'auth')
      
      // Test 2: Validation du token
      addLog('🎫 Validation du token actuel...', 'info', 'auth')
      const response = await api.auth.validateToken()
      
      if (response.data.status === 'success') {
        const userData = response.data.data.user
        addLog(`✅ Token valide - Utilisateur: ${userData.username}`, 'success', 'auth')
        addLog(`👤 Email: ${userData.email}`, 'info', 'auth')
        addLog(`👑 Admin: ${userData.is_admin ? 'Oui' : 'Non'}`, userData.is_admin ? 'success' : 'warning', 'auth')
        addLog(`📅 Dernière connexion: ${userData.last_login || 'N/A'}`, 'info', 'auth')
      } else {
        addLog('❌ Token invalide ou expiré', 'error', 'auth')
      }
      
      // Test 3: Permissions et accès aux routes
      addLog('🔑 Test des permissions d\'accès...', 'info', 'auth')
      
      try {
        await api.routes.getAll({ limit: 1 })
        addLog('✅ Accès aux parcours autorisé', 'success', 'auth')
      } catch (error) {
        if (error.response?.status === 403) {
          addLog('🚫 Accès aux parcours refusé - Permissions insuffisantes', 'error', 'auth')
        } else {
          addLog(`❌ Erreur d\'accès aux parcours: ${error.message}`, 'error', 'auth')
        }
      }

      try {
        await api.users.getAll({ limit: 1 })
        addLog('✅ Accès à la gestion des utilisateurs autorisé', 'success', 'auth')
      } catch (error) {
        if (error.response?.status === 403) {
          addLog('🚫 Accès à la gestion des utilisateurs refusé', 'warning', 'auth')
        } else {
          addLog(`❌ Erreur d\'accès aux utilisateurs: ${error.message}`, 'error', 'auth')
        }
      }
      
      addLog('🏁 Tests d\'authentification terminés', 'success', 'auth')
      
    } catch (error) {
      addLog(`❌ Erreur critique: ${error.message}`, 'error', 'auth')
      if (error.response) {
        addLog(`📱 Code HTTP: ${error.response.status}`, 'error', 'auth')
        addLog(`📋 Détails: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'error', 'auth')
      }
    } finally {
      setIsRunningTests(false)
    }
  }

  // Test des APIs et endpoints
  const runApiTest = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    addLog('🌐 Début des tests API...', 'info', 'api')
    
    const endpoints = [
      { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
      { name: 'Routes', endpoint: '/api/routes', method: 'GET' },
      { name: 'Users', endpoint: '/api/users', method: 'GET' },
      { name: 'Running History', endpoint: '/api/running-history', method: 'GET' },
      { name: 'Statistics', endpoint: '/api/stats', method: 'GET' }
    ]

    for (const test of endpoints) {
      try {
        addLog(`📡 Test ${test.name}...`, 'info', 'api')
        const start = performance.now()
        
        let response
        switch (test.endpoint) {
          case '/api/health':
            response = await fetch(`${selectedApi?.url || ''}${test.endpoint}`)
            break
          case '/api/routes':
            response = await api.routes.getAll({ limit: 1 })
            break
          case '/api/users':
            response = await api.users.getAll({ limit: 1 })
            break
          default:
            response = await fetch(`${selectedApi?.url || ''}${test.endpoint}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
              }
            })
        }
        
        const duration = Math.round(performance.now() - start)
        const status = response.status || response.response?.status || 200
        
        if (status >= 200 && status < 300) {
          addLog(`✅ ${test.name}: OK (${duration}ms)`, 'success', 'api')
        } else if (status === 403) {
          addLog(`🚫 ${test.name}: Accès refusé (${duration}ms)`, 'warning', 'api')
        } else {
          addLog(`❌ ${test.name}: Erreur ${status} (${duration}ms)`, 'error', 'api')
        }
        
      } catch (error) {
        addLog(`❌ ${test.name}: ${error.message}`, 'error', 'api')
      }
    }
    
    addLog('🏁 Tests API terminés', 'success', 'api')
    setIsRunningTests(false)
  }

  // Informations système
  const getSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof Storage !== 'undefined',
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'N/A',
      connection: navigator.connection ? `${navigator.connection.effectiveType} (${navigator.connection.downlink}Mbps)` : 'N/A'
    }
    
    Object.entries(info).forEach(([key, value]) => {
      addLog(`💻 ${key}: ${value}`, 'info', 'system')
    })
  }

  // Promotion admin
  const promoteAdmin = async () => {
    if (isRunningTests) return
    
    setIsRunningTests(true)
    try {
      addLog('👑 Tentative de promotion admin...', 'info', 'auth')
      const response = await api.auth.promoteAdmin('PROMOTE_ADMIN_SECRET_2025')
      
      if (response.data.status === 'success') {
        addLog('✅ Promotion admin réussie! 🎉', 'success', 'auth')
        addLog('🔄 Rechargement recommandé pour mettre à jour les permissions...', 'warning', 'auth')
      }
    } catch (error) {
      addLog(`❌ Échec promotion: ${error.response?.data?.message || error.message}`, 'error', 'auth')
    } finally {
      setIsRunningTests(false)
    }
  }

  // Vider les logs
  const clearLogs = () => {
    setLogs([])
    addLog('🧹 Console vidée', 'info', 'general')
  }

  // Télécharger les logs
  const downloadLogs = () => {
    const logContent = logs.map(log => 
      `[${log.fullDate}] [${log.category.toUpperCase()}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    addLog('📥 Logs téléchargés', 'success', 'general')
  }

  // Filtrer les logs par onglet actif
  const filteredLogs = logs.filter(log => {
    switch (activeTab) {
      case 'console': return true
      case 'auth': return log.category === 'auth'
      case 'api': return log.category === 'api'
      case 'system': return log.category === 'system'
      default: return true
    }
  })

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bouton Debug avec thème vert */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn transition-all duration-300 shadow-green ${
          isOpen 
            ? 'btn-primary' 
            : logs.length > 0 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse' 
              : 'btn-secondary'
        }`}
        title="Panel de Debug"
      >
        <BugAntIcon className="h-4 w-4 mr-2" />
        🔧 Debug
        {logs.length > 0 && !isOpen && (
          <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-bounce">
            {logs.length}
          </span>
        )}
      </button>
      
      {/* Panel de Debug */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[28rem] h-[32rem] bg-white/95 backdrop-blur-xl border-2 border-green-200 rounded-xl shadow-green-xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-200 bg-green-card-gradient rounded-t-xl">
            <div className="flex items-center space-x-2">
              <CommandLineIcon className="h-5 w-5 text-green-700" />
              <h3 className="font-semibold text-green-800">Debug Panel</h3>
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                DEV
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {logs.length > 0 && (
                <>
                  <button
                    onClick={downloadLogs}
                    className="p-1 hover:bg-green-100 rounded text-green-700"
                    title="Télécharger les logs"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearLogs}
                    className="p-1 hover:bg-green-100 rounded text-green-700"
                    title="Vider les logs"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-green-100 rounded text-green-700"
                title="Fermer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Onglets */}
          <div className="flex border-b border-green-200 bg-green-50">
            {[
              { id: 'console', label: 'Console', icon: CommandLineIcon },
              { id: 'auth', label: 'Auth', icon: ShieldCheckIcon },
              { id: 'api', label: 'API', icon: ServerIcon },
              { id: 'system', label: 'Système', icon: CpuChipIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-700 border-b-2 border-green-500 bg-white'
                    : 'text-green-600 hover:text-green-700 hover:bg-green-100'
                }`}
              >
                <tab.icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {tab.id !== 'console' && (
                  <span className="ml-1 px-1 py-0.5 bg-green-200 text-green-700 text-xs rounded">
                    {logs.filter(log => log.category === tab.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contenu selon l'onglet */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Informations rapides */}
            <div className="p-3 bg-green-50/50 border-b border-green-100 text-xs">
              <div className="grid grid-cols-2 gap-2 text-green-700">
                <div><strong>Utilisateur:</strong> {user?.username || 'Non connecté'}</div>
                <div><strong>Authentifié:</strong> {isAuthenticated ? '✅' : '❌'}</div>
                <div><strong>Admin:</strong> {user?.is_admin ? '✅' : '❌'}</div>
                <div><strong>API:</strong> {isConfigured ? '🟢' : '🔴'} {selectedApi?.name || 'Non configurée'}</div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="p-3 border-b border-green-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={runAuthTest}
                  disabled={isRunningTests}
                  className="btn btn-sm btn-primary disabled:opacity-50"
                >
                  {isRunningTests ? (
                    <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  )}
                  Test Auth
                </button>
                <button
                  onClick={runApiTest}
                  disabled={isRunningTests || !isConfigured}
                  className="btn btn-sm btn-secondary disabled:opacity-50"
                >
                  {isRunningTests ? (
                    <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <ServerIcon className="h-3 w-3 mr-1" />
                  )}
                  Test API
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={promoteAdmin}
                  disabled={isRunningTests || user?.is_admin}
                  className="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                >
                  <UserIcon className="h-3 w-3 mr-1" />
                  Promouvoir
                </button>
                <button
                  onClick={getSystemInfo}
                  className="btn btn-sm btn-secondary"
                >
                  <CpuChipIcon className="h-3 w-3 mr-1" />
                  Info Système
                </button>
              </div>
            </div>

            {/* Console de logs */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 bg-gray-900 text-green-400 text-xs">
                <span>💻 Console ({filteredLogs.length} entrées)</span>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>Auto-scroll</span>
                  </label>
                </div>
              </div>
              
              <div 
                ref={consoleRef}
                className="flex-1 overflow-y-auto bg-gray-900 text-green-300 p-2 font-mono text-xs leading-relaxed scrollbar-thin"
              >
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <CommandLineIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Console vide</p>
                      <p className="text-xs mt-1">Exécutez des tests pour voir les logs</p>
                    </div>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className={`mb-1 p-1 rounded ${
                        log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                        log.type === 'error' ? 'bg-red-900/30 text-red-300' :
                        log.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                        'text-green-400'
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span>
                      <span className="text-gray-400 ml-1">[{log.category.toUpperCase()}]</span>
                      <span className="ml-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel