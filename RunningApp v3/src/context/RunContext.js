import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../services/api';

const RunContext = createContext();

export const useRun = () => {
  const context = useContext(RunContext);
  if (!context) {
    throw new Error('useRun must be used within a RunProvider');
  }
  return context;
};


export const RunProvider = ({ children }) => {
  // États principaux
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

  // Références pour les timers et subscriptions
  const timerInterval = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    loadLocalHistory();
    return () => {
      // Nettoyage lors du démontage
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Calculer les statistiques en temps réel
  useEffect(() => {
    if (isRunning && !isPaused) {
      // Calcul de la vitesse moyenne
      if (duration > 0 && distance > 0) {
        const avgSpeedKmh = (distance / 1000) / (duration / 3600);
        setAverageSpeed(avgSpeedKmh);
        
        // Calcul de l'allure (min/km)
        const paceMinutes = duration / 60 / (distance / 1000);
        if (isFinite(paceMinutes) && paceMinutes > 0) {
          const minutes = Math.floor(paceMinutes);
          const seconds = Math.floor((paceMinutes - minutes) * 60);
          setPace(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        // Estimation des calories (formule simple)
        const caloriesEstimate = Math.round((distance / 1000) * 65); // ~65 kcal par km
        setCalories(caloriesEstimate);
      }
    }
  }, [distance, duration, isRunning, isPaused]);

  const requestLocationPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur permission localisation:', error);
      setError('Erreur lors de la demande de permission');
      return false;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
        
        if (dist > 0.5) { // Seuil pour éviter le bruit GPS
          setDistance(prevDist => {
            const newDist = prevDist + dist;
            console.log('📍 Distance mise à jour:', `+${dist.toFixed(1)}m`, `Total: ${(newDist/1000).toFixed(3)}km`);
            return newDist;
          });
        }
      }
      
      return updated;
    });

    // Mettre à jour la vitesse actuelle
    if (location.coords.speed && location.coords.speed > 0) {
      setCurrentSpeed(location.coords.speed * 3.6); // Convertir m/s en km/h
    }
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
      setError(null);
      
      const newRun = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        locations: [],
        distance: 0,
        duration: 0,
      };
      
      setCurrentRun(newRun);
      
      // Démarrer le timer
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Démarrer le suivi GPS
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        updateLocation
      );
      
      console.log('✅ Course démarrée');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
    } catch (err) {
      console.error('❌ Erreur démarrage:', err);
      setError('Erreur lors du démarrage de la course');
    }
  };

  const pauseRun = () => {
    console.log('⏸️ Course en pause');
    setIsPaused(true);
    
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resumeRun = async () => {
    console.log('▶️ Reprise de la course');
    setIsPaused(false);
    
    try {
      // Redémarrer le timer
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Redémarrer le GPS
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        updateLocation
      );
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Erreur lors de la reprise:', err);
      setError('Impossible de reprendre la course');
    }
  };

  const finishRun = async () => {
    try {
      console.log('🏁 Fin de course...');
      
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
      
      const endTime = new Date().toISOString();
      
      // Préparer les données pour la sauvegarde
      const completedRun = {
        // Données pour l'API (format serveur)
        start_time: currentRun?.startTime || endTime,
        end_time: endTime,
        distance: distance / 1000, // Convertir en kilomètres
        duration: duration,
        avg_speed: averageSpeed > 0 ? averageSpeed / 3.6 : 0, // Convertir km/h en m/s
        max_speed: currentSpeed > 0 ? currentSpeed / 3.6 : 0, // Convertir km/h en m/s
        calories_burned: calories,
        elevation_gain: 0,
        status: 'finished',
        weather_conditions: null,
        notes: 'Course enregistrée via application mobile',
        
        // Données locales pour l'affichage
        id: currentRun?.id || Date.now(),
        startTime: currentRun?.startTime || endTime,
        endTime: endTime,
        distanceMeters: distance,
        locations: locationHistory,
        averageSpeed: averageSpeed,
        pace: pace,
      };

      console.log('📊 Résumé de course:', {
        distance: `${(distance/1000).toFixed(2)} km`,
        durée: `${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')}`,
        vitesse: `${averageSpeed.toFixed(1)} km/h`,
        allure: pace,
        calories: calories
      });

      // Sauvegarder sur le serveur
      setLoading(true);
      try {
        const response = await apiService.saveRun(completedRun);
        console.log('✅ Course sauvegardée sur le serveur:', response.data);
        
        // Ajouter l'ID du serveur pour la course locale
        completedRun.serverId = response.data?.data?.id;
        
        // Récupérer l'historique mis à jour du serveur
        await fetchRunHistory();
        
      } catch (apiError) {
        console.warn('⚠️ Échec sauvegarde serveur:', apiError.message);
        
        // Sauvegarder localement en cas d'échec serveur
        const updatedHistory = Array.isArray(runHistory) ? 
          [...runHistory, completedRun] : [completedRun];
        setRunHistory(updatedHistory);
        await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
        
        console.log('📱 Course sauvée localement uniquement');
      }
      
      // Réinitialiser les états
      setCurrentRun(null);
      setLocationHistory([]);
      setDistance(0);
      setDuration(0);
      setCurrentSpeed(0);
      setAverageSpeed(0);
      setPace('00:00');
      setCalories(0);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      return completedRun;
      
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      setError('Erreur lors de la sauvegarde');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchRunHistory = async () => {
    try {
      setLoading(true);
      console.log('🔄 Récupération historique courses...');
      
      const response = await apiService.getRunHistory();
      
      // Debug de la structure
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response.data type:', typeof response.data);
      console.log('🔍 Response keys:', Object.keys(response));
      
      // Extraire les courses
      let serverRuns = [];
      if (response.data && Array.isArray(response.data)) {
        serverRuns = response.data;
        console.log('📊 Courses extraites directement de response.data');
      } else if (response.runs && Array.isArray(response.runs)) {
        serverRuns = response.runs;
        console.log('📊 Courses extraites de response.runs');
      } else {
        console.warn('⚠️ Structure non reconnue, response:', response);
      }
      
      console.log(`📊 ${serverRuns.length} courses reçues du serveur`);
      
      // Transformer les données serveur pour l'affichage local
      const formattedRuns = serverRuns.map(run => ({
        id: run.id,
        serverId: run.id,
        startTime: run.start_time,
        endTime: run.end_time,
        distance: run.distance * 1000, // Convertir km en mètres pour l'affichage
        distanceKm: run.distance, // Garder en km aussi
        duration: run.duration,
        averageSpeed: run.avg_speed ? run.avg_speed * 3.6 : 0, // m/s vers km/h
        maxSpeed: run.max_speed ? run.max_speed * 3.6 : 0,
        calories: run.calories_burned || 0,
        status: run.status,
        notes: run.notes,
        locations: [], // Les locations ne sont pas stockées côté serveur pour le moment
        pace: calculatePace(run.distance, run.duration),
        user: run.user, // Informations utilisateur pour les admins
      }));
      
      setRunHistory(formattedRuns);
      console.log(`✅ ${formattedRuns.length} courses récupérées`);
      
    } catch (error) {
      console.warn('⚠️ Erreur récupération serveur, chargement local:', error.message);
      await loadLocalHistory();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('runHistory');
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        if (Array.isArray(parsedHistory)) {
          setRunHistory(parsedHistory);
          console.log(`📱 ${parsedHistory.length} courses chargées localement`);
        }
      }
    } catch (error) {
      console.error('Erreur chargement local:', error);
      setRunHistory([]);
    }
  };

  const deleteRun = async (runId) => {
    try {
      console.log('🗑️ Suppression course:', runId);
      
      // Trouver la course à supprimer
      const runToDelete = runHistory.find(run => 
        run.id === runId || run.serverId === runId
      );
      
      if (!runToDelete) {
        throw new Error('Course non trouvée');
      }
      
      // Supprimer côté serveur si elle a un ID serveur
      if (runToDelete.serverId) {
        try {
          await apiService.deleteRun(runToDelete.serverId);
          console.log('✅ Course supprimée du serveur');
        } catch (apiError) {
          console.warn('⚠️ Échec suppression serveur:', apiError.message);
        }
      }
      
      // Supprimer localement
      const updatedHistory = runHistory.filter(run => 
        run.id !== runId && run.serverId !== runId
      );
      setRunHistory(updatedHistory);
      await AsyncStorage.setItem('runHistory', JSON.stringify(updatedHistory));
      
      console.log('✅ Course supprimée');
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      throw error;
    }
  };

  const calculatePace = (distanceKm, durationSeconds) => {
    if (!distanceKm || !durationSeconds || distanceKm <= 0) return '00:00';
    
    const paceMinutes = durationSeconds / 60 / distanceKm;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyRuns = runHistory.filter(run => {
      const runDate = new Date(run.startTime);
      return runDate >= oneWeekAgo;
    });
    
    const totalDistance = weeklyRuns.reduce((acc, run) => 
      acc + (run.distanceKm || run.distance / 1000), 0
    );
    const totalDuration = weeklyRuns.reduce((acc, run) => 
      acc + (run.duration || 0), 0
    );
    
    return {
      runs: weeklyRuns.length,
      distance: totalDistance,
      duration: totalDuration,
      pace: weeklyRuns.length > 0 ? calculatePace(totalDistance, totalDuration) : '00:00'
    };
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // États
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
    runHistory: Array.isArray(runHistory) ? runHistory : [],
    loading,
    error,
    
    // Actions
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