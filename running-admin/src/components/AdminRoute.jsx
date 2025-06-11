// Nouveau fichier: running-admin/src/components/AdminRoute.jsx
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
        // Afficher un message d'erreur ou rediriger
        alert('Vous devez être administrateur pour accéder à cette page.')
        navigate('/dashboard')
      }
    }
  }, [loading, isAuthenticated, user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user?.is_admin) {
    return null
  }

  return children
}

export default AdminRoute