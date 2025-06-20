import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function RunningApp() {
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(null);
  
  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);

  // Demander les permissions de géolocalisation
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Timer pour le temps écoulé
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, startTime]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Permission refusée',
          'L\'application a besoin d\'accéder à votre position pour fonctionner.'
        );
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la position:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position actuelle.');
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation);
          
          if (previousLocation && isRunning && !isPaused) {
            const newDistance = calculateDistance(
              previousLocation.coords,
              newLocation.coords
            );
            setDistance(prevDistance => prevDistance + newDistance);
          }
          
          setPreviousLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Erreur lors du suivi de position:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Calcul de la distance entre deux points GPS (formule de Haversine)
  const calculateDistance = (coords1, coords2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.latitude * Math.PI / 180) *
      Math.cos(coords2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startRun = () => {
    if (!locationPermission) {
      Alert.alert('Erreur', 'Permissions de géolocalisation requises');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setDistance(0);
    setPreviousLocation(location);
    startLocationTracking();
  };

  const pauseRun = () => {
    setIsPaused(!isPaused);
  };

  const stopRun = () => {
    setIsRunning(false);
    setIsPaused(false);
    stopLocationTracking();
    
    // Afficher un résumé de la course
    Alert.alert(
      'Course terminée !',
      `Temps: ${formatTime(elapsedTime)}\nDistance: ${(distance / 1000).toFixed(2)} km\nVitesse moyenne: ${calculateAverageSpeed()} km/h`,
      [{ text: 'OK' }]
    );
  };

  const resetRun = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setDistance(0);
    setStartTime(null);
    setPreviousLocation(null);
    stopLocationTracking();
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateAverageSpeed = () => {
    const timeInHours = elapsedTime / (1000 * 60 * 60);
    const distanceInKm = distance / 1000;
    return timeInHours > 0 ? (distanceInKm / timeInHours).toFixed(1) : '0.0';
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Tracker</Text>
        <View style={styles.locationIndicator}>
          <Ionicons 
            name={locationPermission ? "location" : "location-outline"} 
            size={20} 
            color={locationPermission ? "#4CAF50" : "#FF5722"} 
          />
          <Text style={[styles.locationText, { color: locationPermission ? "#4CAF50" : "#FF5722" }]}>
            {locationPermission ? "GPS Activé" : "GPS Désactivé"}
          </Text>
        </View>
      </View>

      {/* Statistiques principales */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TEMPS</Text>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>VITESSE MOY.</Text>
          <Text style={styles.statValue}>{calculateAverageSpeed()} km/h</Text>
        </View>
      </View>

      {/* Position actuelle */}
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Position actuelle</Text>
          <Text style={styles.locationDetails}>
            Lat: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationDetails}>
            Lng: {location.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationDetails}>
            Précision: ±{location.coords.accuracy?.toFixed(0)}m
          </Text>
        </View>
      )}

      {/* Boutons de contrôle */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]} 
            onPress={startRun}
            disabled={!locationPermission}
          >
            <Ionicons name="play" size={30} color="white" />
            <Text style={styles.buttonText}>DÉMARRER</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity 
              style={[styles.button, styles.pauseButton]} 
              onPress={pauseRun}
            >
              <Ionicons name={isPaused ? "play" : "pause"} size={25} color="white" />
              <Text style={styles.buttonTextSmall}>
                {isPaused ? "REPRENDRE" : "PAUSE"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.stopButton]} 
              onPress={stopRun}
            >
              <Ionicons name="stop" size={25} color="white" />
              <Text style={styles.buttonTextSmall}>ARRÊTER</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isRunning && (elapsedTime > 0 || distance > 0) && (
          <TouchableOpacity 
            style={[styles.button, styles.resetButton]} 
            onPress={resetRun}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.buttonTextSmall}>RESET</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isRunning ? (isPaused ? "⏸️ En pause" : "🏃‍♂️ Course en cours") : "⏹️ Prêt à démarrer"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2d2d2d',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  locationContainer: {
    backgroundColor: '#2d2d2d',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  locationDetails: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  button: {
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 5,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    width: 150,
    height: 150,
    borderRadius: 75,
    flexDirection: 'column',
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flex: 0.4,
    flexDirection: 'column',
  },
  stopButton: {
    backgroundColor: '#F44336',
    flex: 0.4,
    flexDirection: 'column',
  },
  resetButton: {
    backgroundColor: '#607D8B',
    marginTop: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});