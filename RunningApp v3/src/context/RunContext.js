import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/api';

const LOCATION_TASK_NAME = 'background-location-task';

export const RunContext = createContext();

export const useRun = () => {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return context;
};

// Définir la tâche de localisation en arrière-plan
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Erreur de localisation en arrière-plan:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    // Traiter les nouvelles locations ici
    console.log('Nouvelles locations reçues:', locations);
  }
});

export const RunProvider = ({ children }) => {
  // État de la course actuelle
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [pace, setPace] = useState('00:00');
  const [calories, setCalories] = useState(0);

  // État des courses passées
  const [runHistory, setRunHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Références pour les abonnements
  const locationSubscription = useRef(null);
  const timerInterval = useRef(null);
  const startTime = useRef(null);
  const lastNotificationTime = useRef(0);

  useEffect(() => {
    fetchRunHistory();
    requestLocationPermissions();
    
    return () => {
      // Nettoyer les abonnements
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const requestLocationPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner.'
        );
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Permission arrière-plan',
          'Pour un meilleur suivi, activez la localisation en arrière-plan dans les paramètres.'
        );
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
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

  const calculatePace = (distance, duration) => {
    if (distance === 0) return '00:00';
    const paceInSeconds = (duration * 1000) / distance; // secondes par kilomètre
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateCalories = (distance, duration, weight = 70) => {
    // Formule approximative : MET × poids (kg) × durée (heures)
    // Course à pied : MET ≈ 8-12 selon l'intensité
    const MET = 10; // Valeur moyenne
    const durationInHours = duration / 3600;
    return Math.round(MET * weight * durationInHours);
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
          await AsyncStorage.setItem('runHistory', JSON.stringify(data));
        } catch (apiError) {
          console.log('Erreur API, utilisation du cache local');
          const storedHistory = await AsyncStorage.getItem('runHistory');
          if (storedHistory) {
            setRunHistory(JSON.parse(storedHistory));
          }
        }
      } else {
        const storedHistory = await AsyncStorage.getItem('runHistory');
        if (storedHistory) {
          setRunHistory(JSON.parse(storedHistory));
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError('Impossible de charger l\'historique des courses');
    } finally {
      setLoading(false);
    }
  };

  const startRun = async () => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) return;

      // Feedback haptique
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Réinitialiser les états
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setCurrentSpeed(0);
      setAverageSpeed(0);
      setMaxSpeed(0);
      setPace('00:00');
      setCalories(0);
      setError(null);
      
      startTime.current = Date.now();
      
      const newRun = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        endTime: null,
        distance: 0,
        duration: 0,
        locations: [],
        averageSpeed: 0,
        maxSpeed: 0,
        pace: '00:00',
        calories: 0
      };
      
      setCurrentRun(newRun);
      setIsRunning(true);
      setIsPaused(false);
      
      // Démarrer le suivi de localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 3, // Mise à jour tous les 3 mètres
          timeInterval: 1000, // Mise à jour toutes les secondes
        },
        handleLocationUpdate
      );
      
      locationSubscription.current = subscription;
      
      // Démarrer le chronomètre
      timerInterval.current = setInterval(() => {
        setDuration(prevDuration => {
          const newDuration = prevDuration + 1;
          
          // Notifications de progression (tous les kilomètres)
          if (newDuration > 0 && newDuration % 60 === 0) { // Toutes les minutes
            sendProgressNotification(newDuration);
          }
          
          return newDuration;
        });
      }, 1000);

      // Démarrer le suivi en arrière-plan
      if (Platform.OS !== 'web') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          deferredUpdatesInterval: 5000,
          foregroundService: {
            notificationTitle: 'Course en cours',
            notificationBody: 'Suivi de votre course...',
            notificationColor: '#4CAF50',
          },
        });
      }
      
    } catch (err) {
      console.error('Erreur lors du démarrage:', err);
      setError('Impossible de démarrer la course');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLocationUpdate = (location) => {
    const { latitude, longitude, speed: locationSpeed, altitude } = location.coords;
    const timestamp = location.timestamp;
    
    setLocationHistory(prevLocations => {
      const newLocation = { 
        latitude, 
        longitude, 
        altitude: altitude || 0,
        timestamp,
        speed: locationSpeed || 0
      };
      const newLocations = [...prevLocations, newLocation];
      
      // Calculer la distance si nous avons au moins deux points
      if (newLocations.length > 1) {
        const lastIndex = newLocations.length - 1;
        const prevLocation = newLocations[lastIndex - 1];
        const distanceIncrement = calculateDistance(
          prevLocation.latitude,
          prevLocation.longitude,
          latitude,
          longitude
        );
        
        setDistance(prevDistance => {
          const newDistance = prevDistance + distanceIncrement;
          
          // Mettre à jour l'allure
          if (duration > 0) {
            setPace(calculatePace(newDistance, duration));
          }
          
          // Mettre à jour les calories
          setCalories(calculateCalories(newDistance, duration));
          
          return newDistance;
        });
      }
      
      return newLocations;
    });
    
    // Mettre à jour les vitesses
    const speedKmh = (locationSpeed || 0) * 3.6; // Conversion m/s vers km/h
    setCurrentSpeed(speedKmh);
    setMaxSpeed(prevMax => Math.max(prevMax, speedKmh));
    
    // Calculer la vitesse moyenne
    if (duration > 0) {
      setAverageSpeed((distance / 1000) / (duration / 3600));
    }
  };

  const sendProgressNotification = async (duration) => {
    if (Platform.OS === 'web') return;
    
    const now = Date.now();
    if (now - lastNotificationTime.current < 60000) return; // Pas plus d'une notification par minute
    
    const distanceKm = (distance / 1000).toFixed(2);
    const durationStr = formatDuration(duration);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Course en cours',
        body: `${distanceKm} km parcourus en ${durationStr}`,
        data: { type: 'progress' },
      },
      trigger: null,
    });
    
    lastNotificationTime.current = now;
  };

  const pauseRun = async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      // Arrêter le suivi en arrière-plan
      if (Platform.OS !== 'web') {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      
      setIsRunning(false);
      setIsPaused(true);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Erreur lors de la pause:', err);
    }
  };

  const resumeRun = async () => {
    try {
      setIsRunning(true);
      setIsPaused(false);
      
      // Redémarrer le suivi de localisation
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 3,
          timeInterval: 1000,
        },
        handleLocationUpdate
      );
      
      locationSubscription.current = subscription;
      
      // Redémarrer le chronomètre
      timerInterval.current = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
      // Redémarrer le suivi en arrière-plan
      if (Platform.OS !== 'web') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          deferredUpdatesInterval: 5000,
          foregroundService: {
            notificationTitle: 'Course en cours',
            notificationBody: 'Suivi de votre course...',
            notificationColor: '#4CAF50',
          },
        });
      }
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Erreur lors de la reprise:', err);
      setError('Impossible de reprendre la course');
    }
  };

  const finishRun = async () => {
    try {
      // Arrêter tous les abonnements
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      // Arrêter le suivi en arrière-plan
      if (Platform.OS !== 'web') {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      
      if (!currentRun) return;
      
      const finalRun = {
        ...currentRun,
        endTime: new Date().toISOString(),
        distance: distance,
        duration: duration,
        locations: locationHistory,
        averageSpeed: averageSpeed,
        maxSpeed: maxSpeed,
        pace: pace,
        calories: calories,
        steps: Math.round(distance * 1.3), // Estimation approximative
      };
      
      // Mettre à jour l'historique
      const updatedHistory = [finalRun, ...runHistory];
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Sauvegarder sur le serveur
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          await apiService.saveRun(finalRun);
        } catch (apiError) {
          console.log('Erreur de sauvegarde serveur, données gardées localement');
        }
      }
      
      // Réinitialiser l'état
      setIsRunning(false);
      setIsPaused(false);
      setCurrentRun(null);
      
      // Notification de fin
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Course terminée !',
            body: `${(distance / 1000).toFixed(2)} km en ${formatDuration(duration)}`,
            data: { type: 'finished', runId: finalRun.id },
          },
          trigger: null,
        });
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Course terminée !',
        `Distance: ${(distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(duration)}\nAllure: ${pace}/km`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.error('Erreur lors de la finalisation:', err);
      setError('Erreur lors de la finalisation');
    }
  };

  const deleteRun = async (runId) => {
    try {
      const updatedHistory = runHistory.filter(run => run.id !== runId);
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Supprimer du serveur
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          await apiService.deleteRun(runId);
        } catch (apiError) {
          console.log('Erreur lors de la suppression serveur');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyRuns = runHistory.filter(run => 
      new Date(run.startTime) >= oneWeekAgo
    );
    
    const totalDistance = weeklyRuns.reduce((sum, run) => sum + (run.distance || 0), 0);
    const totalDuration = weeklyRuns.reduce((sum, run) => sum + (run.duration || 0), 0);
    const totalCalories = weeklyRuns.reduce((sum, run) => sum + (run.calories || 0), 0);
    
    return {
      runs: weeklyRuns.length,
      distance: totalDistance,
      duration: totalDuration,
      calories: totalCalories,
      averagePace: weeklyRuns.length > 0 ? calculatePace(totalDistance, totalDuration) : '00:00'
    };
  };

  const getMonthlyStats = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const monthlyRuns = runHistory.filter(run => 
      new Date(run.startTime) >= oneMonthAgo
    );
    
    const totalDistance = monthlyRuns.reduce((sum, run) => sum + (run.distance || 0), 0);
    const totalDuration = monthlyRuns.reduce((sum, run) => sum + (run.duration || 0), 0);
    const totalCalories = monthlyRuns.reduce((sum, run) => sum + (run.calories || 0), 0);
    
    return {
      runs: monthlyRuns.length,
      distance: totalDistance,
      duration: totalDuration,
      calories: totalCalories,
      averagePace: monthlyRuns.length > 0 ? calculatePace(totalDistance, totalDuration) : '00:00'
    };
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // État de la course
    isRunning,
    isPaused,
    currentRun,
    locationHistory,
    distance,
    duration,
    currentSpeed,
    averageSpeed,
    maxSpeed,
    pace,
    calories,
    
    // Historique et statistiques
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
    getWeeklyStats,
    getMonthlyStats,
    clearError,
  };

  return (
    <RunContext.Provider value={value}>
      {children}
    </RunContext.Provider>
  );
};