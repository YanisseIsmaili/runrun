import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/api';

export const RunContext = createContext();

export const useRun = () => {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return context;
};

export const RunProvider = ({ children }) => {
  // État de la course actuelle
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  // État des courses passées
  const [runHistory, setRunHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRunHistory();
    requestLocationPermissions();
  }, []);

  const requestLocationPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée', 
          'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner correctement.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Rayon de la terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
  };

  const fetchRunHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const data = await apiService.getRunHistory();
          setRunHistory(data);
        } catch (apiError) {
          console.log('API error, falling back to local storage');
          // Fallback vers le stockage local
          const storedHistory = await AsyncStorage.getItem('runHistory');
          if (storedHistory) {
            setRunHistory(JSON.parse(storedHistory));
          }
        }
      } else {
        // Pas de token, récupérer depuis le stockage local
        const storedHistory = await AsyncStorage.getItem('runHistory');
        if (storedHistory) {
          setRunHistory(JSON.parse(storedHistory));
        }
      }
    } catch (err) {
      console.error('Error fetching run history:', err);
      setError('Impossible de charger l\'historique des courses');
    } finally {
      setLoading(false);
    }
  };

  const startRun = async () => {
    try {
      // Vérifier les permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la localisation');
        return;
      }

      // Réinitialiser les états
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setSpeed(0);
      setError(null);
      
      // Créer un nouvel objet de course
      const newRun = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        endTime: null,
        distance: 0,
        duration: 0,
        locations: []
      };
      
      setCurrentRun(newRun);
      setIsRunning(true);
      setIsPaused(false);
      
      // Démarrer le suivi de la localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        handleLocationUpdate
      );
      
      setLocationSubscription(subscription);
      
      // Démarrer le chronomètre
      const interval = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
    } catch (err) {
      console.error('Error starting run:', err);
      setError('Impossible de démarrer la course');
      Alert.alert('Erreur', 'Impossible de démarrer la course. Veuillez vérifier vos permissions.');
    }
  };

  const handleLocationUpdate = (location) => {
    const { latitude, longitude, altitude, speed: currentSpeed } = location.coords;
    const timestamp = location.timestamp;
    
    setLocationHistory(prevLocations => {
      const newLocation = { latitude, longitude, altitude, timestamp };
      const newLocations = [...prevLocations, newLocation];
      
      // Calculer la distance si nous avons au moins deux points
      if (newLocations.length > 1) {
        const lastIndex = newLocations.length - 1;
        const prevLat = newLocations[lastIndex - 1].latitude;
        const prevLon = newLocations[lastIndex - 1].longitude;
        const newDistance = calculateDistance(prevLat, prevLon, latitude, longitude);
        
        setDistance(prevDistance => prevDistance + newDistance);
      }
      
      return newLocations;
    });
    
    // Mettre à jour la vitesse
    setSpeed(currentSpeed || 0);
  };

  const pauseRun = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    setIsRunning(false);
    setIsPaused(true);
  };

  const resumeRun = async () => {
    try {
      setIsRunning(true);
      setIsPaused(false);
      
      // Redémarrer le suivi de la localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        handleLocationUpdate
      );
      
      setLocationSubscription(subscription);
      
      // Redémarrer le chronomètre
      const interval = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
    } catch (err) {
      console.error('Error resuming run:', err);
      setError('Impossible de reprendre la course');
    }
  };

  const finishRun = async () => {
    try {
      // Arrêter tous les abonnements
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
      
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Finaliser les données de la course
      const finishedRun = {
        ...currentRun,
        endTime: new Date().toISOString(),
        distance: distance,
        duration: duration,
        locations: locationHistory,
        averageSpeed: distance / (duration || 1),
      };
      
      // Enregistrer la course localement
      const updatedHistory = [...runHistory, finishedRun];
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Tenter de sauvegarder sur le serveur
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          await apiService.saveRun(finishedRun);
        } catch (apiError) {
          console.log('Failed to save to server, but saved locally');
        }
      }
      
      // Réinitialiser l'état
      setIsRunning(false);
      setIsPaused(false);
      setCurrentRun(null);
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setSpeed(0);
      
      // Afficher un résumé
      Alert.alert(
        'Course terminée !',
        `Distance: ${(distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(duration)}`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.error('Error finishing run:', err);
      setError('Erreur lors de la finalisation');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const deleteRun = async (runId) => {
    try {
      const updatedHistory = runHistory.filter(run => run.id !== runId);
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Tenter de supprimer du serveur
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          await apiService.deleteRun(runId);
        } catch (apiError) {
          console.log('Failed to delete from server, but deleted locally');
        }
      }
    } catch (err) {
      console.error('Error deleting run:', err);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <RunContext.Provider
      value={{
        // État de la course
        isRunning,
        isPaused,
        currentRun,
        locationHistory,
        distance,
        duration,
        speed,
        
        // Historique
        runHistory,
        loading,
        error,
        
        // Actions
        startRun,
        pauseRun,
        resumeRun,
        finishRun,
        deleteRun,
        fetchRunHistory,
        
        // Utilitaires
        formatDuration,
        
        // Reset error
        clearError: () => setError(null)
      }}
    >
      {children}
    </RunContext.Provider>
  );
};