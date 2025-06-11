// running-admin/src/contexts/AuthContext.jsx - AVEC DÉCONNEXION AU REFRESH
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
    
    // Gérer la déconnexion au refresh pour les sessions temporaires
    const handleBeforeUnload = () => {
      // Si l'utilisateur a une session temporaire (sessionStorage seulement)
      if (sessionStorage.getItem('auth_token') && !localStorage.getItem('auth_token')) {
        console.log('Déconnexion automatique - session temporaire')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('user_data')
      }
    }

    // Marquer le début de session pour détecter les refreshes
    const sessionStart = sessionStorage.getItem('session_start')
    if (!sessionStart) {
      sessionStorage.setItem('session_start', Date.now().toString())
    }

    // Ajouter l'écouteur beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const checkAuth = async () => {
    try {
      // Si c'est un refresh et que l'utilisateur avait une session temporaire, déconnecter
      const sessionStart = sessionStorage.getItem('session_start')
      const wasTemporarySession = sessionStorage.getItem('temp_session')
      
      if (sessionStart && wasTemporarySession && !localStorage.getItem('auth_token')) {
        console.log('Refresh détecté - déconnexion session temporaire')
        clearStoredAuth()
        setLoading(false)
        return
      }

      // Priorité à localStorage puis sessionStorage
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      console.log('CheckAuth - Token trouvé:', token ? 'Oui' : 'Non')
      console.log('CheckAuth - Source:', localStorage.getItem('auth_token') ? 'localStorage' : 'sessionStorage')
      
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
    sessionStorage.removeItem('temp_session')
    sessionStorage.removeItem('session_start')
    console.log('Tous les tokens supprimés')
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
        console.log('Login - Se souvenir:', rememberMe ? 'Oui (localStorage)' : 'Non (session temporaire)')
        
        // Nettoyer d'abord tous les anciens tokens
        clearStoredAuth()
        
        if (rememberMe) {
          // Persistance longue durée avec localStorage
          localStorage.setItem('auth_token', access_token)
          localStorage.setItem('user_data', JSON.stringify(userData))
          console.log('Token stocké dans localStorage (persistant)')
        } else {
          // Session temporaire avec sessionStorage + marqueur temporaire
          sessionStorage.setItem('auth_token', access_token)
          sessionStorage.setItem('user_data', JSON.stringify(userData))
          sessionStorage.setItem('temp_session', 'true')
          sessionStorage.removeItem('session_start') // Reset pour permettre la navigation
          console.log('Token stocké dans sessionStorage (session temporaire)')
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
      console.log('User data mis à jour dans localStorage')
    } else if (sessionStorage.getItem('auth_token')) {
      sessionStorage.setItem('user_data', userDataString)
      console.log('User data mis à jour dans sessionStorage')
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