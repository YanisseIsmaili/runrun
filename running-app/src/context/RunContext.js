import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/api';
import * as authService from '../services/auth';

export const RunContext = createContext();

export const RunProvider = ({ children }) => {
  // État de la course actuelle
  const [isRunning, setIsRunning] = useState(false);
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

  // État de l'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Charger l'historique des courses
  useEffect(() => {
    fetchRunHistory();
  }, []);

  // Vérifier le statut de connexion
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Error checking login status:', err);
        // Supprimer le token invalide
        await AsyncStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Demander la permission d'accéder à la localisation
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner correctement.');
      }
    })();
  }, []);

  // Calculer la distance entre deux coordonnées (formule de Haversine)
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
    const d = R * c; // Distance en mètres

    return d;
  };

  // Récupérer l'historique des courses
  const fetchRunHistory = async () => {
    try {
      setLoading(true);
      // Essayer d'abord de récupérer depuis l'API
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const data = await apiService.getRunHistory(token);
        setRunHistory(data);
      } else {
        // Sinon, récupérer localement
        const storedHistory = await AsyncStorage.getItem('runHistory');
        if (storedHistory) {
          setRunHistory(JSON.parse(storedHistory));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      setError('Impossible de charger l\'historique des courses');
      
      // Essayer de récupérer localement en cas d'erreur
      try {
        const storedHistory = await AsyncStorage.getItem('runHistory');
        if (storedHistory) {
          setRunHistory(JSON.parse(storedHistory));
        }
      } catch (storageErr) {
        console.error('Erreur de stockage local:', storageErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Démarrer une nouvelle course
  const startRun = async () => {
    try {
      // Réinitialiser les états
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setSpeed(0);
      
      // Créer un nouvel objet de course
      const newRun = {
        id: Date.now().toString(),
        startTime: new Date(),
        endTime: null,
        distance: 0,
        duration: 0,
        locations: []
      };
      
      setCurrentRun(newRun);
      setIsRunning(true);
      
      // Démarrer le suivi de la localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // Mettre à jour tous les 5 mètres
          timeInterval: 1000, // Ou toutes les secondes
        },
        (location) => {
          const { latitude, longitude, altitude, speed: currentSpeed } = location.coords;
          const timestamp = location.timestamp;
          
          // Ajouter la nouvelle position à l'historique
          setLocationHistory(prevLocations => {
            const newLocations = [...prevLocations, { latitude, longitude, altitude, timestamp }];
            
            // Calculer la distance si nous avons au moins deux points
            if (newLocations.length > 1) {
              const lastIndex = newLocations.length - 1;
              const prevLat = newLocations[lastIndex - 1].latitude;
              const prevLon = newLocations[lastIndex - 1].longitude;
              const newDistance = calculateDistance(prevLat, prevLon, latitude, longitude);
              
              setDistance(prevDistance => prevDistance + newDistance);
            }
            
            // Mettre à jour la vitesse (m/s)
            setSpeed(currentSpeed);
            
            return newLocations;
          });
        }
      );
      
      setLocationSubscription(subscription);
      
      // Démarrer le chronomètre
      const interval = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
    } catch (err) {
      console.error('Erreur lors du démarrage de la course:', err);
      Alert.alert('Erreur', 'Impossible de démarrer la course. Veuillez vérifier vos permissions de localisation.');
    }
  };

  // Mettre en pause une course
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
  };

  // Reprendre une course
  const resumeRun = async () => {
    try {
      setIsRunning(true);
      
      // Redémarrer le suivi de la localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        (location) => {
          // Même logique que dans startRun
          const { latitude, longitude, altitude, speed: currentSpeed } = location.coords;
          const timestamp = location.timestamp;
          
          setLocationHistory(prevLocations => {
            const newLocations = [...prevLocations, { latitude, longitude, altitude, timestamp }];
            
            if (newLocations.length > 1) {
              const lastIndex = newLocations.length - 1;
              const prevLat = newLocations[lastIndex - 1].latitude;
              const prevLon = newLocations[lastIndex - 1].longitude;
              const newDistance = calculateDistance(prevLat, prevLon, latitude, longitude);
              
              setDistance(prevDistance => prevDistance + newDistance);
            }
            
            setSpeed(currentSpeed);
            
            return newLocations;
          });
        }
      );
      
      setLocationSubscription(subscription);
      
      // Redémarrer le chronomètre
      const interval = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
    } catch (err) {
      console.error('Erreur lors de la reprise de la course:', err);
      Alert.alert('Erreur', 'Impossible de reprendre la course.');
    }
  };

  // Terminer une course
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
        endTime: new Date(),
        distance: distance,
        duration: duration,
        locations: locationHistory,
        averageSpeed: distance / (duration || 1), // Éviter la division par zéro
      };
      
      // Enregistrer la course dans l'historique local
      const updatedHistory = [...runHistory, finishedRun];
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Tenter de sauvegarder sur le serveur
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await apiService.saveRun(token, finishedRun);
      }
      
      // Réinitialiser l'état
      setIsRunning(false);
      setCurrentRun(null);
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setSpeed(0);
      
      // Afficher une notification de résumé
      Alert.alert(
        'Course terminée',
        `Distance: ${(distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(duration)}\nVitesse moyenne: ${((distance / 1000) / (duration / 3600)).toFixed(2)} km/h`,
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      
    } catch (err) {
      console.error('Erreur lors de la finalisation de la course:', err);
      Alert.alert('Erreur', 'Problème lors de l\'enregistrement de la course. Veuillez réessayer.');
    }
  };

  // Formater la durée en HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <RunContext.Provider
      value={{
        isRunning,
        currentRun,
        locationHistory,
        distance,
        duration,
        speed,
        runHistory,
        loading,
        error,
        isAuthenticated,
        user,
        startRun,
        pauseRun,
        resumeRun,
        finishRun,
        fetchRunHistory,
        formatDuration
      }}
    >
      {children}
    </RunContext.Provider>
  );
};