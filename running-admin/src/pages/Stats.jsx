// running-admin/src/pages/Stats.jsx - Fixed version
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UsersIcon, 
  ClockIcon, 
  MapPinIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Stats = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    total_runs: 0,
    total_distance: 0,
    total_routes: 0,
    active_routes: 0,
    average_pace: 0,
    new_users_this_month: 0,
    runs_this_month: 0,
    distance_this_month: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try multiple token sources
      const token = localStorage.getItem('auth_token') || 
                   sessionStorage.getItem('auth_token') ||
                   localStorage.getItem('token') ||
                   sessionStorage.getItem('token')
      
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      // Use environment variable or fallback to localhost
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non autorisé - Veuillez vous reconnecter')
        } else if (response.status === 403) {
          throw new Error('Accès refusé - Privilèges administrateur requis')
        } else if (response.status === 404) {
          throw new Error('Endpoint non trouvé')
        } else {
          throw new Error(`Erreur serveur (${response.status})`)
        }
      }

      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Réponse invalide du serveur')
      }

      // Handle different response formats from Flask
      const statsData = data.data || data
      
      // Ensure all values are numbers and not null/undefined
      const sanitizedStats = {
        total_users: Number(statsData.total_users) || 0,
        active_users: Number(statsData.active_users) || 0,
        total_runs: Number(statsData.total_runs) || 0,
        total_distance: Number(statsData.total_distance) || 0,
        total_routes: Number(statsData.total_routes) || 0,
        active_routes: Number(statsData.active_routes) || 0,
        average_pace: Number(statsData.average_pace) || 0,
        new_users_this_month: Number(statsData.new_users_this_month) || 0,
        runs_this_month: Number(statsData.runs_this_month) || 0,
        distance_this_month: Number(statsData.distance_this_month) || 0
      }

      setStats(sanitizedStats)
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (distance) => {
    const numDistance = Number(distance) || 0
    if (numDistance >= 1000) {
      return `${(numDistance / 1000).toFixed(1)}k km`
    }
    return `${Math.round(numDistance)} km`
  }

  const formatPace = (pace) => {
    const numPace = Number(pace) || 0
    if (numPace === 0) return "0:00"
    
    const minutes = Math.floor(numPace)
    const seconds = Math.round((numPace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const calculatePercentage = (value, total) => {
    const numValue = Number(value) || 0
    const numTotal = Number(total) || 0
    if (numTotal === 0) return 0
    return Math.min(100, Math.max(0, (numValue / numTotal) * 100))
  }

  const StatCard = ({ title, value, subValue, icon: Icon, iconColor, trend }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <span className="ml-2 text-sm font-medium text-green-600 flex-shrink-0">
                  {trend}
                </span>
              )}
            </div>
            {subValue && (
              <p className="text-sm text-gray-600 truncate">{subValue}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Erreur de chargement des statistiques
              </h3>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <button 
                onClick={fetchStats}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="mt-2 text-sm text-gray-600">
            Données en temps réel de l'application
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Utilisateurs totaux" 
          value={stats.total_users.toLocaleString()} 
          subValue={`${stats.active_users} actifs`}
          icon={UsersIcon} 
          iconColor="bg-blue-50 text-blue-600"
          trend={stats.new_users_this_month > 0 ? `+${stats.new_users_this_month}` : null}
        />
        <StatCard 
          title="Courses totales" 
          value={stats.total_runs.toLocaleString()} 
          subValue={`${stats.runs_this_month} ce mois-ci`}
          icon={ClockIcon} 
          iconColor="bg-green-50 text-green-600"
        />
        <StatCard 
          title="Distance totale" 
          value={formatDistance(stats.total_distance)} 
          subValue={`${formatDistance(stats.distance_this_month)} ce mois-ci`}
          icon={MapPinIcon} 
          iconColor="bg-purple-50 text-purple-600"
        />
        <StatCard 
          title="Routes actives" 
          value={stats.active_routes.toLocaleString()} 
          subValue={`${stats.total_routes} au total`}
          icon={BuildingOfficeIcon} 
          iconColor="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Métriques calculées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Allure moyenne</span>
                <span className="font-semibold">{formatPace(stats.average_pace)} min/km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Distance par course</span>
                <span className="font-semibold">
                  {stats.total_runs > 0 ? (stats.total_distance / stats.total_runs).toFixed(1) : '0.0'} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Courses par utilisateur</span>
                <span className="font-semibold">
                  {stats.total_users > 0 ? (stats.total_runs / stats.total_users).toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Activité mensuelle</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nouvelles courses</span>
                <span className="font-semibold text-green-600">+{stats.runs_this_month}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Distance parcourue</span>
                <span className="font-semibold text-green-600">+{formatDistance(stats.distance_this_month)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nouveaux utilisateurs</span>
                <span className="font-semibold text-green-600">+{stats.new_users_this_month}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Taux d'activité</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Utilisateurs actifs</span>
                  <span className="text-sm font-medium">
                    {calculatePercentage(stats.active_users, stats.total_users).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${calculatePercentage(stats.active_users, stats.total_users)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Routes utilisées</span>
                  <span className="text-sm font-medium">
                    {calculatePercentage(stats.active_routes, stats.total_routes).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${calculatePercentage(stats.active_routes, stats.total_routes)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/users" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900">Gérer les utilisateurs</h4>
                <p className="text-sm text-gray-500 truncate">{stats.total_users} utilisateurs</p>
              </div>
            </Link>
            
            <Link 
              to="/routes" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MapPinIcon className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900">Gérer les parcours</h4>
                <p className="text-sm text-gray-500 truncate">{stats.total_routes} parcours</p>
              </div>
            </Link>
            
            <Link 
              to="/history" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900">Historique des courses</h4>
                <p className="text-sm text-gray-500 truncate">{stats.total_runs} courses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats