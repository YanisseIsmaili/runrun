// running-admin/src/pages/Parcours.jsx - VERSION DEBUGGÉE
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
  ServerIcon
} from '@heroicons/react/24/outline'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

const ParcoursPage = () => {
  // Vérification de la configuration API
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
  const [autoRefresh, setAutoRefresh] = useState(false) // Désactivé par défaut pour debug

  // Fonction de debug
  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${message}`)
    console.log(`[PARCOURS DEBUG] ${message}`)
  }

  // Chargement initial
  useEffect(() => {
    if (isConfigured) {
      addDebugInfo(`API configurée: ${selectedApi?.name} (${selectedApi?.url})`)
      fetchRoutes()
      fetchActiveRuns()
    } else {
      addDebugInfo('❌ API non configurée')
      setError('Aucune API configurée. Veuillez sélectionner un serveur API.')
    }
  }, [isConfigured, selectedApi, pagination.page, filters, searchTerm])

  // Test de connectivité API
  const testApiConnection = async () => {
    if (!isConfigured) {
      addDebugInfo('❌ Impossible de tester: API non configurée')
      return false
    }

    try {
      addDebugInfo(`🔍 Test de connexion: ${selectedApi.url}/api/health`)
      const response = await fetch(`${selectedApi.url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        addDebugInfo('✅ API accessible')
        return true
      } else {
        addDebugInfo(`❌ API répond avec status: ${response.status}`)
        return false
      }
    } catch (error) {
      addDebugInfo(`❌ Erreur connexion API: ${error.message}`)
      return false
    }
  }

  // Récupérer les parcours avec debug détaillé
  const fetchRoutes = async (showLoading = true) => {
    if (!isConfigured) {
      addDebugInfo('❌ fetchRoutes: API non configurée')
      return
    }

    if (showLoading) setLoading(true)
    setError('')

    try {
      addDebugInfo('📡 Début récupération routes...')
      
      // Test de connectivité d'abord
      const isConnected = await testApiConnection()
      if (!isConnected) {
        throw new Error('API non accessible')
      }

      // Préparation des paramètres - NE PAS ENVOYER undefined
      const params = {
        page: pagination.page,
        limit: pagination.per_page
      }

      // Ajouter seulement les paramètres non vides
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim()
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
      
      // Log complet de la réponse pour debug
      console.log('Réponse complète API routes:', response)
      addDebugInfo(`📦 Type de données reçues: ${typeof response.data}`)
      
      if (response.data) {
        // Log détaillé de la structure
        addDebugInfo(`🔍 Structure response.data:`, JSON.stringify(Object.keys(response.data)))
        
        // Essayer différentes structures de réponse
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
          // Log de la structure complète pour debug
          addDebugInfo(`🔍 Structure inconnue:`)
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
        
        // Log détaillé de la première route pour debug
        if (routesData.length > 0) {
          addDebugInfo(`🔍 Première route: ${JSON.stringify(routesData[0]).substring(0, 200)}...`)
        }
        
      } else {
        throw new Error('Pas de données dans la réponse')
      }

    } catch (error) {
      addDebugInfo(`❌ Erreur fetchRoutes: ${error.message}`)
      console.error('Erreur détaillée fetchRoutes:', error)
      
      // Log de l'erreur complète
      if (error.response) {
        addDebugInfo(`📱 Status: ${error.response.status}`)
        addDebugInfo(`📱 Data: ${JSON.stringify(error.response.data).substring(0, 200)}`)
        console.log('Erreur response complète:', error.response)
      }
      
      // Messages d'erreur contextuels
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        setError('Impossible de contacter le serveur API. Vérifiez la connexion réseau.')
      } else if (error.response) {
        if (error.response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
        } else if (error.response.status === 403) {
          setError('Accès refusé. Permissions insuffisantes.')
        } else if (error.response.status === 404) {
          setError('Endpoint /api/routes non trouvé sur le serveur.')
        } else if (error.response.status >= 500) {
          setError('Erreur serveur. Vérifiez que l\'API backend est démarrée.')
        } else {
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
    setDebugInfo('')
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
      
      // Préparer les données en nettoyant les valeurs vides
      const routeData = {
        name: newRoute.name.trim(),
        description: newRoute.description.trim() || '',
        distance: newRoute.distance ? parseFloat(newRoute.distance) : 0,
        difficulty: newRoute.difficulty || 'Facile',
        estimated_duration: newRoute.estimated_duration ? parseInt(newRoute.estimated_duration) : null,
        elevation_gain: newRoute.elevation_gain ? parseInt(newRoute.elevation_gain) : null,
        waypoints: newRoute.waypoints || [],
        status: 'active' // Statut par défaut
      }
      
      addDebugInfo(`📋 Données à envoyer: ${JSON.stringify(routeData)}`)
      
      const response = await api.routes.create(routeData)
      
      if (response.data) {
        const newRouteData = response.data.data || response.data
        setRoutes([newRouteData, ...routes])
        setShowCreateModal(false)
        resetNewRoute()
        addDebugInfo('✅ Parcours créé avec succès')
      }
    } catch (error) {
      addDebugInfo(`❌ Erreur création: ${error.message}`)
      
      // Log détaillé de l'erreur
      if (error.response) {
        addDebugInfo(`📱 Status: ${error.response.status}`)
        addDebugInfo(`📱 Data: ${JSON.stringify(error.response.data)}`)
        console.error('Erreur création complète:', error.response)
        
        // Messages d'erreur spécifiques
        if (error.response.status === 500) {
          if (error.response.data && error.response.data.message) {
            setError(`Erreur serveur: ${error.response.data.message}`)
          } else {
            setError('Erreur serveur interne. Vérifiez les logs du backend.')
          }
        } else if (error.response.status === 400) {
          setError(`Données invalides: ${error.response.data?.message || 'Vérifiez les champs du formulaire'}`)
        } else if (error.response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
        } else {
          setError(`Erreur ${error.response.status}: ${error.response.data?.message || error.message}`)
        }
      } else {
        setError(`Impossible de créer le parcours: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser le formulaire
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

  // Formater la durée
  const formatDuration = (seconds) => {
    if (!seconds) return 'Non définie'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
  }

  // Affichage conditionnel si API non configurée
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ServerIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Configuration API requise
            </h2>
            <p className="text-gray-600 mb-6">
              Veuillez configurer une connexion API pour accéder aux parcours.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Utilisez le sélecteur API dans la barre de navigation</p>
              <p>• Ou configurez l'API dans les paramètres</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <MapPinIcon className="h-8 w-8 text-green-600" />
                <span>Parcours</span>
              </h1>
              {selectedApi && (
                <p className="text-sm text-gray-600 mt-1">
                  📡 Connecté à: <span className="font-mono text-green-600">{selectedApi.name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="btn bg-blue-600 hover:bg-blue-700 text-white btn-sm"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              {/* Bouton de test direct API */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={async () => {
                    addDebugInfo('🧪 Test direct API...')
                    try {
                      const directResponse = await fetch(`${selectedApi.url}/api/routes`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                        }
                      })
                      const data = await directResponse.json()
                      addDebugInfo(`🧪 Réponse directe: ${JSON.stringify(data, null, 2)}`)
                      console.log('Test direct API - Réponse complète:', data)
                    } catch (error) {
                      addDebugInfo(`🧪 Erreur test direct: ${error.message}`)
                    }
                  }}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white btn-sm"
                >
                  🧪 Test Direct
                </button>
              )}
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn bg-green-600 hover:bg-green-700 text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouveau parcours
              </button>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Erreur de chargement
                </h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Parcours</p>
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <PlayIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses Actives</p>
                <p className="text-2xl font-bold text-gray-900">{activeRuns.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeRuns.filter(run => run.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ServerIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Status</p>
                <p className="text-sm font-bold text-green-600">Connecté</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un parcours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filtres</span>
              </button>
            </div>
          </div>

          {/* Filtres étendus */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Toutes les difficultés</option>
                  <option value="Facile">Facile</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Difficile">Difficile</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Liste des parcours */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des parcours...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="p-8 text-center">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun parcours trouvé</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filters.status !== 'all' || filters.difficulty !== 'all'
                  ? 'Aucun parcours ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre premier parcours.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn bg-green-600 hover:bg-green-700 text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer un parcours
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parcours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance / Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulté
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {route.name || 'Parcours sans nom'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {route.description || 'Aucune description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {route.distance ? `${route.distance} km` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDuration(route.estimated_duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          route.difficulty === 'Facile' ? 'bg-green-100 text-green-800' :
                          route.difficulty === 'Moyen' ? 'bg-yellow-100 text-yellow-800' :
                          route.difficulty === 'Difficile' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {route.difficulty || 'Facile'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          route.status === 'active' ? 'bg-green-100 text-green-800' :
                          route.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {route.status === 'active' ? 'Actif' :
                           route.status === 'inactive' ? 'Inactif' : 'Maintenance'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedRoute(route)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRoute(route)
                              setShowEditModal(true)
                            }}
                            className="text-green-600 hover:text-green-900"
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
          )}
        </div>

        {/* Debug Panel - Uniquement en développement */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Debug Console</h3>
              <button
                onClick={() => setDebugInfo('')}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto">
              {debugInfo}
            </pre>
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Nouveau Parcours</h3>
              <form onSubmit={handleCreateRoute} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du parcours
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="ex: Tour du lac"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Description du parcours..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="ex: 5.2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulté
                    </label>
                    <select
                      value={newRoute.difficulty}
                      onChange={(e) => setNewRoute({...newRoute, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Facile">Facile</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Difficile">Difficile</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée estimée (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newRoute.estimated_duration}
                      onChange={(e) => setNewRoute({...newRoute, estimated_duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="ex: 30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dénivelé (m)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRoute.elevation_gain}
                      onChange={(e) => setNewRoute({...newRoute, elevation_gain: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="ex: 150"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  {/* Bouton de test en mode dev */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      onClick={async () => {
                        addDebugInfo('🧪 Test création API directe...')
                        try {
                          const testData = {
                            name: 'Test Parcours',
                            description: 'Parcours de test',
                            distance: 5.0,
                            difficulty: 'Facile',
                            estimated_duration: 1800,
                            elevation_gain: 100,
                            waypoints: [],
                            status: 'active'
                          }
                          
                          const directResponse = await fetch(`${selectedApi.url}/api/routes`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
                            },
                            body: JSON.stringify(testData)
                          })
                          
                          const data = await directResponse.json()
                          addDebugInfo(`🧪 Test création - Status: ${directResponse.status}`)
                          addDebugInfo(`🧪 Test création - Réponse: ${JSON.stringify(data, null, 2)}`)
                          console.log('Test création API - Réponse complète:', data)
                          
                          if (directResponse.ok) {
                            addDebugInfo('✅ Test création réussi')
                            // Recharger les routes
                            fetchRoutes()
                          } else {
                            addDebugInfo(`❌ Test création échoué: ${data.message || 'Erreur inconnue'}`)
                          }
                        } catch (error) {
                          addDebugInfo(`🧪 Erreur test création: ${error.message}`)
                        }
                      }}
                      className="btn bg-purple-600 hover:bg-purple-700 text-white btn-sm"
                    >
                      🧪 Test
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetNewRoute()
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newRoute.name}
                    className="btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {selectedRoute && !showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Détails du Parcours</h3>
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedRoute.name}</h4>
                  <p className="text-gray-600">{selectedRoute.description || 'Aucune description'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Informations</h5>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">Distance</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedRoute.distance ? `${selectedRoute.distance} km` : 'Non définie'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Durée estimée</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {formatDuration(selectedRoute.estimated_duration)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Dénivelé</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedRoute.elevation_gain ? `${selectedRoute.elevation_gain} m` : 'Non défini'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Statut</h5>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">Difficulté</dt>
                        <dd>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedRoute.difficulty === 'Facile' ? 'bg-green-100 text-green-800' :
                            selectedRoute.difficulty === 'Moyen' ? 'bg-yellow-100 text-yellow-800' :
                            selectedRoute.difficulty === 'Difficile' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedRoute.difficulty || 'Facile'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">État</dt>
                        <dd>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedRoute.status === 'active' ? 'bg-green-100 text-green-800' :
                            selectedRoute.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedRoute.status === 'active' ? 'Actif' :
                             selectedRoute.status === 'inactive' ? 'Inactif' : 'Maintenance'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Créé le</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedRoute.created_at 
                            ? new Date(selectedRoute.created_at).toLocaleDateString('fr-FR')
                            : 'Non disponible'
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {selectedRoute.waypoints && selectedRoute.waypoints.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Points de passage</h5>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {selectedRoute.waypoints.length} point(s) de passage défini(s)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn bg-green-600 hover:bg-green-700 text-white"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ParcoursPage