import { useState, useEffect } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import StatCard from '../components/StatCard'
import ErrorMessage from '../components/ErrorMessage'
import { useApiCall } from '../hooks/useErrorHandler'
import api from '../services/api'

// Icônes SVG
const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ArrowTrendingUpIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const MapPinIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const FireIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l4 4-6.121-1.879z" />
  </svg>
)

const Stats = () => {
  const [globalStats, setGlobalStats] = useState({
    total_users: 0,
    active_users: 0,
    total_runs: 0,
    total_distance: 0,
    average_pace: 0,
    new_users_this_month: 0,
    runs_this_month: 0,
    distance_this_month: 0
  })
  
  const [weeklyStats, setWeeklyStats] = useState([])
  const [monthlyStats, setMonthlyStats] = useState([])
  const [userActivity, setUserActivity] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  
  const { callApi, loading, error, retry, clearError } = useApiCall()

  useEffect(() => {
    fetchAllStats()
  }, [])

  const fetchAllStats = async () => {
    await callApi(
      async () => {
        // Récupération des statistiques globales
        const globalResponse = await api.stats.getGlobal()
        console.log('Global stats response:', globalResponse)
        
        // Récupération de l'activité utilisateur récente
        const activityResponse = await api.admin.getUserActivity()
        console.log('Activity response:', activityResponse)
        
        // Récupération des stats hebdomadaires
        const weeklyResponse = await api.stats.getWeeklyStats()
        console.log('Weekly response:', weeklyResponse)
        
        return {
          global: globalResponse,
          activity: activityResponse,
          weekly: weeklyResponse
        }
      },
      {
        onSuccess: (data) => {
          // Traitement des stats globales avec valeurs par défaut
          const globalData = data.global?.data || {}
          setGlobalStats({
            total_users: globalData.total_users || 0,
            active_users: globalData.active_users || 0,
            total_runs: globalData.total_runs || 0,
            total_distance: globalData.total_distance || 0,
            average_pace: globalData.average_pace || "0:00",
            new_users_this_month: globalData.new_users_this_month || 0,
            runs_this_month: globalData.runs_this_month || 0,
            distance_this_month: globalData.distance_this_month || 0
          })
          
          // Traitement de l'activité utilisateur
          const activityData = data.activity?.data || []
          setUserActivity(activityData)
          
          // Traitement des stats hebdomadaires
          const weeklyData = data.weekly?.weekly_stats || []
          setWeeklyStats(weeklyData.map(day => ({
            date: new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
            runs: day.runs_count || 0,
            distance: (day.distance / 1000) || 0, // Convertir en km
            duration: Math.round((day.duration / 60)) || 0 // Convertir en minutes
          })))
          
          // Générer des données mensuelles simulées pour l'exemple
          generateMonthlyStats()
        },
        errorMessage: 'Impossible de charger les statistiques'
      }
    )
  }

  const generateMonthlyStats = () => {
    // Générer des données pour les 12 derniers mois
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        runs: Math.floor(Math.random() * 100) + 50,
        users: Math.floor(Math.random() * 50) + 30,
        distance: Math.floor(Math.random() * 1000) + 500
      })
    }
    
    setMonthlyStats(months)
  }

  const formatDistance = (distance) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`
    }
    return `${Math.round(distance)} m`
  }

  const formatPace = (pace) => {
    if (typeof pace === 'string') return pace
    if (!pace || pace === 0) return "0:00"
    
    const minutes = Math.floor(pace)
    const seconds = Math.round((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Données pour le graphique en secteurs de répartition des utilisateurs
  const userDistributionData = [
    { name: 'Actifs', value: globalStats.active_users, color: '#10b981' },
    { name: 'Inactifs', value: Math.max(0, globalStats.total_users - globalStats.active_users), color: '#6b7280' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage 
        error={error}
        onRetry={() => retry(fetchAllStats)}
        onDismiss={clearError}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="mt-2 text-sm text-gray-600">
          Analyse détaillée des performances de l'application
        </p>
      </div>

      {/* Statistiques clés */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Utilisateurs totaux" 
          value={globalStats.total_users} 
          subValue={`${globalStats.new_users_this_month} nouveaux ce mois`}
          icon={UsersIcon} 
          iconColor="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Utilisateurs actifs" 
          value={globalStats.active_users} 
          subValue={`${Math.round((globalStats.active_users / Math.max(globalStats.total_users, 1)) * 100)}% du total`}
          icon={ChartBarIcon} 
          iconColor="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Courses totales" 
          value={globalStats.total_runs} 
          subValue={`${globalStats.runs_this_month} ce mois-ci`}
          icon={ClockIcon} 
          iconColor="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Distance totale" 
          value={formatDistance(globalStats.total_distance)} 
          subValue={`${formatDistance(globalStats.distance_this_month)} ce mois`}
          icon={MapPinIcon} 
          iconColor="bg-yellow-50 text-yellow-600" 
        />
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-50 p-3 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Allure moyenne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPace(globalStats.average_pace)} min/km
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-50 p-3 rounded-lg">
              <FireIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Calories brûlées</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(globalStats.total_distance * 0.06) || 0} kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Moyenne / utilisateur</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(globalStats.total_runs / Math.max(globalStats.total_users, 1)) || 0} courses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Évolution dans le temps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Évolution des activités</h2>
              <p className="text-sm text-gray-500">Données sur la période sélectionnée</p>
            </div>
            <select 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">12 derniers mois</option>
            </select>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedPeriod === 'week' ? weeklyStats : monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={selectedPeriod === 'week' ? 'date' : 'month'}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderColor: '#e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="runs" 
                  name="Courses" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  fillOpacity={0.6}
                />
                {selectedPeriod === 'month' && (
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    name="Utilisateurs actifs" 
                    stroke="#10b981" 
                    fill="#6ee7b7" 
                    fillOpacity={0.6}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Répartition des utilisateurs</h2>
            <p className="text-sm text-gray-500">Utilisateurs actifs vs inactifs</p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
          <p className="text-sm text-gray-500">Dernières courses enregistrées</p>
        </div>
        
        {userActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userActivity.slice(0, 5).map((activity, index) => (
                  <tr key={activity.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                          {activity.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.user?.name || 'Utilisateur inconnu'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.date ? new Date(activity.date).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistance(activity.distance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round((activity.duration || 0) / 60)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default Stats