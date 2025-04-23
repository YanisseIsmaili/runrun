import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'  // Changé de "import jwtDecode" à "import { jwtDecode }"
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  
  // Vérifier si le token est valide
  const isTokenValid = (token) => {
    if (!token) return false
    
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      
      return decoded.exp > currentTime
    } catch (error) {
      return false
    }
  }
  
  // Login
  const login = async (email, password) => {
    try {
      const response = await api.auth.login(email, password)
      const { access_token, user } = response.data
      
      setToken(access_token)
      setCurrentUser(user)
      localStorage.setItem('token', access_token)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Une erreur est survenue'
      }
    }
  }
  
  // Logout
  const logout = () => {
    setToken(null)
    setCurrentUser(null)
    localStorage.removeItem('token')
  }
  
  // Configure axios pour inclure le token dans les requêtes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      
      if (token && isTokenValid(token)) {
        try {
          // Charger les informations de l'utilisateur
          const response = await api.users.getCurrentUser()
          setCurrentUser(response.data)
        } catch (error) {
          // En cas d'erreur, déconnecter l'utilisateur
          logout()
        }
      } else if (token) {
        // Si le token n'est pas valide, déconnecter l'utilisateur
        logout()
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])
  
  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}