// running-admin/src/pages/Parcours.jsx - CODE COMPLET RÉÉCRIT
import { useState, useEffect } from 'react'
import { 
  MapPinIcon, 
  PlayIcon, 
  PauseIcon, 
  EyeIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowPathIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  BugAntIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

const ParcoursPage = () => {
  // Configuration API
  const { isConfigured, selectedApi } = useApiConfig()
  
  // États principaux
  const [routes, setRoutes] = useState([])
  const [activeRuns, setActiveRuns] = useState([])
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
    difficulty: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    distance: '',
    difficulty: 'Facile',
    estimated_duration: '',
    elevation_gain: '',
    waypoints: []
  })
  
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
    console.log(`[PARCOURS DEBUG] ${message}`)
  }

  // Chargement initial
  useEffect(() => {
    if (isConfigured) {
      addDebugInfo(`🔧 API configurée: ${selectedApi?.name} (${selectedApi?.url})`)
      fetchRoutes()
      fetchActiveRuns()
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
        fetchRoutes(false)
        fetchActiveRuns()
      }, 30000) // 30 secondes

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isConfigured])

  // Recherche et filtres
  useEffect(() => {
    if (isConfigured) {
      const timeoutId = setTimeout(() => {
        addDebugInfo(`🔍 Recherche/Filtres appliqués: "${searchTerm}" - ${filters.status} - ${filters.difficulty}`)
        fetchRoutes()
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, filters])

  // Récupérer les parcours
  const fetchRoutes = async (showLoading = true) => {
    if (!isConfigured) {
      addDebugInfo('❌ fetchRoutes: API non configurée')
      return
    }

    if (showLoading) setLoading(true)
    setError('')

    try {
      addDebugInfo('📡 Début fetchRoutes...')
      
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
        params.status = filters.status
      }

      if (filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty
      }

      addDebugInfo(`📋 Paramètres envoyés: ${JSON.stringify(params)}`)
      addDebugInfo(`🌐 URL de base API: ${api.instance.defaults.baseURL}`)

      // Appel API
      const response = await api.routes.getAll(params)
      addDebugInfo(`✅ Réponse reçue: Status ${response.status}`)
      
      console.log('Réponse complète API routes:', response)
      addDebugInfo(`📦 Type de données reçues: ${typeof response.data}`)
      
      if (response.data) {
        // Analyser la structure de la réponse
        addDebugInfo(`🔍 Structure response.data: ${JSON.stringify(Object.keys(response.data))}`)
        
        let routesData = []
        let paginationData = {}
        
        if (response.data.status === 'success' && response.data.data) {
          // Structure API standard: {status: 'success', data: {routes: [...], pagination: {...}}}
          routesData = response.data.data.routes || response.data.data || []
          paginationData = response.data.data.pagination || {}
          addDebugInfo(`📊 Structure API standard: ${routesData.length} routes`)
        } else if (Array.isArray(response.data)) {
          // Structure tableau direct: [route1, route2, ...]
          routesData = response.data
          addDebugInfo(`📊 Structure tableau direct: ${routesData.length} routes`)
        } else if (response.data.routes) {
          // Structure {routes: [...], pagination: {...}}
          routesData = response.data.routes
          paginationData = response.data.pagination || {}
          addDebugInfo(`📊 Structure routes directes: ${routesData.length} routes`)
        } else {
          // Structure inconnue
          addDebugInfo(`🔍 Structure inconnue`)
          console.log('Structure complète response.data:', response.data)
          addDebugInfo(`📝 Clés disponibles: ${Object.keys(response.data).join(', ')}`)
          
          // Essayer de trouver un tableau dans la réponse
          for (const key of Object.keys(response.data)) {
            if (Array.isArray(response.data[key])) {
              routesData = response.data[key]
              addDebugInfo(`📊 Trouvé tableau dans ${key}: ${routesData.length} éléments`)
              break
            }
          }
        }
        
        // Mettre à jour l'état
        setRoutes(routesData)
        setPagination(prev => ({
          ...prev,
          pages: paginationData.pages || Math.ceil((paginationData.total || routesData.length) / prev.per_page),
          total: paginationData.total || routesData.length
        }))
        
        addDebugInfo(`✅ ${routesData.length} routes chargées avec succès`)
        
        // Log de la première route pour debug
        if (routesData.length > 0) {
          addDebugInfo(`🔍 Première route: ${JSON.stringify(routesData[0]).substring(0, 200)}...`)
        }
        
      } else {
        throw new Error('Pas de données dans la réponse')
      }

    } catch (error) {
      addDebugInfo(`❌ Erreur fetchRoutes: ${error.message}`)
      console.error('Erreur détaillée fetchRoutes:', error)
      
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
            setError('Endpoint /api/routes non trouvé sur le serveur.')
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

  // Récupérer les courses actives
  const fetchActiveRuns = async () => {
    if (!isConfigured) {
      addDebugInfo('❌ fetchActiveRuns: API non configurée')
      return
    }

    try {
      addDebugInfo('📡 Récupération courses actives...')
      const response = await api.routes.getActiveRuns()
      
      if (response.data) {
        const runsData = response.data.data || response.data || []
        setActiveRuns(runsData)
        addDebugInfo(`🏃 ${runsData.length} courses actives`)
      }
    } catch (error) {
      addDebugInfo(`❌ Erreur fetchActiveRuns: ${error.message}`)
      console.error('Erreur fetchActiveRuns:', error)
    }
  }

  // Retry avec debug
  const handleRetry = () => {
    addDebugInfo('🔄 Retry demandé par utilisateur')
    setError('')
    fetchRoutes()
    fetchActiveRuns()
  }

  // Créer un nouveau parcours
  const handleCreateRoute = async (e) => {
    e.preventDefault()
    
    if (!isConfigured) {
      setError('API non configurée')
      return
    }

    setLoading(true)
    try {
      addDebugInfo('📝 Création nouveau parcours...')
      
      // Préparer les données
      const routeData = {
        name: newRoute.name.trim(),
        description: newRoute.description.trim() || '',
        distance: newRoute.distance ? parseFloat(newRoute.distance) : 0,
        difficulty: newRoute.difficulty || 'Facile',
        estimated_duration: newRoute.estimated_duration ? parseInt(newRoute.estimated_duration) : null,
        elevation_gain: newRoute.elevation_gain ? parseFloat(newRoute.elevation_gain) : null,
        waypoints: newRoute.waypoints || []
      }

      addDebugInfo(`📋 Données à envoyer: ${JSON.stringify(routeData)}`)

      const response = await api.routes.create(routeData)
      addDebugInfo(`✅ Parcours créé: ${response.data?.id || 'ID inconnu'}`)

      // Fermer le modal et actualiser
      setShowCreateModal(false)
      resetNewRoute()
      fetchRoutes()
      
    } catch (error) {
      addDebugInfo(`❌ Erreur création: ${error.message}`)
      setError(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser le formulaire de création
  const resetNewRoute = () => {
    setNewRoute({
      name: '',
      description: '',
      distance: '',
      difficulty: 'Facile',
      estimated_duration: '',
      elevation_gain: '',
      waypoints: []
    })
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
    a.download = `parcours-debug-${new Date().toISOString().split('T')[0]}.txt`
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
              <span>🗺️</span>
              <span>Gestion des Parcours</span>
            </h1>
            <p className="text-green-600 mt-2">
              Créez et gérez les parcours de running de votre plateforme
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
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
              disabled={!isConfigured}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau Parcours
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
                Veuillez sélectionner un serveur API pour accéder aux parcours.
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
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-2xl font-bold text-green-700">{routes.length}</div>
              <div className="text-sm text-gray-600">Parcours totaux</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">🏃</div>
              <div className="text-2xl font-bold text-emerald-600">{activeRuns.length}</div>
              <div className="text-sm text-gray-600">Courses actives</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-2xl font-bold text-green-600">
                {routes.filter(r => r.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Parcours actifs</div>
            </div>
          </div>
          <div className="card hover:shadow-green-lg transition-all duration-300">
            <div className="card-body text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-2xl font-bold text-emerald-700">
                {routes.reduce((acc, r) => acc + (parseFloat(r.distance) || 0), 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Total km</div>
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
                <span className="text-xl">🗺️</span>
                <h2 className="text-lg font-semibold text-green-800">
                  Parcours disponibles
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
                    placeholder="Rechercher un parcours..."
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
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label text-sm">
                    <span>⚡</span>
                    <span>Difficulté</span>
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                    className="form-select text-sm"
                  >
                    <option value="all">Toutes les difficultés</option>
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-600">Chargement des parcours...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="p-8 text-center">
                <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun parcours trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filters.status !== 'all' || filters.difficulty !== 'all' 
                    ? 'Aucun parcours ne correspond à vos critères de recherche.'
                    : 'Commencez par créer votre premier parcours de running.'
                  }
                </p>
                {(!searchTerm && filters.status === 'all' && filters.difficulty === 'all') && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer un parcours
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Parcours</th>
                        <th className="table-header-cell">Distance</th>
                        <th className="table-header-cell">Difficulté</th>
                        <th className="table-header-cell">Durée est.</th>
                        <th className="table-header-cell">Statut</th>
                        <th className="table-header-cell text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {routes.map((route, index) => (
                        <tr 
                          key={route.id || index} 
                          className="table-row animate-fade-in" 
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>🗺️</span>
                                <span>{route.name || 'Parcours sans nom'}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {route.description || 'Aucune description'}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm font-medium text-gray-900">
                              {route.distance ? `${route.distance} km` : 'N/A'}
                            </div>
                            {route.elevation_gain && (
                              <div className="text-xs text-gray-500">
                                Dénivelé: {route.elevation_gain}m
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${
                              route.difficulty === 'Facile' ? 'badge-success' :
                              route.difficulty === 'Moyen' ? 'badge-warning' :
                              route.difficulty === 'Difficile' ? 'badge-danger' : 'badge-secondary'
                            }`}>
                              {route.difficulty || 'Non défini'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-900">
                              {route.estimated_duration ? `${route.estimated_duration} min` : 'N/A'}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${
                              route.status === 'active' ? 'badge-success' :
                              route.status === 'inactive' ? 'badge-secondary' : 'badge-warning'
                            }`}>
                              {route.status === 'active' ? 'Actif' :
                               route.status === 'inactive' ? 'Inactif' : 'Maintenance'}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedRoute(route)
                                  addDebugInfo(`👁️ Affichage détails parcours: ${route.name}`)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Voir détails"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRoute(route)
                                  setShowEditModal(true)
                                  addDebugInfo(`✏️ Modification parcours: ${route.name}`)
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Modifier"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
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
                        <span>{pagination.total} parcours au total</span>
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

      {/* Modal de création */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                <span>🗺️</span>
                <span>Nouveau Parcours</span>
              </h3>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateRoute} className="space-y-4">
                <div>
                  <label className="form-label">
                    <span>📝</span>
                    <span>Nom du parcours *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    className="form-input"
                    placeholder="ex: Tour du lac"
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    <span>📄</span>
                    <span>Description</span>
                  </label>
                  <textarea
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                    className="form-textarea"
                    rows="3"
                    placeholder="Description du parcours..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      <span>📏</span>
                      <span>Distance (km)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                      className="form-input"
                      placeholder="5.2"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">
                      <span>⚡</span>
                      <span>Difficulté</span>
                    </label>
                    <select
                      value={newRoute.difficulty}
                      onChange={(e) => setNewRoute({...newRoute, difficulty: e.target.value})}
                      className="form-select"
                    >
                      <option value="Facile">Facile</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Difficile">Difficile</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      <span>⏰</span>
                      <span>Durée estimée (min)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRoute.estimated_duration}
                      onChange={(e) => setNewRoute({...newRoute, estimated_duration: e.target.value})}
                      className="form-input"
                      placeholder="30"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">
                      <span>⛰️</span>
                      <span>Dénivelé (m)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRoute.elevation_gain}
                      onChange={(e) => setNewRoute({...newRoute, elevation_gain: e.target.value})}
                      className="form-input"
                      placeholder="150"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  resetNewRoute()
                  addDebugInfo('❌ Création parcours annulée')
                }}
                className="btn btn-secondary"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRoute}
                className="btn btn-primary"
                disabled={loading || !newRoute.name.trim()}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Créer le parcours</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails d'un parcours */}
      {selectedRoute && !showEditModal && (
        <div className="modal-overlay">
          <div className="modal max-w-3xl animate-scale-in">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                <span>🗺️</span>
                <span>Détails du Parcours</span>
              </h3>
            </div>
            <div className="modal-body">
              <div className="space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-green-50/50 border-green-200">
                    <div className="card-body">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">📝</span>
                        <h4 className="font-semibold text-green-800">Informations</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Nom:</span>
                          <p className="text-gray-900 mt-1 font-medium">{selectedRoute.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Description:</span>
                          <p className="text-gray-700 mt-1">
                            {selectedRoute.description || 'Aucune description'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">ID:</span>
                          <p className="text-gray-600 font-mono text-xs mt-1">
                            {selectedRoute.id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-emerald-50/50 border-emerald-200">
                    <div className="card-body">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">📊</span>
                        <h4 className="font-semibold text-green-800">Statistiques</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600">Distance:</span>
                          <span className="text-gray-900 font-semibold">
                            {selectedRoute.distance ? `${selectedRoute.distance} km` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600">Durée est.:</span>
                          <span className="text-gray-900 font-semibold">
                            {selectedRoute.estimated_duration ? `${selectedRoute.estimated_duration} min` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600">Dénivelé:</span>
                          <span className="text-gray-900 font-semibold">
                            {selectedRoute.elevation_gain ? `${selectedRoute.elevation_gain} m` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600">Difficulté:</span>
                          <span className={`badge ${
                            selectedRoute.difficulty === 'Facile' ? 'badge-success' :
                            selectedRoute.difficulty === 'Moyen' ? 'badge-warning' :
                            selectedRoute.difficulty === 'Difficile' ? 'badge-danger' : 'badge-secondary'
                          }`}>
                            {selectedRoute.difficulty || 'Non défini'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-600">Statut:</span>
                          <span className={`badge ${
                            selectedRoute.status === 'active' ? 'badge-success' :
                            selectedRoute.status === 'inactive' ? 'badge-secondary' : 'badge-warning'
                          }`}>
                            {selectedRoute.status === 'active' ? 'Actif' :
                             selectedRoute.status === 'inactive' ? 'Inactif' : 'Maintenance'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points de passage */}
                {selectedRoute.waypoints && selectedRoute.waypoints.length > 0 && (
                  <div className="card border-green-200">
                    <div className="card-header bg-green-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📍</span>
                        <h4 className="font-semibold text-green-800">Points de passage</h4>
                        <span className="badge badge-primary">{selectedRoute.waypoints.length}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="space-y-3">
                        {selectedRoute.waypoints.map((waypoint, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {waypoint.name || `Point ${index + 1}`}
                              </p>
                              {waypoint.coordinates && (
                                <p className="text-xs text-gray-500 font-mono">
                                  {waypoint.coordinates.lat}, {waypoint.coordinates.lng}
                                </p>
                              )}
                              {waypoint.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {waypoint.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="card border-green-200">
                  <div className="card-header bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚙️</span>
                      <h4 className="font-semibold text-green-800">Métadonnées</h4>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        {selectedRoute.created_at && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Créé le:</span>
                            <span className="text-gray-900">
                              {new Date(selectedRoute.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {selectedRoute.updated_at && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Modifié le:</span>
                            <span className="text-gray-900">
                              {new Date(selectedRoute.updated_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {selectedRoute.created_by && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Créé par:</span>
                            <span className="text-gray-900">{selectedRoute.created_by}</span>
                          </div>
                        )}
                        {selectedRoute.tags && selectedRoute.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-600">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedRoute.tags.map((tag, index) => (
                                <span key={index} className="badge badge-secondary text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setSelectedRoute(null)
                  addDebugInfo('❌ Fermeture détails parcours')
                }}
                className="btn btn-secondary"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowEditModal(true)
                  addDebugInfo(`✏️ Ouverture édition: ${selectedRoute.name}`)
                }}
                className="btn btn-primary"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedRoute && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
                <span>✏️</span>
                <span>Modifier le Parcours</span>
              </h3>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <div className="flex items-center space-x-2">
                  <span>ℹ️</span>
                  <span className="text-sm">
                    Fonctionnalité d'édition en développement. 
                    Consultez les logs de debug pour plus d'informations.
                  </span>
                </div>
              </div>
              <div className="text-center py-8">
                <PencilIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Édition du parcours "{selectedRoute.name}"
                </h3>
                <p className="text-gray-500">
                  Cette fonctionnalité sera disponible dans une prochaine version.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  addDebugInfo('❌ Édition annulée')
                }}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParcoursPage