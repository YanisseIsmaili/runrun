import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Charger l'historique des courses
  useEffect(() => {
    fetchRunHistory();
  }, []);

  // Demander la permission d'accéder à la localisation
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission refusée', 
            'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner correctement.'
          );
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
      }
    })();
  }, []);

  
  // Calculer la distance entre deux coordonnées (formule de Haversine) du point A (lat1, lon1) au point B (lat2, lon2) 
  // https://fr.wikipedia.org/wiki/Formule_de_Haversine
  // l'utilisation de la formule de Haversine est courante pour calculer la distance entre deux points sur la surface d'une sphère, comme la Terre.
  // Cette formule prend en compte la courbure de la Terre et est plus précise que la simple distance euclidienne, surtout sur de longues distances.
  // Elle est particulièrement utile pour les applications de navigation, de géolocalisation et de suivi d'activités comme la course à pied.
  // La formule de Haversine est basée sur la trigonométrie sphérique et utilise les coordonnées géographiques (latitude et longitude) des deux points.

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    //paratmètres de la formule de Haversine
    const R = 6371e3; // Rayon de la terre en mètres
    const φ1 = (lat1 * Math.PI) / 180; // φ1 c'est la latitude du point A en radians
    const φ2 = (lat2 * Math.PI) / 180; // φ2 c'est la latitude du point B en radians  
    const Δφ = ((lat2 - lat1) * Math.PI) / 180; // Différence de latitude en radians
    const Δλ = ((lon2 - lon1) * Math.PI) / 180; // Différence de longitude en radians

    const a =
      // Trigonometrique de Haversine 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // c la distance angulaire entre les deux points ou hypoténuse de la sphère
    const d = R * c; // Distance en mètres , c est la distance angulaire entre les deux points et R est le rayon de la Terre

    return d;
  };

  // Récupérer l'historique des courses
  const fetchRunHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer de récupérer depuis le stockage local
      const storedHistory = await AsyncStorage.getItem('runHistory');
      if (storedHistory) {
        setRunHistory(JSON.parse(storedHistory));
      } else {
        // Si pas d'historique, créer quelques courses d'exemple pour la démonstration
        const sampleRuns = [
          {
            id: '1',
            startTime: new Date(Date.now() - 86400000).toISOString(), // hier
            endTime: new Date(Date.now() - 86400000 + 1800000).toISOString(), // 30 min plus tard
            distance: 5000, // 5 km
            duration: 1800, // 30 minutes
            locations: []
          },
          {
            id: '2',
            startTime: new Date(Date.now() - 172800000).toISOString(), // avant-hier
            endTime: new Date(Date.now() - 172800000 + 2400000).toISOString(), // 40 min plus tard
            distance: 6500, // 6.5 km
            duration: 2400, // 40 minutes
            locations: []
          }
        ];
        setRunHistory(sampleRuns);
        await AsyncStorage.setItem('runHistory', JSON.stringify(sampleRuns));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      setError('Impossible de charger l\'historique des courses');
    } finally {
      setLoading(false);
    }
  };

  // Démarrer une nouvelle course
  const startRun = async () => {
    try {
      // Vérifier les permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la localisation est nécessaire pour démarrer une course.'
        );
        return;
      }

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
            setSpeed(currentSpeed || 0);
            
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
            
            setSpeed(currentSpeed || 0);
            
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
        [{ text: 'OK', onPress: () => console.log('Course terminée') }]
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

  // Nettoyer les abonnements au démontage du composant
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [locationSubscription, timerInterval]);

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