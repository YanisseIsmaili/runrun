import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
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
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [pace, setPace] = useState('00:00');
  const [calories, setCalories] = useState(0);
  const [runHistory, setRunHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locationSubscription = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    fetchRunHistory();
    requestLocationPermissions();
    
    return () => {
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculatePace = (distance, duration) => {
    if (distance === 0) return '00:00';
    const paceInSeconds = (duration * 1000) / distance;
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateCalories = (distance, duration, weight = 70) => {
    const MET = 10;
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

      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setCurrentSpeed(0);
      setAverageSpeed(0);
      setPace('00:00');
      setCalories(0);
      setError(null);
      
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
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        handleLocationUpdate
      );
      
      locationSubscription.current = subscription;
      
      timerInterval.current = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Erreur lors du démarrage:', err);
      setError('Impossible de démarrer la course');
    }
  };

  const handleLocationUpdate = (location) => {
    const { latitude, longitude, speed: locationSpeed } = location.coords;
    const timestamp = location.timestamp;
    
    setLocationHistory(prevLocations => {
      const newLocation = { latitude, longitude, timestamp, speed: locationSpeed || 0 };
      const newLocations = [...prevLocations, newLocation];
      
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
          setPace(calculatePace(newDistance, duration));
          setCalories(calculateCalories(newDistance, duration));
          return newDistance;
        });
      }
      
      return newLocations;
    });
    
    const speedKmh = (locationSpeed || 0) * 3.6;
    setCurrentSpeed(speedKmh);
    
    if (duration > 0) {
      setAverageSpeed((distance / 1000) / (duration / 3600));
    }
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
      
      setIsRunning(false);
      setIsPaused(true);
    } catch (err) {
      console.error('Erreur lors de la pause:', err);
    }
  };

  const resumeRun = async () => {
    try {
      setIsRunning(true);
      setIsPaused(false);
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        handleLocationUpdate
      );
      
      locationSubscription.current = subscription;
      
      timerInterval.current = setInterval(() => {
        setDuration(prevDuration => prevDuration + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de la reprise:', err);
      setError('Impossible de reprendre la course');
    }
  };

  const finishRun = async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      if (!currentRun) return;
      
      const finalRun = {
        ...currentRun,
        endTime: new Date().toISOString(),
        distance: distance,
        duration: duration,
        locations: locationHistory,
        averageSpeed: averageSpeed,
        pace: pace,
        calories: calories,
      };
      
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
      
      setIsRunning(false);
      setIsPaused(false);
      setCurrentRun(null);
      
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

  const clearError = () => {
    setError(null);
  };

  const value = {
    isRunning,
    isPaused,
    currentRun,
    locationHistory,
    distance,
    duration,
    currentSpeed,
    averageSpeed,
    pace,
    calories,
    runHistory,
    loading,
    error,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    deleteRun,
    fetchRunHistory,
    formatDuration,
    getWeeklyStats,
    clearError,
  };

  return (
    <RunContext.Provider value={value}>
      {children}
    </RunContext.Provider>
  );
};