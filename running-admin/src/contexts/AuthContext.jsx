// running-admin/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('CheckAuth - Token trouvé:', token ? 'Oui' : 'Non')
      
      if (!token) {
        setLoading(false)
        return
      }

      // Valider le token avec l'API
      const response = await api.auth.validateToken()
      
      if (response.data.status === 'success') {
        const userData = response.data.data.user
        setUser(userData)
        setIsAuthenticated(true)
        
        // NOUVEAU: Vérifier les permissions admin
        console.log('CheckAuth - Utilisateur authentifié:', userData.username)
        console.log('CheckAuth - Permissions admin:', userData.is_admin ? 'Oui' : 'Non')
        
        // Avertir si pas admin et sur une page admin
        if (!userData.is_admin && window.location.pathname.includes('/routes')) {
          console.warn('Utilisateur non-admin tentant d\'accéder à une page admin')
        }
      } else {
        // Token invalide
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur validation token:', error)
      
      // Ne pas déconnecter automatiquement si c'est juste une erreur réseau
      if (!error.response || error.response.status >= 500) {
        console.log('Erreur réseau/serveur - conservation de la session')
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        setIsAuthenticated(false)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }


  const login = async (emailOrUsername, password, rememberMe = false) => {
    try {
      setLoading(true)
      
      const response = await api.auth.login(emailOrUsername, password)
      console.log('Login - Réponse reçue:', response.data.status)
      
      if (response.data.status === 'success') {
        const { access_token, user: userData } = response.data.data
        
        console.log('Login - Token reçu:', access_token ? 'Oui' : 'Non')
        console.log('Login - Données utilisateur:', userData.username)
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        // Vérification immédiate du stockage
        const storedToken = localStorage.getItem('auth_token')
        console.log('Login - Token stocké vérifié:', storedToken ? 'Oui' : 'Non')
        
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Erreur de connexion' 
        }
      }
    } catch (error) {
      console.error('Erreur login:', error)
      
      let message = 'Erreur de connexion'
      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.userMessage) {
        message = error.userMessage
      }
      
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Erreur logout:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      setUser(null)
      setIsAuthenticated(false)
      
      window.location.href = '/login'
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user_data', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}