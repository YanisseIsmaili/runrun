import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ClockIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  PlayIcon,
  ChartBarIcon,
  XMarkIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

// Hook pour intégrer avec le DebugPanel global
const useDebugIntegration = () => {
  const addDebugLog = (message, type = 'info', category = 'history') => {
    // Dispatch vers le DebugPanel global
    window.dispatchEvent(new CustomEvent('debugLog', { 
      detail: { 
        message: `[HISTORY] ${message}`, 
        type, 
        category,
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          fractionalSecondDigits: 3
        })
      } 
    }))
    
    // Log dans console
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[HISTORY] ${message}`)
  }
  
  return { addDebugLog }
}

const RunningHistory = () => {
  const { isConfigured, selectedApi } = useApiConfig()
  const { addDebugLog } = useDebugIntegration()
  
  // États principaux
  const [runs, setRuns] = useState([])
  const [filteredRuns, setFilteredRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    period: 'all', // all, week, month, year
    minDistance: '',
    maxDistance: '',
    sortBy: 'date', // date, distance, duration
    sortOrder: 'desc' // asc, desc
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // États pour les modals
  const [selectedRun, setSelectedRun] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 20,
    total: 0
  })

  // Chargement initial
  useEffect(() => {
    addDebugLog('🚀 Initialisation RunningHistory')
    if (isConfigured) {
      addDebugLog(`✅ API configurée: ${selectedApi?.name || 'Inconnue'} (${selectedApi?.url || 'URL manquante'})`)
      fetchRuns()
    } else {
      addDebugLog('❌ API non configurée - impossible de charger l\'historique', 'error')
    }
  }, [isConfigured, pagination.page])

  // Application des filtres
  useEffect(() => {
    applyFilters()
  }, [runs, searchTerm, filters])

  const fetchRuns = async () => {
    if (!isConfigured) {
      setError('API non configurée')
      addDebugLog('❌ Tentative d\'appel API sans configuration', 'error')
      return
    }

    setLoading(true)
    setError('')
    addDebugLog(`🔄 Début récupération historique - Page ${pagination.page}`)
    
    const startTime = Date.now()
    
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        sort: `${filters.sortBy}_${filters.sortOrder}`
      }

      addDebugLog(`📋 Paramètres requête: ${JSON.stringify(params)}`, 'info')
      addDebugLog(`🌐 Test endpoint /api/users (temporaire) avec API: ${selectedApi.url}`, 'info')
      
      // Test temporaire avec endpoint qui marche
      const response = await api.users.getAll({})
      const responseTime = Date.now() - startTime
      
      addDebugLog(`✅ Réponse reçue en ${responseTime}ms`, 'success')
      addDebugLog(`📊 Données reçues: ${response.data?.runs?.length || 0} courses`, 'info')
      
      if (response.data?.runs) {
        setRuns(response.data.runs)
        setPagination(prev => ({
          ...prev,
          pages: response.data.pages || 1,
          total: response.data.total || 0
        }))
        addDebugLog(`📈 État mis à jour: ${response.data.runs.length} courses chargées`, 'success')
      } else {
        addDebugLog('⚠️ Structure de réponse inattendue', 'warning')
        addDebugLog(`🔍 Réponse complète: ${JSON.stringify(response.data)}`, 'info')
      }
    } catch (err) {
      const responseTime = Date.now() - startTime
      addDebugLog(`❌ Erreur après ${responseTime}ms: ${err.message}`, 'error')
      
      if (err.response) {
        addDebugLog(`📋 Status: ${err.response.status} ${err.response.statusText}`, 'error')
        addDebugLog(`📋 Headers: ${JSON.stringify(err.response.headers)}`, 'error')
        addDebugLog(`📋 Data: ${JSON.stringify(err.response.data)}`, 'error')
      } else if (err.request) {
        addDebugLog('📋 Aucune réponse du serveur', 'error')
        addDebugLog(`📋 Request: ${JSON.stringify(err.request)}`, 'error')
      } else {
        addDebugLog(`📋 Erreur de configuration: ${err.message}`, 'error')
      }
      
      console.error('Erreur chargement historique:', err)
      setError('Impossible de charger l\'historique des courses')
    } finally {
      setLoading(false)
      addDebugLog('🏁 Fin de la récupération')
    }
  }

  const applyFilters = () => {
    addDebugLog('🔍 Application des filtres')
    let filtered = [...runs]

    // Recherche textuelle
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const originalCount = filtered.length
      filtered = filtered.filter(run => 
        run.user?.username?.toLowerCase().includes(search) ||
        run.user?.first_name?.toLowerCase().includes(search) ||
        run.user?.last_name?.toLowerCase().includes(search)
      )
      addDebugLog(`🔎 Filtrage recherche "${searchTerm}": ${originalCount} → ${filtered.length} courses`)
    }

    // Filtre par période
    if (filters.period !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (filters.period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      const originalCount = filtered.length
      filtered = filtered.filter(run => new Date(run.start_time) >= startDate)
      addDebugLog(`📅 Filtrage période "${filters.period}": ${originalCount} → ${filtered.length} courses`)
    }

    // Filtre par distance
    if (filters.minDistance) {
      const originalCount = filtered.length
      filtered = filtered.filter(run => run.distance >= parseFloat(filters.minDistance))
      addDebugLog(`📏 Filtrage distance min ${filters.minDistance}km: ${originalCount} → ${filtered.length} courses`)
    }
    if (filters.maxDistance) {
      const originalCount = filtered.length
      filtered = filtered.filter(run => run.distance <= parseFloat(filters.maxDistance))
      addDebugLog(`📏 Filtrage distance max ${filters.maxDistance}km: ${originalCount} → ${filtered.length} courses`)
    }

    // Tri
    const sortCriteria = `${filters.sortBy}_${filters.sortOrder}`
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (filters.sortBy) {
        case 'distance':
          aVal = a.distance || 0
          bVal = b.distance || 0
          break
        case 'duration':
          aVal = a.duration || 0
          bVal = b.duration || 0
          break
        default: // date
          aVal = new Date(a.start_time)
          bVal = new Date(b.start_time)
      }
      
      return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    addDebugLog(`🔀 Tri appliqué: ${sortCriteria} - ${filtered.length} courses finales`)
    setFilteredRuns(filtered)
  }

  const handleDeleteRun = async (runId) => {
    addDebugLog(`🗑️ Début suppression course ID: ${runId}`)
    try {
      await api.delete(`/api/admin/runs/${runId}`)
      addDebugLog(`✅ Course ${runId} supprimée avec succès`, 'success')
      setRuns(prev => prev.filter(run => run.id !== runId))
      setShowDeleteModal(false)
      setSelectedRun(null)
    } catch (err) {
      addDebugLog(`❌ Erreur suppression course ${runId}: ${err.message}`, 'error')
      console.error('Erreur suppression course:', err)
      setError('Impossible de supprimer la course')
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const resetFilters = () => {
    setFilters({
      period: 'all',
      minDistance: '',
      maxDistance: '',
      sortBy: 'date',
      sortOrder: 'desc'
    })
    setSearchTerm('')
  }

  if (!isConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            API non configurée
          </h2>
          <p className="text-gray-600">
            Veuillez configurer l'API pour accéder à l'historique des courses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-in-left">
          <h1 className="text-2xl font-bold text-gray-900">Historique des courses</h1>
          <p className="text-gray-600">Gérez et analysez toutes les courses enregistrées</p>
        </div>
        
        <div className="flex items-center space-x-3 animate-slide-in-right">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtres
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="card animate-fade-in">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtres et tri</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche utilisateur
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, prénom..."
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Période
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                  className="form-input"
                >
                  <option value="all">Toutes</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                  <option value="year">Dernière année</option>
                </select>
              </div>

              {/* Distance min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance min (km)
                </label>
                <input
                  type="number"
                  value={filters.minDistance}
                  onChange={(e) => setFilters(prev => ({ ...prev, minDistance: e.target.value }))}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  className="form-input"
                />
              </div>

              {/* Distance max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance max (km)
                </label>
                <input
                  type="number"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: e.target.value }))}
                  placeholder="Aucune limite"
                  step="0.1"
                  min="0"
                  className="form-input"
                />
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trier par
                </label>
                <div className="flex space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="form-input flex-1"
                  >
                    <option value="date">Date</option>
                    <option value="distance">Distance</option>
                    <option value="duration">Durée</option>
                  </select>
                  <button
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                    }))}
                    className="btn btn-secondary px-3"
                    title={filters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
        <div className="card">
          <div className="card-body text-center">
            <FlagIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{filteredRuns.length}</div>
            <div className="text-sm text-gray-600">Courses</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <MapPinIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {filteredRuns.reduce((sum, run) => sum + (run.distance || 0), 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">km totaux</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(filteredRuns.reduce((sum, run) => sum + (run.duration || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Temps total</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {filteredRuns.length > 0 ? (filteredRuns.reduce((sum, run) => sum + (run.distance || 0), 0) / filteredRuns.length).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-600">km moyen</div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Liste des courses */}
      <div className="card animate-fade-in">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">
            {loading ? 'Chargement...' : `${filteredRuns.length} course(s) trouvée(s)`}
          </h2>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Chargement des courses...</span>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-12">
              <FlagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune course trouvée
              </h3>
              <p className="text-gray-600">
                {searchTerm || Object.values(filters).some(f => f && f !== 'all') 
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Aucune course n\'a encore été enregistrée.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allure moy.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRuns.map((run, index) => (
                    <tr key={run.id} className={`hover:bg-gray-50 animate-fade-in`} style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                            {run.user?.first_name?.[0] || run.user?.username?.[0] || '?'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {run.user?.first_name && run.user?.last_name 
                                ? `${run.user.first_name} ${run.user.last_name}`
                                : run.user?.username || 'Utilisateur inconnu'
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              @{run.user?.username || 'inconnu'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(run.distance || 0).toFixed(2)} km
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDuration(run.duration || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {run.duration && run.distance 
                            ? `${Math.floor((run.duration / 60) / run.distance)}:${String(Math.floor(((run.duration / 60) % run.distance) * 60)).padStart(2, '0')}/km`
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(run.start_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRun(run)
                              setShowDetailModal(true)
                            }}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Voir les détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRun(run)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
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
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{((pagination.page - 1) * pagination.per_page) + 1}</span> à{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.per_page, pagination.total)}
              </span>{' '}
              sur <span className="font-medium">{pagination.total}</span> résultat(s)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} sur {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedRun && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Détails de la course
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations utilisateur */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Utilisateur</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedRun.user?.first_name?.[0] || selectedRun.user?.username?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedRun.user?.first_name && selectedRun.user?.last_name 
                        ? `${selectedRun.user.first_name} ${selectedRun.user.last_name}`
                        : selectedRun.user?.username || 'Utilisateur inconnu'
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedRun.user?.email || 'Email non disponible'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques de la course */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Statistiques</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {(selectedRun.distance || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Distance (km)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {formatDuration(selectedRun.duration || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Durée</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedRun.calories_burned || 0}
                    </div>
                    <div className="text-xs text-gray-600">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedRun.duration && selectedRun.distance 
                        ? `${Math.floor((selectedRun.duration / 60) / selectedRun.distance)}:${String(Math.floor(((selectedRun.duration / 60) % selectedRun.distance) * 60)).padStart(2, '0')}`
                        : '-'
                      }
                    </div>
                    <div className="text-xs text-gray-600">Allure (/km)</div>
                  </div>
                </div>
              </div>

              {/* Informations temporelles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Horaires</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Début:</span>
                    <span className="font-medium">{formatDate(selectedRun.start_time)}</span>
                  </div>
                  {selectedRun.end_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="font-medium">{formatDate(selectedRun.end_time)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedRun.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedRun.notes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {showDeleteModal && selectedRun && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Supprimer la course
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cette course de{' '}
                <span className="font-medium">
                  {selectedRun.user?.first_name && selectedRun.user?.last_name 
                    ? `${selectedRun.user.first_name} ${selectedRun.user.last_name}`
                    : selectedRun.user?.username || 'Utilisateur inconnu'
                  }
                </span>{' '}
                ({(selectedRun.distance || 0).toFixed(2)} km) ?
                Cette action est irréversible.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedRun(null)
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteRun(selectedRun.id)}
                  className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RunningHistory