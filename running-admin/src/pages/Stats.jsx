// running-admin/src/pages/Stats.jsx - Avec système de préchargement
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { 
  UsersIcon, 
  ClockIcon, 
  MapPinIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  FireIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

// Composant de squelette pour la page de statistiques
const StatsSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête skeleton */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="skeleton h-8 w-48 mb-2"></div>
              <div className="skeleton h-5 w-96"></div>
            </div>
            <div className="skeleton h-10 w-32"></div>
          </div>
        </div>

        {/* Statistiques principales skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center">
                <div className="skeleton h-12 w-12 rounded-xl mr-4"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-24 mb-2"></div>
                  <div className="skeleton h-8 w-16 mb-1"></div>
                  <div className="skeleton h-3 w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques et tendances skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique principal */}
          <div className="glass rounded-2xl p-6 shadow-xl animate-slide-in-left" style={{ animationDelay: '400ms' }}>
            <div className="skeleton h-6 w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center space-x-4 animate-fade-in"
                  style={{ animationDelay: `${600 + i * 100}ms` }}
                >
                  <div className="skeleton h-4 w-20"></div>
                  <div className="flex-1">
                    <div className="skeleton h-3 w-full"></div>
                  </div>
                  <div className="skeleton h-4 w-12"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Activité récente skeleton */}
          <div className="glass rounded-2xl p-6 shadow-xl animate-slide-in-right" style={{ animationDelay: '500ms' }}>
            <div className="skeleton h-6 w-40 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center space-x-4 p-3 rounded-xl border border-emerald-100 animate-fade-in"
                  style={{ animationDelay: `${700 + i * 120}ms` }}
                >
                  <div className="skeleton h-10 w-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-1"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                  <div className="skeleton h-6 w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides skeleton */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-scale-in" style={{ animationDelay: '800ms' }}>
          <div className="skeleton h-6 w-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="p-4 border border-emerald-200 rounded-xl animate-fade-in"
                style={{ animationDelay: `${1000 + i * 150}ms` }}
              >
                <div className="flex items-center">
                  <div className="skeleton h-8 w-8 rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-1"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // État pour le préchargement
  const [isPreloading, setIsPreloading] = useState(true)

  // Simulation du préchargement
  const simulatePreloading = async () => {
    console.log('🎬 Début du préchargement Stats')
    
    // Délai pour montrer le skeleton
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsPreloading(false)
    console.log('✨ Préchargement Stats terminé')
  }

  useEffect(() => {
    console.log('🚀 Initialisation Stats avec préchargement')
    simulatePreloading()
  }, [])

  useEffect(() => {
    if (!isPreloading) {
      fetchStats()
    }
  }, [isPreloading])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Tentative d'appel API réel
      try {
        const response = await api.admin.getStats()
        
        if (response.data.success) {
          const statsData = response.data.data
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
        } else {
          throw new Error(response.data.message || 'Erreur API')
        }
      } catch (apiError) {
        console.warn('⚠️ API indisponible, utilisation de données simulées')
        // Fallback vers des données simulées
        const mockStats = {
          total_users: 247,
          active_users: 183,
          total_runs: 1456,
          total_distance: 18750.5,
          total_routes: 28,
          active_routes: 22,
          average_pace: 5.25,
          new_users_this_month: 34,
          runs_this_month: 298,
          distance_this_month: 3890.2
        }
        setStats(mockStats)
        setError('Mode simulation - API indisponible')
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
      setError(err.response?.data?.message || err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (distance) => {
    const numDistance = Number(distance) || 0
    if (numDistance >= 1000) {
      return `${(numDistance / 1000).toFixed(1)} km`
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

  const StatCard = ({ title, value, subValue, icon: Icon, bgGradient, trend, delay = "0ms" }) => (
    <div 
      className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${bgGradient} text-white group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-emerald-600 truncate">{title}</h3>
            {trend && (
              <span className="text-xs font-medium text-green-600 flex-shrink-0">
                {trend}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-emerald-800">{value}</p>
          {subValue && (
            <p className="text-sm text-emerald-600 truncate">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )

  // Affichage du skeleton pendant le préchargement
  if (isPreloading) {
    return <StatsSkeletonLoader />
  }

  if (error && !stats.total_users) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 shadow-xl text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Erreur de chargement des statistiques
            </h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <button 
              onClick={fetchStats}
              disabled={loading}
              className="btn btn-primary"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800 text-shadow-lg">Statistiques</h1>
              <p className="text-emerald-600 mt-2">
                Données en temps réel de l'application Running
              </p>
            </div>
            <button 
              onClick={fetchStats}
              disabled={loading}
              className="btn btn-secondary"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
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

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Utilisateurs totaux"
            value={stats.total_users.toLocaleString()}
            subValue={`${stats.active_users} actifs`}
            icon={UsersIcon}
            bgGradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            trend={stats.new_users_this_month > 0 ? `+${stats.new_users_this_month} ce mois` : null}
            delay="0ms"
          />
          
          <StatCard
            title="Courses totales"
            value={stats.total_runs.toLocaleString()}
            subValue={`${stats.runs_this_month} ce mois`}
            icon={TrophyIcon}
            bgGradient="bg-gradient-to-r from-green-500 to-emerald-500"
            trend={stats.runs_this_month > 0 ? `+${stats.runs_this_month}` : null}
            delay="150ms"
          />
          
          <StatCard
            title="Distance totale"
            value={formatDistance(stats.total_distance)}
            subValue={`${formatDistance(stats.distance_this_month)} ce mois`}
            icon={MapPinIcon}
            bgGradient="bg-gradient-to-r from-purple-500 to-indigo-500"
            delay="300ms"
          />
          
          <StatCard
            title="Allure moyenne"
            value={`${formatPace(stats.average_pace)}/km`}
            subValue="Toutes courses"
            icon={ClockIcon}
            bgGradient="bg-gradient-to-r from-orange-500 to-red-500"
            delay="450ms"
          />
          
          <StatCard
            title="Parcours totaux"
            value={stats.total_routes.toLocaleString()}
            subValue={`${stats.active_routes} actifs`}
            icon={BuildingOfficeIcon}
            bgGradient="bg-gradient-to-r from-pink-500 to-rose-500"
            delay="600ms"
          />
          
          <StatCard
            title="Taux d'activité"
            value={`${Math.round(calculatePercentage(stats.active_users, stats.total_users))}%`}
            subValue="Utilisateurs actifs"
            icon={ArrowTrendingUpIcon}
            bgGradient="bg-gradient-to-r from-emerald-500 to-teal-500"
            delay="750ms"
          />
          
          <StatCard
            title="Distance moyenne"
            value={formatDistance(stats.total_distance / (stats.total_runs || 1))}
            subValue="Par course"
            icon={FireIcon}
            bgGradient="bg-gradient-to-r from-yellow-500 to-orange-500"
            delay="900ms"
          />
          
          <StatCard
            title="Performance"
            value={`${Math.round(stats.total_runs / (stats.active_users || 1))}`}
            subValue="Courses/utilisateur"
            icon={HeartIcon}
            bgGradient="bg-gradient-to-r from-red-500 to-pink-500"
            delay="1050ms"
          />
        </div>

        {/* Graphiques et tendances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progression mensuelle */}
          <div className="glass rounded-2xl p-6 shadow-xl animate-slide-in-left" style={{ animationDelay: '400ms' }}>
            <h3 className="text-xl font-bold text-emerald-800 mb-6">Progression ce mois</h3>
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl animate-fade-in"
                style={{ animationDelay: '600ms' }}
              >
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-800">Nouveaux utilisateurs</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.new_users_this_month}</span>
              </div>
              
              <div 
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl animate-fade-in"
                style={{ animationDelay: '750ms' }}
              >
                <div className="flex items-center">
                  <TrophyIcon className="h-6 w-6 text-green-600 mr-3" />
                  <span className="font-semibold text-gray-800">Courses effectuées</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.runs_this_month}</span>
              </div>
              
              <div 
                className="flex items-center justify-between p-4 bg-purple-50 rounded-xl animate-fade-in"
                style={{ animationDelay: '900ms' }}
              >
                <div className="flex items-center">
                  <MapPinIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <span className="font-semibold text-gray-800">Distance parcourue</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{formatDistance(stats.distance_this_month)}</span>
              </div>
            </div>
          </div>

          {/* Répartition des utilisateurs */}
          <div className="glass rounded-2xl p-6 shadow-xl animate-slide-in-right" style={{ animationDelay: '500ms' }}>
            <h3 className="text-xl font-bold text-emerald-800 mb-6">Répartition des utilisateurs</h3>
            <div className="space-y-4">
              <div className="relative animate-fade-in" style={{ animationDelay: '700ms' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Utilisateurs actifs</span>
                  <span className="text-sm text-gray-500">{stats.active_users}/{stats.total_users}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculatePercentage(stats.active_users, stats.total_users)}%`,
                      animationDelay: '1000ms'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{Math.round(calculatePercentage(stats.active_users, stats.total_users))}%</span>
              </div>
              
              <div className="relative animate-fade-in" style={{ animationDelay: '850ms' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Parcours actifs</span>
                  <span className="text-sm text-gray-500">{stats.active_routes}/{stats.total_routes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculatePercentage(stats.active_routes, stats.total_routes)}%`,
                      animationDelay: '1150ms'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{Math.round(calculatePercentage(stats.active_routes, stats.total_routes))}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-scale-in" style={{ animationDelay: '800ms' }}>
          <h3 className="text-xl font-bold text-emerald-800 mb-6">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/users" 
              className="flex items-center p-4 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 hover:scale-105 group focus:outline-none focus:ring-4 focus:ring-emerald-200 animate-fade-in"
              style={{ animationDelay: '1000ms' }}
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900">Gérer les utilisateurs</h4>
                <p className="text-sm text-gray-600 truncate">{stats.total_users} utilisateurs</p>
              </div>
            </Link>
            
            <Link 
              to="/parcours" 
              className="flex items-center p-4 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 hover:scale-105 group focus:outline-none focus:ring-4 focus:ring-emerald-200 animate-fade-in"
              style={{ animationDelay: '1150ms' }}
            >
              <MapPinIcon className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900">Gérer les parcours</h4>
                <p className="text-sm text-gray-600 truncate">{stats.total_routes} parcours</p>
              </div>
            </Link>
            
            <Link 
              to="/history" 
              className="flex items-center p-4 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 hover:scale-105 group focus:outline-none focus:ring-4 focus:ring-emerald-200 animate-fade-in"
              style={{ animationDelay: '1300ms' }}
            >
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900">Historique des courses</h4>
                <p className="text-sm text-gray-600 truncate">{stats.total_runs} courses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats