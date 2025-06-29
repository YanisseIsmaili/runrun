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

      const response = await api.instance.post('/api/uploads/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
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
      await api.instance.delete('/api/uploads/profile-image')
      
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
                    value={user[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={user[field] || false}
                    onChange={(e) => handleInputChange(field, e.target.checked)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                ) : (
                  <input
                    type={type}
                    value={user[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                    autoFocus
                  />
                )}
                <button
                  onClick={() => saveField(field)}
                  disabled={saving}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-900">
                  {type === 'checkbox' ? (user[field] ? 'Oui' : 'Non') : 
                   type === 'date' && user[field] ? new Date(user[field]).toLocaleDateString('fr-FR') :
                   user[field] || 'Non renseigné'}
                </span>
                <button
                  onClick={() => startEditing(field)}
                  className="opacity-0 group-hover:opacity-100 text-emerald-600 hover:text-emerald-800 transition-all duration-300"
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

  // Calcul des statistiques
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
          <div className="glass-green rounded-2xl p-8 text-center animate-fade-in">
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
          <div className="glass-green rounded-2xl p-8 text-center animate-fade-in">
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
        
        {/* En-tête avec animations */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in hover:shadow-2xl transition-all duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="animate-slide-in-left">
              <Link 
                to="/users" 
                className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800 mb-3 font-medium transition-all duration-300 hover:scale-105"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1 transition-transform duration-300 hover:-translate-x-1" />
                Retour à la liste
              </Link>
              <h1 className="text-3xl font-bold text-emerald-800 bg-gradient-to-r from-emerald-800 to-green-600 bg-clip-text text-transparent">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-emerald-600 mt-1 font-medium">@{user.username}</p>
            </div>
            
            <div className="flex gap-3 animate-slide-in-right">
              <button 
                className="btn px-6 py-3 bg-white text-gray-800 hover:bg-emerald-50 border-2 border-emerald-400 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                onClick={() => navigate(`/users/${userId}/edit`)}
              >
                <PencilIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Modifier
              </button>
              <button 
                className="btn px-6 py-3 bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                onClick={() => setShowDeleteModal(true)}
              >
                <TrashIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides avec animations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: ChartBarIcon, label: 'Courses', value: stats.totalRuns, color: 'from-blue-500 to-cyan-500', delay: '100ms' },
            { icon: MapPinIcon, label: 'Distance', value: `${stats.totalDistance} km`, color: 'from-green-500 to-emerald-500', delay: '200ms' },
            { icon: ClockIcon, label: 'Temps', value: formatDuration(stats.totalDuration), color: 'from-purple-500 to-indigo-500', delay: '300ms' },
            { icon: HeartIcon, label: 'Allure moy.', value: stats.avgPace, color: 'from-orange-500 to-red-500', delay: '400ms' }
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
                    { value: false, label: 'Inactif' },
                    { value: true, label: 'Actif' }
                  ]}
                />
                <EditableField label="Taille (cm)" field="height" type="number" />
                <EditableField label="Poids (kg)" field="weight" type="number" />
                <EditableField label="Date de naissance" field="date_of_birth" type="date" />
              </div>
            </div>

            {/* Informations compte */}
            <div className="glass-green rounded-2xl p-6 animate-slide-in-left hover:shadow-xl transition-all duration-500" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
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
            
            {/* Onglets avec animations */}
            <div className="glass-green rounded-2xl overflow-hidden animate-scale-in hover:shadow-xl transition-all duration-500">
              <div className="flex border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                {[
                  { id: 'info', label: 'Informations', icon: UserIcon },
                  { id: 'runs', label: `Courses (${runs.length})`, icon: MapPinIcon }
                ].map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-6 py-4 font-medium transition-all duration-300 flex items-center space-x-2 hover:scale-105 ${
                      selectedTab === tab.id
                        ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500 shadow-lg'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {selectedTab === 'info' && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-lg font-bold text-emerald-800 mb-4">Vue d'ensemble</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations de base */}
                      <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="card-body">
                          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2" />
                            Profil
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Nom complet:</span> {user.first_name} {user.last_name}</p>
                            <p><span className="font-medium">Email:</span> {user.email}</p>
                            <p><span className="font-medium">Username:</span> @{user.username}</p>
                          </div>
                        </div>
                      </div>

                      {/* Statistiques */}
                      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="card-body">
                          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                            <ChartBarIcon className="h-5 w-5 mr-2" />
                            Activité
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Courses:</span> {stats.totalRuns}</p>
                            <p><span className="font-medium">Distance:</span> {stats.totalDistance} km</p>
                            <p><span className="font-medium">Temps total:</span> {formatDuration(stats.totalDuration)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'runs' && (
                  <div className="space-y-4 animate-fade-in">
                    {runs.length === 0 ? (
                      <div className="text-center py-12">
                        <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune course enregistrée</h3>
                        <p className="text-gray-500">Cet utilisateur n'a pas encore effectué de course.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {runs.map((run, index) => (
                          <div 
                            key={run.id} 
                            className="bg-white bg-opacity-60 rounded-xl p-4 flex items-center justify-between hover:bg-opacity-80 transition-all duration-300 hover:scale-102 hover:shadow-lg animate-slide-in-up group"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
                                <MapPinIcon className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-lg">
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
                              <div className="font-medium text-emerald-600 text-lg">
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

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Supprimer l'utilisateur</h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur 
                <span className="font-semibold text-gray-900"> {user.first_name} {user.last_name}</span> ?
                <br />
                <span className="text-sm text-red-600">Toutes ses données seront perdues.</span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    handleDeleteUser()
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS personnalisés */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .card {
          @apply bg-white rounded-xl p-4 border shadow-sm;
        }

        .card-body {
          @apply space-y-3;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}

export default UserDetail