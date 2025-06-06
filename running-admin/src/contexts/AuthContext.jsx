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

// Constantes pour les clés de stockage
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
  
  // Vérifier si le token est valide
  const isTokenValid = (token) => {
    if (!token) return false
    
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      
      return decoded.exp > currentTime
    } catch (error) {
      console.error('Erreur de décodage du token:', error)
      return false
    }
  }

  // Sauvegarder les données de session de manière sécurisée
  const saveSessionData = (tokenData, userData, remember = false) => {
    try {
      const expirationHours = remember ? 24 * 7 : 24 // 7 jours si "se souvenir", sinon 24h
      
      // Sauvegarder le token
      cryptoService.setSecureItem(STORAGE_KEYS.TOKEN, tokenData, expirationHours)
      
      // Sauvegarder les données utilisateur
      cryptoService.setSecureItem(STORAGE_KEYS.USER_DATA, userData, expirationHours)
      
      // Sauvegarder les préférences
      cryptoService.setSecureItem(STORAGE_KEYS.SESSION_PREFS, {
        rememberMe: remember,
        lastLogin: new Date().toISOString()
      }, expirationHours)
      
      console.log('Données de session sauvegardées de manière sécurisée')
      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de session:', error)
      return false
    }
  }

  // Charger les données de session sauvegardées
  const loadSessionData = () => {
    try {
      const savedToken = cryptoService.getSecureItem(STORAGE_KEYS.TOKEN)
      const savedUser = cryptoService.getSecureItem(STORAGE_KEYS.USER_DATA)
      const savedPrefs = cryptoService.getSecureItem(STORAGE_KEYS.SESSION_PREFS)
      
      if (savedToken && savedUser && isTokenValid(savedToken)) {
        setToken(savedToken)
        setCurrentUser(savedUser)
        setRememberMe(savedPrefs?.rememberMe || false)
        
        console.log('Session restaurée depuis le stockage sécurisé')
        console.log('Dernière connexion:', savedPrefs?.lastLogin)
        return true
      } else {
        // Nettoyer les données expirées ou invalides
        clearSessionData()
        return false
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de session:', error)
      clearSessionData()
      return false
    }
  }

  // Effacer toutes les données de session
  const clearSessionData = () => {
    try {
      cryptoService.removeSecureItem(STORAGE_KEYS.TOKEN)
      cryptoService.removeSecureItem(STORAGE_KEYS.USER_DATA)
      cryptoService.removeSecureItem(STORAGE_KEYS.SESSION_PREFS)
      console.log('Données de session effacées')
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données:', error)
    }
  }
  
  // Fonction de connexion améliorée
  const login = async (email, password, remember = false) => {
    setLoading(true)
    try {
      console.log("Début de la fonction login dans AuthContext")
      setError(null)
      setRememberMe(remember)
      
      console.log("Appel API de login")
      const response = await api.auth.login(email, password)
      console.log("Réponse API complète:", response)
      
      // Vérifier le format de la réponse pour s'adapter à l'API
      const tokenData = response.data?.access_token || response.data?.token
      const userData = response.data?.user
      console.log("Token extrait:", tokenData ? "Token présent" : "Token absent")
      console.log("UserData extrait:", userData)
      
      if (!tokenData) {
        console.error("Aucun token trouvé dans la réponse")
        throw new Error('Token non trouvé dans la réponse')
      }
      
      console.log("Mise à jour du state avec token et userData")
      setToken(tokenData)
      setCurrentUser(userData)
      
      // Sauvegarder les données de session de manière sécurisée
      const saved = saveSessionData(tokenData, userData, remember)
      if (!saved) {
        console.warn('Impossible de sauvegarder la session, la connexion sera temporaire')
      }
      
      console.log("Login terminé avec succès")
      return { success: true, user: userData }
    } catch (error) {
      console.error('Erreur détaillée de login:', error)
      
      // Extraire un message d'erreur utile
      let errorMessage = 'Une erreur est survenue lors de la connexion'
      
      if (error.response) {
        console.log("Détails de la réponse d'erreur:", error.response.data)
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Erreur ${error.response.status}: ${error.response.statusText}`
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.log("Message d'erreur final:", errorMessage)
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Logout avec nettoyage complet
  const logout = () => {
    console.log("Déconnexion de l'utilisateur")
    setToken(null)
    setCurrentUser(null)
    setError(null)
    setRememberMe(false)
    
    // Effacer toutes les données stockées
    clearSessionData()
    
    // Nettoyer aussi le localStorage classique au cas où
    localStorage.removeItem('token')
  }
  
  // Charger les données utilisateur
  const loadUserData = async (authToken) => {
    try {
      console.log("Chargement des données utilisateur")
      const response = await api.users.getCurrentUser()
      const userData = response.data || response
      console.log("Données utilisateur chargées:", userData)
      setCurrentUser(userData)
      
      // Mettre à jour les données utilisateur dans le stockage
      if (rememberMe) {
        cryptoService.setSecureItem(STORAGE_KEYS.USER_DATA, userData, 24 * 7)
      } else {
        cryptoService.setSecureItem(STORAGE_KEYS.USER_DATA, userData, 24)
      }
      
      return userData
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error)
      // En cas d'erreur, déconnecter l'utilisateur
      logout()
      throw error
    }
  }
  
  // Rafraîchir les données utilisateur
  const refreshUser = async () => {
    if (!token || !isTokenValid(token)) {
      logout()
      return null
    }
    
    try {
      return await loadUserData(token)
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error)
      return null
    }
  }

  // Prolonger la session
  const extendSession = () => {
    if (token && currentUser && isTokenValid(token)) {
      const expirationHours = rememberMe ? 24 * 7 : 24
      saveSessionData(token, currentUser, rememberMe)
      console.log('Session prolongée')
      return true
    }
    return false
  }
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      console.log("Initialisation de l'authentification")
      setLoading(true)
      setError(null)
      
      try {
        // D'abord, nettoyer les données expirées
        cryptoService.cleanExpiredItems()
        
        // Essayer de charger une session existante
        const sessionLoaded = loadSessionData()
        
        if (sessionLoaded) {
          console.log("Session existante chargée avec succès")
          // Optionnel: vérifier les données utilisateur à jour
          try {
            await loadUserData(token)
          } catch (error) {
            console.log("Impossible de rafraîchir les données utilisateur, utilisation des données mises en cache")
          }
        } else {
          console.log("Aucune session valide trouvée")
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error)
        setError('Erreur lors de la vérification de l\'authentification')
        clearSessionData()
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, []) // Seulement au montage du composant
  
  // Mettre à jour l'instance axios quand le token change
  useEffect(() => {
    if (token && isTokenValid(token)) {
      console.log("Token mis à jour dans le contexte")
    }
  }, [token])

  // Nettoyer périodiquement les données expirées (toutes les 10 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cryptoService.cleanExpiredItems()
    }, 10 * 60 * 1000) // 10 minutes

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
    clearError: () => setError(null)
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}