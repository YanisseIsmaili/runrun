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
      }, 30000)

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
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (filters.status !== 'all') {
        params.status = filters.status === 'active' ? true : false
      }

      if (filters.role !== 'all') {
        params.is_admin = filters.role === 'admin' ? true : false
      }

      addDebugInfo(`📋 Paramètres envoyés: ${JSON.stringify(params)}`)

      const response = await api.users.getAll(params)
      addDebugInfo(`✅ Réponse reçue: Status ${response.status}`)
      
      if (response.data) {
        let usersData = []
        let paginationData = {}
        
        if (response.data.status === 'success' && response.data.data) {
          usersData = response.data.data.users || response.data.data || []
          paginationData = response.data.data.pagination || {}
        } else if (Array.isArray(response.data)) {
          usersData = response.data
        } else if (response.data.users) {
          usersData = response.data.users
          paginationData = response.data.pagination || {}
        }
        
        setUsers(usersData)
        setPagination(prev => ({
          ...prev,
          pages: paginationData.pages || Math.ceil((paginationData.total || usersData.length) / prev.per_page),
          total: paginationData.total || usersData.length
        }))
        
        addDebugInfo(`✅ ${usersData.length} utilisateurs chargés`)
      }

    } catch (error) {
      addDebugInfo(`❌ Erreur fetchUsers: ${error.message}`)
      console.error('Erreur détaillée fetchUsers:', error)
      
      if (error.message.includes('Network Error')) {
        setError('Impossible de contacter le serveur API.')
      } else if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
      } else if (error.response?.status === 404) {
        setError('Endpoint /api/users non trouvé.')
      } else {
        setError(`Erreur API: ${error.response?.status || error.message}`)
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Actions sur les utilisateurs (VRAIES fonctionnalités existantes)
  const handleUserAction = async (action, userId) => {
    if (!isConfigured) return

    try {
      addDebugInfo(`🔧 Action ${action} sur utilisateur ${userId}`)
      
      switch (action) {
        case 'activate':
          await api.users.update(userId, { is_active: true })
          break
        case 'deactivate':
          await api.users.update(userId, { is_active: false })
          break
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            await api.users.delete(userId)
          } else {
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

  // Toggle du statut directement via le badge (FONCTIONNALITÉ EXISTANTE)
  const toggleUserStatus = async (user) => {
    const newStatus = !user.is_active
    await handleUserAction(newStatus ? 'activate' : 'deactivate', user.id)
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

  const getStatusBadge = (user) => {
    return (
      <button
        onClick={() => toggleUserStatus(user)}
        className={`badge cursor-pointer transition-all duration-300 hover:scale-105 ${
          user.is_active ? 'badge-success hover:bg-red-100 hover:text-red-800' : 'badge-danger hover:bg-green-100 hover:text-green-800'
        }`}
        title={`Cliquer pour ${user.is_active ? 'désactiver' : 'activer'}`}
      >
        {user.is_active ? 'Actif' : 'Inactif'}
      </button>
    )
  }

  const getRoleBadge = (isAdmin) => {
    return (
      <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-secondary'}`}>
        {isAdmin ? 'Admin' : 'Utilisateur'}
      </span>
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

      {/* Barre d'outils */}
      {isConfigured && (
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-12 pr-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="btn btn-secondary px-6 py-3"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filtres
                </button>
                
                <button
                  className="btn btn-secondary px-6 py-3"
                  onClick={() => fetchUsers()}
                  disabled={loading}
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="px-6 py-4 border-b border-green-100 bg-green-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select 
                    className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                  <select 
                    className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80"
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="all">Tous</option>
                    <option value="admin">Administrateurs</option>
                    <option value="user">Utilisateurs</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button 
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all duration-300"
                    onClick={() => setFilters({ status: 'all', role: 'all' })}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions groupées */}
          {selectedUsers.length > 0 && (
            <div className="px-6 py-4 bg-green-50/50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Activer
                  </button>
                  <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Désactiver
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table des utilisateurs */}
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
                <p className="text-gray-500">
                  {searchTerm || filters.status !== 'all' || filters.role !== 'all' 
                    ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                    : 'Aucun utilisateur enregistré pour le moment.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Rôle</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Dernière connexion</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-green-100">
                    {users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-green-50/50 transition-all duration-300 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-green-300 text-green-600 focus:ring-green-500"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => navigate(`/users/${user.id}`)}
                            title="Cliquer pour voir les détails"
                          >
                            <div className="w-10 h-10 rounded-full mr-4 group">
                              {user.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={`Photo de ${user.first_name}`}
                                  className="w-full h-full rounded-full object-cover border-2 border-green-200 shadow-sm group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
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
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.is_admin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDate(user.last_login)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Voir le détail"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Éditer rapidement"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction('delete', user.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium">
                    Page {pagination.page} sur {pagination.pages}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      className="px-4 py-2 bg-white hover:bg-green-50 border border-green-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Précédent
                    </button>
                    <button
                      className="px-4 py-2 bg-white hover:bg-green-50 border border-green-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
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
          transition: all 0.3s ease;
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
        }
      `}</style>
    </div>
  )
}

export default Users