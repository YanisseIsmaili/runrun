// running-admin/src/contexts/AuthContext.jsx - FICHIER COMPLET MODIFIÉ
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
      // Vérifier dans localStorage ET sessionStorage
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
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
        
        console.log('CheckAuth - Utilisateur authentifié:', userData.username)
        console.log('CheckAuth - Permissions admin:', userData.is_admin ? 'Oui' : 'Non')
      } else {
        // Token invalide
        clearStoredAuth()
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur validation token:', error)
      
      // Ne pas déconnecter automatiquement si erreur réseau/serveur
      if (!error.response || error.response.status >= 500) {
        console.log('Erreur réseau/serveur - conservation de la session')
        const storedUser = localStorage.getItem('user_data') || sessionStorage.getItem('user_data')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
          } catch (parseError) {
            console.error('Erreur parsing user data:', parseError)
          }
        }
      } else {
        clearStoredAuth()
        setIsAuthenticated(false)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const clearStoredAuth = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_data')
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
        console.log('Login - Se souvenir:', rememberMe ? 'Oui' : 'Non')
        
        if (rememberMe) {
          // Persistance longue durée avec localStorage
          localStorage.setItem('auth_token', access_token)
          localStorage.setItem('user_data', JSON.stringify(userData))
          // S'assurer que sessionStorage est vide
          sessionStorage.removeItem('auth_token')
          sessionStorage.removeItem('user_data')
        } else {
          // Session temporaire avec sessionStorage
          sessionStorage.setItem('auth_token', access_token)
          sessionStorage.setItem('user_data', JSON.stringify(userData))
          // S'assurer que localStorage est vide
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
        
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
      clearStoredAuth()
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    
    // Mettre à jour dans le bon stockage
    const userDataString = JSON.stringify(updatedUser)
    if (localStorage.getItem('auth_token')) {
      localStorage.setItem('user_data', userDataString)
    } else if (sessionStorage.getItem('auth_token')) {
      sessionStorage.setItem('user_data', userDataString)
    }
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