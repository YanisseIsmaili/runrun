import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  BugAntIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

const Users = () => {
  const navigate = useNavigate()
  const { isConfigured, selectedApi } = useApiConfig()
  
  // États principaux
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 10,
    total: 0
  })
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  
  // États pour l'interface et debug
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [showDebugConsole, setShowDebugConsole] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fonction de debug
  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`
    setDebugInfo(prev => prev ? `${prev}\n${formattedMessage}` : formattedMessage)
    console.log(`[USERS DEBUG] ${message}`)
  }

  // Chargement initial
  useEffect(() => {
    if (isConfigured) {
      addDebugInfo(`🔧 API configurée: ${selectedApi?.name} (${selectedApi?.url})`)
      fetchUsers()
    } else {
      addDebugInfo('❌ API non configurée')
      setError('Aucune API configurée. Veuillez sélectionner un serveur API.')
    }
  }, [isConfigured, selectedApi])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && isConfigured) {
      const interval = setInterval(() => {
        addDebugInfo('🔄 Auto-refresh activé')
        fetchUsers(false)
      }, 30000) // 30 secondes

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isConfigured])

  // Recherche et filtres
  useEffect(() => {
    if (isConfigured) {
      const timeoutId = setTimeout(() => {
        addDebugInfo(`🔍 Recherche/Filtres appliqués: "${searchTerm}" - ${filters.status} - ${filters.role}`)
        fetchUsers()
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, filters, pagination.page])

  // Récupérer les utilisateurs
  const fetchUsers = async (showLoading = true) => {
    if (!isConfigured) {
      addDebugInfo('❌ fetchUsers: API non configurée')
      return
    }

    if (showLoading) setLoading(true)
    setError('')

    try {
      addDebugInfo('📡 Début fetchUsers...')
      
      // Construire les paramètres
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
        addDebugInfo(`🔍 Recherche: "${searchTerm.trim()}"`)
      }

      if (filters.status !== 'all') {
        params.status = filters.status === 'active' ? true : false
      }

      if (filters.role !== 'all') {
        params.is_admin = filters.role === 'admin' ? true : false
      }

      addDebugInfo(`📋 Paramètres envoyés: ${JSON.stringify(params)}`)
      addDebugInfo(`🌐 URL de base API: ${api.instance?.defaults?.baseURL || 'Non définie'}`)

      // Appel API
      const response = await api.users.getAll(params)
      addDebugInfo(`✅ Réponse reçue: Status ${response.status}`)
      
      console.log('Réponse complète API users:', response)
      addDebugInfo(`📦 Type de données reçues: ${typeof response.data}`)
      
      if (response.data) {
        // Analyser la structure de la réponse
        addDebugInfo(`🔍 Structure response.data: ${JSON.stringify(Object.keys(response.data))}`)
        
        let usersData = []
        let paginationData = {}
        
        if (response.data.status === 'success' && response.data.data) {
          // Structure API standard: {status: 'success', data: {users: [...], pagination: {...}}}
          usersData = response.data.data.users || response.data.data || []
          paginationData = response.data.data.pagination || {}
          addDebugInfo(`📊 Structure API standard: ${usersData.length} users`)
        } else if (Array.isArray(response.data)) {
          // Structure tableau direct: [user1, user2, ...]
          usersData = response.data
          addDebugInfo(`📊 Structure tableau direct: ${usersData.length} users`)
        } else if (response.data.users) {
          // Structure {users: [...], pagination: {...}}
          usersData = response.data.users
          paginationData = response.data.pagination || {}
          addDebugInfo(`📊 Structure users directes: ${usersData.length} users`)
        } else {
          // Structure inconnue
          addDebugInfo(`🔍 Structure inconnue`)
          console.log('Structure complète response.data:', response.data)
          addDebugInfo(`📝 Clés disponibles: ${Object.keys(response.data).join(', ')}`)
          
          // Essayer de trouver un tableau dans la réponse
          for (const key of Object.keys(response.data)) {
            if (Array.isArray(response.data[key])) {
              usersData = response.data[key]
              addDebugInfo(`📊 Trouvé tableau dans ${key}: ${usersData.length} éléments`)
              break
            }
          }
        }
        
        // Mettre à jour l'état
        setUsers(usersData)
        setPagination(prev => ({
          ...prev,
          pages: paginationData.pages || Math.ceil((paginationData.total || usersData.length) / prev.per_page),
          total: paginationData.total || usersData.length
        }))
        
        addDebugInfo(`✅ ${usersData.length} utilisateurs chargés avec succès`)
        
        // Log du premier utilisateur pour debug
        if (usersData.length > 0) {
          addDebugInfo(`🔍 Premier utilisateur: ${JSON.stringify(usersData[0]).substring(0, 200)}...`)
        }
        
      } else {
        throw new Error('Pas de données dans la réponse')
      }

    } catch (error) {
      addDebugInfo(`❌ Erreur fetchUsers: ${error.message}`)
      console.error('Erreur détaillée fetchUsers:', error)
      
      if (error.response) {
        addDebugInfo(`📱 Status: ${error.response.status}`)
        addDebugInfo(`📱 Data: ${JSON.stringify(error.response.data).substring(0, 200)}`)
        console.log('Erreur response complète:', error.response)
      }
      
      // Messages d'erreur contextuels
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        setError('Impossible de contacter le serveur API. Vérifiez la connexion réseau.')
      } else if (error.response) {
        switch (error.response.status) {
          case 401:
            setError('Session expirée. Veuillez vous reconnecter.')
            break
          case 403:
            setError('Accès refusé. Permissions insuffisantes.')
            break
          case 404:
            setError('Endpoint /api/users non trouvé sur le serveur.')
            break
          case 500:
          case 502:
          case 503:
            setError('Erreur serveur. Vérifiez que l\'API backend est démarrée.')
            break
          default:
            setError(`Erreur API: ${error.response.status} - ${error.response.statusText}`)
        }
      } else {
        setError(`Erreur: ${error.message}`)
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Actions sur les utilisateurs
  const handleUserAction = async (action, userId) => {
    if (!isConfigured) {
      setError('API non configurée')
      return
    }

    try {
      addDebugInfo(`🔧 Action ${action} sur utilisateur ${userId}`)
      
      switch (action) {
        case 'activate':
          await api.users.update(userId, { is_active: true })
          addDebugInfo(`✅ Utilisateur ${userId} activé`)
          break
        case 'deactivate':
          await api.users.update(userId, { is_active: false })
          addDebugInfo(`✅ Utilisateur ${userId} désactivé`)
          break
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            await api.users.delete(userId)
            addDebugInfo(`✅ Utilisateur ${userId} supprimé`)
          } else {
            addDebugInfo(`❌ Suppression annulée`)
            return
          }
          break
        default:
          throw new Error('Action non reconnue')
      }
      
      fetchUsers(false)
      
    } catch (error) {
      addDebugInfo(`❌ Erreur action ${action}: ${error.message}`)
      setError(error.response?.data?.message || `Impossible d'exécuter l'action ${action}`)
    }
  }

  // Retry avec debug
  const handleRetry = () => {
    addDebugInfo('🔄 Retry demandé par utilisateur')
    setError('')
    fetchUsers()
  }

  // Fonctions utilitaires
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Actif</span>
    ) : (
      <span className="badge badge-danger">Inactif</span>
    )
  }

  const getRoleBadge = (isAdmin) => {
    return isAdmin ? (
      <span className="badge badge-warning">Admin</span>
    ) : (
      <span className="badge badge-secondary">Utilisateur</span>
    )
  }

  // Fonction pour vider la console de debug
  const clearDebugConsole = () => {
    setDebugInfo('')
    addDebugInfo('🧹 Console vidée')
  }

  // Fonction pour télécharger les logs de debug
  const downloadDebugLogs = () => {
    const logs = debugInfo || 'Aucun log disponible'
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-debug-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addDebugInfo('📥 Logs téléchargés')
  }

  // Changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }))
      addDebugInfo(`📄 Changement page: ${newPage}`)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec thème vert */}
      <div className="glass-green rounded-2xl p-6 border border-green-200 shadow-green">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-green-800 text-shadow flex items-center space-x-3">
              <span>👥</span>
              <span>Gestion des Utilisateurs</span>
            </h1>
            <p className="text-green-600 mt-2">
              {pagination.total} utilisateur(s) au total
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Bouton Debug Console - uniquement en développement */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugConsole(!showDebugConsole)}
                className={`btn btn-sm transition-all duration-300 ${
                  showDebugConsole 
                    ? 'btn-primary' 
                    : debugInfo 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse' 
                      : 'btn-secondary'
                }`}
                title="Console de Debug"
              >
                <BugAntIcon className="h-4 w-4 mr-2" />
                Debug
                {debugInfo && !showDebugConsole && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>
            )}
            
            {/* Toggle Auto-refresh */}
            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh)
                addDebugInfo(`🔄 Auto-refresh ${!autoRefresh ? 'activé' : 'désactivé'}`)
              }}
              className={`btn btn-sm ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
              title="Auto-actualisation"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto
            </button>
            
            <button 
              onClick={handleRetry}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            
            <button 
              onClick={() => navigate('/users/new')}
              className="btn btn-primary btn-sm"
              disabled={!isConfigured}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Console de Debug - Conditionnelle */}
      {process.env.NODE_ENV === 'development' && showDebugConsole && (
        <div className="card border-2 border-green-300 bg-gradient-to-br from-gray-900 to-black text-green-400 animate-slide-in-right">
          <div className="card-header bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CommandLineIcon className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-300">
                  Debug Console
                </h3>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  DEV MODE
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {debugInfo && (
                  <>
                    <button
                      onClick={downloadDebugLogs}
                      className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300"
                      title="Télécharger les logs"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={clearDebugConsole}
                      className="p-1 hover:bg-gray-700 rounded text-yellow-400 hover:text-yellow-300"
                      title="Vider la console"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDebugConsole(false)}
                  className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300"
                  title="Fermer la console"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="card-body bg-gray-900">
            {debugInfo ? (
              <pre className="font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin leading-relaxed text-green-300">
                {debugInfo}
              </pre>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CommandLineIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Console de debug vide</p>
                <p className="text-xs mt-1">Les logs d'activité apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* État de l'API */}
      {!isConfigured && (
        <div className="alert alert-warning animate-scale-in">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                API non configurée
              </h3>
              <p className="text-yellow-700">
                Veuillez sélectionner un serveur API pour accéder aux utilisateurs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Erreurs */}
      {error && (
        <div className="alert alert-error animate-scale-in">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">
                Erreur
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="btn btn-sm text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      {isConfigured && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-2xl font-bold text-green-700">{users.length}</div>
              <div className="text-sm text-gray-600">Utilisateurs chargés</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-2xl font-bold text-emerald-600">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Utilisateurs actifs</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">👨‍💼</div>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_admin).length}
              </div>
              <div className="text-sm text-gray-600">Administrateurs</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-emerald-700">{selectedUsers.length}</div>
              <div className="text-sm text-gray-600">Sélectionnés</div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {isConfigured && (
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-xl">👥</span>
                <h2 className="text-lg font-semibold text-green-800">
                  Liste des utilisateurs
                </h2>
                <span className="badge badge-primary">
                  {pagination.total}
                </span>
              </div>
              
              {/* Barre de recherche et filtres */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-9 pr-4 py-2 text-sm w-64"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filtres
                </button>
              </div>
            </div>

            {/* Filtres */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-green-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="form-label text-sm">
                    <span>📊</span>
                    <span>Statut</span>
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="form-select text-sm"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-sm">
                    <span>👨‍💼</span>
                    <span>Rôle</span>
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                    className="form-select text-sm"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Administrateurs</option>
                    <option value="user">Utilisateurs</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Actions groupées */}
          {selectedUsers.length > 0 && (
            <div className="px-6 py-4 bg-green-50/50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <div className="flex space-x-2">
                  <button className="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Activer
                  </button>
                  <button className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white">
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Désactiver
                  </button>
                  <button className="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card-body p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-600">Chargement des utilisateurs...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun utilisateur trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filters.status !== 'all' || filters.role !== 'all' 
                    ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                    : 'Aucun utilisateur enregistré pour le moment.'
                  }
                </p>
                {(!searchTerm && filters.status === 'all' && filters.role === 'all') && (
                  <button
                    onClick={() => navigate('/users/new')}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer un utilisateur
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">
                          <input
                            type="checkbox"
                            className="rounded border-green-300 text-green-600 focus:ring-green-500"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(users.map(u => u.id))
                              } else {
                                setSelectedUsers([])
                              }
                            }}
                            checked={selectedUsers.length === users.length && users.length > 0}
                          />
                        </th>
                        <th className="table-header-cell">Utilisateur</th>
                        <th className="table-header-cell">Email</th>
                        <th className="table-header-cell">Rôle</th>
                        <th className="table-header-cell">Statut</th>
                        <th className="table-header-cell">Dernière connexion</th>
                        <th className="table-header-cell text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {users.map((user, index) => (
                        <tr 
                          key={user.id || index} 
                          className="table-row animate-fade-in" 
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="table-cell">
                            <input
                              type="checkbox"
                              className="rounded border-green-300 text-green-600 focus:ring-green-500"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full mr-4 group cursor-pointer">
                                {user.profile_picture ? (
                                  <img
                                    src={user.profile_picture}
                                    alt={`Photo de ${user.first_name}`}
                                    className="w-full h-full rounded-full object-cover border-2 border-green-200 shadow-sm group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      // Fallback si l'image ne charge pas
                                      e.target.style.display = 'none'
                                      e.target.nextElementSibling.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center border-2 border-green-200 shadow-sm group-hover:scale-105 transition-transform duration-300 ${user.profile_picture ? 'hidden' : 'flex'}`}
                                >
                                  <span className="text-sm font-bold text-white">
                                    {user.first_name?.[0] || '?'}{user.last_name?.[0] || ''}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.first_name || ''} {user.last_name || ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{user.username || 'utilisateur'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">
                              {user.email || 'N/A'}
                            </div>
                          </td>
                          <td className="table-cell">
                            {getRoleBadge(user.is_admin)}
                          </td>
                          <td className="table-cell">
                            {getStatusBadge(user.is_active)}
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-600">
                              {formatDate(user.last_login)}
                            </div>
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  navigate(`/users/${user.id}`)
                                  addDebugInfo(`👁️ Affichage détails utilisateur: ${user.username}`)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Voir détails"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/users/${user.id}/edit`)
                                  addDebugInfo(`✏️ Modification utilisateur: ${user.username}`)
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Modifier"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {user.is_active ? (
                                <button
                                  onClick={() => handleUserAction('deactivate', user.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Désactiver"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction('activate', user.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Activer"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-green-100 bg-green-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Page {pagination.page} sur {pagination.pages}</span>
                        <span>•</span>
                        <span>{pagination.total} utilisateurs au total</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="btn btn-sm btn-secondary disabled:opacity-50"
                        >
                          Précédent
                        </button>
                        
                        {/* Numéros de pages */}
                        <div className="flex space-x-1">
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 text-sm rounded ${
                                  pageNum === pagination.page
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-green-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          className="btn btn-sm btn-secondary disabled:opacity-50"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Styles CSS personnalisés exactement comme Dashboard.jsx */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
        }

        .shadow-green {
          box-shadow: 0 10px 25px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05);
        }

        .shadow-green-lg {
          box-shadow: 0 10px 25px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05);
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
        }

        .alert {
          border-radius: 12px;
          padding: 16px;
          border-width: 1px;
        }

        .alert-warning {
          background-color: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(16, 185, 129, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          background: rgba(16, 185, 129, 0.02);
        }

        .card-body {
          padding: 20px 24px;
        }

        .btn {
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: rgb(16, 185, 129);
          color: white;
          border-color: rgb(16, 185, 129);
        }

        .btn-primary:hover {
          background-color: rgb(5, 150, 105);
          border-color: rgb(5, 150, 105);
        }

        .btn-secondary {
          background-color: transparent;
          border-color: rgb(16, 185, 129);
          color: rgb(16, 185, 129);
        }

        .btn-secondary:hover {
          background-color: rgb(16, 185, 129);
          color: white;
        }

        .btn-success {
          background-color: rgb(34, 197, 94);
          color: white;
          border-color: rgb(34, 197, 94);
        }

        .btn-success:hover {
          background-color: rgb(22, 163, 74);
          border-color: rgb(22, 163, 74);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-primary {
          background-color: rgb(16, 185, 129);
          color: white;
        }

        .badge-success {
          background-color: rgb(34, 197, 94);
          color: white;
        }

        .badge-warning {
          background-color: rgb(251, 191, 36);
          color: rgb(92, 51, 23);
        }

        .badge-danger {
          background-color: rgb(239, 68, 68);
          color: white;
        }

        .badge-secondary {
          background-color: rgb(156, 163, 175);
          color: white;
        }

        .form-input {
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-input:focus {
          outline: none;
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-select {
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-select:focus {
          outline: none;
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 4px;
          color: rgb(75, 85, 99);
        }

        .table-container {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-header {
          background: rgba(16, 185, 129, 0.05);
        }

        .table-header-cell {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(16, 133, 92);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
        }

        .table-body {
          background: rgba(255, 255, 255, 0.6);
        }

        .table-row {
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background: rgba(16, 185, 129, 0.05);
        }

        .table-cell {
          padding: 16px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          vertical-align: middle;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(16, 185, 129, 0.5);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .card-header,
          .card-body {
            padding: 16px 20px;
          }

          .glass-green {
            padding: 20px;
          }

          .table-container {
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  )
}

export default Users