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
  ArrowPathIcon,
  PencilIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useApiCall } from '../hooks/useErrorHandler'
import ErrorMessage from '../components/ErrorMessage'
import api from '../services/api'

const RoutesPage = () => {
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
  
  // États pour l'interface
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  
  const { callApi, loading, error, retry, clearError } = useApiCall()

  // Chargement initial
  useEffect(() => {
    fetchRoutes()
    fetchActiveRuns()
  }, [pagination.page, filters, searchTerm])

  // Auto-refresh pour les courses actives
  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchActiveRuns()
        fetchRoutes(false) // Mettre à jour les statistiques sans loading
      }, refreshInterval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Récupérer les itinéraires
  const fetchRoutes = async (showLoading = true) => {
    const params = {
      page: pagination.page,
      limit: pagination.per_page,
      search: searchTerm,
      status: filters.status !== 'all' ? filters.status : undefined,
      difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined
    }

    await callApi(
      async () => {
        const response = await api.routes.getAll(params)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes(data.routes || [])
          setPagination(data.pagination || pagination)
        },
        errorMessage: 'Impossible de charger les itinéraires',
        showLoading
      }
    )
  }

  // Récupérer les courses actives
  const fetchActiveRuns = async () => {
    try {
      const response = await api.routes.getActiveRuns()
      setActiveRuns(response.data || [])
    } catch (error) {
      console.warn('Erreur lors de la récupération des courses actives:', error)
    }
  }

  // Créer un nouvel itinéraire
  const handleCreateRoute = async (e) => {
    e.preventDefault()
    
    if (!newRoute.name.trim() || !newRoute.distance) {
      alert('Nom et distance requis')
      return
    }

    const routeData = {
      name: newRoute.name.trim(),
      description: newRoute.description.trim(),
      distance: parseFloat(newRoute.distance),
      difficulty: newRoute.difficulty,
      estimated_duration: newRoute.estimated_duration ? parseInt(newRoute.estimated_duration) * 60 : null,
      elevation_gain: newRoute.elevation_gain ? parseFloat(newRoute.elevation_gain) : null,
      waypoints: newRoute.waypoints
    }

    await callApi(
      async () => {
        const response = await api.routes.create(routeData)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes(prevRoutes => [data.data, ...prevRoutes])
          setShowCreateModal(false)
          resetNewRoute()
          // Recharger la liste pour s'assurer de la cohérence
          setTimeout(() => fetchRoutes(), 500)
        },
        errorMessage: 'Impossible de créer l\'itinéraire'
      }
    )
  }

  // Modifier un itinéraire
  const handleUpdateRoute = async (e) => {
    e.preventDefault()
    
    if (!selectedRoute || !selectedRoute.name.trim() || !selectedRoute.distance) {
      alert('Nom et distance requis')
      return
    }

    const routeData = {
      name: selectedRoute.name.trim(),
      description: selectedRoute.description.trim(),
      distance: parseFloat(selectedRoute.distance),
      difficulty: selectedRoute.difficulty,
      estimated_duration: selectedRoute.estimated_duration ? parseInt(selectedRoute.estimated_duration) / 60 : null,
      elevation_gain: selectedRoute.elevation_gain ? parseFloat(selectedRoute.elevation_gain) : null,
      waypoints: selectedRoute.waypoints || []
    }

    await callApi(
      async () => {
        const response = await api.routes.update(selectedRoute.id, routeData)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes(prevRoutes => 
            prevRoutes.map(route => 
              route.id === selectedRoute.id ? data.data : route
            )
          )
          setShowEditModal(false)
          setSelectedRoute(null)
        },
        errorMessage: 'Impossible de modifier l\'itinéraire'
      }
    )
  }

  // Changer le statut d'un itinéraire
  const handleToggleRouteStatus = async (routeId, currentStatus) => {
    await callApi(
      async () => {
        const response = await api.routes.toggleStatus(routeId)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes(routes.map(route => 
            route.id === routeId 
              ? { ...route, status: data.data.status }
              : route
          ))
        },
        errorMessage: 'Impossible de modifier le statut'
      }
    )
  }

  // Supprimer un itinéraire
  const handleDeleteRoute = async (routeId) => {
    const route = routes.find(r => r.id === routeId)
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'itinéraire "${route?.name}" ?`)) {
      return
    }

    await callApi(
      async () => {
        await api.routes.delete(routeId)
      },
      {
        onSuccess: () => {
          setRoutes(routes.filter(route => route.id !== routeId))
        },
        errorMessage: 'Impossible de supprimer l\'itinéraire'
      }
    )
  }

  // Voir les détails d'un itinéraire
  const handleViewRoute = async (route) => {
    await callApi(
      async () => {
        const response = await api.routes.getRouteStats(route.id)
        return response.data
      },
      {
        onSuccess: (data) => {
          setSelectedRoute({ ...route, ...data.data })
          // Ici vous pourriez ouvrir un modal de détails
          console.log('Statistiques de l\'itinéraire:', data.data)
        },
        errorMessage: 'Impossible de charger les statistiques'
      }
    )
  }

  // Export des itinéraires
  const handleExportRoutes = async () => {
    await callApi(
      async () => {
        const response = await api.routes.export()
        
        // Télécharger le fichier
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `routes_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      {
        errorMessage: 'Impossible d\'exporter les itinéraires'
      }
    )
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

  // Composant de filtres
  const FiltersPanel = () => (
    <div className={`${showFilters ? 'block' : 'hidden'} bg-gray-50 p-4 rounded-lg mb-4`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
          <select 
            className="form-select"
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
          >
            <option value="all">Toutes</option>
            <option value="Facile">Facile</option>
            <option value="Moyen">Moyen</option>
            <option value="Difficile">Difficile</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auto-refresh</label>
          <div className="flex items-center space-x-2">
            <button
              className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Activé' : 'Désactivé'}
            </button>
            {autoRefresh && (
              <select 
                className="form-select text-sm"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              >
                <option value={15000}>15s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1min</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Interface de gestion d'erreur
  if (error && !routes.length) {
    return (
      <div className="p-6">
        <ErrorMessage 
          message={error} 
          onRetry={retry}
          onDismiss={clearError}
        />
      </div>
    )
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des itinéraires</h1>
        <p className="mt-1 text-sm text-gray-500">
          {routes.length} itinéraire(s) • {activeRuns.length} course(s) en cours
        </p>
      </div>

      {/* Barre d'outils */}
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
          <button 
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => fetchRoutes()}
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleExportRoutes}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel itinéraire
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      <FiltersPanel />

      {/* Courses actives */}
      {activeRuns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Courses en cours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRuns.map((run) => (
              <div key={run.id} className="bg-white rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{run.user?.username}</div>
                    <div className="text-xs text-gray-500">{run.route?.name}</div>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    En cours
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && routes.length > 0 && (
        <div className="mb-4">
          <ErrorMessage 
            message={error} 
            onRetry={retry}
            onDismiss={clearError}
            variant="warning"
          />
        </div>
      )}

      {/* Tableau des itinéraires */}
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
                  Durée estimée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {route.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {route.description || 'Aucune description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.distance} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.difficulty === 'Facile' 
                        ? 'bg-green-100 text-green-800'
                        : route.difficulty === 'Moyen'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {formatDuration(route.estimated_duration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-xs">
                      <div>{route.active_runners || 0} en cours</div>
                      <div>{route.total_runs_today || 0} aujourd'hui</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                        route.status === 'active' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => handleToggleRouteStatus(route.id, route.status)}
                    >
                      {route.status === 'active' ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleViewRoute(route)}
                        title="Voir les statistiques"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          setSelectedRoute(route)
                          setShowEditModal(true)
                        }}
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteRoute(route.id)}
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
              >
                Précédent
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> sur{' '}
                  <span className="font-medium">{pagination.pages}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Créer un nouvel itinéraire</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetNewRoute()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateRoute} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Nom de l'itinéraire *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    placeholder="Parcours du Parc Central"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                    placeholder="Description de l'itinéraire..."
                  />
                </div>
                
                <div>
                  <label className="form-label">Distance (km) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={newRoute.distance}
                    onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                    placeholder="5.2"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Difficulté</label>
                  <select
                    className="form-select"
                    value={newRoute.difficulty}
                    onChange={(e) => setNewRoute({...newRoute, difficulty: e.target.value})}
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Durée estimée (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={newRoute.estimated_duration}
                    onChange={(e) => setNewRoute({...newRoute, estimated_duration: e.target.value})}
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <label className="form-label">Dénivelé (mètres)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    value={newRoute.elevation_gain}
                    onChange={(e) => setNewRoute({...newRoute, elevation_gain: e.target.value})}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetNewRoute()
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </div>
                  ) : (
                    'Créer l\'itinéraire'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedRoute && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Modifier l'itinéraire</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRoute(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateRoute} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Nom de l'itinéraire *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedRoute.name || ''}
                    onChange={(e) => setSelectedRoute({...selectedRoute, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={selectedRoute.description || ''}
                    onChange={(e) => setSelectedRoute({...selectedRoute, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="form-label">Distance (km) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={selectedRoute.distance || ''}
                    onChange={(e) => setSelectedRoute({...selectedRoute, distance: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Difficulté</label>
                  <select
                    className="form-select"
                    value={selectedRoute.difficulty || 'Facile'}
                    onChange={(e) => setSelectedRoute({...selectedRoute, difficulty: e.target.value})}
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Durée estimée (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={selectedRoute.estimated_duration ? Math.round(selectedRoute.estimated_duration / 60) : ''}
                    onChange={(e) => setSelectedRoute({...selectedRoute, estimated_duration: e.target.value ? parseInt(e.target.value) * 60 : null})}
                  />
                </div>
                
                <div>
                  <label className="form-label">Dénivelé (mètres)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    value={selectedRoute.elevation_gain || ''}
                    onChange={(e) => setSelectedRoute({...selectedRoute, elevation_gain: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedRoute(null)
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Modification...
                    </div>
                  ) : (
                    'Modifier l\'itinéraire'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoutesPage