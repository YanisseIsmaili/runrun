import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ChevronLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon, 
  MapPinIcon,
  CalendarIcon
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
  runs: 37,
  total_distance: 321.5,
  total_duration: 26 * 3600 + 43 * 60, // 26h 43min
  avg_pace: '5:12',
  last_activity: '2024-04-02'
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
  const [user, setUser] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState('info') // 'info', 'runs', 'stats'
  
    (() => {
    const fetchUserData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par des appels API pour obtenir les données réelles
        // const userResponse = await api.users.getById(userId)
        // const runsResponse = await api.users.getRuns(userId)
        // setUser(userResponse.data)
        // setRuns(runsResponse.data)
        
        // Utilisation des données temporaires pour le développement
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
  
  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Formatage de la durée (secondes -> format HH:MM:SS)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours}h ${minutes}min ${secs}s`
  }
  
  // Formatage de l'âge à partir de la date de naissance
  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
  
  // Fonction pour supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour supprimer l'utilisateur
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
  
  if (!user) {
    return <div>Utilisateur non trouvé</div>
  }
  
  return (
    <div>
      {/* En-tête */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link to="/users" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Retour à la liste
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user.first_name} {user.last_name}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(`/users/${userId}/edit`)}
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Modifier
          </button>
          <button 
            className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            onClick={handleDeleteUser}
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Supprimer
          </button>
        </div>
      </div>
      
      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              selectedTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setSelectedTab('info')}
          >
            Informations
          </button>
          <button
            className={`${
              selectedTab === 'runs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setSelectedTab('runs')}
          >
            Courses
          </button>
          <button
            className={`${
              selectedTab === 'stats'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setSelectedTab('stats')}
          >
            Statistiques
          </button>
        </nav>
      </div>
      
      {/* Contenu de l'onglet */}
      {selectedTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="md:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Informations personnelles</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Détails du profil utilisateur</p>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {user.first_name} {user.last_name}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nom d'utilisateur</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.username}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Âge</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {calculateAge(user.birthdate)} ans (né le {formatDate(user.birthdate)})
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Taille</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.height} cm</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Poids</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.weight} kg</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Membre depuis</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(user.created_at)}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Dernière activité</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(user.last_activity)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          
          {/* Statistiques résumées */}
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé d'activité</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre de courses</p>
                    <p className="text-xl font-semibold">{user.runs}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <LocationMarkerIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Distance totale</p>
                    <p className="text-xl font-semibold">{user.total_distance} km</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <CalendarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Temps total</p>
                    <p className="text-xl font-semibold">{formatDuration(user.total_duration)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Allure moyenne</p>
                    <p className="text-xl font-semibold">{user.avg_pace} min/km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedTab === 'runs' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Historique des courses</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Courses enregistrées par {user.first_name}
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FC moyenne
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dénivelé
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.date.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.distance} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(run.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.avg_pace} min/km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.avg_heart_rate} bpm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.elevation_gain} m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/history/${run.id}`} className="text-primary-600 hover:text-primary-900">
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedTab === 'stats' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques détaillées</h3>
          <p className="text-gray-500 mb-6">Visualisation des performances de l'utilisateur</p>
          
          <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Graphiques de statistiques à implémenter</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDetail