import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const DebugPanel = () => {
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  const runAuthTest = async () => {
    addLog('Début du test d\'authentification...', 'info')
    
    try {
      // Test 1: Santé API
      await api.auth.testConnection()
      addLog('✅ API accessible', 'success')
      
      // Test 2: Validation token
      const response = await api.auth.validateToken()
      if (response.data.status === 'success') {
        addLog(`✅ Token valide - Utilisateur: ${response.data.data.user.username}`, 'success')
        addLog(`Admin: ${response.data.data.user.is_admin ? 'Oui' : 'Non'}`, response.data.data.user.is_admin ? 'success' : 'warning')
      }
      
      // Test 3: Accès aux routes
      try {
        await api.routes.getAll({ limit: 1 })
        addLog('✅ Accès aux itinéraires OK', 'success')
      } catch (error) {
        if (error.response?.status === 403) {
          addLog('🚫 Accès aux itinéraires refusé - Pas admin', 'error')
        } else {
          addLog(`❌ Erreur routes: ${error.message}`, 'error')
        }
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
    }
  }

  const promoteAdmin = async () => {
    try {
      addLog('Tentative de promotion admin...', 'info')
      const response = await api.auth.promoteAdmin('PROMOTE_ADMIN_SECRET_2025')
      if (response.data.status === 'success') {
        addLog('✅ Promotion admin réussie!', 'success')
        addLog('Rechargement recommandé...', 'warning')
      }
    } catch (error) {
      addLog(`❌ Échec promotion: ${error.response?.data?.message || error.message}`, 'error')
    }
  }

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
      >
        🔧 Debug
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Panel de Debug</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <strong>Utilisateur:</strong> {user?.username || 'Non connecté'}
            </div>
            <div className="text-sm">
              <strong>Authentifié:</strong> {isAuthenticated ? '✅' : '❌'}
            </div>
            <div className="text-sm">
              <strong>Admin:</strong> {user?.is_admin ? '✅' : '❌'}
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <button
              onClick={runAuthTest}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm"
            >
              Tester Auth
            </button>
            <button
              onClick={promoteAdmin}
              className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm"
            >
              Promouvoir Admin
            </button>
            <button
              onClick={() => setLogs([])}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm"
            >
              Effacer Logs
            </button>
          </div>
          
          <div className="max-h-40 overflow-y-auto text-xs">
            {logs.map((log, index) => (
              <div key={index} className={`p-1 mb-1 rounded ${
                log.type === 'success' ? 'bg-green-50 text-green-700' :
                log.type === 'error' ? 'bg-red-50 text-red-700' :
                log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                'bg-gray-50 text-gray-700'
              }`}>
                <span className="text-gray-400">{log.timestamp}</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel