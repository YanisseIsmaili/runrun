// running-admin/src/pages/Routes.jsx
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
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useApiCall } from '../hooks/useErrorHandler'
import ErrorMessage from '../components/ErrorMessage'
import api from '../services/api'

// Données temporaires pour la démonstration
const tempRoutes = [
  {
    id: 1,
    name: "Parcours du Parc Central",
    description: "Circuit autour du parc avec dénivelé modéré",
    distance: 5.2,
    estimated_duration: 1800,
    difficulty: "Facile",
    active_runners: 3,
    total_runs_today: 12,
    status: "active",
    created_at: "2024-01-15",
    waypoints: [
      { lat: 48.8566, lng: 2.3522, name: "Départ" },
      { lat: 48.8576, lng: 2.3532, name: "Point 1" },
      { lat: 48.8586, lng: 2.3542, name: "Arrivée" }
    ]
  },
  {
    id: 2,
    name: "Circuit Urbain",
    description: "Parcours en ville avec plusieurs arrêts",
    distance: 8.5,
    estimated_duration: 2700,
    difficulty: "Moyen",
    active_runners: 7,
    total_runs_today: 8,
    status: "active",
    created_at: "2024-02-10",
    waypoints: [
      { lat: 48.8566, lng: 2.3522, name: "Départ" },
      { lat: 48.8576, lng: 2.3532, name: "Centre-ville" },
      { lat: 48.8586, lng: 2.3542, name: "Retour" }
    ]
  },
  {
    id: 3,
    name: "Trail Montagne",
    description: "Parcours difficile en montagne",
    distance: 12.3,
    estimated_duration: 4500,
    difficulty: "Difficile",
    active_runners: 2,
    total_runs_today: 3,
    status: "inactive",
    created_at: "2024-03-05",
    waypoints: [
      { lat: 48.8566, lng: 2.3522, name: "Base" },
      { lat: 48.8576, lng: 2.3532, name: "Sommet" },
      { lat: 48.8586, lng: 2.3542, name: "Retour base" }
    ]
  }
]

const tempActiveRuns = [
  {
    id: 101,
    user: { id: 1, name: "Alexandre Dupont" },
    route_id: 1,
    route_name: "Parcours du Parc Central",
    start_time: new Date(Date.now() - 900000),
    current_position: { lat: 48.8576, lng: 2.3532 },
    distance_covered: 2.1,
    estimated_remaining: 15,
    status: "running",
    avg_pace: "5:12"
  },
  {
    id: 102,
    user: { id: 2, name: "Sophie Martin" },
    route_id: 2,
    route_name: "Circuit Urbain",
    start_time: new Date(Date.now() - 1800000),
    current_position: { lat: 48.8586, lng: 2.3542 },
    distance_covered: 6.2,
    estimated_remaining: 8,
    status: "running",
    avg_pace: "4:45"
  }
]

const Routes = () => {
  const [routes, setRoutes] = useState([])
  const [activeRuns, setActiveRuns] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    distance: '',
    difficulty: 'Facile',
    estimated_duration: ''
  })
  
  const { callApi, loading, error, retry, clearError } = useApiCall()

  useEffect(() => {
    fetchRoutes()
    fetchActiveRuns()
    
    const interval = setInterval(() => {
      fetchActiveRuns()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchRoutes = async () => {
    await callApi(
      async () => {
        try {
          const response = await api.routes.getAll()
          return response.data?.routes || tempRoutes
        } catch (error) {
          console.log('API non disponible, utilisation des données de test')
          return tempRoutes
        }
      },
      {
        onSuccess: (data) => setRoutes(data),
        errorMessage: 'Impossible de charger les itinéraires'
      }
    )
  }

  const fetchActiveRuns = async () => {
    try {
      const response = await api.routes.getActiveRuns()
      setActiveRuns(response.data || tempActiveRuns)
    } catch (error) {
      setActiveRuns(tempActiveRuns)
    }
  }

  const handleCreateRoute = async (e) => {
    e.preventDefault()
    
    if (!newRoute.name || !newRoute.distance) {
      alert('Nom et distance requis')
      return
    }

    await callApi(
      async () => {
        try {
          const routeData = {
            ...newRoute,
            distance: parseFloat(newRoute.distance),
            estimated_duration: newRoute.estimated_duration ? parseInt(newRoute.estimated_duration) * 60 : null
          }
          
          const response = await api.routes.create(routeData)
          return response.data
        } catch (error) {
          // Simulation si API non disponible
          const newId = Math.max(...routes.map(r => r.id)) + 1
          const simulatedRoute = {
            id: newId,
            ...newRoute,
            distance: parseFloat(newRoute.distance),
            estimated_duration: newRoute.estimated_duration ? parseInt(newRoute.estimated_duration) * 60 : 1800,
            active_runners: 0,
            total_runs_today: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            waypoints: []
          }
          return simulatedRoute
        }
      },
      {
        onSuccess: (data) => {
          setRoutes(prevRoutes => [...prevRoutes, data])
          setShowCreateModal(false)
          setNewRoute({
            name: '',
            description: '',
            distance: '',
            difficulty: 'Facile',
            estimated_duration: ''
          })
          // Recharger la liste pour s'assurer de la cohérence
          setTimeout(() => fetchRoutes(), 500)
        },
        errorMessage: 'Impossible de créer l\'itinéraire'
      }
    )
  }

  const handleToggleRouteStatus = async (routeId, currentStatus) => {
    await callApi(
      async () => {
        try {
          await api.routes.toggleStatus(routeId)
        } catch (error) {
          console.log('Simulation du changement de statut')
        }
        
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        setRoutes(routes.map(route => 
          route.id === routeId 
            ? { ...route, status: newStatus }
            : route
        ))
        
        return { success: true }
      },
      {
        errorMessage: 'Impossible de modifier le statut'
      }
    )
  }

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet itinéraire ?')) {
      return
    }

    await callApi(
      async () => {
        try {
          await api.routes.delete(routeId)
        } catch (error) {
          console.log('Simulation de la suppression')
        }
        
        setRoutes(routes.filter(route => route.id !== routeId))
        return { success: true }
      },
      {
        errorMessage: 'Impossible de supprimer l\'itinéraire'
      }
    )
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins}min`
    
    const diffHours = Math.floor(diffMins / 60)
    return `Il y a ${diffHours}h ${diffMins % 60}min`
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Facile': return 'bg-green-100 text-green-800'
      case 'Moyen': return 'bg-yellow-100 text-yellow-800'
      case 'Difficile': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'finished': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading && routes.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des itinéraires...</p>
        </div>
      </div>
    )
  }

  if (error && routes.length === 0) {
    return (
      <ErrorMessage 
        error={error}
        onRetry={() => retry(fetchRoutes)}
        onDismiss={clearError}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Itinéraires</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administration des parcours et suivi des courses en temps réel
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchActiveRuns}
            className="btn btn-secondary"
            disabled={loading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel Itinéraire
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Itinéraires totaux</p>
              <p className="text-2xl font-semibold text-gray-900">{routes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Courses actives</p>
              <p className="text-2xl font-semibold text-gray-900">{activeRuns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Itinéraires actifs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {routes.filter(r => r.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Courses en pause</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activeRuns.filter(r => r.status === 'paused').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses actives */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Courses en cours</h2>
              <p className="text-sm text-gray-500">Suivi en temps réel des coureurs actifs</p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Actualisation automatique
            </div>
          </div>
        </div>
        
        {activeRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coureur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itinéraire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temps restant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                          {run.user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{run.user.name}</div>
                          <div className="text-sm text-gray-500">{formatTimeAgo(run.start_time)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {run.route_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.distance_covered.toFixed(1)} km
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((run.distance_covered / (run.distance_covered + run.estimated_remaining * 0.1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.avg_pace} min/km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status)}`}>
                        {run.status === 'running' ? 'En cours' : 
                         run.status === 'paused' ? 'En pause' : 'Terminé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ~{run.estimated_remaining} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {run.status === 'running' ? (
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="text-green-600 hover:text-green-900">
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune course active</h3>
            <p className="mt-1 text-sm text-gray-500">Aucun coureur n'est actuellement en course</p>
          </div>
        )}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un itinéraire..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <button className="btn btn-secondary">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
        </div>
      </div>

      {/* Liste des itinéraires */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Itinéraire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulté
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coureurs actifs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses aujourd'hui
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
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{route.name}</div>
                      <div className="text-sm text-gray-500">{route.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.distance} km
                    <div className="text-xs text-gray-400">
                      ~{formatDuration(route.estimated_duration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(route.difficulty)}`}>
                      {route.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.active_runners}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.total_runs_today}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                        route.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => handleToggleRouteStatus(route.id, route.status)}
                    >
                      {route.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      onClick={() => setSelectedRoute(route)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouvel itinéraire</h3>
              
              <form onSubmit={handleCreateRoute} className="space-y-4">
                <div>
                  <label className="form-label">Nom de l'itinéraire</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Durée estimée (min)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRoute.estimated_duration}
                      onChange={(e) => setNewRoute({...newRoute, estimated_duration: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Difficulté</label>
                  <select
                    className="form-input"
                    value={newRoute.difficulty}
                    onChange={(e) => setNewRoute({...newRoute, difficulty: e.target.value})}
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedRoute && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedRoute.name}</h3>
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">{selectedRoute.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Distance:</span>
                    <p className="font-medium">{selectedRoute.distance} km</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Durée estimée:</span>
                    <p className="font-medium">{formatDuration(selectedRoute.estimated_duration)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Difficulté:</span>
                    <p className="font-medium">{selectedRoute.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Coureurs actifs:</span>
                    <p className="font-medium">{selectedRoute.active_runners}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Points de passage:</span>
                  <ul className="mt-2 space-y-1">
                    {selectedRoute.waypoints?.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {index + 1}. {point.name} ({point.lat?.toFixed(4)}, {point.lng?.toFixed(4)})
                      </li>
                    )) || <li className="text-sm text-gray-500">Aucun point de passage défini</li>}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Routes