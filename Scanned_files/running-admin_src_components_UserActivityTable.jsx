import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Données temporaires pour le développement
const tempData = [
  {
    id: 1,
    user: {
      id: 101,
      name: 'Alexandre Dupont',
      avatar: null
    },
    type: 'run',
    distance: 8.5,
    duration: 42 * 60 + 15, // 42 min 15 sec
    date: new Date(2024, 3, 1, 18, 30)
  },
  {
    id: 2,
    user: {
      id: 102,
      name: 'Sophie Martin',
      avatar: null
    },
    type: 'run',
    distance: 5.2,
    duration: 25 * 60 + 45, // 25 min 45 sec
    date: new Date(2024, 3, 1, 7, 15)
  },
  {
    id: 3,
    user: {
      id: 103,
      name: 'Thomas Bernard',
      avatar: null
    },
    type: 'run',
    distance: 12.0,
    duration: 65 * 60 + 30, // 1h 5min 30sec
    date: new Date(2024, 2, 31, 10, 0)
  },
  {
    id: 4,
    user: {
      id: 104,
      name: 'Julie Leclerc',
      avatar: null
    },
    type: 'run',
    distance: 3.5,
    duration: 20 * 60 + 10, // 20 min 10 sec
    date: new Date(2024, 2, 31, 19, 45)
  },
  {
    id: 5,
    user: {
      id: 101,
      name: 'Alexandre Dupont',
      avatar: null
    },
    type: 'run',
    distance: 7.8,
    duration: 38 * 60 + 50, // 38 min 50 sec
    date: new Date(2024, 2, 30, 17, 0)
  }
]

// Formatage du temps (secondes -> format MM:SS ou HH:MM:SS)
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Calcul de l'allure (min/km)
const calculatePace = (seconds, distance) => {
  if (!distance) return '-'
  
  const paceSeconds = seconds / distance
  const paceMinutes = Math.floor(paceSeconds / 60)
  const paceSecs = Math.floor(paceSeconds % 60)
  
  return `${paceMinutes}:${paceSecs.toString().padStart(2, '0')}`
}

const UserActivityTable = ({ data = tempData }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Utilisateur
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durée
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Allure
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((activity) => (
            <tr key={activity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {activity.user.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <Link to={`/users/${activity.user.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                      {activity.user.name}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(activity.date, 'PPp', { locale: fr })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.distance.toFixed(1)} km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDuration(activity.duration)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {calculatePace(activity.duration, activity.distance)} min/km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link to={`/history/${activity.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                  Détails
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserActivityTable