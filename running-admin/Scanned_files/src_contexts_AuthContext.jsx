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
      
      if (!token) {
        setLoading(false)
        return
      }

      // Valider le token avec l'API
      const response = await api.auth.validateToken()
      
      if (response.data.status === 'success') {
        setUser(response.data.data.user)
        setIsAuthenticated(true)
      } else {
        // Token invalide
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    } catch (error) {
      console.error('Erreur validation token:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true)
      
      const response = await api.auth.login(emailOrUsername, password)
      
      if (response.data.status === 'success') {
        const { access_token, user: userData } = response.data.data
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true }
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Erreur de connexion' 
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
      
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Appeler l'API de déconnexion si nécessaire
      await api.auth.logout()
    } catch (error) {
      console.error('Erreur logout:', error)
    } finally {
      // Nettoyer le stockage local
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      setUser(null)
      setIsAuthenticated(false)
      
      // Rediriger vers la page de connexion
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