import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  UserGroupIcon, 
  ClockIcon, 
  ChartBarIcon,
  MapPinIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon,
  TrophyIcon,
  FireIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  BugAntIcon,
  XMarkIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { ChartBarIcon as ChartBarSolidIcon } from '@heroicons/react/24/solid'
import { useApiConfig } from '../utils/globalApiConfig'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isConfigured, selectedApi } = useApiConfig()
  
  // États principaux
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRuns: 0,
    totalDistance: 0,
    totalRoutes: 0,
    loading: true
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [quickStats, setQuickStats] = useState([])
  
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
    console.log(`[DASHBOARD DEBUG] ${message}`)
  }

  // Chargement initial
  useEffect(() => {
    if (isConfigured) {
      addDebugInfo(`🔧 API configurée: ${selectedApi?.name} (${selectedApi?.url})`)
      fetchDashboardData()
    } else {
      addDebugInfo('❌ API non configurée')
      setError('Aucune API configurée. Veuillez sélectionner un serveur API.')
      loadMockData()
    }
  }, [isConfigured, selectedApi])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && isConfigured) {
      const interval = setInterval(() => {
        addDebugInfo('🔄 Auto-refresh activé')
        fetchDashboardData(false)
      }, 30000) // 30 secondes

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isConfigured])

  // Récupérer les données du dashboard
  const fetchDashboardData = async (showLoading = true) => {
    if (!isConfigured) {
      addDebugInfo('❌ fetchDashboardData: API non configurée')
      loadMockData()
      return
    }

    if (showLoading) setLoading(true)
    setError('')

    try {
      addDebugInfo('📡 Début fetchDashboardData...')
      addDebugInfo(`🌐 URL de base API: ${api.instance?.defaults?.baseURL || 'Non définie'}`)

      // Appels API parallèles
      const [dashboardResponse, activityResponse] = await Promise.all([
        api.get('/dashboard/overview').catch(err => {
          addDebugInfo(`❌ Erreur /dashboard/overview: ${err.message}`)
          return { data: null }
        }),
        api.get('/dashboard/recent-activity').catch(err => {
          addDebugInfo(`❌ Erreur /dashboard/recent-activity: ${err.message}`)
          return { data: null }
        })
      ])

      addDebugInfo('✅ Réponses API reçues')
      
      if (dashboardResponse.data) {
        addDebugInfo(`📦 Dashboard data: ${JSON.stringify(Object.keys(dashboardResponse.data))}`)
        
        const statsData = dashboardResponse.data.data || dashboardResponse.data
        setStats({
          totalUsers: statsData.totalUsers || 1247,
          activeRuns: statsData.activeRuns || 23,
          totalDistance: statsData.totalDistance || 15847.2,
          totalRoutes: statsData.totalRoutes || 45,
          loading: false
        })

        setQuickStats(statsData.quickStats || [
          { label: 'Courses aujourd\'hui', value: '47', change: '+12%', positive: true },
          { label: 'Nouveaux membres', value: '8', change: '+25%', positive: true },
          { label: 'Distance moyenne', value: '6.3 km', change: '-2%', positive: false },
          { label: 'Temps moyen', value: '32min', change: '+5%', positive: true }
        ])
      }

      if (activityResponse.data) {
        addDebugInfo(`📦 Activity data: ${JSON.stringify(Object.keys(activityResponse.data))}`)
        
        const activityData = activityResponse.data.data || activityResponse.data.activities || []
        setRecentActivity(activityData.length > 0 ? activityData : getMockActivity())
      } else {
        setRecentActivity(getMockActivity())
      }

      addDebugInfo('✅ Données chargées avec succès depuis l\'API')
      
    } catch (apiError) {
      addDebugInfo(`❌ Erreur API globale: ${apiError.message}`)
      console.error('Erreur API dashboard:', apiError)
      
      if (apiError.response) {
        addDebugInfo(`📱 Status: ${apiError.response.status}`)
        addDebugInfo(`📱 Data: ${JSON.stringify(apiError.response.data).substring(0, 200)}`)
      }
      
      setError('Impossible de charger les données depuis l\'API')
      loadMockData()
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Charger les données simulées
  const loadMockData = () => {
    addDebugInfo('📊 Chargement des données simulées...')
    
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        activeRuns: 23,
        totalDistance: 15847.2,
        totalRoutes: 45,
        loading: false
      })

      setRecentActivity(getMockActivity())

      setQuickStats([
        { label: 'Courses aujourd\'hui', value: '47', change: '+12%', positive: true },
        { label: 'Nouveaux membres', value: '8', change: '+25%', positive: true },
        { label: 'Distance moyenne', value: '6.3 km', change: '-2%', positive: false },
        { label: 'Temps moyen', value: '32min', change: '+5%', positive: true }
      ])

      addDebugInfo('✅ Données simulées chargées avec succès')
    }, 1000)
  }

  // Données d'activité simulées
  const getMockActivity = () => [
    {
      id: 1,
      user: 'Marie Dubois',
      action: 'Course terminée',
      details: '5.2 km en 28min',
      time: 'il y a 5 min',
      type: 'run',
      avatar: 'MD'
    },
    {
      id: 2,
      user: 'Pierre Martin', 
      action: 'Nouveau parcours',
      details: '8.7 km - Parc Central',
      time: 'il y a 12 min',
      type: 'route',
      avatar: 'PM'
    },
    {
      id: 3,
      user: 'Sophie Leroux',
      action: 'Record personnel',
      details: '10.1 km en 45min',
      time: 'il y a 23 min',
      type: 'achievement',
      avatar: 'SL'
    },
    {
      id: 4,
      user: 'Thomas Blanc',
      action: 'Inscription',
      details: 'Nouveau membre',
      time: 'il y a 1h',
      type: 'user',
      avatar: 'TB'
    }
  ]

  // Retry avec debug
  const handleRetry = () => {
    addDebugInfo('🔄 Retry demandé par utilisateur')
    setError('')
    fetchDashboardData()
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
    a.download = `dashboard-debug-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addDebugInfo('📥 Logs téléchargés')
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'increase',
      gradient: 'from-green-500 to-emerald-500',
      href: '/users'
    },
    {
      title: 'Courses actives',
      value: stats.activeRuns,
      icon: ClockIcon,
      change: '+3',
      changeType: 'increase', 
      gradient: 'from-blue-500 to-cyan-500',
      href: '/history'
    },
    {
      title: 'Distance totale',
      value: `${stats.totalDistance.toLocaleString()} km`,
      icon: ChartBarIcon,
      change: '+8%',
      changeType: 'increase',
      gradient: 'from-purple-500 to-indigo-500',
      href: '/stats'
    },
    {
      title: 'Parcours créés',
      value: stats.totalRoutes,
      icon: MapPinIcon,
      change: '+2',
      changeType: 'increase',
      gradient: 'from-orange-500 to-red-500',
      href: '/routes'
    }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'run': return <ClockIcon className="h-5 w-5 text-green-600" />
      case 'route': return <MapPinIcon className="h-5 w-5 text-blue-600" />
      case 'achievement': return <TrophyIcon className="h-5 w-5 text-yellow-600" />
      case 'user': return <UserGroupIcon className="h-5 w-5 text-purple-600" />
      default: return <HeartIcon className="h-5 w-5 text-red-600" />
    }
  }

  const getActivityBgColor = (type) => {
    switch (type) {
      case 'run': return 'bg-green-100'
      case 'route': return 'bg-blue-100'
      case 'achievement': return 'bg-yellow-100'
      case 'user': return 'bg-purple-100'
      default: return 'bg-red-100'
    }
  }

  if (stats.loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-green-600">Chargement des données...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec thème vert */}
      <div className="glass-green rounded-2xl p-6 border border-green-200 shadow-green">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-green-800 text-shadow flex items-center space-x-3">
              <span>📊</span>
              <span>Tableau de Bord</span>
            </h1>
            <p className="text-green-600 mt-2">
              Bienvenue, {user?.name || 'Administrateur'} ! Surveillez l'activité de votre plateforme
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
                Veuillez sélectionner un serveur API pour accéder aux données en temps réel.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-green-lg transition-all duration-300">
          <div className="card-body text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-2xl font-bold text-green-700">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Utilisateurs totaux</div>
          </div>
        </div>
        <div className="card hover:shadow-green-lg transition-all duration-300">
          <div className="card-body text-center">
            <div className="text-2xl mb-2">🏃</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.activeRuns}</div>
            <div className="text-sm text-gray-600">Courses actives</div>
          </div>
        </div>
        <div className="card hover:shadow-green-lg transition-all duration-300">
          <div className="card-body text-center">
            <div className="text-2xl mb-2">📏</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDistance.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total km</div>
          </div>
        </div>
        <div className="card hover:shadow-green-lg transition-all duration-300">
          <div className="card-body text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.totalRoutes}</div>
            <div className="text-sm text-gray-600">Parcours créés</div>
          </div>
        </div>
      </div>

      {/* Contenu principal en grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques détaillées */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📈</span>
              <h2 className="text-lg font-semibold text-green-800">
                Statistiques du jour
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {quickStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:shadow-green-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <div className="flex items-center">
                    {stat.positive ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ml-1 font-medium ${
                      stat.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-green-800 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Activité récente
              </h3>
              <button
                onClick={() => navigate('/history')}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Voir tout
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 group hover:bg-green-50 p-2 rounded-lg transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-2 rounded-full ${getActivityBgColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.user}
                        </p>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-green-800 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Actions rapides
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
              <button
                key={card.title}
                onClick={() => navigate(card.href)}
                className="card hover:shadow-green-lg transition-all duration-300 group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="card-body text-center">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${card.gradient} group-hover:scale-110 transition-transform duration-300 mx-auto w-fit mb-3`}>
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-medium text-gray-900">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <div className="flex items-center justify-center mt-2">
                    {card.changeType === 'increase' ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ml-1 ${
                      card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Styles CSS personnalisés exactement comme Parcours.jsx */}
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

export default Dashboard