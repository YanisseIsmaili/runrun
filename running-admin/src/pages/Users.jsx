import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import ErrorMessage from '../components/ErrorMessage'
import { useApiCall } from '../hooks/useErrorHandler'

const Users = () => {
  const navigate = useNavigate()
  
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 10,
    total: 0
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  
  const { callApi, loading, error, retry, clearError } = useApiCall()

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, filters, searchTerm])

  const fetchUsers = async () => {
    await callApi(
      async () => {
        const params = {
          page: pagination.page,
          limit: pagination.per_page,
          search: searchTerm,
          status: filters.status !== 'all' ? filters.status : undefined,
          role: filters.role !== 'all' ? filters.role : undefined
        }
        
        const response = await api.users.getAll(params)
        return response.data
      },
      {
        onSuccess: (data) => {
          setUsers(data.data?.users || data.users || [])
          setPagination(data.data?.pagination || data.pagination || pagination)
        },
        errorMessage: 'Impossible de charger les utilisateurs'
      }
    )
  }

  const handleUserAction = async (action, userId) => {
    await callApi(
      async () => {
        switch (action) {
          case 'activate':
            return await api.users.update(userId, { is_active: true })
          case 'deactivate':
            return await api.users.update(userId, { is_active: false })
          case 'delete':
            return await api.users.delete(userId)
          default:
            throw new Error('Action non reconnue')
        }
      },
      {
        onSuccess: () => {
          fetchUsers()
        },
        errorMessage: `Impossible d'exécuter l'action ${action}`
      }
    )
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Actif</span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Inactif</span>
    )
  }

  const getRoleBadge = (isAdmin) => {
    return isAdmin ? (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Admin</span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Utilisateur</span>
    )
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6">
        <ErrorMessage 
          error={error}
          onRetry={retry}
          onDismiss={clearError}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête avec animations */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-fade-in hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white">
              <UsersIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-800 bg-gradient-to-r from-emerald-800 to-green-600 bg-clip-text text-transparent">
                Gestion des utilisateurs
              </h1>
              <p className="text-emerald-600 font-medium">
                {pagination.total} utilisateur(s) au total
              </p>
            </div>
          </div>
        </div>
        
        {/* Barre d'outils */}
        <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-500">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-12 pr-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                className="btn-secondary px-6 py-3 bg-white hover:bg-emerald-50 border-2 border-emerald-200 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Filtres
              </button>
              
              <button
                className="btn-secondary px-6 py-3 bg-white hover:bg-emerald-50 border-2 border-emerald-200 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                onClick={() => fetchUsers()}
                disabled={loading}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button className="btn-primary px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-600 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <PlusIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Nouvel utilisateur
              </button>
            </div>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-scale-in hover:shadow-2xl transition-all duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select 
                  className="w-full p-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select 
                  className="w-full p-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="all">Tous</option>
                  <option value="admin">Administrateurs</option>
                  <option value="user">Utilisateurs</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  onClick={() => setFilters({ status: 'all', role: 'all' })}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions groupées */}
        {selectedUsers.length > 0 && (
          <div className="glass-green rounded-2xl p-6 shadow-xl animate-slide-in-up hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Activer
                </button>
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Désactiver
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center">
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table des utilisateurs */}
        <div className="glass-green rounded-2xl shadow-xl overflow-hidden animate-scale-in hover:shadow-2xl transition-all duration-500">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id))
                        } else {
                          setSelectedUsers([])
                        }
                      }}
                      checked={selectedUsers.length === users.length && users.length > 0}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-emerald-100">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="ml-3 text-gray-500">Chargement...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-emerald-50/50 transition-all duration-300 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mr-4">
                            <span className="text-sm font-bold text-white">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.is_admin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {formatDate(user.last_login)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-110"
                            title="Voir le détail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-300 hover:scale-110"
                            title="Éditer"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {user.is_active ? (
                            <button
                              onClick={() => handleUserAction('deactivate', user.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Désactiver"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction('activate', user.id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Activer"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-t border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium">
                  Page {pagination.page} sur {pagination.pages}
                </div>
                <div className="flex space-x-3">
                  <button
                    className="px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Précédent
                  </button>
                  <button
                    className="px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles CSS personnalisés */}
      <style jsx>{`
        .glass-green {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Users