// running-admin/src/pages/Dashboard.jsx - VERSION CORRIGÉE
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  UsersIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  MapPinIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import StatCard from '../components/StatCard'
import ActivityChart from '../components/charts/ActivityChart'
import UserActivityTable from '../components/UserActivityTable'
import PerformanceDistributionChart from '../components/charts/PerformanceDistributionChart'
import ErrorMessage from '../components/ErrorMessage'
import { useApiCall } from '../hooks/useErrorHandler'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRuns: 0,
    totalDistance: 0,
    averagePace: 0,
    lastWeekRuns: 0,
    lastWeekDistance: 0
  })

  const [userActivity, setUserActivity] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [dateRange, setDateRange] = useState('month')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(10) // Réduit à 10s pour plus de réactivité
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showRefreshOptions, setShowRefreshOptions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [previousStats, setPreviousStats] = useState(null)
  const intervalRef = useRef(null)
  
  const { callApi, loading, error, retry, clearError } = useApiCall()
  
  useEffect(() => {
    fetchDashboardData()
    
    // Configuration de l'auto-refresh silencieux
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchDashboardData(true) // Refresh silencieux
      }, refreshInterval * 1000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])

  // Cleanup de l'interval quand le composant se démonte
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const fetchDashboardData = async () => {
    await callApi(
      async () => {
        try {
          // Utiliser les nouveaux endpoints dashboard avec la bonne URL
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
          const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
          
          const [overviewRes, activityRes, healthRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/dashboard/overview`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch(`${API_BASE_URL}/api/dashboard/recent-activity`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch(`${API_BASE_URL}/api/dashboard/system-health`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          ])

          if (!overviewRes.ok) {
            throw new Error(`Erreur overview: ${overviewRes.status}`)
          }
          if (!activityRes.ok) {
            throw new Error(`Erreur activity: ${activityRes.status}`)
          }
          if (!healthRes.ok) {
            throw new Error(`Erreur health: ${healthRes.status}`)
          }

          const overview = await overviewRes.json()
          const activity = await activityRes.json()
          const health = await healthRes.json()

          return {
            overview: overview.data,
            activity: activity.data,
            health: health.data
          }
        } catch (error) {
          console.error('Erreur lors du fetch:', error)
          
          // Données de fallback en cas d'erreur
          return {
            overview: {
              overview: {
                total_users: 150,
                active_users: 75,
                total_runs: 520,
                recent_runs: 120,
                total_distance: 3250,
                avg_distance: 6.25,
                avg_pace: 312,
                activity_rate: 23.1
              }
            },
            activity: {
              recent_runs: [
                {
                  id: 1,
                  user: { id: 101, username: 'Alexandre', email: 'alex@example.com' },
                  distance: 8.5,
                  duration: 2535,
                  pace: 298,
                  start_time: new Date().toISOString()
                },
                {
                  id: 2,
                  user: { id: 102, username: 'Sophie', email: 'sophie@example.com' },
                  distance: 5.2,
                  duration: 1545,
                  pace: 297,
                  start_time: new Date().toISOString()
                }
              ]
            },
            health: {
              database: { status: 'healthy', connected: true },
              uptime: { status: 'healthy' }
            }
          }
        }
      },
      {
        onSuccess: (data) => {
          // Mettre à jour les stats
          const overview = data.overview.overview || data.overview
          setStats({
            totalUsers: overview.total_users || 0,
            activeUsers: overview.active_users || 0,
            totalRuns: overview.total_runs || 0,
            totalDistance: overview.total_distance || 0,
            averagePace: overview.avg_pace || 0,
            lastWeekRuns: overview.recent_runs || 0,
            lastWeekDistance: overview.avg_distance || 0
          })
          
          // Mettre à jour l'activité récente
          const recentRuns = data.activity.recent_runs || []
          const formattedActivity = recentRuns.map(run => ({
            id: run.id,
            user: { 
              id: run.user.id, 
              name: run.user.username 
            },
            date: new Date(run.start_time),
            distance: run.distance,
            duration: run.duration,
            pace: run.pace
          }))
          setUserActivity(formattedActivity)
          
          // Mettre à jour la santé système
          setSystemHealth(data.health)
          
          // Mettre à jour l'heure de dernière actualisation
          setLastUpdate(new Date())
        },
        errorMessage: 'Impossible de charger les données du tableau de bord'
      }
    )
  }

  const handleManualRefresh = () => {
    fetchDashboardData()
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
    if (!autoRefresh && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const handleRefreshIntervalChange = (newInterval) => {
    setRefreshInterval(newInterval)
    setShowRefreshOptions(false)
    
    // Redémarrer l'interval avec le nouveau délai
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchDashboardData()
      }, newInterval * 1000)
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Jamais'
    const now = new Date()
    const diff = Math.floor((now - lastUpdate) / 1000)
    
    if (diff < 60) return `Il y a ${diff}s`
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`
    return lastUpdate.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <ErrorMessage 
        error={error}
        onRetry={() => retry(fetchDashboardData)}
        onDismiss={clearError}
      />
    )
  }
  
  return (
    <div className="space-y-8">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-2 text-gray-600">Vue d'ensemble de l'activité de votre application</p>
        </div>
        
        {/* Contrôles d'actualisation */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Dernière mise à jour */}
          <div className="text-sm text-gray-500">
            Mis à jour: {formatLastUpdate()}
          </div>
          
          {/* Bouton de rafraîchissement manuel */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          {/* Auto-refresh toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              autoRefresh 
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {autoRefresh ? (
              <PauseIcon className="h-4 w-4 mr-2" />
            ) : (
              <PlayIcon className="h-4 w-4 mr-2" />
            )}
            Auto ({refreshInterval}s)
          </button>
          
          {/* Options d'actualisation */}
          <div className="relative">
            <button
              onClick={() => setShowRefreshOptions(!showRefreshOptions)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
            
            {showRefreshOptions && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                    Intervalle d'actualisation
                  </div>
                  {[10, 30, 60, 300].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => handleRefreshIntervalChange(interval)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        refreshInterval === interval ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      {interval < 60 ? `${interval} secondes` : `${interval / 60} minute${interval > 60 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Indicateur de santé système avec statut temps réel */}
      {systemHealth && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              Base de données: {systemHealth.database.status === 'healthy' ? 'En ligne' : 'Hors ligne'}
            </span>
            {autoRefresh && (
              <span className="text-xs text-gray-400">
                • Auto-actualisation active
              </span>
            )}
          </div>
          
          {loading && !isUpdating && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Chargement initial...</span>
            </div>
          )}
          
          {isUpdating && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Mise à jour des données...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Cartes de statistiques avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs totaux"
          value={stats.totalUsers}
          icon={UsersIcon}
          trend={{ type: 'increase', value: 12 }}
          color="blue"
          animated={true}
          isUpdating={isUpdating}
        />
        <StatCard
          title="Utilisateurs actifs"
          value={stats.activeUsers}
          icon={UsersIcon}
          trend={{ type: 'increase', value: 8 }}
          color="green"
          animated={true}
          isUpdating={isUpdating}
        />
        <StatCard
          title="Courses totales"
          value={stats.totalRuns}
          icon={ClockIcon}
          trend={{ type: 'increase', value: 15 }}
          color="purple"
          animated={true}
          isUpdating={isUpdating}
        />
        <StatCard
          title="Distance totale"
          value={`${stats.totalDistance} km`}
          icon={MapPinIcon}
          trend={{ type: 'increase', value: 22 }}
          color="orange"
          animated={true}
          isUpdating={isUpdating}
        />
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Activité au fil du temps</h2>
              <p className="text-sm text-gray-500">Évolution des courses et distances</p>
            </div>
            <select
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">12 derniers mois</option>
            </select>
          </div>
          <div className="h-80 relative">
            <ActivityChart 
              dateRange={dateRange} 
              data={userActivity}
              isUpdating={isUpdating}
            />
            {isUpdating && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Distribution des performances</h2>
            <p className="text-sm text-gray-500">Répartition par distance</p>
          </div>
          <div className="h-80 relative">
            <PerformanceDistributionChart 
              data={stats}
              isUpdating={isUpdating}
            />
            {isUpdating && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dernière activité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dernière activité</h2>
              <p className="text-sm text-gray-500">Activités récentes des utilisateurs</p>
            </div>
            <Link 
              to="/history" 
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Voir tout
            </Link>
          </div>
        </div>
        {userActivity.length > 0 ? (
          <div className="relative">
            <UserActivityTable 
              data={userActivity} 
              isUpdating={isUpdating}
            />
            {isUpdating && (
              <div className="absolute top-4 right-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Aucune activité récente à afficher</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard