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
  HeartIcon
} from '@heroicons/react/24/outline'
import { ChartBarIcon as ChartBarSolidIcon } from '@heroicons/react/24/solid'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRuns: 0,
    totalDistance: 0,
    totalRoutes: 0,
    loading: true
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [quickStats, setQuickStats] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Simulation de données - remplacer par vrais appels API
      setTimeout(() => {
        setStats({
          totalUsers: 1247,
          activeRuns: 23,
          totalDistance: 15847.2,
          totalRoutes: 45,
          loading: false
        })

        setRecentActivity([
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
        ])

        setQuickStats([
          { label: 'Courses aujourd\'hui', value: '47', change: '+12%', positive: true },
          { label: 'Nouveaux membres', value: '8', change: '+25%', positive: true },
          { label: 'Distance moyenne', value: '6.3 km', change: '-2%', positive: false },
          { label: 'Temps moyen', value: '32min', change: '+5%', positive: true }
        ])
      }, 1000)
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'increase',
      gradient: 'from-blue-500 to-cyan-500',
      href: '/users'
    },
    {
      title: 'Courses actives',
      value: stats.activeRuns,
      icon: ClockIcon,
      change: '+3',
      changeType: 'increase', 
      gradient: 'from-green-500 to-emerald-500',
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
      default: return <ChartBarSolidIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getActivityBg = (type) => {
    switch (type) {
      case 'run': return 'bg-green-100'
      case 'route': return 'bg-blue-100' 
      case 'achievement': return 'bg-yellow-100'
      case 'user': return 'bg-purple-100'
      default: return 'bg-gray-100'
    }
  }

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 mb-6 animate-spin">
              <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête de bienvenue */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">
                  {user?.first_name?.[0] || user?.username?.[0] || '👋'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 bg-gradient-to-r from-emerald-800 to-green-600 bg-clip-text text-transparent">
                  Bienvenue, {user?.first_name || user?.username} !
                </h1>
                <p className="text-emerald-600 font-medium">
                  Voici un aperçu de votre plateforme Running
                </p>
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div 
              key={card.title}
              className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-slide-in-up group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(card.href)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="flex items-center space-x-1">
                  {card.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-800 mb-1">{card.value}</h3>
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Statistiques rapides */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-scale-in hover:shadow-2xl transition-all duration-500">
          <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center">
            <FireIcon className="h-5 w-5 mr-2" />
            Aujourd'hui
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <div key={stat.label} className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-800">{stat.value}</div>
                <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                <div className={`text-xs font-semibold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Activité récente */}
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-left hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-emerald-800 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Activité récente
              </h2>
              <button 
                onClick={() => navigate('/history')}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center space-x-1 transition-colors duration-300"
              >
                <span>Voir tout</span>
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-center space-x-4 p-3 bg-white/60 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all duration-300 animate-slide-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-full ${getActivityBg(activity.type)} flex items-center justify-center`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 text-sm">{activity.user}</span>
                      <span className="text-gray-600 text-sm">{activity.action}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{activity.details}</div>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-right hover:shadow-2xl transition-all duration-500">
            <h2 className="text-lg font-bold text-emerald-800 mb-6 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Actions rapides
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  title: 'Ajouter un utilisateur', 
                  desc: 'Créer un nouveau compte', 
                  icon: UserGroupIcon, 
                  color: 'blue',
                  action: () => navigate('/users')
                },
                { 
                  title: 'Créer un parcours', 
                  desc: 'Nouveau parcours de course', 
                  icon: MapPinIcon, 
                  color: 'green',
                  action: () => navigate('/routes')
                },
                { 
                  title: 'Voir les statistiques', 
                  desc: 'Analyse des performances', 
                  icon: ChartBarIcon, 
                  color: 'purple',
                  action: () => navigate('/stats')
                },
                { 
                  title: 'Historique des courses', 
                  desc: 'Toutes les activités', 
                  icon: ClockIcon, 
                  color: 'orange',
                  action: () => navigate('/history')
                }
              ].map((action, index) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className={`p-4 bg-white/60 rounded-xl text-left hover:bg-white/80 transition-all duration-300 hover:scale-105 animate-slide-in-up group`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS personnalisés */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
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
      `}</style>
    </div>
  )
}

export default Dashboard