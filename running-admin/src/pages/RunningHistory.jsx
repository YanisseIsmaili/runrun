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
  FireIcon,
  CheckIcon
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

const RunningHistory = () => {
  const { isConfigured, selectedApi } = useApiConfig()
  const { addDebugLog } = useDebugIntegration()
  
  // États principaux
  const [runs, setRuns] = useState([])
  const [filteredRuns, setFilteredRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // États pour la recherche et filtres
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
  
  // États pour les modals
  const [selectedRun, setSelectedRun] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // États pour la pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 20,
    total: 0
  })
  const [showCustomPerPage, setShowCustomPerPage] = useState(false)
  const [customPerPage, setCustomPerPage] = useState('')

  // États pour les colonnes
  const [columnOrder, setColumnOrder] = useState([
    'user', 'course', 'date', 'distance', 'duration', 'pace', 'cardio', 'actions'
  ])
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [sortField, setSortField] = useState('start_time')
  const [sortDirection, setSortDirection] = useState('desc')

  // États pour le redimensionnement des colonnes
  const [columnWidths, setColumnWidths] = useState({
    user: 200,
    course: 180,
    date: 140,
    distance: 120,
    duration: 120,
    pace: 100,
    cardio: 120,
    actions: 100
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // ✅ useEffect pour l'initialisation et la pagination
  useEffect(() => {
    if (isConfigured) {
      addDebugLog(`✅ API configurée: ${selectedApi?.name || 'Inconnue'} (${selectedApi?.url || 'URL manquante'})`)
      fetchRuns()
    }
  }, [isConfigured, pagination.page, pagination.per_page])

  // ✅ useEffect pour les filtres côté serveur (SANS searchTerm)
  useEffect(() => {
    if (isConfigured) {
      const timeoutId = setTimeout(() => {
        addDebugLog(`🔄 Filtres serveur modifiés: ${filters.period}, ${filters.sortBy}, ${filters.sortOrder}`)
        fetchRuns()
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [filters.period, filters.minDistance, filters.maxDistance, filters.sortBy, filters.sortOrder])

  // ✅ useEffect pour le filtrage local uniquement
  useEffect(() => {
    applyFilters()
  }, [runs, searchTerm])

  // Fonction principale de récupération des données
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
        limit: pagination.per_page,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }

      // Filtres de période pour l'API
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

      // Filtres de distance pour l'API
      if (filters.minDistance) params.min_distance = filters.minDistance
      if (filters.maxDistance) params.max_distance = filters.maxDistance
      if (filters.userId) params.user_id = filters.userId

      addDebugLog(`📋 Paramètres requête API: ${JSON.stringify(params)}`, 'info')
      
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
          addDebugLog(`📈 État mis à jour: ${runsData.length} courses chargées depuis l'API`, 'success')
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

  // Génération de données simulées
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

  // Fonction de filtrage local
  const applyFilters = () => {
    addDebugLog('🔍 Application du filtrage local (recherche uniquement)')
    let filtered = [...runs]

    // Recherche locale uniquement
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
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

    // Tri local
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

    addDebugLog(`📊 Filtrage local terminé: ${filtered.length} courses affichées`)
    setFilteredRuns(filtered)
  }

  // Fonctions utilitaires de formatage
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

  // Gestionnaires d'événements
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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePerPageChange = (newPerPage) => {
    if (newPerPage === 'custom') {
      setShowCustomPerPage(true)
      return
    }
    
    const perPageValue = parseInt(newPerPage)
    addDebugLog(`📊 Changement per_page: ${perPageValue}`)
    
    setPagination(prev => ({ 
      ...prev, 
      per_page: perPageValue,
      page: 1
    }))
    setShowCustomPerPage(false)
  }

  // Gestion du redimensionnement des colonnes
  const handleResizeStart = (e, columnKey) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey])
    addDebugLog(`🔧 Début redimensionnement colonne: ${columnKey}`)
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleResizeMove = (e) => {
    if (!isResizing || !resizingColumn) return
    
    const deltaX = e.clientX - startX
    const newWidth = Math.max(80, startWidth + deltaX)
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }

  const handleResizeEnd = () => {
    if (resizingColumn) {
      addDebugLog(`✅ Redimensionnement terminé: ${resizingColumn} = ${columnWidths[resizingColumn]}px`)
    }
    
    setIsResizing(false)
    setResizingColumn(null)
    setStartX(0)
    setStartWidth(0)
    
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }

  // Gestion du drag & drop des colonnes
  const handleDragStart = (e, columnKey) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = 'move'
    addDebugLog(`📋 Début déplacement colonne: ${columnKey}`)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault()
    
    if (!draggedColumn || draggedColumn === targetColumnKey) return
    
    const newOrder = [...columnOrder]
    const draggedIndex = newOrder.indexOf(draggedColumn)
    const targetIndex = newOrder.indexOf(targetColumnKey)
    
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedColumn)
    
    setColumnOrder(newOrder)
    setDraggedColumn(null)
    addDebugLog(`📋 Colonne ${draggedColumn} déplacée vers position ${targetIndex}`)
  }

  // Gestion du tri par colonne
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDirection(newDirection)
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newDirection }))
    addDebugLog(`📊 Tri par ${field} ${newDirection}`)
  }

  // Nettoyage des event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [])

  // Validation per_page personnalisé
  const handleCustomPerPageSubmit = () => {
    const value = parseInt(customPerPage)
    if (value && value > 0 && value <= 1000) {
      addDebugLog(`📊 Per_page personnalisé: ${value}`)
      setPagination(prev => ({ 
        ...prev, 
        per_page: value,
        page: 1
      }))
      setShowCustomPerPage(false)
      setCustomPerPage('')
    } else {
      alert('Veuillez entrer un nombre entre 1 et 1000')
    }
  }

  // Calcul des statistiques
  const stats = {
    totalRuns: filteredRuns.length,
    totalDistance: filteredRuns.reduce((acc, run) => acc + (run.distance || 0), 0),
    totalDuration: filteredRuns.reduce((acc, run) => acc + (run.duration || 0), 0),
    avgDistance: filteredRuns.length > 0 ? filteredRuns.reduce((acc, run) => acc + (run.distance || 0), 0) / filteredRuns.length : 0
  }

  // Configuration des colonnes
  const columnConfig = {
    user: {
      key: 'user',
      title: 'Utilisateur', 
      sortable: true,
      sortField: 'user',
      render: (run) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">
              {run.user?.first_name?.[0] || run.user?.username?.[0] || '?'}
            </span>
          </div>
          <div className="ml-3">
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
      )
    },
    course: {
      key: 'course',
      title: 'Course',
      sortable: true,
      sortField: 'title',
      render: (run) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {run.title || 'Course sans titre'}
          </div>
          <div className="text-sm text-emerald-600">
            {run.route?.name || 'Parcours libre'}
          </div>
        </div>
      )
    },
    date: {
      key: 'date',
      title: 'Date/Heure',
      sortable: true,
      sortField: 'start_time',
      render: (run) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDate(run.start_time)}
          </div>
          <div className="text-sm text-emerald-600">
            {formatTime(run.start_time)}
          </div>
        </div>
      )
    },
    distance: {
      key: 'distance',
      title: 'Distance',
      sortable: true,
      sortField: 'distance',
      render: (run) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {(run.distance || 0).toFixed(2)} m
          </div>
          {run.elevation_gain > 0 && (
            <div className="text-sm text-emerald-600 flex items-center">
              <span className="mr-1">↗</span>
              {run.elevation_gain}m
            </div>
          )}
        </div>
      )
    },
    duration: {
      key: 'duration',
      title: 'Durée',
      sortable: true,
      sortField: 'duration',
      render: (run) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDuration(run.duration || 0)}
          </div>
          {run.calories && (
            <div className="text-sm text-orange-600 flex items-center">
              <FireIcon className="h-3 w-3 mr-1" />
              {run.calories} cal
            </div>
          )}
        </div>
      )
    },
    pace: {
      key: 'pace',
      title: 'Allure',
      sortable: true,
      sortField: 'avg_pace',
      render: (run) => (
        <div className="text-sm font-medium text-gray-900">
          {run.avg_pace || 'N/A'}
        </div>
      )
    },
    cardio: {
      key: 'cardio',
      title: 'Cardio',
      sortable: true,
      sortField: 'avg_heart_rate',
      render: (run) => (
        <div>
          <div className="text-sm font-medium text-gray-900 flex items-center">
            <HeartIcon className="h-4 w-4 mr-1 text-red-500" />
            {run.avg_heart_rate ? `${run.avg_heart_rate} bpm` : 'N/A'}
          </div>
          {run.max_heart_rate && (
            <div className="text-sm text-red-500">
              Max: {run.max_heart_rate}
            </div>
          )}
        </div>
      )
    },
    actions: {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (run) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleRunDetail(run)}
            className="text-emerald-600 hover:text-emerald-800 transition-colors duration-200 hover:scale-110"
            title="Voir les détails"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRun(run)
              setShowDeleteModal(true)
            }}
            className="text-red-600 hover:text-red-800 transition-colors duration-200 hover:scale-110"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  }

  // Vérification de la configuration API
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4">
            <h3 className="font-bold">API non configurée</h3>
            <p>Veuillez configurer une API pour afficher l'historique des courses.</p>
          </div>
        </div>
      </div>
    )
  } 
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-green shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-emerald-800 text-shadow">
                Historique des Courses
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 ${showFilters ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl transition-all duration-300 hover:scale-105`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtres
              </button>
              <button
                onClick={() => fetchRuns()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✅ BARRE DE RECHERCHE CORRIGÉE */}
        <div className="glass-green rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur, titre ou parcours... (recherche locale instantanée)"
                value={searchTerm}
                onChange={(e) => {
                  const newValue = e.target.value
                  setSearchTerm(newValue)
                  addDebugLog(`🔍 Recherche mise à jour: "${newValue}" (${newValue.length} caractères)`)
                }}
                className="w-full pl-12 pr-16 py-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 placeholder-gray-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    addDebugLog('🔍 Recherche effacée')
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors hover:scale-110"
                  title="Effacer la recherche"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Indicateur de résultats de recherche */}
            {searchTerm && (
              <div className="flex items-center px-4 py-2 bg-emerald-100 rounded-lg border border-emerald-200">
                <span className="text-sm font-medium text-emerald-700">
                  🔍 "{searchTerm}" → {filteredRuns.length} résultat{filteredRuns.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {/* Bouton pour effacer tous les filtres */}
            {(searchTerm || filters.period !== 'all' || filters.minDistance || filters.maxDistance) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  resetFilters()
                  addDebugLog('🔄 Tous les filtres effacés')
                }}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105 flex items-center"
                title="Effacer tous les filtres"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Tout effacer
              </button>
            )}
          </div>
          
          {/* Compteur de courses totales */}
          <div className="mt-4 flex justify-between items-center text-sm text-emerald-600">
            <span>
              📊 Total: {runs.length} courses • Affichées: {filteredRuns.length} courses
              {searchTerm && ` • Recherche active`}
            </span>
            <span className="text-xs opacity-75">
              🔄 Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
            </span>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-emerald-200 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-800">Courses par page</label>
                  <select 
                    className="w-full p-3 bg-white border-2 border-emerald-300 rounded-xl text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                    value={pagination.per_page}
                    onChange={(e) => handlePerPageChange(e.target.value)}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value="custom">Personnalisé...</option>
                  </select>
                </div>
              </div>

              {/* Modal pour per_page personnalisé */}
              {showCustomPerPage && (
                <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-emerald-200">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-emerald-800">
                      Nombre personnalisé (1-1000):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24"
                      value={customPerPage}
                      onChange={(e) => setCustomPerPage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomPerPageSubmit()}
                    />
                    <button
                      onClick={handleCustomPerPageSubmit}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-300"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomPerPage(false)
                        setCustomPerPage('')
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

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
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-2xl p-6 mb-8 animate-scale-in">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: PlayIcon, label: 'Total Courses', value: stats.totalRuns, color: 'from-blue-500 to-cyan-500', delay: '100ms' },
              { icon: MapPinIcon, label: 'Distance Totale', value: `${(stats.totalDistance / 1000).toFixed(1)} km`, color: 'from-green-500 to-emerald-500', delay: '200ms' },
              { icon: ClockIcon, label: 'Temps Total', value: formatDuration(stats.totalDuration), color: 'from-purple-500 to-pink-500', delay: '300ms' },
              { icon: ChartBarIcon, label: 'Distance Moyenne', value: `${(stats.avgDistance / 1000).toFixed(1)} km`, color: 'from-orange-500 to-red-500', delay: '400ms' }
            ].map((stat, index) => (
              <div 
                key={index}
                className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in group"
                style={{ animationDelay: stat.delay }}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-emerald-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-emerald-800">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tableau des courses */}
        <div className="glass-green rounded-2xl p-6 animate-slide-in-up hover:shadow-xl transition-all duration-500">
          <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Historique des courses ({filteredRuns.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-600 text-lg">Chargement des courses...</p>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-8">
              <PlayIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? `Aucune course trouvée pour "${searchTerm}"` : 'Aucune course enregistrée'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table 
                className="w-full table-fixed"
                style={{ 
                  minWidth: Object.values(columnWidths).reduce((a, b) => a + b, 0) + 'px'
                }}
              >
                <thead className="bg-emerald-50">
                  <tr>
                    {columnOrder.map(columnKey => {
                      const column = columnConfig[columnKey]
                      const width = columnWidths[columnKey]
                      const isSorted = sortField === column.sortField
                      
                      return (
                        <th 
                          key={columnKey}
                          className={`px-4 py-2 text-left text-sm font-semibold text-emerald-700 cursor-move select-none hover:bg-emerald-100 transition-colors duration-200 relative ${
                            column.sortable ? 'cursor-pointer' : ''
                          } ${isSorted ? 'bg-emerald-100' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, columnKey)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, columnKey)}
                          onClick={() => column.sortable && handleSort(column.sortField)}
                          style={{ width: `${width}px` }}
                          title={column.sortable ? `Cliquer pour trier par ${column.title}` : 'Glisser pour réorganiser'}
                        >
                          <div className="flex items-center justify-between pr-4">
                            <div className="flex items-center space-x-2">
                              <span>{column.title}</span>
                              <span className="text-xs opacity-50">⋮⋮</span>
                              {column.sortable && (
                                <span className="text-xs">
                                  {isSorted ? (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                  ) : '↕'}
                                </span>
                              )}
                            </div>
                            
                            {/* Handle de redimensionnement */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-emerald-300 transition-colors duration-200"
                              onMouseDown={(e) => handleResizeStart(e, columnKey)}
                              title="Glisser pour redimensionner"
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-0.5 h-6 bg-emerald-400 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                              </div>
                            </div>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {filteredRuns.map((run, index) => (
                    <tr key={run.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                      {columnOrder.map(columnKey => {
                        const column = columnConfig[columnKey]
                        const width = columnWidths[columnKey]
                        return (
                          <td 
                            key={columnKey} 
                            className="px-4 py-3 overflow-hidden"
                            style={{ width: `${width}px` }}
                          >
                            {column.render(run)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-right mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-emerald-700 font-medium">
                Page {pagination.page} sur {pagination.pages} ({pagination.total} courses, {pagination.per_page} par page)
              </div>
              <div className="flex items-center space-x-3">
                <button
                  className="px-3 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(1)}
                  title="Première page"
                >
                  ««
                </button>
                
                <button
                  className="px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Précédent
                </button>

                <div className="flex space-x-1">
                  {(() => {
                    const pages = []
                    const currentPage = pagination.page
                    const totalPages = pagination.pages
                    
                    let startPage = Math.max(1, currentPage - 2)
                    let endPage = Math.min(totalPages, currentPage + 2)
                    
                    if (currentPage <= 3) {
                      endPage = Math.min(5, totalPages)
                    }
                    if (currentPage >= totalPages - 2) {
                      startPage = Math.max(1, totalPages - 4)
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                            i === currentPage
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-emerald-50 border border-emerald-200 text-gray-700'
                          }`}
                          onClick={() => handlePageChange(i)}
                        >
                          {i}
                        </button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                <button
                  className="px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Suivant
                </button>
                
                <button
                  className="px-3 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.pages)}
                  title="Dernière page"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetailModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Détails de la Course</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
            </div>
            
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedRun(selectedRun)
                  setShowDeleteModal(true)
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la course{' '}
              <strong>"{selectedRun.title}" de{' '}
              {selectedRun.user?.first_name && selectedRun.user?.last_name
                ? `${selectedRun.user.first_name} ${selectedRun.user.last_name}`
                : selectedRun.user?.username || 'Utilisateur inconnu'
              }</strong>{' '}
              ({(selectedRun.distance || 0).toFixed(2)} m) ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedRun(null)
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteRun(selectedRun.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .table-fixed {
          table-layout: fixed;
        }

        .cursor-col-resize {
          cursor: col-resize;
        }

        @media (max-width: 768px) {
          .table-fixed {
            table-layout: auto;
          }
          
          .cursor-col-resize {
            cursor: default;
          }
        }
      `}</style>
    </div>
  )
}

export default RunningHistory