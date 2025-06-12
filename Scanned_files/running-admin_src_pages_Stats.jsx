// running-admin/src/pages/Stats.jsx - Page standalone
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UsersIcon, 
  ClockIcon, 
  MapPinIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowPathIcon
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
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setStats(data.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Erreur stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (distance) => {
    if (!distance) return '0 km'
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}k km`
    }
    return `${Math.round(distance)} km`
  }

  const formatPace = (pace) => {
    if (!pace || pace === 0) return "0:00"
    const minutes = Math.floor(pace)
    const seconds = Math.round((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const StatCard = ({ title, value, subValue, icon: Icon, iconColor, trend }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <span className="ml-2 text-sm font-medium text-green-600">
                  {trend}
                </span>
              )}
            </div>
            {subValue && (
              <p className="text-sm text-gray-600">{subValue}</p>
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
        <div className="alert alert-error">
          <p>Erreur de chargement: {error}</p>
          <button 
            onClick={fetchStats}
            className="btn btn-sm btn-secondary mt-2"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="mt-2 text-sm text-gray-600">
            Données en temps réel de l'application
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="btn btn-secondary"
          disabled={loading}
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Utilisateurs totaux" 
          value={stats.total_users?.toLocaleString() || '0'} 
          subValue={`${stats.active_users || 0} actifs`}
          icon={UsersIcon} 
          iconColor="bg-blue-50 text-blue-600"
          trend={stats.new_users_this_month > 0 ? `+${stats.new_users_this_month}` : null}
        />
        <StatCard 
          title="Courses totales" 
          value={stats.total_runs?.toLocaleString() || '0'} 
          subValue={`${stats.runs_this_month || 0} ce mois-ci`}
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
          value={stats.active_routes?.toLocaleString() || '0'} 
          subValue={`${stats.total_routes || 0} au total`}
          icon={BuildingOfficeIcon} 
          iconColor="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Métriques calculées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Allure moyenne</span>
                <span className="font-semibold">{formatPace(stats.average_pace)} min/km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance par course</span>
                <span className="font-semibold">
                  {((stats.total_distance || 0) / Math.max(1, stats.total_runs || 1)).toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Courses par utilisateur</span>
                <span className="font-semibold">
                  {((stats.total_runs || 0) / Math.max(1, stats.total_users || 1)).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Activité mensuelle</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Nouvelles courses</span>
                <span className="font-semibold text-green-600">+{stats.runs_this_month || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance parcourue</span>
                <span className="font-semibold text-green-600">+{formatDistance(stats.distance_this_month)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nouveaux utilisateurs</span>
                <span className="font-semibold text-green-600">+{stats.new_users_this_month || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Taux d'activité</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Utilisateurs actifs</span>
                  <span className="text-sm font-medium">
                    {(((stats.active_users || 0) / Math.max(1, stats.total_users || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((stats.active_users || 0) / Math.max(1, stats.total_users || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Routes utilisées</span>
                  <span className="text-sm font-medium">
                    {(((stats.active_routes || 0) / Math.max(1, stats.total_routes || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, ((stats.active_routes || 0) / Math.max(1, stats.total_routes || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/users" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Gérer les utilisateurs</h4>
                <p className="text-sm text-gray-500">{stats.total_users} utilisateurs</p>
              </div>
            </Link>
            
            <Link 
              to="/routes" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPinIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Gérer les parcours</h4>
                <p className="text-sm text-gray-500">{stats.total_routes} parcours</p>
              </div>
            </Link>
            
            <Link 
              to="/history" 
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Historique des courses</h4>
                <p className="text-sm text-gray-500">{stats.total_runs} courses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats