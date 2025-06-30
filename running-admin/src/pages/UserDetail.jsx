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
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/solid'
import api from '../services/api'

const UserDetail = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  // États React
  const [user, setUser] = useState(null)
  const [originalUser, setOriginalUser] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState('info')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
        setOriginalUser({...userData})

        try {
          const runsResponse = await api.runs.getAll({ user_id: userId })
          console.log('Runs response:', runsResponse)
          
          let runsData = []
          if (runsResponse.data?.status === 'success' && runsResponse.data?.data?.runs) {
            runsData = runsResponse.data.data.runs || runsResponse.data.data || []
          } else if (runsResponse.data?.runs) {
            runsData = runsResponse.data.runs
          } else if (Array.isArray(runsResponse.data)) {
            runsData = runsResponse.data
          }
          
          setRuns(runsData)
        } catch (runsError) {
          console.warn('Erreur lors du chargement des courses:', runsError)
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

  // Gestion de l'upload d'image - CORRECTION
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format non supporté. Utilisez: PNG, JPG, JPEG, GIF, WEBP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 5MB)')
      return
    }

    setUploadLoading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      // CORRECTION: Utiliser l'endpoint avec userId spécifique
      const response = await api.instance.post(`/api/users/${userId}/upload-profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        setUser(prev => ({
          ...prev,
          profile_picture: response.data.data.profile_picture
        }))
        setUploadError(null)
      }
    } catch (error) {
      console.error('Erreur upload image:', error)
      setUploadError(error.response?.data?.message || 'Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadLoading(false)
    }
  }

  // Supprimer l'image de profil - CORRECTION
  const handleDeleteImage = async () => {
    if (!user.profile_picture) return
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette image de profil ?')) {
      return
    }

    setUploadLoading(true)
    setUploadError(null)

    try {
      // CORRECTION: Utiliser l'endpoint avec userId spécifique
      await api.instance.delete(`/api/users/${userId}/upload-profile-image`)
      
      setUser(prev => ({
        ...prev,
        profile_picture: null
      }))
      setUploadError(null)
    } catch (error) {
      console.error('Erreur suppression image:', error)
      setUploadError(error.response?.data?.message || 'Erreur lors de la suppression de l\'image')
    } finally {
      setUploadLoading(false)
    }
  }

  // Gestion de l'édition de champs
  const startEditing = (field) => {
    setEditingField(field)
  }

  const cancelEditing = () => {
    setUser({...originalUser})
    setEditingField(null)
  }

  const saveField = async (field) => {
    setSaving(true)
    try {
      const updateData = {
        [field]: user[field]
      }
      
      const response = await api.users.update(userId, updateData)
      
      if (response.data?.status === 'success') {
        setOriginalUser({...user})
        setEditingField(null)
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      setUser({...originalUser})
      alert('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeleteUser = async () => {
    try {
      await api.users.delete(userId)
      navigate('/users', { 
        state: { message: `L'utilisateur ${user.first_name} ${user.last_name} a été supprimé` } 
      })
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur', err)
      alert('Impossible de supprimer l\'utilisateur: ' + (err.response?.data?.message || err.message))
    }
  }

  // Composant pour champ éditable
  const EditableField = ({ label, field, type = 'text', options = null, className = "" }) => {
    const isEditing = editingField === field
    
    return (
      <div className={`group hover:bg-emerald-50/30 rounded-lg p-3 transition-all duration-300 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">{label}:</span>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                {type === 'select' ? (
                  <select
                    value={user[field]}
                    onChange={(e) => handleInputChange(field, type === 'select' && options ? 
                      (e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value) : 
                      e.target.value
                    )}
                    className="px-3 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    disabled={saving}
                  >
                    {options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    value={user[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="px-3 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    disabled={saving}
                  />
                )}
                <button
                  onClick={() => saveField(field)}
                  disabled={saving}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-900 font-medium">
                  {type === 'select' && options ? 
                    options.find(opt => opt.value === user[field])?.label || 'Non défini' :
                    user[field] || 'Non défini'
                  }
                </span>
                <button
                  onClick={() => startEditing(field)}
                  className="opacity-0 group-hover:opacity-100 text-emerald-600 hover:text-emerald-800 transition-opacity duration-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 text-lg">Chargement du profil utilisateur...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <h3 className="font-bold">Erreur</h3>
            <p>{error}</p>
          </div>
          <Link
            to="/users"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Utilisateur non trouvé</p>
          <Link
            to="/users"
            className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  // Calculer les statistiques
  const stats = {
    totalRuns: runs.length,
    totalDistance: runs.reduce((acc, run) => acc + (run.distance || 0), 0),
    totalTime: runs.reduce((acc, run) => acc + (run.duration || 0), 0),
    avgPace: runs.length > 0 ? 
      runs.reduce((acc, run) => acc + (run.pace || 0), 0) / runs.length : 0
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-green shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/users"
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-emerald-700 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <h1 className="text-3xl font-bold text-emerald-800 text-shadow">
                Profil Utilisateur
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/users/${userId}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistiques en haut */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: ChartBarIcon, label: 'Total Courses', value: stats.totalRuns, color: 'from-blue-500 to-cyan-500', delay: '100ms' },
            { icon: MapPinIcon, label: 'Distance Totale', value: `${(stats.totalDistance / 1000).toFixed(1)} km`, color: 'from-green-500 to-emerald-500', delay: '200ms' },
            { icon: ClockIcon, label: 'Temps Total', value: formatDuration(stats.totalTime), color: 'from-purple-500 to-pink-500', delay: '300ms' },
            { icon: HeartIcon, label: 'Allure Moyenne', value: stats.avgPace ? `${stats.avgPace.toFixed(2)} min/km` : 'N/A', color: 'from-orange-500 to-red-500', delay: '400ms' }
          ].map((stat, index) => (
            <div 
              key={index}
              className="glass-green rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in group"
              style={{ animationDelay: stat.delay }}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-emerald-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-emerald-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne gauche - Profil */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Avatar et photo de profil */}
            <div className="glass-green rounded-2xl p-6 text-center animate-scale-in hover:shadow-xl transition-all duration-500">
              <div className="relative inline-block group">
                <div className="w-32 h-32 mx-auto relative">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={`Photo de ${user.first_name}`}
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <span className="text-4xl font-bold text-white">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute -bottom-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50"
                      title="Changer la photo"
                    >
                      {uploadLoading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <PhotoIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    {user.profile_picture && (
                      <button
                        onClick={handleDeleteImage}
                        disabled={uploadLoading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50"
                        title="Supprimer la photo"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {uploadError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg animate-shake">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              <h2 className="text-xl font-bold text-emerald-800 mt-4">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-emerald-600">@{user.username}</p>
              <p className="text-gray-600 text-sm mt-1">{user.email}</p>
            </div>

            {/* Informations personnelles - Éditables */}
            <div className="glass-green rounded-2xl p-6 animate-slide-in-left hover:shadow-xl transition-all duration-500">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Informations personnelles
              </h3>
              <div className="space-y-2">
                <EditableField label="Prénom" field="first_name" />
                <EditableField label="Nom" field="last_name" />
                <EditableField label="Email" field="email" type="email" />
                <EditableField label="Username" field="username" />
                <EditableField 
                  label="Rôle" 
                  field="is_admin" 
                  type="select"
                  options={[
                    { value: false, label: 'Utilisateur' },
                    { value: true, label: 'Administrateur' }
                  ]}
                />
                <EditableField 
                  label="Statut" 
                  field="is_active" 
                  type="select"
                  options={[
                    { value: true, label: 'Actif' },
                    { value: false, label: 'Inactif' }
                  ]}
                />
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Créé le:</span>
                    <span className="font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non défini'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Dernière connexion:</span>
                    <span className="font-medium">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Courses */}
          <div className="lg:col-span-2">
            <div className="glass-green rounded-2xl p-6 animate-slide-in-right hover:shadow-xl transition-all duration-500">
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Historique des courses ({runs.length})
              </h3>
              
              {runs.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune course enregistrée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Distance</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Durée</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Allure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {runs.slice(0, 10).map((run, index) => (
                        <tr key={run.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">
                            {new Date(run.start_time).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {run.distance ? `${(run.distance / 1000).toFixed(2)} km` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {run.duration ? formatDuration(run.duration) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {run.pace ? `${run.pace.toFixed(2)} min/km` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {runs.length > 10 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        Affichage des 10 dernières courses sur {runs.length}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.first_name} {user.last_name}</strong> ? 
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS complets de Users.jsx */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
        }

        .shadow-green {
          box-shadow: 0 10px 25px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05);
        }

        .shadow-green-lg {
          box-shadow: 0 10px 25px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05);
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
        }

        .alert {
          border-radius: 12px;
          padding: 16px;
          border-width: 1px;
        }

        .alert-warning {
          background-color: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(16, 185, 129, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          background: rgba(16, 185, 129, 0.02);
        }

        .card-body {
          padding: 20px 24px;
        }

        .btn {
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }

        .btn-primary {
          background-color: rgb(16, 185, 129);
          color: white;
          border-color: rgb(16, 185, 129);
        }

        .btn-primary:hover {
          background-color: rgb(5, 150, 105);
          border-color: rgb(5, 150, 105);
        }

        .btn-secondary {
          background-color: transparent;
          border-color: rgb(16, 185, 129);
          color: rgb(16, 185, 129);
        }

        .btn-secondary:hover {
          background-color: rgb(16, 185, 129);
          color: white;
        }

        .btn-success {
          background-color: rgb(34, 197, 94);
          color: white;
          border-color: rgb(34, 197, 94);
        }

        .btn-success:hover {
          background-color: rgb(22, 163, 74);
          border-color: rgb(22, 163, 74);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .badge-success {
          background-color: rgb(34, 197, 94);
          color: white;
        }

        .badge-warning {
          background-color: rgb(251, 191, 36);
          color: rgb(92, 51, 23);
        }

        .badge-danger {
          background-color: rgb(239, 68, 68);
          color: white;
        }

        .badge-secondary {
          background-color: rgb(156, 163, 175);
          color: white;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(16, 185, 129, 0.5);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Input styles neuomorphism light theme */
        .neuro-container {
          display: flex;
          flex-direction: column;
          gap: 7px;
          position: relative;
          color: #4a5568;
        }

        .neuro-container .neuro-label {
          font-size: 14px;
          padding-left: 10px;
          position: absolute;
          top: 13px;
          transition: 0.3s;
          pointer-events: none;
          color: #718096;
        }

        .neuro-input {
          width: 100%;
          height: 40px;
          border: none;
          outline: none;
          padding: 0px 12px;
          border-radius: 8px;
          color: #2d3748;
          font-size: 14px;
          background-color: #f7fafc;
          box-shadow: 
            2px 2px 8px rgba(0,0,0,0.1),
            -2px -2px 8px rgba(255,255,255,0.8);
          transition: all 0.3s ease;
        }

        .neuro-input:focus {
          color: #2d3748;
          box-shadow: 
            inset 2px 2px 8px rgba(0,0,0,0.1),
            inset -2px -2px 8px rgba(255,255,255,0.8);
        }

        .neuro-container .neuro-input:valid ~ .neuro-label,
        .neuro-container .neuro-input:focus ~ .neuro-label {
          transition: 0.3s;
          padding-left: 4px;
          transform: translateY(-28px);
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default UserDetail