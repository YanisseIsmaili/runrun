import { useState, useEffect, useRef } from 'react'
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
  FireIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/solid'
import api from '../services/api'

const UserDetail = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  // États React
  const [user, setUser] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState('info')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

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
        // Récupération des données utilisateur
        const userResponse = await api.users.getById(userId)
        console.log('User response:', userResponse)
        
        let userData = null
        if (userResponse.data?.status === 'success' && userResponse.data?.data) {
          userData = userResponse.data.data
        } else if (userResponse.data?.user) {
          userData = userResponse.data.user
        } else {
          userData = userResponse.data
        }
        
        setUser(userData)

        // Récupération des courses de l'utilisateur
        try {
          const runsResponse = await api.runs.getAll({ user_id: userId })
          console.log('Runs response:', runsResponse)
          
          let runsData = []
          if (runsResponse.data?.status === 'success' && runsResponse.data?.data) {
            runsData = runsResponse.data.data.runs || runsResponse.data.data || []
          } else if (runsResponse.data?.runs) {
            runsData = runsResponse.data.runs
          } else if (Array.isArray(runsResponse.data)) {
            runsData = runsResponse.data
          }
          
          setRuns(runsData)
        } catch (runsError) {
          console.warn('Erreur lors du chargement des courses:', runsError)
          // Si l'endpoint des courses n'existe pas, on continue sans les courses
          setRuns([])
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement des données utilisateur:', err)
        setError(err.response?.data?.message || 'Impossible de charger les informations de l\'utilisateur')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId])

  // Gestion de l'upload d'image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validation du fichier
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format non supporté. Utilisez: PNG, JPG, JPEG, GIF, WEBP')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setUploadError('Fichier trop volumineux (max 5MB)')
      return
    }

    setUploadLoading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      // Appel API pour upload via l'endpoint upload existant
      const response = await api.instance.post('/api/uploads/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        // Mettre à jour l'utilisateur avec la nouvelle image
        setUser(prev => ({
          ...prev,
          profile_picture: response.data.data.profile_picture
        }))
      }
    } catch (error) {
      console.error('Erreur upload image:', error)
      setUploadError(error.response?.data?.message || 'Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadLoading(false)
    }
  }

  // Supprimer l'image de profil
  const handleDeleteImage = async () => {
    if (!user.profile_picture) return
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image de profil ?')) {
      return
    }

    setUploadLoading(true)
    setUploadError(null)

    try {
      // Appel API pour supprimer l'image
      await api.instance.delete('/api/uploads/profile-image')
      
      // Mettre à jour l'utilisateur
      setUser(prev => ({
        ...prev,
        profile_picture: null
      }))
    } catch (error) {
      console.error('Erreur suppression image:', error)
      setUploadError(error.response?.data?.message || 'Erreur lors de la suppression de l\'image')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
      try {
        await api.delete(`/api/admin/users/${userId}`)
        navigate('/users', { 
          state: { message: `L'utilisateur ${user.first_name} ${user.last_name} a été supprimé` } 
        })
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'utilisateur', err)
        alert('Impossible de supprimer l\'utilisateur: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  // Calcul des statistiques utilisateur
  const getStats = () => {
    if (!runs.length) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 'N/A'
      }
    }

    const totalDistance = runs.reduce((sum, run) => sum + (run.distance || 0), 0)
    const totalDuration = runs.reduce((sum, run) => sum + (run.duration || 0), 0)
    const avgPace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0

    return {
      totalRuns: runs.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration,
      avgPace: avgPace > 0 ? `${Math.floor(avgPace)}:${Math.round((avgPace % 1) * 60).toString().padStart(2, '0')}` : 'N/A'
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

  const stats = getStats()
  
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

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne gauche - Profil */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Avatar et photo de profil */}
            <div className="glass-green rounded-2xl p-6 text-center">
              <div className="relative inline-block">
                {/* Avatar ou photo */}
                <div className="w-32 h-32 mx-auto relative">
                  {user.profile_picture ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/uploads/profiles/${user.profile_picture.split('/').pop()}`}
                      alt={`Photo de ${user.first_name}`}
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-4xl font-bold text-white">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  
                  {/* Boutons d'action pour l'image */}
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                      title="Changer la photo"
                    >
                      {uploadLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <PhotoIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    {user.profile_picture && (
                      <button
                        onClick={handleDeleteImage}
                        disabled={uploadLoading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                        title="Supprimer la photo"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Input file caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* Messages d'erreur pour l'upload */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              <h2 className="text-xl font-bold text-emerald-800 mt-4">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-emerald-600">@{user.username}</p>
              <p className="text-gray-600 text-sm mt-1">{user.email}</p>
            </div>

            {/* Informations personnelles */}
            <div className="glass-green rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4">
                Informations personnelles
              </h3>
              <div className="space-y-4">
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
                {user.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Date de naissance:</span>
                    <span className="text-gray-900">{new Date(user.date_of_birth).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations compte */}
            <div className="glass-green rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4">
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
                    {user.last_login ? 
                      new Date(user.last_login).toLocaleDateString('fr-FR') : 
                      'Jamais'
                    }
                  </span>
                </div>
                {user.updated_at && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Dernière mise à jour:</span>
                    <span className="text-gray-900">{new Date(user.updated_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite - Statistiques et activités */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Statistiques de course */}
            <div className="glass-green rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-6">
                Statistiques de course
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white bg-opacity-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{stats.totalRuns}</div>
                  <div className="text-sm text-gray-600">Courses</div>
                </div>
                <div className="text-center p-4 bg-white bg-opacity-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{stats.totalDistance} km</div>
                  <div className="text-sm text-gray-600">Distance totale</div>
                </div>
                <div className="text-center p-4 bg-white bg-opacity-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{formatDuration(stats.totalDuration)}</div>
                  <div className="text-sm text-gray-600">Temps total</div>
                </div>
                <div className="text-center p-4 bg-white bg-opacity-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{stats.avgPace}</div>
                  <div className="text-sm text-gray-600">Allure moyenne</div>
                </div>
              </div>
            </div>

            {/* Onglets */}
            <div className="glass-green rounded-2xl overflow-hidden">
              <div className="flex border-b border-emerald-200">
                <button
                  onClick={() => setSelectedTab('info')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    selectedTab === 'info'
                      ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setSelectedTab('runs')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    selectedTab === 'runs'
                      ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  Historique des courses ({runs.length})
                </button>
              </div>

              <div className="p-6">
                {selectedTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <div className="text-gray-900">{user.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nom d'utilisateur</label>
                        <div className="text-gray-900">@{user.username}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Prénom</label>
                        <div className="text-gray-900">{user.first_name || 'Non renseigné'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                        <div className="text-gray-900">{user.last_name || 'Non renseigné'}</div>
                      </div>
                      {user.date_of_birth && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Date de naissance</label>
                          <div className="text-gray-900">{new Date(user.date_of_birth).toLocaleDateString('fr-FR')}</div>
                        </div>
                      )}
                      {user.height && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Taille</label>
                          <div className="text-gray-900">{user.height} cm</div>
                        </div>
                      )}
                      {user.weight && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Poids</label>
                          <div className="text-gray-900">{user.weight} kg</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'runs' && (
                  <div className="space-y-4">
                    {runs.length === 0 ? (
                      <div className="text-center py-8">
                        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune course enregistrée</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {runs.map((run) => (
                          <div key={run.id} className="bg-white bg-opacity-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-emerald-100 p-2 rounded-lg">
                                <MapPinIcon className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {run.distance} km
                                </div>
                                <div className="text-sm text-gray-500 flex items-center space-x-4">
                                  <span className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    {formatDuration(run.duration)}
                                  </span>
                                  {run.avg_heart_rate && (
                                    <span className="flex items-center">
                                      <HeartIcon className="h-4 w-4 mr-1" />
                                      {run.avg_heart_rate} bpm
                                    </span>
                                  )}
                                  {run.elevation_gain > 0 && (
                                    <span className="flex items-center">
                                      <FireIcon className="h-4 w-4 mr-1" />
                                      {run.elevation_gain}m D+
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-emerald-600">
                                {run.avg_pace || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(run.date || run.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetail