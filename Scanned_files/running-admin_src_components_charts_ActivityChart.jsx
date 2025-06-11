import { useState, useEffect } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import api from '../../services/api'

// Données temporaires pour le développement
const tempData = {
  week: [
    { date: 'Lun', runs: 15, users: 12, distance: 75 },
    { date: 'Mar', runs: 20, users: 15, distance: 110 },
    { date: 'Mer', runs: 18, users: 14, distance: 95 },
    { date: 'Jeu', runs: 25, users: 18, distance: 140 },
    { date: 'Ven', runs: 30, users: 22, distance: 170 },
    { date: 'Sam', runs: 45, users: 30, distance: 290 },
    { date: 'Dim', runs: 40, users: 25, distance: 250 },
  ],
  month: [
    { date: 'Sem 1', runs: 120, users: 55, distance: 650 },
    { date: 'Sem 2', runs: 135, users: 60, distance: 710 },
    { date: 'Sem 3', runs: 150, users: 65, distance: 780 },
    { date: 'Sem 4', runs: 145, users: 63, distance: 740 },
  ],
  year: [
    { date: 'Jan', runs: 450, users: 120, distance: 2500 },
    { date: 'Fév', runs: 480, users: 130, distance: 2700 },
    { date: 'Mar', runs: 520, users: 140, distance: 3000 },
    { date: 'Avr', runs: 540, users: 145, distance: 3100 },
    { date: 'Mai', runs: 570, users: 150, distance: 3300 },
    { date: 'Juin', runs: 600, users: 155, distance: 3500 },
    { date: 'Juil', runs: 620, users: 160, distance: 3700 },
    { date: 'Août', runs: 580, users: 150, distance: 3400 },
    { date: 'Sep', runs: 600, users: 155, distance: 3500 },
    { date: 'Oct', runs: 630, users: 160, distance: 3800 },
    { date: 'Nov', runs: 650, users: 165, distance: 4000 },
    { date: 'Déc', runs: 530, users: 140, distance: 3200 },
  ]
}

const ActivityChart = ({ dateRange = 'month' }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metric, setMetric] = useState('users') // users, runs, distance
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour obtenir les données réelles
        // const response = await api.stats.getByPeriod(startDate, endDate)
        // setData(response.data)
        
        // Utilisation des données temporaires pour le développement
        setData(tempData[dateRange])
      } catch (err) {
        console.error('Erreur lors du chargement des données du graphique', err)
        setError('Impossible de charger les données du graphique')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [dateRange])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        {error}
      </div>
    )
  }
  
  return (
    <div className="h-full">
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setMetric('users')}
            className={`px-3 py-1 text-xs font-medium rounded-l-md ${
              metric === 'users'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Utilisateurs
          </button>
          <button
            type="button"
            onClick={() => setMetric('runs')}
            className={`px-3 py-1 text-xs font-medium ${
              metric === 'runs'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => setMetric('distance')}
            className={`px-3 py-1 text-xs font-medium rounded-r-md ${
              metric === 'distance'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Distance
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderColor: '#e5e7eb',
              borderRadius: '0.375rem'
            }}
          />
          {metric === 'users' && (
            <Area 
              type="monotone" 
              dataKey="users" 
              name="Utilisateurs" 
              stroke="#3b82f6" 
              fill="#93c5fd" 
              fillOpacity={0.5}
            />
          )}
          {metric === 'runs' && (
            <Area 
              type="monotone" 
              dataKey="runs" 
              name="Courses" 
              stroke="#10b981" 
              fill="#6ee7b7" 
              fillOpacity={0.5}
            />
          )}
          {metric === 'distance' && (
            <Area 
              type="monotone" 
              dataKey="distance" 
              name="Distance (km)" 
              stroke="#8b5cf6" 
              fill="#c4b5fd" 
              fillOpacity={0.5}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityChart