import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UsersIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline'
import api from '../services/api'
import StatCard from '../components/StatCard'
import ActivityChart from '../components/charts/ActivityChart'
import UserActivityTable from '../components/UserActivityTable'
import PerformanceDistributionChart from '../components/charts/PerformanceDistributionChart'
import ErrorMessage from '../components/ErrorMessage'
import { useApiCall } from '../hooks/useErrorHandler'

const statsData = {
  total_users: 150,
  active_users: 75,
  total_runs: 520,
  total_distance: 3250,
  average_pace: 5.2,
  runs_this_month: 120,
  distance_this_month: 750
}

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
  const [dateRange, setDateRange] = useState('month')
  
  const { callApi, loading, error, retry, clearError } = useApiCall()
  
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    await callApi(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (Math.random() < 0.05) {
          throw new Error('Erreur simulée de l\'API')
        }
        
        return {
          stats: statsData,
          activity: [
            {
              id: 1,
              user: { id: 101, name: 'Alexandre Dupont' },
              date: new Date(),
              distance: 8.5,
              duration: 42 * 60 + 15,
            },
            {
              id: 2,
              user: { id: 102, name: 'Sophie Martin' },
              date: new Date(),
              distance: 5.2,
              duration: 25 * 60 + 45,
            },
            {
              id: 3,
              user: { id: 103, name: 'Thomas Bernard' },
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              distance: 12.0,
              duration: 65 * 60 + 30,
            }
          ]
        }
      },
      {
        onSuccess: (data) => {
          setStats({
            totalUsers: data.stats.total_users || 0,
            activeUsers: data.stats.active_users || 0,
            totalRuns: data.stats.total_runs || 0,
            totalDistance: data.stats.total_distance || 0,
            averagePace: data.stats.average_pace || 0,
            lastWeekRuns: data.stats.runs_this_month || 0,
            lastWeekDistance: data.stats.distance_this_month || 0
          })
          setUserActivity(data.activity)
        },
        errorMessage: 'Impossible de charger les données du tableau de bord'
      }
    )
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
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-sm text-gray-600">
          Vue d'ensemble de l'application Running
        </p>
      </div>
      
      {/* Statistiques clés */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Utilisateurs" 
          value={stats.totalUsers} 
          subValue={`${stats.activeUsers} actifs`}
          icon={UsersIcon} 
          iconColor="bg-blue-50 text-blue-600" 
          to="/users"
        />
        <StatCard 
          title="Courses" 
          value={stats.totalRuns} 
          subValue={`${stats.lastWeekRuns} ce mois-ci`}
          icon={ClockIcon} 
          iconColor="bg-green-50 text-green-600" 
          to="/history"
        />
        <StatCard 
          title="Distance" 
          value={`${stats.totalDistance.toLocaleString()} km`} 
          subValue={`${stats.lastWeekDistance.toLocaleString()} km ce mois-ci`}
          icon={MapPinIcon} 
          iconColor="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Allure moyenne" 
          value={`${stats.averagePace || "--:--"} min/km`} 
          subValue="Globale" 
          icon={ArrowTrendingUpIcon} 
          iconColor="bg-yellow-50 text-yellow-600" 
        />
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Activité des utilisateurs</h2>
              <p className="text-sm text-gray-500">Évolution des métriques</p>
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
          <div className="h-80">
            <ActivityChart dateRange={dateRange} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Distribution des performances</h2>
            <p className="text-sm text-gray-500">Répartition par distance</p>
          </div>
          <div className="h-80">
            <PerformanceDistributionChart />
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
          <UserActivityTable data={userActivity} />
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