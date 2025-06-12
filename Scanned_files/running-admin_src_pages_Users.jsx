// running-admin/src/pages/Users.jsx
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
  XMarkIcon
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
        try {
          const params = {
            page: pagination.page,
            limit: pagination.per_page,
            search: searchTerm,
            status: filters.status !== 'all' ? filters.status : undefined,
            role: filters.role !== 'all' ? filters.role : undefined
          }
          
          const response = await api.users.getAll(params)
          return response.data
        } catch (apiError) {
          // Données de simulation
          return {
            status: 'success',
            data: {
              users: [
                {
                  id: 1,
                  username: 'admin',
                  email: 'admin@running.com',
                  first_name: 'Administrateur',
                  last_name: 'Système',
                  is_admin: true,
                  is_active: true,
                  created_at: '2024-01-15T10:00:00Z',
                  last_login: '2024-06-12T08:00:00Z'
                },
                {
                  id: 2,
                  username: 'marie.dupont',
                  email: 'marie.dupont@email.com',
                  first_name: 'Marie',
                  last_name: 'Dupont',
                  is_admin: false,
                  is_active: true,
                  created_at: '2024-02-20T14:30:00Z',
                  last_login: '2024-06-11T19:45:00Z'
                },
                {
                  id: 3,
                  username: 'pierre.martin',
                  email: 'pierre.martin@email.com',
                  first_name: 'Pierre',
                  last_name: 'Martin',
                  is_admin: false,
                  is_active: false,
                  created_at: '2024-03-10T09:15:00Z',
                  last_login: '2024-05-20T16:20:00Z'
                }
              ],
              pagination: {
                page: 1,
                pages: 1,
                per_page: 10,
                total: 3
              }
            }
          }
        }
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
      <span className="badge badge-success">Actif</span>
    ) : (
      <span className="badge badge-secondary">Inactif</span>
    )
  }

  const getRoleBadge = (isAdmin) => {
    return isAdmin ? (
      <span className="badge badge-warning">Admin</span>
    ) : (
      <span className="badge badge-primary">Utilisateur</span>
    )
  }

  if (error && !users.length) {
    return (
      <div className="p-6">
        <ErrorMessage 
          error={error}
          onRetry={retry}
          onDismiss={clearError}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination.total} utilisateur(s) au total
        </p>
      </div>
      
      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          <button className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Statut</label>
                <select 
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Rôle</label>
                <select 
                  className="form-select"
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
                  className="btn btn-secondary"
                  onClick={() => setFilters({ status: 'all', role: 'all' })}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions groupées */}
      {selectedUsers.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-success">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Activer
                </button>
                <button className="btn btn-sm btn-secondary">
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Désactiver
                </button>
                <button className="btn btn-sm btn-danger">
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table des utilisateurs */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">
                  <input
                    type="checkbox"
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
                <th className="table-header-cell">Utilisateur</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Rôle</th>
                <th className="table-header-cell">Statut</th>
                <th className="table-header-cell">Dernière connexion</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Chargement...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">
                      {getRoleBadge(user.is_admin)}
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {formatDate(user.last_login)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir le détail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {user.is_active ? (
                          <button
                            onClick={() => handleUserAction('deactivate', user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Désactiver"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction('activate', user.id)}
                            className="text-green-600 hover:text-green-800"
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
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Précédent
                </button>
                <button
                  className="btn btn-sm btn-secondary"
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
  )
}

export default Users