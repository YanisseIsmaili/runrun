import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ClockIcon,
  ArrowPathIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  PlayIcon,
  ChartBarIcon,
  XMarkIcon,
  HeartIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

const useDebugIntegration = () => {
  const addDebugLog = (message, type = 'info', category = 'history') => {
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
    
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[HISTORY] ${message}`)
  }
  
  return { addDebugLog }
}

// Composant de squelette pour les éléments de la page
const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête skeleton */}
        <div className="text-center animate-fade-in">
          <div className="skeleton h-10 w-96 mx-auto mb-4"></div>
          <div className="skeleton h-6 w-128 mx-auto"></div>
        </div>

        {/* Barre de recherche skeleton */}
        <div className="glass-green rounded-2xl shadow-xl p-6 animate-slide-in-left">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="skeleton h-12 flex-1"></div>
            <div className="flex gap-3">
              <div className="skeleton h-12 w-24"></div>
              <div className="skeleton h-12 w-32"></div>
            </div>
          </div>
        </div>

        {/* Statistiques skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-green rounded-2xl p-6 shadow-xl">
              <div className="flex items-center">
                <div className="skeleton h-14 w-14 rounded-xl mr-4"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-20 mb-2"></div>
                  <div className="skeleton h-8 w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tableau skeleton */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-6">
            {/* Header du tableau */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-8 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton h-4"></div>
                ))}
              </div>
            </div>
            
            {/* Lignes du tableau */}
            {[...Array(8)].map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className="grid grid-cols-8 gap-4 p-4 border-b border-emerald-100 animate-fade-in"
                style={{ animationDelay: `${rowIndex * 100}ms` }}
              >
                {/* Utilisateur */}
                <div className="flex items-center">
                  <div className="skeleton h-12 w-12 rounded-full mr-3"></div>
                  <div>
                    <div className="skeleton h-4 w-24 mb-1"></div>
                    <div className="skeleton h-3 w-16"></div>
                  </div>
                </div>
                
                {/* Autres colonnes */}
                {[...Array(6)].map((_, colIndex) => (
                  <div key={colIndex}>
                    <div className="skeleton h-4 w-full mb-1"></div>
                    <div className="skeleton h-3 w-3/4"></div>
                  </div>
                ))}
                
                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <div className="skeleton h-6 w-6 rounded"></div>
                  <div className="skeleton h-6 w-6 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const RunningHistory = () => {
  const { isConfigured, selectedApi } = useApiConfig()
  const { addDebugLog } = useDebugIntegration()
  
  const [runs, setRuns] = useState([])
  const [filteredRuns, setFilteredRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // État pour le préchargement
  const [isPreloading, setIsPreloading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    period: 'all',
    minDistance: '',
    maxDistance: '',
    userId: '',
    sortBy: 'start_time',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedRun, setSelectedRun] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 20,
    total: 0
  })

  // Simulation du préchargement
  const simulatePreloading = async () => {
    addDebugLog('🎬 Début du préchargement')
    
    // Délai pour montrer le skeleton
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsPreloading(false)
    addDebugLog('✨ Préchargement terminé')
  }

  useEffect(() => {
    addDebugLog('🚀 Initialisation RunningHistory avec préchargement')
    simulatePreloading()
  }, [])

  useEffect(() => {
    if (!isPreloading && isConfigured) {
      addDebugLog(`✅ API configurée: ${selectedApi?.name || 'Inconnue'} (${selectedApi?.url || 'URL manquante'})`)
      fetchRuns()
    }
  }, [isPreloading, isConfigured, pagination.page])

  useEffect(() => {
    if (!isPreloading) {
      applyFilters()
    }
  }, [runs, searchTerm, filters, isPreloading])

  const fetchRuns = async () => {
    if (!isConfigured) {
      setError('API non configurée')
      addDebugLog('❌ Tentative d\'appel API sans configuration', 'error')
      return
    }

    setLoading(true)
    setError('')
    addDebugLog(`🔄 Début récupération courses - Page ${pagination.page}`)
    
    const startTime = Date.now()
    
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }

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
        
        params.start_date = startDate.toISOString()
      }

      if (filters.minDistance) params.min_distance = filters.minDistance
      if (filters.maxDistance) params.max_distance = filters.maxDistance
      if (filters.userId) params.user_id = filters.userId

      addDebugLog(`📋 Paramètres requête: ${JSON.stringify(params)}`, 'info')
      
      try {
        const response = await api.runs.getAll(params)
        const responseTime = Date.now() - startTime
        
        addDebugLog(`✅ Réponse reçue en ${responseTime}ms`, 'success')
        
        if (response.data?.status === 'success' && response.data?.data?.runs) {
          const runsData = response.data.data.runs
          const paginationData = response.data.data.pagination
          
          setRuns(runsData)
          setPagination(prev => ({
            ...prev,
            pages: paginationData?.pages || 1,
            total: paginationData?.total || runsData.length
          }))
          addDebugLog(`📈 État mis à jour: ${runsData.length} courses chargées`, 'success')
        } else {
          throw new Error('Structure de réponse inattendue')
        }
      } catch (apiError) {
        addDebugLog('⚠️ Endpoint /api/runs indisponible, utilisation des données simulées', 'warning')
        const mockData = generateMockRuns()
        setRuns(mockData)
        addDebugLog(`🎭 ${mockData.length} courses simulées générées`, 'info')
        setError('Mode simulation - Endpoint /api/runs non disponible')
      }
    } catch (err) {
      const responseTime = Date.now() - startTime
      addDebugLog(`❌ Erreur après ${responseTime}ms: ${err.message}`, 'error')
      
      const mockData = generateMockRuns()
      setRuns(mockData)
      addDebugLog(`🎭 Fallback vers données simulées: ${mockData.length} courses`, 'warning')
      
      console.error('Erreur chargement courses:', err)
      setError('Impossible de charger l\'historique (mode simulation)')
    } finally {
      setLoading(false)
      addDebugLog('🏁 Fin de la récupération')
    }
  }

  const generateMockRuns = () => {
    const users = [
      { id: 5, username: 'alex', first_name: 'Alexandre', last_name: 'Dupont' },
      { id: 6, username: 'sophie', first_name: 'Sophie', last_name: 'Martin' },
      { id: 7, username: 'thomas', first_name: 'Thomas', last_name: 'Bernard' },
      { id: 8, username: 'julie', first_name: 'Julie', last_name: 'Leclerc' }
    ]

    const routes = [
      { id: 1, name: 'Parcours du Parc' },
      { id: 2, name: 'Tour du Lac' },
      { id: 3, name: 'Sentier de la Forêt' },
      { id: 4, name: 'Circuit Urbain' }
    ]

    return Array.from({ length: 15 }, (_, i) => {
      const user = users[Math.floor(Math.random() * users.length)]
      const route = routes[Math.floor(Math.random() * routes.length)]
      const distance = Math.random() * 15 + 2
      const duration = Math.floor(distance * (300 + Math.random() * 120))
      const startTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      
      return {
        id: i + 1,
        user_id: user.id,
        user: user,
        title: `Course ${route.name}`,
        distance: Math.round(distance * 100) / 100,
        duration: duration,
        start_time: startTime.toISOString(),
        end_time: new Date(startTime.getTime() + duration * 1000).toISOString(),
        avg_pace: `${Math.floor(duration / distance / 60)}:${Math.floor((duration / distance) % 60).toString().padStart(2, '0')}`,
        avg_heart_rate: Math.floor(Math.random() * 40 + 140),
        max_heart_rate: Math.floor(Math.random() * 20 + 170),
        elevation_gain: Math.floor(Math.random() * 300),
        calories: Math.floor(distance * 65),
        route: route,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString()
      }
    }).sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
  }

  const applyFilters = () => {
    addDebugLog('🔍 Application des filtres')
    let filtered = [...runs]

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const originalCount = filtered.length
      filtered = filtered.filter(run => 
        run.user?.username?.toLowerCase().includes(search) ||
        run.user?.first_name?.toLowerCase().includes(search) ||
        run.user?.last_name?.toLowerCase().includes(search) ||
        run.title?.toLowerCase().includes(search) ||
        run.route?.name?.toLowerCase().includes(search)
      )
      addDebugLog(`🔎 Filtrage recherche "${searchTerm}": ${originalCount} → ${filtered.length} courses`)
    }

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

    if (filters.minDistance) {
      const originalCount = filtered.length
      filtered = filtered.filter(run => run.distance >= parseFloat(filters.minDistance))
      addDebugLog(`📏 Filtrage distance min ${filters.minDistance}m: ${originalCount} → ${filtered.length} courses`)
    }
    if (filters.maxDistance) {
      const originalCount = filtered.length
      filtered = filtered.filter(run => run.distance <= parseFloat(filters.maxDistance))
      addDebugLog(`📏 Filtrage distance max ${filters.maxDistance}m: ${originalCount} → ${filtered.length} courses`)
    }

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
        default:
          aVal = new Date(a.start_time)
          bVal = new Date(b.start_time)
      }
      
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    addDebugLog(`📊 Tri par ${filters.sortBy} (${filters.sortOrder}): ${filtered.length} courses`)
    setFilteredRuns(filtered)
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
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleRunDetail = (run) => {
    setSelectedRun(run)
    setShowDetailModal(true)
    addDebugLog(`👁️ Affichage détails course: ${run.title} (${run.id})`)
  }

  const handleDeleteRun = async (runId) => {
    addDebugLog(`🗑️ Suppression course: ${runId}`)
    
    try {
      if (api.runs?.delete) {
        await api.runs.delete(runId)
        addDebugLog(`✅ Course ${runId} supprimée avec succès`, 'success')
        fetchRuns()
      } else {
        setRuns(prev => prev.filter(run => run.id !== runId))
        addDebugLog(`🎭 Course ${runId} supprimée (simulation)`, 'info')
      }
      setShowDeleteModal(false)
      setSelectedRun(null)
    } catch (err) {
      addDebugLog(`❌ Erreur suppression course ${runId}: ${err.message}`, 'error')
      setError('Impossible de supprimer la course')
    }
  }

  const resetFilters = () => {
    setFilters({
      period: 'all',
      minDistance: '',
      maxDistance: '',
      userId: '',
      sortBy: 'start_time',
      sortOrder: 'desc'
    })
    setSearchTerm('')
    addDebugLog('🔄 Réinitialisation des filtres')
  }

  const stats = {
    totalRuns: filteredRuns.length,
    totalDistance: filteredRuns.reduce((acc, run) => acc + (run.distance || 0), 0),
    totalDuration: filteredRuns.reduce((acc, run) => acc + (run.duration || 0), 0),
    avgDistance: filteredRuns.length > 0 ? filteredRuns.reduce((acc, run) => acc + (run.distance || 0), 0) / filteredRuns.length : 0
  }

  // Affichage du skeleton pendant le préchargement
  if (isPreloading) {
    return <SkeletonLoader />
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-green rounded-3xl shadow-2xl p-12 text-center animate-fade-in">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-emerald-500 mb-6 animate-pulse" />
            <h3 className="text-2xl font-bold text-emerald-800 mb-4">API non configurée</h3>
            <p className="text-emerald-600 max-w-md mx-auto">
              Veuillez configurer une API pour afficher l'historique des courses.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-emerald-800 mb-4 text-shadow-lg">
            Historique des Courses
          </h1>
          <p className="text-lg text-emerald-600 max-w-2xl mx-auto">
            Toutes les courses effectuées par les utilisateurs de la plateforme
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="glass-green rounded-2xl shadow-xl p-6 animate-slide-in-left">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur, titre ou parcours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 placeholder-gray-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtres
              </button>
              <button
                onClick={() => fetchRuns()}
                disabled={loading}
                className="btn btn-secondary"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-800">Période</label>
                  <select
                    value={filters.period}
                    onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">30 derniers jours</option>
                    <option value="year">12 derniers mois</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-800">Distance min (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={filters.minDistance}
                    onChange={(e) => setFilters(prev => ({ ...prev, minDistance: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-800">Distance max (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                    placeholder="∞"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-800">Trier par</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full p-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                  >
                    <option value="start_time">Date</option>
                    <option value="distance">Distance</option>
                    <option value="duration">Durée</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={filters.sortOrder === 'desc'}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 transition-all duration-300 ${
                      filters.sortOrder === 'desc' 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-emerald-300 group-hover:border-emerald-400'
                    }`}>
                      {filters.sortOrder === 'desc' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-emerald-800 font-medium">Décroissant</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={filters.sortOrder === 'asc'}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 transition-all duration-300 ${
                      filters.sortOrder === 'asc' 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-emerald-300 group-hover:border-emerald-400'
                    }`}>
                      {filters.sortOrder === 'asc' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-emerald-800 font-medium">Croissant</span>
                  </label>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="btn btn-secondary"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Information</h3>
                <p className="text-yellow-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques globales */}
        {filteredRuns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
            <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white group-hover:scale-110 transition-transform duration-300">
                  <PlayIcon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-600">Total Courses</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.totalRuns}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white group-hover:scale-110 transition-transform duration-300">
                  <MapPinIcon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-600">Distance Totale</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.totalDistance.toFixed(1)} m</p>
                </div>
              </div>
            </div>
            
            <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white group-hover:scale-110 transition-transform duration-300">
                  <ClockIcon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-600">Temps Total</p>
                  <p className="text-3xl font-bold text-emerald-800">{formatDuration(stats.totalDuration)}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-600">Distance Moyenne</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.avgDistance.toFixed(1)} m</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des courses */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 mb-6 animate-spin">
                <ArrowPathIcon className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg text-emerald-700 font-medium">Chargement des courses...</p>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 mb-6">
                <PlayIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Aucune course</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || filters.period !== 'all' || filters.minDistance || filters.maxDistance
                  ? 'Aucune course ne correspond aux critères de recherche.'
                  : 'Aucune course enregistrée pour le moment.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Allure
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Cardio
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {filteredRuns.map((run, index) => (
                    <tr 
                      key={run.id} 
                      className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <span className="text-sm font-bold text-white">
                                {run.user?.first_name?.[0] || run.user?.username?.[0] || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {run.user?.first_name && run.user?.last_name 
                                ? `${run.user.first_name} ${run.user.last_name}`
                                : run.user?.username || 'Utilisateur inconnu'
                              }
                            </div>
                            <div className="text-sm text-emerald-600">
                              @{run.user?.username || 'inconnu'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {run.title || 'Course sans titre'}
                        </div>
                        <div className="text-sm text-emerald-600">
                          {run.route?.name || 'Parcours libre'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(run.start_time)}
                        </div>
                        <div className="text-sm text-emerald-600">
                          {formatTime(run.start_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {(run.distance || 0).toFixed(2)} m
                        </div>
                        {run.elevation_gain > 0 && (
                          <div className="text-sm text-emerald-600 flex items-center">
                            <span className="mr-1">↗</span>
                            {run.elevation_gain}m
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDuration(run.duration || 0)}
                        </div>
                        {run.calories && (
                          <div className="text-sm text-orange-600 flex items-center">
                            <FireIcon className="h-3 w-3 mr-1" />
                            {run.calories} cal
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {run.avg_pace || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <HeartIcon className="h-4 w-4 mr-1 text-red-500" />
                          {run.avg_heart_rate ? `${run.avg_heart_rate} bpm` : 'N/A'}
                        </div>
                        {run.max_heart_rate && (
                          <div className="text-sm text-red-500">
                            Max: {run.max_heart_rate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleRunDetail(run)}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-200 hover:scale-110"
                            title="Voir les détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRun(run)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 hover:scale-110"
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-right">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-emerald-700 font-medium">
                Affichage de {((pagination.page - 1) * pagination.per_page) + 1} à{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} sur{' '}
                {pagination.total} courses
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn btn-sm btn-secondary"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-sm btn-secondary"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails de course */}
        {showDetailModal && selectedRun && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto animate-scale-in">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Détails de la Course</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                      Informations générales
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Titre:</span>
                        <span className="text-gray-900">{selectedRun.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Utilisateur:</span>
                        <span className="text-gray-900">{selectedRun.user?.first_name} {selectedRun.user?.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Parcours:</span>
                        <span className="text-gray-900">{selectedRun.route?.name || 'Parcours libre'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date:</span>
                        <span className="text-gray-900">{formatDate(selectedRun.start_time)} à {formatTime(selectedRun.start_time)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                      Performance
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Distance:</span>
                        <span className="text-gray-900 font-semibold">{selectedRun.distance?.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Durée:</span>
                        <span className="text-gray-900 font-semibold">{formatDuration(selectedRun.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Allure moyenne:</span>
                        <span className="text-gray-900 font-semibold">{selectedRun.avg_pace}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Dénivelé:</span>
                        <span className="text-gray-900 font-semibold">{selectedRun.elevation_gain}m</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                    Données cardio
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <HeartIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900">{selectedRun.avg_heart_rate} bpm</div>
                      <div className="text-sm text-gray-600">FC moyenne</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <HeartIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900">{selectedRun.max_heart_rate} bpm</div>
                      <div className="text-sm text-gray-600">FC max</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <FireIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900">{selectedRun.calories} cal</div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                    Horaires
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="font-medium text-emerald-800">Début</div>
                      <div className="text-emerald-900 font-semibold">{new Date(selectedRun.start_time).toLocaleString('fr-FR')}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="font-medium text-emerald-800">Fin</div>
                      <div className="text-emerald-900 font-semibold">{new Date(selectedRun.end_time).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-8 py-6 rounded-b-3xl flex justify-end space-x-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedRun(selectedRun)
                    setShowDeleteModal(true)
                  }}
                  className="btn btn-danger"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && selectedRun && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Confirmer la suppression</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer la course{' '}
                  <span className="font-semibold text-gray-900">
                    "{selectedRun.title}" de{' '}
                    {selectedRun.user?.first_name && selectedRun.user?.last_name
                      ? `${selectedRun.user.first_name} ${selectedRun.user.last_name}`
                      : selectedRun.user?.username || 'Utilisateur inconnu'
                    }
                  </span>{' '}
                  ({(selectedRun.distance || 0).toFixed(2)} m) ?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  Cette action est irréversible.
                </p>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 rounded-b-3xl flex justify-end space-x-3">
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
                  className="btn btn-danger"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RunningHistory