// running-admin/src/pages/Parcours.jsx - FICHIER COMPLET RÉPARÉ
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
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useApiCall } from '../hooks/useErrorHandler'
import ErrorMessage from '../components/ErrorMessage'
import api from '../services/api'

const ParcoursPage = () => {
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
        fetchRoutes(false)
      }, refreshInterval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Récupérer les parcours
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
          setRoutes(data.data.routes || [])
          setPagination({
            ...pagination,
            pages: data.data.pagination?.pages || 1,
            total: data.data.pagination?.total || 0
          })
        },
        errorMessage: 'Impossible de charger les parcours',
        showLoading
      }
    )
  }

  // Récupérer les courses actives
  const fetchActiveRuns = async () => {
    await callApi(
      async () => {
        const response = await api.routes.getActiveRuns()
        return response.data
      },
      {
        onSuccess: (data) => {
          setActiveRuns(data.data || [])
        },
        errorMessage: 'Impossible de charger les courses actives',
        showLoading: false
      }
    )
  }

  // Créer un nouveau parcours
  const handleCreateRoute = async (e) => {
    e.preventDefault()
    
    await callApi(
      async () => {
        const response = await api.routes.create(newRoute)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes([data.data, ...routes])
          setShowCreateModal(false)
          resetNewRoute()
        },
        errorMessage: 'Impossible de créer le parcours'
      }
    )
  }

  // Modifier un parcours
  const handleEditRoute = async (e) => {
    e.preventDefault()
    
    await callApi(
      async () => {
        const response = await api.routes.update(selectedRoute.id, selectedRoute)
        return response.data
      },
      {
        onSuccess: (data) => {
          setRoutes(routes.map(route => 
            route.id === data.data.id ? data.data : route
          ))
          setShowEditModal(false)
          setSelectedRoute(null)
        },
        errorMessage: 'Impossible de modifier le parcours'
      }
    )
  }

  // Changer le statut d'un parcours
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

  // Supprimer un parcours
  const handleDeleteRoute = async (routeId) => {
    const route = routes.find(r => r.id === routeId)
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le parcours "${route?.name}" ?`)) {
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
        errorMessage: 'Impossible de supprimer le parcours'
      }
    )
  }

  // Voir les détails d'un parcours
  const handleViewRoute = async (route) => {
    await callApi(
      async () => {
        const response = await api.routes.getRouteStats(route.id)
        return response.data
      },
      {
        onSuccess: (data) => {
          setSelectedRoute({ ...route, ...data.data })
          console.log('Statistiques du parcours:', data.data)
        },
        errorMessage: 'Impossible de charger les statistiques'
      }
    )
  }

  // Export des parcours
  const handleExportRoutes = async () => {
    await callApi(
      async () => {
        const response = await api.routes.export()
        
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `parcours_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      {
        errorMessage: 'Impossible d\'exporter les parcours'
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
    <div className={`${showFilters ? 'block' : 'hidden'} bg-gray-50 p-4 border-b`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulté
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">Toutes les difficultés</option>
            <option value="Facile">Facile</option>
            <option value="Moyen">Moyen</option>
            <option value="Difficile">Difficile</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({ status: 'all', difficulty: 'all' })
              setSearchTerm('')
            }}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapPinIcon className="h-8 w-8 text-green-600 mr-3" />
            Gestion des Parcours
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les parcours de course et suivez l'activité en temps réel
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              autoRefresh ? 'bg-green-50 text-green-700 border-green-300' : ''
            }`}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </button>
          
          <button
            onClick={handleExportRoutes}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exporter
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouveau Parcours
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Parcours
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pagination.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Courses Actives
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activeRuns.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Parcours Actifs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.filter(r => r.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PauseIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Parcours Inactifs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.filter(r => r.status === 'inactive').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un parcours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
        
        <FiltersPanel />
      </div>

      {/* Message d'erreur */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={retry}
          onDismiss={clearError}
          variant="error"
        />
      )}

      {/* Tableau des parcours */}
      {loading && routes.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des parcours...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun parcours</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par créer votre premier parcours de course.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau Parcours
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parcours
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
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPinIcon className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      {formatDuration(route.estimated_duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
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
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">1</span> à{' '}
                    <span className="font-medium">{Math.min(pagination.per_page, routes.length)}</span> sur{' '}
                    <span className="font-medium">{pagination.total}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Précédent
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Créer un nouveau parcours</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetNewRoute()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRoute} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du parcours *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Parcours du Parc Central"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Description du parcours..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newRoute.distance}
                    onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="5.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulté
                  </label>
                  <select
                    value={newRoute.difficulty}
                    onChange={(e) => setNewRoute({ ...newRoute, difficulty: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Durée estimée (minutes)
                  </label>
                  <input
                    type="number"
                    value={newRoute.estimated_duration}
                    onChange={(e) => setNewRoute({ ...newRoute, estimated_duration: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dénivelé (m)
                  </label>
                  <input
                    type="number"
                    value={newRoute.elevation_gain}
                    onChange={(e) => setNewRoute({ ...newRoute, elevation_gain: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="100"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetNewRoute()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </div>
                  ) : (
                    'Créer le parcours'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedRoute && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Modifier le parcours</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRoute(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditRoute} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du parcours *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectedRoute.name}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={selectedRoute.description || ''}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={selectedRoute.distance}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, distance: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulté
                  </label>
                  <select
                    value={selectedRoute.difficulty}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, difficulty: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Difficile">Difficile</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Durée estimée (minutes)
                  </label>
                  <input
                    type="number"
                    value={selectedRoute.estimated_duration || ''}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, estimated_duration: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dénivelé (m)
                  </label>
                  <input
                    type="number"
                    value={selectedRoute.elevation_gain || ''}
                    onChange={(e) => setSelectedRoute({ ...selectedRoute, elevation_gain: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedRoute(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Modification...
                    </div>
                  ) : (
                    'Modifier le parcours'
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

export default ParcoursPage