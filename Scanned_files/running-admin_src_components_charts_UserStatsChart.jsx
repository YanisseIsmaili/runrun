import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Données de démonstration
const tempData = {
  weekly: [
    { date: 'Semaine 1', distance: 15.2, duration: 90, pace: 5.92 },
    { date: 'Semaine 2', distance: 18.7, duration: 105, pace: 5.61 },
    { date: 'Semaine 3', distance: 22.3, duration: 125, pace: 5.6 },
    { date: 'Semaine 4', distance: 25.1, duration: 140, pace: 5.58 },
    { date: 'Semaine 5', distance: 20.5, duration: 115, pace: 5.61 },
    { date: 'Semaine 6', distance: 28.4, duration: 158, pace: 5.56 },
    { date: 'Semaine 7', distance: 31.2, duration: 172, pace: 5.51 },
    { date: 'Semaine 8', distance: 26.8, duration: 143, pace: 5.34 },
  ],
  monthly: [
    { date: 'Jan', distance: 85.4, duration: 480, pace: 5.62 },
    { date: 'Fév', distance: 92.7, duration: 515, pace: 5.55 },
    { date: 'Mar', distance: 107.3, duration: 590, pace: 5.5 },
    { date: 'Avr', distance: 115.1, duration: 625, pace: 5.43 },
    { date: 'Mai', distance: 120.5, duration: 650, pace: 5.39 },
    { date: 'Juin', distance: 98.4, duration: 540, pace: 5.49 },
  ]
};

const UserStatsChart = ({ userId }) => {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly');
  const [statType, setStatType] = useState('distance');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulation de chargement des données
    setLoading(true);
    
    // Dans une application réelle, vous feriez un appel API ici
    // api.users.getStats(userId, timeRange)
    //   .then(response => setData(response.data))
    
    // Utiliser les données de démonstration pour l'exemple
    setTimeout(() => {
      setData(tempData[timeRange]);
      setLoading(false);
    }, 500);
  }, [userId, timeRange]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const formatYAxis = (value) => {
    if (statType === 'distance') return `${value} km`;
    if (statType === 'duration') return `${value} min`;
    if (statType === 'pace') return `${value} min/km`;
    return value;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setStatType('distance')}
            className={`px-3 py-1 text-xs font-medium rounded-l-md ${
              statType === 'distance'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Distance
          </button>
          <button
            type="button"
            onClick={() => setStatType('duration')}
            className={`px-3 py-1 text-xs font-medium ${
              statType === 'duration'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Durée
          </button>
          <button
            type="button"
            onClick={() => setStatType('pace')}
            className={`px-3 py-1 text-xs font-medium rounded-r-md ${
              statType === 'pace'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300`}
          >
            Allure
          </button>
        </div>
        
        <select
          className="form-select py-1 px-2 text-xs rounded-md border-gray-300"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuel</option>
        </select>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {statType === 'pace' ? (
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
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
                tickFormatter={formatYAxis}
              />
              <Tooltip 
                formatter={(value) => [formatYAxis(value), statType === 'pace' ? 'Allure moyenne' : '']}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '0.375rem' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="pace" 
                name="Allure moyenne" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ fill: '#7c3aed', r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
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
                tickFormatter={formatYAxis}
              />
              <Tooltip 
                formatter={(value) => [
                  formatYAxis(value), 
                  statType === 'distance' ? 'Distance' : 'Durée'
                ]}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', borderRadius: '0.375rem' }}
              />
              <Legend />
              <Bar 
                dataKey={statType} 
                name={statType === 'distance' ? 'Distance' : 'Durée'} 
                fill={statType === 'distance' ? '#3b82f6' : '#10b981'} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserStatsChart;