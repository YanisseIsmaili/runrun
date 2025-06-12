import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('AdminRoute: Utilisateur non authentifié, redirection vers login')
        navigate('/login')
      } else if (!user?.is_admin) {
        console.log('AdminRoute: Utilisateur non-admin, accès refusé')
      }
    }
  }, [loading, isAuthenticated, user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Accès Refusé</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vous devez être administrateur pour accéder à cette page.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Compte actuel: <span className="font-medium">{user?.username}</span>
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour au Tableau de Bord
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous essayer de vous promouvoir administrateur? (nécessite une clé secrète)')) {
                    window.promoteToAdmin && window.promoteToAdmin()
                  }
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Obtenir Droits Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute