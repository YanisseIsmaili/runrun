import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ChevronLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon, 
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/solid'
import api from '../services/api'

// Utilisateur temporaire pour le développement
const tempUser = {
  id: 101,
  username: 'alexandre.dupont',
  email: 'alexandre.dupont@example.com',
  first_name: 'Alexandre',
  last_name: 'Dupont',
  height: 178,
  weight: 72,
  birthdate: '1988-05-12',
  created_at: '2023-01-15',
  is_active: true,
  is_admin: false,
  runs: 37,
  total_distance: 321.5,
  total_duration: 26 * 3600 + 43 * 60, // 26h 43min
  avg_pace: '5:12',
  last_activity: '2024-04-02',
  last_login: '2024-06-28T09:30:00Z'
}

// Courses temporaires pour le développement
const tempRuns = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  date: new Date(2024, 3 - Math.floor(i / 3), 28 - i),
  distance: Math.round((5 + Math.random() * 10) * 10) / 10,
  duration: Math.floor((20 + Math.random() * 40) * 60),
  avg_pace: `${4 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  avg_heart_rate: Math.floor(140 + Math.random() * 30),
  elevation_gain: Math.floor(Math.random() * 200)
}))

const UserDetail = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  // États React correctement déclarés
  const [user, setUser] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState('info')

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes} min`
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par des appels API
        // const userResponse = await api.users.getById(userId)
        // const runsResponse = await api.users.getRuns(userId)
        // setUser(userResponse.data)
        // setRuns(runsResponse.data)
        
        // Simulation d'un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Utilisation des données temporaires
        setUser(tempUser)
        setRuns(tempRuns)
      } catch (err) {
        console.error('Erreur lors du chargement des données utilisateur', err)
        setError('Impossible de charger les informations de l\'utilisateur')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  const handleDeleteUser = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
      try {
        // Dans un projet réel, remplacez ceci par un appel API
        // await api.users.delete(userId)
        
        // Rediriger vers la liste des utilisateurs
        navigate('/users', { 
          state: { message: `L'utilisateur ${user.first_name} ${user.last_name} a été supprimé` } 
        })
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'utilisateur', err)
        alert('Impossible de supprimer l\'utilisateur')
      }
    }
  }
  
  if (loading) {
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-green rounded-2xl p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-green rounded-2xl p-8 text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Utilisateur non trouvé</h3>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link 
                to="/users" 
                className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800 mb-3 font-medium transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Retour à la liste
              </Link>
              <h1 className="text-3xl font-bold text-emerald-800">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-emerald-600 mt-1">@{user.username}</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                className="btn px-6 py-3 bg-white text-gray-800 hover:bg-emerald-50 border-2 border-gray-400 rounded-xl font-semibold transition-all duration-300"
                onClick={() => navigate(`/users/${userId}/edit`)}
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Modifier
              </button>
              <button 
                className="btn px-6 py-3 bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 rounded-xl font-semibold transition-all duration-300"
                onClick={handleDeleteUser}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in-right">
          <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <ChartBarIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-emerald-600">Courses</p>
                <p className="text-2xl font-bold text-emerald-800">{user.runs}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <MapPinIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-emerald-600">Distance</p>
                <p className="text-2xl font-bold text-emerald-800">{user.total_distance} km</p>
              </div>
            </div>
          </div>
          
          <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <ClockIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-emerald-600">Temps</p>
                <p className="text-2xl font-bold text-emerald-800">{formatDuration(user.total_duration)}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <HeartIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-emerald-600">Allure moy.</p>
                <p className="text-2xl font-bold text-emerald-800">{user.avg_pace}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Onglets */}
        <div className="glass-green rounded-2xl shadow-xl overflow-hidden animate-scale-in">
          <div className="border-b border-emerald-200">
            <nav className="flex space-x-8 px-6">
              <button
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'info'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedTab('info')}
              >
                Informations
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'runs'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedTab('runs')}
              >
                Courses récentes
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'stats'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-emerald-700 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedTab('stats')}
              >
                Statistiques
              </button>
            </nav>
          </div>
          
          {/* Contenu de l'onglet */}
          <div className="p-6">
            {selectedTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                    Informations personnelles
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Nom complet:</span>
                      <span className="text-gray-900">{user.first_name} {user.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Username:</span>
                      <span className="text-gray-900">@{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Rôle:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.is_admin ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Statut:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    {user.height && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Taille:</span>
                        <span className="text-gray-900">{user.height} cm</span>
                      </div>
                    )}
                    {user.weight && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Poids:</span>
                        <span className="text-gray-900">{user.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations compte */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2">
                    Informations compte
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Membre depuis:</span>
                      <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Dernière connexion:</span>
                      <span className="text-gray-900">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Dernière activité:</span>
                      <span className="text-gray-900">{new Date(user.last_activity).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'runs' && (
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-6">Courses récentes</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Distance</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Durée</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Allure</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">FC moy.</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Dénivelé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {runs.map((run) => (
                        <tr key={run.id} className="hover:bg-emerald-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {run.date.toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.distance} km
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDuration(run.duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.avg_pace} min/km
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.avg_heart_rate} bpm
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.elevation_gain} m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {selectedTab === 'stats' && (
              <div className="space-y-8">
                <h3 className="text-lg font-bold text-emerald-800 mb-6">Statistiques détaillées</h3>
                
                {/* Cartes de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <ChartBarIcon className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-blue-800">{user.runs}</div>
                    <div className="text-sm text-blue-600">Courses totales</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <MapPinIcon className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-green-800">{user.total_distance} km</div>
                    <div className="text-sm text-green-600">Distance parcourue</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                    <ClockIcon className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-purple-800">{formatDuration(user.total_duration)}</div>
                    <div className="text-sm text-purple-600">Temps total</div>
                  </div>
                </div>

                {/* Graphiques de performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Graphique des distances par mois */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Distance par mois</h4>
                    <div className="h-64 relative">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#e5e7eb" strokeWidth="2"/>
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#e5e7eb" strokeWidth="2"/>
                        
                        {/* Données simulées - Barres */}
                        {[65, 45, 80, 55, 70, 90].map((height, index) => (
                          <g key={index}>
                            <rect
                              x={60 + index * 50}
                              y={180 - height}
                              width="30"
                              height={height}
                              fill={`url(#gradient${index})`}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <text
                              x={75 + index * 50}
                              y={195}
                              textAnchor="middle"
                              className="text-xs fill-gray-600"
                            >
                              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'][index]}
                            </text>
                            <text
                              x={75 + index * 50}
                              y={175 - height}
                              textAnchor="middle"
                              className="text-xs fill-gray-800 font-semibold"
                            >
                              {[45, 32, 58, 39, 51, 67][index]}km
                            </text>
                          </g>
                        ))}
                        
                        {/* Gradients */}
                        <defs>
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <linearGradient key={i} id={`gradient${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          ))}
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Graphique de l'évolution de l'allure */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Évolution de l'allure</h4>
                    <div className="h-64 relative">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#e5e7eb" strokeWidth="2"/>
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#e5e7eb" strokeWidth="2"/>
                        
                        {/* Ligne de tendance */}
                        <path
                          d="M 60,140 L 110,120 L 160,100 L 210,110 L 260,90 L 310,80"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          className="drop-shadow-sm"
                        />
                        
                        {/* Points de données */}
                        {[
                          {x: 60, y: 140, pace: '5:30'},
                          {x: 110, y: 120, pace: '5:15'},
                          {x: 160, y: 100, pace: '5:00'},
                          {x: 210, y: 110, pace: '5:05'},
                          {x: 260, y: 90, pace: '4:55'},
                          {x: 310, y: 80, pace: '4:45'}
                        ].map((point, index) => (
                          <g key={index}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="6"
                              fill="#3b82f6"
                              className="hover:r-8 transition-all cursor-pointer drop-shadow-lg"
                            />
                            <text
                              x={point.x}
                              y={point.y - 15}
                              textAnchor="middle"
                              className="text-xs fill-gray-800 font-semibold"
                            >
                              {point.pace}
                            </text>
                            <text
                              x={point.x}
                              y={195}
                              textAnchor="middle"
                              className="text-xs fill-gray-600"
                            >
                              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'][index]}
                            </text>
                          </g>
                        ))}
                        
                        {/* Zone de remplissage sous la courbe */}
                        <path
                          d="M 60,140 L 110,120 L 160,100 L 210,110 L 260,90 L 310,80 L 310,180 L 60,180 Z"
                          fill="url(#blueGradient)"
                          opacity="0.2"
                        />
                        
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#93c5fd" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Graphique circulaire des types d'activités */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Répartition des activités</h4>
                    <div className="h-64 flex items-center justify-center">
                      <svg className="w-48 h-48" viewBox="0 0 200 200">
                        {/* Cercle de base */}
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20"/>
                        
                        {/* Segments - Course à pied (70%) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="20"
                          strokeDasharray="351.86 502.65"
                          strokeDashoffset="125.66"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-1000 hover:stroke-width-25"
                        />
                        
                        {/* Segments - Trail (20%) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="20"
                          strokeDasharray="100.53 502.65"
                          strokeDashoffset="-226.19"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-1000 hover:stroke-width-25"
                        />
                        
                        {/* Segments - Autres (10%) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="20"
                          strokeDasharray="50.27 502.65"
                          strokeDashoffset="-326.73"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-1000 hover:stroke-width-25"
                        />
                        
                        {/* Texte central */}
                        <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                          {user.runs}
                        </text>
                        <text x="100" y="115" textAnchor="middle" className="text-sm fill-gray-600">
                          courses
                        </text>
                      </svg>
                    </div>
                    
                    {/* Légende */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-emerald-500 rounded mr-2"></div>
                          <span className="text-sm text-gray-700">Course à pied</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">70%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
                          <span className="text-sm text-gray-700">Trail</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                          <span className="text-sm text-gray-700">Autres</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">10%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progression mensuelle */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Progression ce mois</h4>
                    <div className="space-y-4">
                      
                      {/* Distance */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Distance</span>
                          <span className="text-sm font-semibold text-emerald-600">67km / 80km</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-1000"
                            style={{width: '84%'}}
                          ></div>
                        </div>
                      </div>

                      {/* Nombre de courses */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Courses</span>
                          <span className="text-sm font-semibold text-blue-600">12 / 15</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000"
                            style={{width: '80%'}}
                          ></div>
                        </div>
                      </div>

                      {/* Temps total */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Temps</span>
                          <span className="text-sm font-semibold text-purple-600">5h30 / 7h00</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-400 h-3 rounded-full transition-all duration-1000"
                            style={{width: '79%'}}
                          ></div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Graphique des performances par semaine */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-6">Performances des 12 dernières semaines</h4>
                  <div className="h-80 relative">
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      {/* Grille de fond */}
                      <defs>
                        <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Axes */}
                      <line x1="60" y1="40" x2="60" y2="260" stroke="#374151" strokeWidth="2"/>
                      <line x1="60" y1="260" x2="740" y2="260" stroke="#374151" strokeWidth="2"/>
                      
                      {/* Courbe de distance */}
                      <path
                        d="M 80,200 Q 130,180 180,160 T 280,140 T 380,130 T 480,120 T 580,110 T 680,100"
                        stroke="#10b981"
                        strokeWidth="4"
                        fill="none"
                        className="drop-shadow-lg"
                      />
                      
                      {/* Zone sous la courbe */}
                      <path
                        d="M 80,200 Q 130,180 180,160 T 280,140 T 380,130 T 480,120 T 580,110 T 680,100 L 680,260 L 80,260 Z"
                        fill="url(#greenGradient)"
                        opacity="0.3"
                      />
                      
                      {/* Points de données avec valeurs */}
                      {[
                        {x: 80, y: 200, value: '15km'},
                        {x: 180, y: 160, value: '22km'},
                        {x: 280, y: 140, value: '28km'},
                        {x: 380, y: 130, value: '31km'},
                        {x: 480, y: 120, value: '35km'},
                        {x: 580, y: 110, value: '38km'},
                        {x: 680, y: 100, value: '42km'}
                      ].map((point, index) => (
                        <g key={index}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="8"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="3"
                            className="hover:r-10 transition-all cursor-pointer drop-shadow-lg"
                          />
                          <text
                            x={point.x}
                            y={point.y - 20}
                            textAnchor="middle"
                            className="text-sm fill-gray-800 font-semibold"
                          >
                            {point.value}
                          </text>
                        </g>
                      ))}
                      
                      {/* Labels des semaines */}
                      {['S-6', 'S-5', 'S-4', 'S-3', 'S-2', 'S-1', 'Cette sem.'].map((week, index) => (
                        <text
                          key={index}
                          x={80 + index * 100}
                          y={280}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {week}
                        </text>
                      ))}
                      
                      <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#d1fae5" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetail