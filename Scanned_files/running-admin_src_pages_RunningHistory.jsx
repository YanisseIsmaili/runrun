import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

// Données temporaires pour le développement
const tempRuns = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  user: {
    id: 100 + (i % 10),
    name: ['Alexandre Dupont', 'Sophie Martin', 'Thomas Bernard', 'Julie Leclerc', 'Mathieu Petit', 
           'Lucie Robert', 'Nicolas Dubois', 'Emma Moreau', 'Antoine Leroy', 'Camille Simon'][i % 10]
  },
  date: new Date(2024, 3 - Math.floor(i / 15), 30 - (i % 30)),
  distance: Math.round((3 + Math.random() * 15) * 10) / 10,
  duration: Math.floor((20 + Math.random() * 90) * 60),
  avg_pace: `${4 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  avg_heart_rate: Math.floor(140 + Math.random() * 40),
  elevation_gain: Math.floor(Math.random() * 500)
}))

const RunningHistory = () => {
  const [runs, setRuns] = useState([])
  const [filteredRuns, setFilteredRuns] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minDistance: '',
    maxDistance: '',
    userId: ''
  })
  const runsPerPage = 10
  
  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Dans un projet réel, remplacez ceci par un appel API pour obtenir les données réelles
        // const response = await api.runs.getAll(currentPage, runsPerPage)
        // setRuns(response.data.runs)
        // setTotalPages(Math.ceil(response.data.total / runsPerPage))
        
        // Utilisation des données temporaires pour le développement
        setRuns(tempRuns)
        setTotalPages(Math.ceil(tempRuns.length / runsPerPage))
      } catch (err) {
        console.error('Erreur lors du chargement des courses', err)
        setError('Impossible de charger la liste des courses')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRuns()
  }, [currentPage])
  
  useEffect(() => {
    // Filtrer et trier les courses
    let result = [...runs]
    
    // Appliquer les filtres
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      result = result.filter(run => new Date(run.date) >= startDate)
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59)
      result = result.filter(run => new Date(run.date) <= endDate)
    }
    
    if (filters.minDistance) {
      result = result.filter(run => run.distance >= parseFloat(filters.minDistance))
    }
    
    if (filters.maxDistance) {
      result = result.filter(run => run.distance <= parseFloat(filters.maxDistance))
    }
    
    if (filters.userId) {
      result = result.filter(run => run.user.id === parseInt(filters.userId))
    }
    
    // Filtre de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        run => 
          run.user.name.toLowerCase().includes(searchLower) ||
          run.date.toLocaleDateString().includes(searchLower) ||
          run.distance.toString().includes(searchLower)
      )
    }
    
    // Tri
    result.sort((a, b) => {
      let fieldA = a[sortField]
      let fieldB = b[sortField]
      
      // Gestion spéciale pour les dates
      if (sortField === 'date') {
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
      
      // Gestion spéciale pour les objets imbriqués (user.name)
      if (sortField === 'user') {
        fieldA = a.user.name
        fieldB = b.user.name
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredRuns(result)
    setTotalPages(Math.ceil(result.length / runsPerPage))
  }, [runs, searchTerm, sortField, sortDirection, filters])
  
  // Fonction pour gérer le tri
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Formatage de la durée (secondes -> format MM:SS ou HH:MM:SS)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  // Formatage de la date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minDistance: '',
      maxDistance: '',
      userId: ''
    })
  }
  
  // Calculer les courses pour la page en cours
  const paginatedRuns = filteredRuns.slice(
    (currentPage - 1) * runsPerPage,
    currentPage * runsPerPage
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
        <h1 className="text-2xl font-semibold text-gray-900">Historique des courses</h1>
        <p className="mt-1 text-sm text-gray-500">
          Liste complète des activités enregistrées par les utilisateurs
        </p>
      </div>
      
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une course..."
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
          <button className="btn btn-secondary">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Statistiques
          </button>
          <button className="btn btn-secondary">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exporter
          </button>
        </div>
      </div>
      
      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres avancés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="form-label">Date de début</label>
              <input
                type="date"
                id="startDate"
                className="form-input"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="form-label">Date de fin</label>
              <input
                type="date"
                id="endDate"
                className="form-input"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="userId" className="form-label">Utilisateur</label>
              <select
                id="userId"
                className="form-input"
                value={filters.userId}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
              >
                <option value="">Tous les utilisateurs</option>
                {/* Options générées dynamiquement - en réalité, vous feriez un appel API pour obtenir la liste des utilisateurs */}
                {Array.from(new Set(runs.map(run => run.user.id))).map(userId => {
                  const user = runs.find(run => run.user.id === userId).user
                  return (
                    <option key={userId} value={userId}>{user.name}</option>
                  )
                })}
              </select>
            </div>
            
            <div>
              <label htmlFor="minDistance" className="form-label">Distance minimum (km)</label>
              <input
                type="number"
                id="minDistance"
                className="form-input"
                value={filters.minDistance}
                onChange={(e) => setFilters({...filters, minDistance: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label htmlFor="maxDistance" className="form-label">Distance maximum (km)</label>
              <input
                type="number"
                id="maxDistance"
                className="form-input"
                value={filters.maxDistance}
                onChange={(e) => setFilters({...filters, maxDistance: e.target.value})}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="btn btn-secondary mr-2"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="btn btn-primary"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
      
      {/* Tableau des courses */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('user')}
                >
                  <div className="flex items-center">
                    Utilisateur
                    {sortField === 'user' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'date' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('distance')}
                >
                  <div className="flex items-center">
                    Distance
                    {sortField === 'distance' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center">
                    Durée
                    {sortField === 'duration' && (
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
                    Allure
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
                  onClick={() => handleSort('avg_heart_rate')}
                >
                  <div className="flex items-center">
                    FC Moy.
                    {sortField === 'avg_heart_rate' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('elevation_gain')}
                >
                  <div className="flex items-center">
                    Dénivelé
                    {sortField === 'elevation_gain' && (
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
              {paginatedRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {run.user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{run.user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(run.date)}
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
                    <button className="text-primary-600 hover:text-primary-900 mr-4">
                      Détails
                    </button>
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
                  Affichage de <span className="font-medium">{(currentPage - 1) * runsPerPage + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * runsPerPage, filteredRuns.length)}
                  </span>{' '}
                  sur <span className="font-medium">{filteredRuns.length}</span> courses
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
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // Afficher 5 pages maximum, centrées autour de la page courante
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
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

export default RunningHistory