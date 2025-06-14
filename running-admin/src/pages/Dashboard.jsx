// running-admin/src/pages/Dashboard.jsx - EXEMPLE AVEC THEME VERT
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  UserGroupIcon, 
  ClockIcon, 
  ChartBarIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRuns: 0,
    totalDistance: 0,
    avgSpeed: 0,
    loading: true
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [quickActions, setQuickActions] = useState([])

  // Données de démonstration
  useEffect(() => {
    // Simulation du chargement des données
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        activeRuns: 23,
        totalDistance: 15847.2,
        avgSpeed: 8.3,
        loading: false
      })

      setRecentActivity([
        {
          id: 1,
          user: 'Marie Dubois',
          action: 'Course terminée',
          distance: '5.2 km',
          time: 'il y a 5 min',
          type: 'success'
        },
        {
          id: 2,
          user: 'Pierre Martin',
          action: 'Nouveau parcours créé',
          distance: '8.7 km',
          time: 'il y a 12 min',
          type: 'info'
        },
        {
          id: 3,
          user: 'Sophie Leroux',
          action: 'Record personnel battu',
          distance: '10.1 km',
          time: 'il y a 23 min',
          type: 'achievement'
        }
      ])
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'increase',
      emoji: '👥',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Courses actives',
      value: stats.activeRuns,
      icon: ClockIcon,
      change: '+3',
      changeType: 'increase',
      emoji: '🏃',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      title: 'Distance totale',
      value: `${stats.totalDistance.toLocaleString()} km`,
      icon: ChartBarIcon,
      change: '+8%',
      changeType: 'increase',
      emoji: '📊',
      gradient: 'from-green-600 to-emerald-700'
    },
    {
      title: 'Vitesse moyenne',
      value: `${stats.avgSpeed} km/h`,
      icon: TrophyIcon,
      change: '-0.2',
      changeType: 'decrease',
      emoji: '🏆',
      gradient: 'from-emerald-600 to-green-700'
    }
  ]

  if (stats.loading) {
    return (
      <div className="animate-fade-in">
        {/* Loading Skeleton avec thème vert */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="skeleton h-4 w-24 mb-2"></div>
                <div className="skeleton h-8 w-16 mb-2"></div>
                <div className="skeleton h-3 w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-green rounded-2xl p-6 border border-green-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-green-800 text-shadow">
              Bienvenue, {user?.username} ! 🌟
            </h1>
            <p className="text-green-600 mt-2">
              Voici un aperçu de l'activité de votre plateforme de running
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn btn-secondary btn-sm">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            {isAdmin && (
              <button className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={stat.title}
            className="card hover:shadow-green-lg transition-all duration-300 animate-slide-in-right group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-green-button group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-green-600 font-medium">
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📈</span>
                  <h2 className="text-lg font-semibold text-green-800">
                    Activité récente
                  </h2>
                </div>
                <button className="btn btn-outline btn-sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Voir tout
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 hover:bg-green-50/50 rounded-xl transition-colors duration-200 animate-slide-in-left"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'success' ? 'bg-green-badge-gradient' :
                      activity.type === 'achievement' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-lg">
                        {activity.type === 'success' ? '✅' : 
                         activity.type === 'achievement' ? '🏆' : 'ℹ️'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-green-700">{activity.user}</span> • {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.distance} • {activity.time}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`badge ${
                        activity.type === 'success' ? 'badge-success' :
                        activity.type === 'achievement' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {activity.type === 'success' ? 'Terminé' :
                         activity.type === 'achievement' ? 'Record' : 'Nouveau'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚡</span>
                <h2 className="text-lg font-semibold text-green-800">
                  Actions rapides
                </h2>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {[
                  { label: 'Créer un parcours', icon: '🗺️', action: '/parcours', color: 'green' },
                  { label: 'Ajouter un utilisateur', icon: '👤', action: '/users', color: 'emerald', adminOnly: true },
                  { label: 'Voir les statistiques', icon: '📊', action: '/stats', color: 'green' },
                  { label: 'Gérer les paramètres', icon: '⚙️', action: '/settings', color: 'emerald' }
                ].filter(item => !item.adminOnly || (item.adminOnly && isAdmin)).map((action, index) => (
                  <button
                    key={action.label}
                    className={`w-full text-left p-4 rounded-xl border-2 border-${action.color}-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all duration-300 group animate-scale-in`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        {action.icon}
                      </span>
                      <span className="font-medium text-gray-900 group-hover:text-green-800">
                        {action.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Chart Preview */}
          <div className="card mt-6">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📈</span>
                <h2 className="text-lg font-semibold text-green-800">
                  Performance cette semaine
                </h2>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {[
                  { day: 'Lun', value: 85, color: 'bg-green-500' },
                  { day: 'Mar', value: 92, color: 'bg-emerald-500' },
                  { day: 'Mer', value: 78, color: 'bg-green-400' },
                  { day: 'Jeu', value: 95, color: 'bg-emerald-600' },
                  { day: 'Ven', value: 88, color: 'bg-green-500' },
                  { day: 'Sam', value: 100, color: 'bg-emerald-600' },
                  { day: 'Dim', value: 82, color: 'bg-green-400' }
                ].map((item, index) => (
                  <div key={item.day} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-8">
                      {item.day}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ 
                          width: `${item.value}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔧</span>
              <h2 className="text-lg font-semibold text-green-800">
                État du système
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                { label: 'API Server', status: 'connected', uptime: '99.9%' },
                { label: 'Base de données', status: 'connected', uptime: '99.8%' },
                { label: 'Cache Redis', status: 'connected', uptime: '100%' },
                { label: 'Service GPS', status: 'connected', uptime: '98.5%' }
              ].map((service, index) => (
                <div key={service.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'connected' ? 'bg-green-500 animate-green-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {service.label}
                    </span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {service.uptime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips & Announcements */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💡</span>
              <h2 className="text-lg font-semibold text-green-800">
                Conseils & Annonces
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="alert alert-success">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">🎉</span>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">
                      Nouvelle fonctionnalité !
                    </h4>
                    <p className="text-sm text-green-700">
                      Les parcours partagés sont maintenant disponibles. 
                      Vos utilisateurs peuvent partager leurs routes préférées.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-200">
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">💭</span>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">
                      Conseil du jour
                    </h4>
                    <p className="text-sm text-green-700">
                      Pensez à vérifier régulièrement les statistiques d'utilisation 
                      pour optimiser les performances de votre plateforme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard