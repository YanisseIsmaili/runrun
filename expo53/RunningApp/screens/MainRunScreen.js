// screens/MainRunScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import des composants
import GeoDebugJoystick from '../components/GeoDebugJoystick';

// Services
import AuthService from '../services/AuthService';
import RunService from '../services/RunService';

const { width, height } = Dimensions.get('window');

export default function MainRunScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [followUser, setFollowUser] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Demande d\'autorisation...');
  const [savedRuns, setSavedRuns] = useState([]);

  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTime]);

  useEffect(() => {
    if (location && mapRef.current && followUser && mapInitialized) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 500);
    }
  }, [location, followUser, mapInitialized]);

  const initializeApp = async () => {
    await loadSavedRuns();
    await loadUser();
    await initializeLocation();
  };

  const loadSavedRuns = async () => {
    try {
      console.log('📊 Chargement des courses sauvegardées...');
      
      // Synchroniser les courses en attente
      await RunService.syncPendingRuns();
      
      const runs = await RunService.getLocalRuns();
      setSavedRuns(runs);
      console.log(`✅ ${runs.length} courses locales chargées`);
      
    } catch (error) {
      console.error('❌ Erreur chargement courses:', error);
      setSavedRuns([]);
    }
  };

  const loadUser = async () => {
    try {
      console.log('👤 Chargement utilisateur...');
      const userData = await AuthService.getUser();
      if (userData) {
        setUser(userData);
        console.log(`✅ Utilisateur chargé: ${userData.username}`);
      } else {
        console.log('❌ Pas de données utilisateur');
        // Rediriger vers login si pas d'utilisateur
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
      navigation.replace('Login');
    }
  };

  const initializeLocation = async () => {
    try {
      setLoadingMessage('Vérification des permissions...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationPermission(false);
        setIsLocationLoading(false);
        Alert.alert(
          'Permission requise',
          'L\'accès à la localisation est nécessaire pour utiliser cette app.',
          [
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
            { text: 'Annuler', style: 'cancel' }
          ]
        );
        return;
      }

      setLocationPermission(true);
      setLoadingMessage('Recherche de votre position...');

      // Obtenir la position actuelle
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      console.log('📍 Position initiale obtenue');

      // Démarrer le suivi de position
      setLoadingMessage('Initialisation du GPS...');
      
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        handleLocationUpdate
      );

      setIsLocationLoading(false);
      console.log('✅ Géolocalisation initialisée');
      
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      setIsLocationLoading(false);
      Alert.alert('Erreur', 'Impossible d\'accéder à votre position');
    }
  };

  const handleLocationUpdate = (newLocation) => {
    setLocation(newLocation);
    
    if (isRunning && !isPaused && previousLocation) {
      const distanceIncrement = calculateDistance(
        previousLocation.coords.latitude,
        previousLocation.coords.longitude,
        newLocation.coords.latitude,
        newLocation.coords.longitude
      );
      
      setDistance(prev => prev + distanceIncrement);
      
      const currentSpeed = newLocation.coords.speed || 0;
      setSpeed(currentSpeed);
      setMaxSpeed(prev => Math.max(prev, currentSpeed));
      
      setRouteCoordinates(prev => [...prev, {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      }]);
    }
    
    setPreviousLocation(newLocation);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  };

  const startRun = () => {
    if (!locationPermission) {
      Alert.alert('Permission requise', 'Autorisation de géolocalisation nécessaire');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setRouteCoordinates(location ? [{
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }] : []);
    
    console.log('🏃 Course démarrée');
  };

  const pauseRun = () => {
    setIsPaused(true);
    console.log('⏸️ Course mise en pause');
  };

  const resumeRun = () => {
    setIsPaused(false);
    setStartTime(Date.now() - elapsedTime);
    console.log('▶️ Course reprise');
  };

  const stopRun = async () => {
    Alert.alert(
      'Arrêter la course',
      'Voulez-vous sauvegarder cette course ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: abandonRun },
        { text: 'Sauvegarder', onPress: saveRun }
      ]
    );
  };

  const saveRun = async () => {
    try {
      console.log('💾 Sauvegarde de la course...');
      
      const runData = {
        distance: parseFloat(distance.toFixed(2)),
        duration: Math.floor(elapsedTime / 1000),
        maxSpeed: parseFloat(maxSpeed.toFixed(2)),
        avgSpeed: elapsedTime > 0 ? parseFloat(((distance / (elapsedTime / 1000)) * 3.6).toFixed(2)) : 0,
        coordinates: routeCoordinates,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
      };

      const result = await RunService.saveRun(runData);
      
      if (result.success) {
        console.log('✅ Course sauvegardée');
        Alert.alert('Succès', 'Course sauvegardée avec succès !');
        await loadSavedRuns(); // Recharger la liste
      } else {
        console.log('❌ Erreur sauvegarde:', result.message);
        Alert.alert('Erreur', result.message || 'Erreur lors de la sauvegarde');
      }
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde course:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la course');
    } finally {
      resetRun();
    }
  };

  const abandonRun = () => {
    console.log('🗑️ Course abandonnée');
    resetRun();
  };

  const resetRun = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime(0);
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setRouteCoordinates([]);
    setPreviousLocation(null);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speedMs) => {
    return (speedMs * 3.6).toFixed(1); // Conversion m/s en km/h
  };

  const LoadingOverlay = ({ isVisible, message, runs }) => {
    if (!isVisible) return null;

    return (
      <View style={styles.loadingOverlay}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Animated.View style={styles.loadingIconContainer}>
              <Ionicons name="location" size={30} color="#6366F1" />
            </Animated.View>
            
            <Text style={styles.loadingTitle}>{message}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar} />
            </View>
            
            {runs.length > 0 && (
              <View style={styles.runsPreview}>
                <Text style={styles.runsPreviewTitle}>
                  📊 {runs.length} course{runs.length > 1 ? 's' : ''} locale{runs.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (isLocationLoading) {
    return (
      <LoadingOverlay
        isVisible={true}
        message={loadingMessage}
        runs={savedRuns}
      />
    );
  }

  return (
    <GeoDebugJoystick>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.navigate('RunHistory')}>
                <Ionicons name="list" size={24} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {user ? `Salut ${user.username}!` : 'RunTracker'}
              </Text>
              
              <TouchableOpacity onPress={logout}>
                <Ionicons name="exit-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Map */}
        <View style={styles.mapContainer}>
          {location && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              showsUserLocation={true}
              followsUserLocation={followUser}
              onMapReady={() => setMapInitialized(true)}
            >
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#4CAF50"
                  strokeWidth={4}
                />
              )}
              
              {location && (
                <Circle
                  center={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  radius={location.coords.accuracy || 10}
                  fillColor="rgba(76, 175, 80, 0.2)"
                  strokeColor="rgba(76, 175, 80, 0.5)"
                  strokeWidth={1}
                />
              )}
            </MapView>
          )}
        </View>

        {/* Stats Panel */}
        <LinearGradient
          colors={['rgba(26, 26, 46, 0.95)', 'rgba(22, 33, 62, 0.95)', 'rgba(15, 52, 96, 0.95)']}
          style={styles.statsPanel}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#4CAF50" />
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.statLabel}>Temps</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="walk" size={20} color="#2196F3" />
              <Text style={styles.statValue}>{(distance / 1000).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distance (km)</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={20} color="#FF9800" />
              <Text style={styles.statValue}>{formatSpeed(speed)}</Text>
              <Text style={styles.statLabel}>Vitesse (km/h)</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!isRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={startRun}>
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.buttonGradient}
              >
                <Ionicons name="play" size={30} color="white" />
                <Text style={styles.buttonText}>Commencer</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={isPaused ? resumeRun : pauseRun}
              >
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={24} 
                  color={isPaused ? "#4CAF50" : "#FF9800"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={stopRun}>
                <Ionicons name="stop" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Follow User Toggle */}
        {location && (
          <TouchableOpacity
            style={[styles.followButton, { backgroundColor: followUser ? "#4CAF50" : "#666" }]}
            onPress={() => setFollowUser(!followUser)}
          >
            <Ionicons 
              name="locate" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>
    </GeoDebugJoystick>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loadingGradient: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    width: '70%',
  },
  runsPreview: {
    marginTop: 30,
    alignItems: 'center',
  },
  runsPreviewTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsPanel: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButton: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});