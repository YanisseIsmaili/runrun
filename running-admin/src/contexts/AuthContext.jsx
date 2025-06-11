// running-admin/src/contexts/AuthContext.jsx - AVEC STOCKAGE MÉMOIRE
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

// Variables globales pour stockage en mémoire (se remettent à null au refresh)
let memoryToken = null
let memoryUser = null

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
      // Priorité : mémoire puis localStorage (pas de sessionStorage)
      const token = memoryToken || localStorage.getItem('auth_token')
      const userData = memoryUser || (localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')) : null)
      
      console.log('CheckAuth - Token trouvé:', token ? 'Oui' : 'Non')
      console.log('CheckAuth - Source:', memoryToken ? 'mémoire' : localStorage.getItem('auth_token') ? 'localStorage' : 'aucune')
      
      if (!token) {
        setLoading(false)
        return
      }

      // Valider le token avec l'API
      const response = await api.auth.validateToken()
      
      if (response.data.status === 'success') {
        const validatedUser = response.data.data.user
        setUser(validatedUser)
        setIsAuthenticated(true)
        
        // Mettre à jour les variables mémoire si elles existent
        if (memoryToken) {
          memoryUser = validatedUser
        }
        
        console.log('CheckAuth - Utilisateur authentifié:', validatedUser.username)
        console.log('CheckAuth - Permissions admin:', validatedUser.is_admin ? 'Oui' : 'Non')
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
        const storedUser = memoryUser || userData
        if (storedUser) {
          setUser(storedUser)
          setIsAuthenticated(true)
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
    // Nettoyer TOUS les stockages
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_data')
    
    // Nettoyer la mémoire
    memoryToken = null
    memoryUser = null
    
    console.log('Tous les tokens supprimés (localStorage + mémoire)')
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
        console.log('Login - Se souvenir:', rememberMe ? 'Oui (localStorage)' : 'Non (mémoire seulement)')
        
        // Nettoyer d'abord tous les anciens tokens
        clearStoredAuth()
        
        if (rememberMe) {
          // Persistance longue durée avec localStorage
          localStorage.setItem('auth_token', access_token)
          localStorage.setItem('user_data', JSON.stringify(userData))
          console.log('Token stocké dans localStorage (persistant)')
        } else {
          // Stockage en mémoire seulement (supprimé au refresh)
          memoryToken = access_token
          memoryUser = userData
          console.log('Token stocké en mémoire (supprimé au refresh)')
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
    if (memoryToken) {
      memoryUser = updatedUser
      console.log('User data mis à jour en mémoire')
    } else if (localStorage.getItem('auth_token')) {
      localStorage.setItem('user_data', userDataString)
      console.log('User data mis à jour dans localStorage')
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