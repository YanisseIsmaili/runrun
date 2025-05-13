// Fichier: src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UsersIcon, 
  ClockIcon, 
  TrendingUpIcon, 
  LocationMarkerIcon 
} from '@heroicons/react/outline'
import api from '../services/api'
import StatCard from '../components/StatCard'
import ActivityChart from '../components/charts/ActivityChart'
import UserActivityTable from '../components/UserActivityTable'
import PerformanceDistributionChart from '../components/charts/PerformanceDistributionChart'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRuns: 0,
    totalDistance: 0,
    averagePace: 0,
    lastWeekRuns: 0,
    lastWeekDistance: 0
  });
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtenir les statistiques globales
        const statsResponse = await api.stats.getGlobal();
        
        // Vérifier la structure de la réponse et extraire les données
        const statsData = statsResponse.data || {};
        
        // Mise à jour des statistiques selon la structure de la réponse de l'API
        setStats({
          totalUsers: statsData.total_users || 0,
          activeUsers: statsData.active_users || 0,
          totalRuns: statsData.total_runs || 0,
          totalDistance: statsData.total_distance || 0,
          averagePace: statsData.average_pace || 0,
          lastWeekRuns: statsData.runs_this_month || 0,
          lastWeekDistance: statsData.distance_this_month || 0
        });
        
        // Simuler des données d'activité pour le développement
        // Dans un environnement de production, remplacez par un appel API réel
        const fakeUserActivity = [
          {
            id: 1,
            user: {
              id: 101,
              name: 'Alexandre Dupont'
            },
            date: new Date(),
            distance: 8.5,
            duration: 42 * 60 + 15, // 42 min 15 sec
          },
          {
            id: 2,
            user: {
              id: 102,
              name: 'Sophie Martin'
            },
            date: new Date(),
            distance: 5.2,
            duration: 25 * 60 + 45, // 25 min 45 sec
          },
          {
            id: 3,
            user: {
              id: 103,
              name: 'Thomas Bernard'
            },
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // hier
            distance: 12.0,
            duration: 65 * 60 + 30, // 1h 5min 30sec
          }
        ];
        
        setUserActivity(fakeUserActivity);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord', err);
        setError('Impossible de charger les données du tableau de bord');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de l'application Running
        </p>
      </div>
      
      {/* Statistiques clés */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Utilisateurs" 
          value={stats.totalUsers} 
          subValue={`${stats.activeUsers} actifs`}
          icon={UsersIcon} 
          iconColor="bg-blue-100 text-blue-600" 
          to="/users"
        />
        <StatCard 
          title="Courses" 
          value={stats.totalRuns} 
          subValue={`${stats.lastWeekRuns} ce mois-ci`}
          icon={ClockIcon} 
          iconColor="bg-green-100 text-green-600" 
          to="/history"
        />
        <StatCard 
          title="Distance" 
          value={`${stats.totalDistance.toLocaleString()} km`} 
          subValue={`${stats.lastWeekDistance.toLocaleString()} km ce mois-ci`}
          icon={LocationMarkerIcon} 
          iconColor="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Allure moyenne" 
          value={`${stats.averagePace || "--:--"} min/km`} 
          subValue="Globale" 
          icon={TrendingUpIcon} 
          iconColor="bg-yellow-100 text-yellow-600" 
        />
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Activité des utilisateurs</h2>
            <select 
              className="form-select text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">12 derniers mois</option>
            </select>
          </div>
          <div className="h-72">
            <ActivityChart dateRange={dateRange} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Distribution des performances</h2>
          <div className="h-72">
            <PerformanceDistributionChart />
          </div>
        </div>
      </div>
      
      {/* Dernière activité */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Dernière activité</h2>
        </div>
        <UserActivityTable data={userActivity} />
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link 
            to="/history" 
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Voir tout l'historique
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard