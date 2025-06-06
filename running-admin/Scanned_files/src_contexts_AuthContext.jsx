import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'
import cryptoService from '../services/cryptoService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const STORAGE_KEYS = {
  TOKEN: 'running_app_token',
  USER_DATA: 'running_app_user',
  SESSION_PREFS: 'running_app_session_prefs'
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)
  
  const emergencyCleanup = () => {
    try {
      console.log('🧹 Nettoyage d\'urgence du localStorage...')
      cryptoService.clearAllSecureData()
      
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('running_app') || key.includes('token') || key.includes('user')) {
          localStorage.removeItem(key)
        }
      })
      
      console.log('✅ Nettoyage d\'urgence terminé')
      return true
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage d\'urgence:', error)
      return false
    }
  }
  
  const isTokenValid = (token) => {
    if (!token) return false
    
    try {
      if (token.includes('mock')) return true
      
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      
      return decoded.exp > currentTime
    } catch (error) {
      console.error('Erreur de décodage du token:', error)
      return false
    }
  }

  const saveSessionData = (tokenData, userData, remember = false) => {
    try {
      const expirationHours = remember ? 24 * 7 : 24
      
      const tokenSaved = cryptoService.setSecureItem(STORAGE_KEYS.TOKEN, tokenData, expirationHours)
      const userSaved = cryptoService.setSecureItem(STORAGE_KEYS.USER_DATA, userData, expirationHours)
      const prefsSaved = cryptoService.setSecureItem(STORAGE_KEYS.SESSION_PREFS, {
        rememberMe: remember,
        lastLogin: new Date().toISOString()
      }, expirationHours)
      
      if (tokenSaved && userSaved && prefsSaved) {
        console.log('✅ Données de session sauvegardées de manière sécurisée')
        return true
      } else {
        console.warn('⚠️ Problème lors de la sauvegarde des données')
        return false
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données de session:', error)
      return false
    }
  }

  const loadSessionData = () => {
    try {
      const savedToken = cryptoService.getSecureItem(STORAGE_KEYS.TOKEN)
      const savedUser = cryptoService.getSecureItem(STORAGE_KEYS.USER_DATA)
      const savedPrefs = cryptoService.getSecureItem(STORAGE_KEYS.SESSION_PREFS)
      
      if (savedToken && savedUser && isTokenValid(savedToken)) {
        setToken(savedToken)
        setCurrentUser(savedUser)
        setRememberMe(savedPrefs?.rememberMe || false)
        
        console.log('✅ Session restaurée depuis le stockage sécurisé')
        console.log('📅 Dernière connexion:', savedPrefs?.lastLogin)
        return true
      } else {
        clearSessionData()
        return false
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de session:', error)
      emergencyCleanup()
      return false
    }
  }

  const clearSessionData = () => {
    try {
      cryptoService.removeSecureItem(STORAGE_KEYS.TOKEN)
      cryptoService.removeSecureItem(STORAGE_KEYS.USER_DATA)
      cryptoService.removeSecureItem(STORAGE_KEYS.SESSION_PREFS)
      console.log('🗑️ Données de session effacées')
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement des données:', error)
    }
  }
  
  const login = async (email, password, remember = false) => {
    setLoading(true)
    try {
      console.log("🔐 Début de la fonction login dans AuthContext")
      setError(null)
      setRememberMe(remember)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjk5OTk5OTk5OTl9.mock"
      const mockUser = {
        id: 1,
        first_name: "Admin",
        last_name: "Test", 
        email: email,
        username: "admin"
      }
      
      console.log("✅ Connexion simulée réussie")
      setToken(mockToken)
      setCurrentUser(mockUser)
      
      const saved = saveSessionData(mockToken, mockUser, remember)
      if (!saved) {
        console.warn('⚠️ Impossible de sauvegarder la session, la connexion sera temporaire')
      }
      
      console.log("🎉 Login terminé avec succès")
      return { success: true, user: mockUser }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error)
      setError('Erreur de connexion simulée')
      return {
        success: false,
        error: 'Erreur de connexion simulée'
      }
    } finally {
      setLoading(false)
    }
  }
  
  const logout = () => {
    console.log("👋 Déconnexion de l'utilisateur")
    setToken(null)
    setCurrentUser(null)
    setError(null)
    setRememberMe(false)
    
    clearSessionData()
    localStorage.removeItem('token')
  }
  
  const loadUserData = async (authToken) => {
    try {
      console.log("👤 Chargement des données utilisateur")
      
      const userData = cryptoService.getSecureItem(STORAGE_KEYS.USER_DATA)
      if (userData) {
        setCurrentUser(userData)
        return userData
      }
      
      return null
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données utilisateur:', error)
      return null
    }
  }
  
  const refreshUser = async () => {
    if (!token || !isTokenValid(token)) {
      logout()
      return null
    }
    
    try {
      return await loadUserData(token)
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des données:', error)
      return null
    }
  }

  const extendSession = () => {
    if (token && currentUser && isTokenValid(token)) {
      saveSessionData(token, currentUser, rememberMe)
      console.log('⏰ Session prolongée')
      return true
    }
    return false
  }
  
  useEffect(() => {
    const initAuth = async () => {
      console.log("🚀 Initialisation de l'authentification")
      setLoading(true)
      setError(null)
      
      try {
        const integrity = cryptoService.checkStorageIntegrity()
        console.log('🔍 Vérification de l\'intégrité du stockage:', integrity)
        
        if (!integrity.isHealthy) {
          console.warn('⚠️ Données corrompues détectées, nettoyage nécessaire')
          emergencyCleanup()
        } else {
          cryptoService.cleanExpiredItems()
          
          const sessionLoaded = loadSessionData()
          
          if (sessionLoaded) {
            console.log("✅ Session existante chargée avec succès")
          } else {
            console.log("ℹ️ Aucune session valide trouvée")
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error)
        setError('Erreur lors de la vérification de l\'authentification')
        emergencyCleanup()
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])
  
  useEffect(() => {
    if (token && isTokenValid(token)) {
      console.log("🔑 Token mis à jour dans le contexte")
    }
  }, [token])

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      try {
        cryptoService.cleanExpiredItems()
      } catch (error) {
        console.warn('⚠️ Erreur lors du nettoyage périodique:', error)
      }
    }, 10 * 60 * 1000)

    return () => clearInterval(cleanupInterval)
  }, [])
  
  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token && isTokenValid(token),
    loading,
    error,
    rememberMe,
    login,
    logout,
    refreshUser,
    extendSession,
    clearError: () => setError(null),
    emergencyCleanup
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}