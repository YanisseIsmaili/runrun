import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          // En mode développement, on peut simuler un utilisateur connecté
          // Remplacez ceci par un vrai appel API en production
          const userData = {
            id: '1',
            name: 'Utilisateur Test',
            email: 'test@example.com',
            profileImage: null
          };
          
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Error checking login status:', err);
        setError('Erreur lors de la vérification du statut de connexion');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Fonction pour gérer la connexion
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // En mode développement, simuler une connexion réussie
      // Remplacez ceci par un vrai appel API en production
      if (email && password) {
        const mockResponse = {
          user: {
            id: '1',
            name: 'Utilisateur Test',
            email: email,
            profileImage: null
          },
          token: 'mock-jwt-token'
        };
        
        await AsyncStorage.setItem('authToken', mockResponse.token);
        
        setUser(mockResponse.user);
        setIsAuthenticated(true);
        
        return mockResponse;
      } else {
        throw new Error('Email et mot de passe requis');
      }
      
      // Code pour la vraie API (décommenté quand l'API est disponible)
      /*
      const response = await authService.login(email, password);
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
      */
    } catch (err) {
      const errorMessage = err.message || 'Erreur de connexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer l'inscription
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // En mode développement, simuler une inscription réussie
      // Remplacez ceci par un vrai appel API en production
      if (userData.email && userData.password && userData.name) {
        const mockResponse = {
          user: {
            id: '1',
            name: userData.name,
            email: userData.email,
            profileImage: null
          },
          token: 'mock-jwt-token'
        };
        
        await AsyncStorage.setItem('authToken', mockResponse.token);
        
        setUser(mockResponse.user);
        setIsAuthenticated(true);
        
        return mockResponse;
      } else {
        throw new Error('Données d\'inscription incomplètes');
      }
      
      // Code pour la vraie API (décommenté quand l'API est disponible)
      /*
      const response = await authService.register(userData);
      await AsyncStorage.setItem('authToken', response.token);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response;
      */
    } catch (err) {
      const errorMessage = err.message || 'Erreur d\'inscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer la déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Erreur de déconnexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};