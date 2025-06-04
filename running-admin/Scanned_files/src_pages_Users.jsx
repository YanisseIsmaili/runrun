import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon, FilterIcon } from '@heroicons/react/outline'
import api from '../services/api'

// Données temporaires pour le développement
const tempUsers = Array.from({ length: 25 }, (_, i) => ({
  id: i + 101,
  username: `user${i + 1}`,
  email: `user${i + 1}@example.com`,
  first_name: ['Alexandre', 'Sophie', 'Thomas', 'Julie', 'Mathieu', 'Lucie', 'Nicolas', 'Emma'][i % 8],
  last_name: ['Dupont', 'Martin', 'Bernard', 'Leclerc', 'Petit', 'Robert', 'Dubois', 'Moreau'][i % 8],
  runs: Math.floor(Math.random() * 50) + 1,
  total_distance: Math.floor(Math.random() * 500) + 10,
  avg_pace: `${Math.floor(Math.random() * 3) + 4}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  created_at: new Date(2023, Math.floor(i / 5), (i % 28) + 1),
  last_activity: i < 15 ? new Date(2024, 3, Math.floor(Math.random() * 30) + 1) : new Date(2024, 2, Math.floor(Math.random() * 31) + 1)
}))

const Users = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortField, setSortField] = useState('last_activity')
  const [sortDirection, setSortDirection] = useState('desc')
  const usersPerPage = 10
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour obtenir les données réelles
        // const response = await api.users.getAll(currentPage, usersPerPage)
        // setUsers(response.data.users)
        // setTotalPages(Math.ceil(response.data.total / usersPerPage))
        
        // Utilisation des données temporaires pour le développement
        setUsers(tempUsers)
        setTotalPages(Math.ceil(tempUsers.length / usersPerPage))
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs', err)
        setError('Impossible de charger la liste des utilisateurs')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [currentPage])
  
  useEffect(() => {
    // Filtrer et trier les utilisateurs
    let result = [...users]
    
    // Filtre de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        user => 
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
      )
    }
    
    // Tri
    result.sort((a, b) => {
      let fieldA = a[sortField]
      let fieldB = b[sortField]
      
      // Gestion spéciale pour les dates
      if (sortField === 'created_at' || sortField === 'last_activity') {
        fieldA = new Date(fieldA)
        fieldB = new Date(fieldB)
      }
      
      // Gestion spéciale pour avg_pace (format mm:ss)
      if (sortField === 'avg_pace') {
        const [minA, secA] = fieldA.split(':').map(Number)
        const [minB, secB] = fieldB.split(':').map(Number)
        fieldA = minA * 60 + secA
        fieldB = minB * 60 + secB
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredUsers(result)
  }, [users, searchTerm, sortField, sortDirection])
  
  // Fonction pour gérer le tri
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Formatage de la date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Calculer les utilisateurs pour la page en cours
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )
  
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
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Liste des utilisateurs de l'application Running
        </p>
      </div>
      
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
          <button className="btn btn-secondary">
            <FilterIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
          <button className="btn btn-primary">
            Ajouter un utilisateur
          </button>
        </div>
      </div>
      
      {/* Tableau des utilisateurs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center">
                    Utilisateur
                    {sortField === 'username' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Inscription
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('runs')}
                >
                  <div className="flex items-center">
                    Courses
                    {sortField === 'runs' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total_distance')}
                >
                  <div className="flex items-center">
                    Distance totale
                    {sortField === 'total_distance' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('avg_pace')}
                >
                  <div className="flex items-center">
                    Allure moyenne
                    {sortField === 'avg_pace' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_activity')}
                >
                  <div className="flex items-center">
                    Dernière activité
                    {sortField === 'last_activity' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {user.first_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.runs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.total_distance} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.avg_pace} min/km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_activity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/users/${user.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                  </span>{' '}
                  sur <span className="font-medium">{filteredUsers.length}</span> utilisateurs
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Précédent</span>
                    &lt;
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Suivant</span>
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users