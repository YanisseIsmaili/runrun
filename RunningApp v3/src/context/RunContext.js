import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
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
  const statsUpdateInterval = useRef(null);

  // Initialiser les permissions et historique
  useEffect(() => {
    fetchRunHistory();
    requestLocationPermissions();
  }, []);

  // Timer pour mettre à jour les statistiques périodiquement
  const updateRealTimeStats = useCallback(() => {
    if (isRunning && !isPaused && distance > 0 && duration > 0) {
      // Calcul de la vitesse en km/h
      const distanceKm = distance / 1000;
      const durationHours = duration / 3600;
      const speedKmh = distanceKm / durationHours;
      
      // Validation et mise à jour de la vitesse
      const validSpeed = speedKmh > 0 && speedKmh < 50 ? speedKmh : 0;
      setCurrentSpeed(validSpeed);
      setAverageSpeed(validSpeed);
      
      // Calcul de l'allure (minutes par kilomètre)
      if (distanceKm > 0) {
        const paceMinPerKm = duration / 60 / distanceKm;
        const paceMin = Math.floor(paceMinPerKm);
        const paceSec = Math.floor((paceMinPerKm - paceMin) * 60);
        
        // Validation de l'allure (entre 2:00 et 20:00 min/km)
        if (paceMinPerKm >= 2 && paceMinPerKm <= 20) {
          setPace(`${paceMin}:${paceSec.toString().padStart(2, '0')}`);
        }
      }
      
      // Calcul des calories (estimation: 70 cal/km)
      setCalories(Math.floor(distanceKm * 70));
      
      console.log('🔄 Stats temps réel:', {
        distance: `${distanceKm.toFixed(3)} km`,
        duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        speed: `${validSpeed.toFixed(1)} km/h`,
        pace: pace,
        calories: Math.floor(distanceKm * 70)
      });
    }
  }, [isRunning, isPaused, distance, duration, pace]);

  // Démarrer/arrêter la mise à jour des statistiques
  useEffect(() => {
    if (isRunning && !isPaused) {
      // Mettre à jour les stats toutes les 2 secondes
      statsUpdateInterval.current = setInterval(updateRealTimeStats, 2000);
    } else {
      if (statsUpdateInterval.current) {
        clearInterval(statsUpdateInterval.current);
        statsUpdateInterval.current = null;
      }
    }

    return () => {
      if (statsUpdateInterval.current) {
        clearInterval(statsUpdateInterval.current);
      }
    };
  }, [isRunning, isPaused, updateRealTimeStats]);

  // Nettoyer les intervalles au démontage
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (statsUpdateInterval.current) {
        clearInterval(statsUpdateInterval.current);
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
    if (distance === 0 || duration === 0) return '00:00';
    const distanceKm = distance / 1000;
    const paceInSeconds = duration / distanceKm;
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchRunHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        try {
          const response = await apiService.getRunHistory();
          // Vérification que la réponse contient des données valides
          const historyData = response?.data || response || [];
          setRunHistory(Array.isArray(historyData) ? historyData : []);
        } catch (apiError) {
          console.log('Erreur API, utilisation du stockage local');
          await loadLocalHistory();
        }
      } else {
        await loadLocalHistory();
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement de l\'historique');
      setRunHistory([]); // Assure un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const loadLocalHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('runHistory');
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // Vérification que les données parsées sont un tableau
        setRunHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
      } else {
        setRunHistory([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement local:', error);
      setRunHistory([]);
    }
  };

  const updateLocation = (location) => {
    const newLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      speed: location.coords.speed || 0,
    };
    
    setLocationHistory(prev => {
      const updated = [...prev, newLocation];
      
      if (updated.length > 1) {
        const lastTwo = updated.slice(-2);
        const dist = calculateDistance(
          lastTwo[0].latitude,
          lastTwo[0].longitude,
          lastTwo[1].latitude,
          lastTwo[1].longitude
        );
        
        // Ajouter la distance même si petite, mais avec un seuil pour éviter le bruit
        if (dist > 0.5) { // Seuil très bas pour détecter tout mouvement réel
          setDistance(prevDist => {
            const newDist = prevDist + dist;
            console.log('📍 Nouvelle position:', {
              distance: `+${dist.toFixed(1)}m`,
              total: `${(newDist / 1000).toFixed(3)}km`
            });
            return newDist;
          });
        }
      }
      
      return updated;
    });
  };

  const startRun = async () => {
    try {
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) return;

      console.log('🏃‍♂️ Démarrage de la course...');

      // Réinitialiser tous les états
      setIsRunning(true);
      setIsPaused(false);
      setDistance(0);
      setDuration(0);
      setLocationHistory([]);
      setCurrentSpeed(0);
      setAverageSpeed(0);
      setPace('00:00');
      setCalories(0);
      
      const newRun = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        locations: [],
        distance: 0,
        duration: 0,
      };
      
      setCurrentRun(newRun);
      
      // Démarrer le timer de durée
      timerInterval.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          console.log('⏱️ Durée:', `${Math.floor(newDuration / 60)}:${(newDuration % 60).toString().padStart(2, '0')}`);
          return newDuration;
        });
      }, 1000);
      
      // Démarrer le suivi GPS
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Toutes les 2 secondes
          distanceInterval: 1, // Tous les 1 mètre
        },
        (location) => {
          console.log('📍 Nouvelle position GPS reçue');
          updateLocation(location);
        }
      );
      
      console.log('✅ Course démarrée avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors du démarrage:', err);
      setError('Erreur lors du démarrage de la course');
    }
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
  };

  const resumeRun = async () => {
    setIsPaused(false);
    
    // Redémarrer le timer
    timerInterval.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    
    // Redémarrer le GPS
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        updateLocation
      );
    } catch (err) {
      console.error('Erreur lors de la reprise:', err);
      setError('Impossible de reprendre la course');
    }
  };

  const finishRun = async () => {
    try {
      // Arrêter les timers et GPS
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      setIsRunning(false);
      setIsPaused(false);
      
      // Créer l'objet course terminée avec les bonnes unités pour le serveur
      const completedRun = {
        id: currentRun?.id || Date.now(),
        start_time: currentRun?.startTime || new Date().toISOString(),
        end_time: new Date().toISOString(),
        distance: distance / 1000, // Convertir de mètres en kilomètres pour le serveur
        duration: duration, // En secondes
        avg_speed: averageSpeed * (1000/3600), // Convertir de km/h en m/s
        max_speed: averageSpeed * (1000/3600), // Même chose pour max_speed
        calories_burned: calories,
        elevation_gain: 0, // Calculer si vous avez l'altimètre
        status: 'finished',
        notes: `Course enregistrée via l'app mobile`,
        // Données locales pour l'app (conservées pour compatibilité)
        startTime: currentRun?.startTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        distanceMeters: distance, // Distance en mètres pour l'affichage local
        locations: locationHistory,
        averageSpeed: averageSpeed,
        pace: pace,
      };
      
      // Mettre à jour l'historique
      const updatedHistory = Array.isArray(runHistory) ? [...runHistory, completedRun] : [completedRun];
      setRunHistory(updatedHistory);
      
      // Sauvegarder localement
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      // Essayer de sauvegarder sur le serveur avec un format adapté
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          // Préparer les données pour l'API serveur (format backend)
          const serverRunData = {
            start_time: completedRun.start_time,
            end_time: completedRun.end_time,
            distance: completedRun.distance, // Déjà en km
            duration: completedRun.duration, // En secondes
            avg_speed: completedRun.avg_speed, // En m/s
            max_speed: completedRun.max_speed, // En m/s
            calories_burned: completedRun.calories_burned,
            elevation_gain: completedRun.elevation_gain,
            status: completedRun.status,
            notes: completedRun.notes
          };
          
          console.log('📤 Données envoyées au serveur:', serverRunData);
          await apiService.saveRun(serverRunData);
          console.log('✅ Course sauvegardée sur le serveur');
        } catch (apiError) {
          console.log('❌ Erreur de sauvegarde serveur:', apiError);
          console.log('📱 Course sauvée localement uniquement');
        }
      }
      
      // Réinitialiser les valeurs
      setCurrentRun(null);
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setCurrentSpeed(0);
      setAverageSpeed(0);
      setPace('00:00');
      setCalories(0);
      
      // Afficher un résumé avec les bonnes unités
      Alert.alert(
        'Course terminée !',
        `Distance: ${(distance / 1000).toFixed(2)} km\nDurée: ${formatDuration(duration)}\nAllure: ${pace}/km\nCalories: ${calories} kcal`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.error('Erreur lors de la finalisation:', err);
      setError('Erreur lors de la finalisation');
    }
  };

  const deleteRun = async (runId) => {
    try {
      // Vérification de sécurité
      if (!Array.isArray(runHistory)) {
        console.error('runHistory n\'est pas un tableau');
        return;
      }

      const updatedHistory = runHistory.filter(run => run && run.id !== runId);
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
    if (typeof seconds !== 'number' || seconds < 0) {
      return '0:00';
    }

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
    // Vérification de sécurité pour runHistory
    if (!Array.isArray(runHistory)) {
      return {
        runs: 0,
        distance: 0,
        duration: 0,
        calories: 0,
        averagePace: '00:00'
      };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyRuns = runHistory.filter(run => 
      run && run.startTime && new Date(run.startTime) >= oneWeekAgo
    );
    
    // Utiliser distanceMeters si disponible, sinon convertir distance depuis km
    const totalDistance = weeklyRuns.reduce((sum, run) => {
      const runDistance = run.distanceMeters || (run.distance * 1000) || 0;
      return sum + runDistance;
    }, 0);
    
    const totalDuration = weeklyRuns.reduce((sum, run) => sum + (run.duration || 0), 0);
    const totalCalories = weeklyRuns.reduce((sum, run) => sum + (run.calories || run.calories_burned || 0), 0);
    
    return {
      runs: weeklyRuns.length,
      distance: totalDistance, // En mètres pour l'affichage
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
    runHistory: Array.isArray(runHistory) ? runHistory : [], // Protection supplémentaire
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