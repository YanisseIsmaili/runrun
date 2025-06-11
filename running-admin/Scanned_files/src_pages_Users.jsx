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
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import UserModal from '../components/UserModal'
import ErrorMessage from '../components/ErrorMessage'
import { useApiCall } from '../hooks/useErrorHandler'

const Users = () => {
  const navigate = useNavigate()
  
  // États principaux
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    per_page: 10,
    total: 0
  })
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all'
  })
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  
  // États pour les modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // États pour les sélections multiples
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // États pour l'interface
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  
  const { callApi, loading, error, retry, clearError } = useApiCall()

  // Effet pour le chargement initial
  useEffect(() => {
    fetchUsers()
  }, [pagination.page, filters, sortField, sortDirection, searchTerm])

  // Effet pour l'auto-refresh
  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchUsers(false) // Ne pas montrer le loading lors de l'auto-refresh
      }, refreshInterval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, pagination.page, filters, sortField, sortDirection, searchTerm])

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = async (showLoading = true) => {
    const params = {
      page: pagination.page,
      limit: pagination.per_page,
      search: searchTerm,
      status: filters.status !== 'all' ? filters.status : undefined,
      role: filters.role !== 'all' ? filters.role : undefined,
      sort_by: sortField,
      sort_order: sortDirection
    }

    await callApi(
      async () => {
        const response = await api.users.getAll(params)
        return response.data
      },
      {
        onSuccess: (data) => {
          setUsers(data.users || [])
          setPagination(data.pagination || pagination)
        },
        errorMessage: 'Impossible de charger les utilisateurs',
        showLoading
      }
    )
  }

  // Gestion du tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Gestion de la sélection multiple
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  // Actions sur les utilisateurs
  const handleAddUser = () => {
    setSelectedUser(null)
    setShowAddModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleCreateUser = async (userData) => {
    await callApi(
      async () => {
        const response = await api.users.create(userData)
        return response.data
      },
      {
        onSuccess: (data) => {
          setUsers(prevUsers => [data.data, ...prevUsers])
          setShowAddModal(false)
          // Actualiser la liste pour s'assurer de la cohérence
          setTimeout(() => fetchUsers(), 500)
        },
        errorMessage: 'Impossible de créer l\'utilisateur'
      }
    )
  }

  const handleUpdateUser = async (userData) => {
    await callApi(
      async () => {
        const response = await api.users.update(selectedUser.id, userData)
        return response.data
      },
      {
        onSuccess: (data) => {
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === selectedUser.id ? data.data : user
            )
          )
          setShowEditModal(false)
          setSelectedUser(null)
        },
        errorMessage: 'Impossible de modifier l\'utilisateur'
      }
    )
  }

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId)
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user?.username}" ?`)) {
      return
    }

    await callApi(
      async () => {
        await api.users.delete(userId)
      },
      {
        onSuccess: () => {
          setUsers(users.filter(user => user.id !== userId))
          setSelectedUsers(selectedUsers.filter(id => id !== userId))
        },
        errorMessage: 'Impossible de supprimer l\'utilisateur'
      }
    )
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Supprimer ${selectedUsers.length} utilisateur(s) sélectionné(s) ?`)) {
      return
    }

    await callApi(
      async () => {
        const response = await api.users.bulkDelete(selectedUsers)
        return response.data
      },
      {
        onSuccess: (data) => {
          setUsers(users.filter(user => !selectedUsers.includes(user.id)))
          setSelectedUsers([])
          setSelectAll(false)
          // Afficher un message de résultat
          if (data.details) {
            console.log('Résultat suppression:', data.details)
          }
        },
        errorMessage: 'Erreur lors de la suppression en lot'
      }
    )
  }

  // Export des données
  const handleExportUsers = async () => {
    await callApi(
      async () => {
        const response = await api.users.export({ 
          format: 'csv', 
          include_stats: true 
        })
        
        // Télécharger le fichier
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },
      {
        errorMessage: 'Impossible d\'exporter les utilisateurs'
      }
    )
  }

  // Composant de filtres
  const FiltersPanel = () => (
    <div className={`${showFilters ? 'block' : 'hidden'} bg-gray-50 p-4 rounded-lg mb-4`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
          <select 
            className="form-select"
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
          >
            <option value="all">Tous</option>
            <option value="admin">Administrateurs</option>
            <option value="user">Utilisateurs</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auto-refresh</label>
          <div className="flex items-center space-x-2">
            <button
              className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Activé' : 'Désactivé'}
            </button>
            {autoRefresh && (
              <select 
                className="form-select text-sm"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1min</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Interface de gestion d'erreur
  if (error && !users.length) {
    return (
      <div className="p-6">
        <ErrorMessage 
          message={error} 
          onRetry={retry}
          onDismiss={clearError}
        />
      </div>
    )
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination.total} utilisateur(s) au total
        </p>
      </div>
      
      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
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
          
          <button 
            className="btn btn-secondary"
            onClick={handleExportUsers}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={handleAddUser}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      <FiltersPanel />

      {/* Actions en lot */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setSelectedUsers([])
                  setSelectAll(false)
                }}
              >
                Désélectionner
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={handleBulkDelete}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && users.length > 0 && (
        <div className="mb-4">
          <ErrorMessage 
            message={error} 
            onRetry={retry}
            onDismiss={clearError}
            variant="warning"
          />
        </div>
      )}
      
      {/* Tableau des utilisateurs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center">
                    Utilisateur
                    {sortField === 'username' && (
                      <span className="ml-1 text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortField === 'email' && (
                      <span className="ml-1 text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Inscription
                    {sortField === 'created_at' && (
                      <span className="ml-1 text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800">
                            {user.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_admin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_admin ? 'Admin' : 'Utilisateur'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.stats && (
                      <div className="text-xs">
                        <div>{user.stats.total_runs} courses</div>
                        <div>{user.stats.total_distance.toFixed(1)} km</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => navigate(`/users/${user.id}`)}
                        title="Voir le détail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleEditUser(user)}
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> sur{' '}
                  <span className="font-medium">{pagination.pages}</span>
                  {' '}({pagination.total} résultats)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  
                  {/* Pages */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else {
                      const start = Math.max(1, pagination.page - 2)
                      const end = Math.min(pagination.pages, start + 4)
                      pageNum = start + i
                      if (pageNum > end) return null
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
        loading={loading}
      />
      
      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSubmit={handleUpdateUser}
        user={selectedUser}
        loading={loading}
      />
    </div>
  )
}

export default Users