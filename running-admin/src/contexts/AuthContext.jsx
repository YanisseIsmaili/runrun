import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
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
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
  
  // Fonction de connexion améliorée
  const login = async (email, password) => {
    setLoading(true)
    try {
      console.log("Début de la fonction login dans AuthContext")
      setError(null)
      
      
      console.log("Appel API de login")
      const response = await api.auth.login(email, password)
      console.log("Réponse API complète:", response)
      
      // Vérifier le format de la réponse pour s'adapter à l'API
      const token = response.data?.access_token || response.data?.token
      const userData = response.data?.user
      console.log("Token extrait:", token ? "Token présent" : "Token absent")
      console.log("UserData extrait:", userData)
      
      if (!token) {
        console.error("Aucun token trouvé dans la réponse")
        throw new Error('Token non trouvé dans la réponse')
      }
      
      console.log("Mise à jour du state avec token et userData")
      setToken(token)
      setCurrentUser(userData)
      localStorage.setItem('token', token)
      
      console.log("Login terminé avec succès")
      return { success: true, user: userData }
    } catch (error) {
      console.error('Erreur détaillée de login:', error)
      
      // Extraire un message d'erreur utile
      let errorMessage = 'Une erreur est survenue lors de la connexion'
      
      if (error.response) {
        console.log("Détails de la réponse d'erreur:", error.response.data)
        // Si l'API renvoie une structure d'erreur standard
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
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      console.log("Initialisation de l'authentification")
      setLoading(true)
      setError(null)
      
      try {
        if (token && isTokenValid(token)) {
          console.log("Token valide trouvé, chargement des données utilisateur")
          await loadUserData(token)
        } else if (token) {
          console.log("Token invalide ou expiré, déconnexion")
          logout()
        } else {
          console.log("Aucun token trouvé")
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error)
        setError('Erreur lors de la vérification de l\'authentification')
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, []) // Seulement au montage du composant
  
  // Mettre à jour l'instance axios quand le token change
  useEffect(() => {
    if (token && isTokenValid(token)) {
      // Le token sera ajouté automatiquement par l'intercepteur d'axios
      console.log("Token mis à jour dans le contexte")
    }
  }, [token])
  
  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token && isTokenValid(token),
    loading,
    error,
    login,
    logout,
    refreshUser,
    clearError: () => setError(null)
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}