import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import api from '../../services/api'

// Données temporaires pour le développement
const tempData = [
  { range: '< 5 km', count: 120, percent: 25 },
  { range: '5-10 km', count: 180, percent: 38 },
  { range: '10-15 km', count: 90, percent: 19 },
  { range: '15-20 km', count: 60, percent: 13 },
  { range: '> 20 km', count: 24, percent: 5 }
]

const PerformanceDistributionChart = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metric, setMetric] = useState('distance') // distance, pace, time
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour obtenir les données réelles
        // const response = await api.stats.getPerformanceMetrics()
        // setData(response.data)
        
        // Utilisation des données temporaires pour le développement
        setData(tempData)
      } catch (err) {
        console.error('Erreur lors du chargement des données du graphique', err)
        setError('Impossible de charger les données du graphique')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [metric])
  
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
            onClick={() => setMetric('distance')}
            className={`px-3 py-1 text-xs font-medium rounded-l-md ${
              metric === 'distance'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Distance
          </button>
          <button
            type="button"
            onClick={() => setMetric('pace')}
            className={`px-3 py-1 text-xs font-medium ${
              metric === 'pace'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Allure
          </button>
          <button
            type="button"
            onClick={() => setMetric('time')}
            className={`px-3 py-1 text-xs font-medium rounded-r-md ${
              metric === 'time'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Durée
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="range" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderColor: '#e5e7eb',
              borderRadius: '0.375rem'
            }}
            formatter={(value, name) => {
              if (name === 'Pourcentage') return `${value}%`
              return value
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="count" 
            name="Nombre de courses" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="percent" 
            name="Pourcentage" 
            fill="#14b8a6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PerformanceDistributionChart