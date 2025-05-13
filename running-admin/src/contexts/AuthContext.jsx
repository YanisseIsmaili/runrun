// Fichier: src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Vérifier si le token est valide
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Erreur de décodage du token:', error);
      return false;
    }
  };
  
  // Dans la fonction login de AuthContext.jsx
  const login = async (email, password) => {
      try {
        console.log("Début de la fonction login dans AuthContext");
        setError(null);
        
        console.log("Appel API de login");
        const response = await api.auth.login(email, password);
        console.log("Réponse API complète:", response);
        
        // Vérifier le format de la réponse pour s'adapter à l'API
        const token = response.data?.access_token || response.data?.token;
        const userData = response.data?.user;
        console.log("Token extrait:", token ? "Token présent" : "Token absent");
        console.log("UserData extrait:", userData);
        
        if (!token) {
          console.error("Aucun token trouvé dans la réponse");
          throw new Error('Token non trouvé dans la réponse');
        }
        
        console.log("Mise à jour du state avec token et userData");
        setToken(token);
        setCurrentUser(userData);
        localStorage.setItem('token', token);
        
        console.log("Login terminé avec succès");
        return { success: true, user: userData };
      } catch (error) {
        console.error('Erreur détaillée de login:', error);
        
        // Extraire un message d'erreur utile
        let errorMessage = 'Une erreur est survenue lors de la connexion';
        
        if (error.response) {
          console.log("Détails de la réponse d'erreur:", error.response.data);
          // Si l'API renvoie une structure d'erreur standard
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        `Erreur ${error.response.status}: ${error.response.statusText}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.log("Message d'erreur final:", errorMessage);
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
  };
  
  // Logout
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
  };
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      if (token && isTokenValid(token)) {
        try {
          // Charger les informations de l'utilisateur
          const response = await api.users.getCurrentUser();
          setCurrentUser(response.data || response);
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          // En cas d'erreur, déconnecter l'utilisateur
          logout();
        }
      } else if (token) {
        // Si le token n'est pas valide, déconnecter l'utilisateur
        logout();
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [token]);
  
  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};