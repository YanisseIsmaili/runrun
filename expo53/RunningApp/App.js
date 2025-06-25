// App.js - Version avec centrage GPS automatique
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Services
import AuthService from './services/AuthService';
import RunService from './services/RunService';

// Screens
import RunHistoryScreen from './screens/RunHistoryScreen';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

// Écran principal de course
function MainRunScreen({ navigation }) {
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
  const [segments, setSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);

  // États traîner
  const [trail, setTrail] = useState([]);
  const [showTrail, setShowTrail] = useState(true);
  const [trailDensity, setTrailDensity] = useState('normal');

  // 🔧 NOUVEAU: État pour le centrage automatique
  const [followUser, setFollowUser] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const segmentStartTime = useRef(null);
  const segmentStartDistance = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const SEGMENT_DISTANCE = 500;
  const TRAIL_CONFIG = {
    dense: { interval: 1000, maxPoints: 200, radius: 3 },
    normal: { interval: 2000, maxPoints: 150, radius: 4 },
    sparse: { interval: 5000, maxPoints: 100, radius: 5 }
  };

  useEffect(() => {
    requestLocationPermission();
    loadUser();
  }, []);

  // 🔧 NOUVEAU: Centrage automatique de la carte
  useEffect(() => {
    if (location && mapRef.current && followUser && mapInitialized) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom plus serré
        longitudeDelta: 0.005,
      };
      
      mapRef.current.animateToRegion(region, 500);
    }
  }, [location, followUser, mapInitialized]);

  // 🔧 NOUVEAU: Activer le suivi automatique pendant la course
  useEffect(() => {
    if (isRunning && !isPaused) {
      setFollowUser(true);
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRunning, isPaused]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isRunning ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRunning]);

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

  useEffect(() => {
    let trailInterval;
    if (isRunning && !isPaused && location && showTrail) {
      const config = TRAIL_CONFIG[trailDensity];
      trailInterval = setInterval(() => {
        addTrailPoint();
      }, config.interval);
    }
    return () => {
      if (trailInterval) clearInterval(trailInterval);
    };
  }, [isRunning, isPaused, location, showTrail, trailDensity]);

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          resetRun();
          navigation.replace('Auth');
        }
      }
    ]);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert('Permission refusée', 'Géolocalisation requise');
      }
    } catch (error) {
      console.error('Erreur permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setMapInitialized(true); // 🔧 NOUVEAU: Marquer la carte comme initialisée
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 2, // 🔧 AMÉLIORATION: Distance plus petite pour un suivi plus précis
        },
        (newLocation) => {
          setLocation(newLocation);
          
          const currentSpeed = (newLocation.coords.speed && newLocation.coords.speed > 0) ? 
            newLocation.coords.speed * 3.6 : 0;
          setSpeed(currentSpeed);
          
          if (currentSpeed > maxSpeed) {
            setMaxSpeed(currentSpeed);
          }
          
          if (previousLocation && isRunning && !isPaused) {
            const newDistance = calculateDistance(
              previousLocation.coords,
              newLocation.coords
            );
            
            const newTotalDistance = distance + newDistance;
            setDistance(newTotalDistance);
            
            const newCoordinate = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };
            setRouteCoordinates(prev => [...prev, newCoordinate]);
            
            checkForNewSegment(newTotalDistance);
          }
          
          setPreviousLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // 🔧 NOUVEAU: Fonction pour basculer le suivi
  const toggleFollowUser = () => {
    setFollowUser(!followUser);
  };

  // 🔧 NOUVEAU: Fonction pour centrer manuellement
  const centerOnUser = () => {
    if (location && mapRef.current) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
      setFollowUser(true);
    }
  };

  // 🔧 NOUVEAU: Détecter quand l'utilisateur bouge la carte manuellement
  const handleMapPanDrag = () => {
    if (followUser) {
      setFollowUser(false);
    }
  };

  const addTrailPoint = () => {
    if (!location || !isRunning || isPaused) return;

    const config = TRAIL_CONFIG[trailDensity];
    const newPoint = {
      id: Date.now() + Math.random(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Date.now(),
      speed: speed,
      opacity: 1.0
    };

    setTrail(prev => {
      let newTrail = [...prev, newPoint];
      if (newTrail.length > config.maxPoints) {
        newTrail = newTrail.slice(-config.maxPoints);
      }
      return newTrail.map((point, index) => ({
        ...point,
        opacity: Math.max(0.1, (index + 1) / newTrail.length)
      }));
    });
  };

  const clearTrail = () => setTrail([]);
  const toggleTrail = () => setShowTrail(!showTrail);

  const changeTrailDensity = () => {
    const densities = ['dense', 'normal', 'sparse'];
    const currentIndex = densities.indexOf(trailDensity);
    const nextIndex = (currentIndex + 1) % densities.length;
    setTrailDensity(densities[nextIndex]);
  };

  const getTrailColor = (point) => {
    if (point.speed < 6) return `rgba(255, 107, 107, ${point.opacity})`;
    if (point.speed < 12) return `rgba(78, 205, 196, ${point.opacity})`;
    return `rgba(69, 183, 209, ${point.opacity})`;
  };

  const calculateDistance = (coords1, coords2) => {
    const R = 6371000;
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

  const checkForNewSegment = (totalDistance) => {
    const segmentNumber = Math.floor(totalDistance / SEGMENT_DISTANCE);
    
    if (currentSegment === null || segmentNumber > currentSegment.number) {
      if (currentSegment !== null) {
        const segmentTime = Date.now() - segmentStartTime.current;
        const segmentDistance = totalDistance - segmentStartDistance.current;
        const segmentSpeed = segmentDistance > 0 ? 
          (segmentDistance / 1000) / (segmentTime / (1000 * 60 * 60)) : 0;
        
        const completedSegment = {
          ...currentSegment,
          endTime: Date.now(),
          distance: segmentDistance,
          duration: segmentTime,
          averageSpeed: segmentSpeed,
        };
        
        setSegments(prev => [...prev, completedSegment]);
      }
      
      const newSegment = {
        number: segmentNumber,
        startTime: Date.now(),
        startDistance: totalDistance,
      };
      
      setCurrentSegment(newSegment);
      segmentStartTime.current = Date.now();
      segmentStartDistance.current = totalDistance;
    }
  };

  const calculateAverageSpeed = () => {
    const timeInHours = elapsedTime / (1000 * 60 * 60);
    const distanceInKm = distance / 1000;
    return timeInHours > 0 ? (distanceInKm / timeInHours).toFixed(1) : '0.0';
  };

  const startRun = () => {
    if (!locationPermission) {
      Alert.alert('Erreur', 'Permissions GPS requises');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setRouteCoordinates([]);
    setSegments([]);
    setCurrentSegment(null);
    setTrail([]);
    setFollowUser(true); // 🔧 NOUVEAU: Activer le suivi au démarrage
    setPreviousLocation(location);
    segmentStartTime.current = Date.now();
    segmentStartDistance.current = 0;
    
    if (location) {
      setRouteCoordinates([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);
    }
    
    startLocationTracking();
  };

  const pauseRun = () => {
    setIsPaused(!isPaused);
  };

  const stopRun = async () => {
    if (currentSegment !== null) {
      const segmentTime = Date.now() - segmentStartTime.current;
      const segmentDistance = distance - segmentStartDistance.current;
      const segmentSpeed = segmentDistance > 0 ? 
        (segmentDistance / 1000) / (segmentTime / (1000 * 60 * 60)) : 0;
      
      const completedSegment = {
        ...currentSegment,
        endTime: Date.now(),
        distance: segmentDistance,
        duration: segmentTime,
        averageSpeed: segmentSpeed,
      };
      
      setSegments(prev => [...prev, completedSegment]);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setCurrentSegment(null);
    setFollowUser(false); // 🔧 NOUVEAU: Désactiver le suivi à l'arrêt
    stopLocationTracking();

    await saveRunToAPI();
    
    Alert.alert(
      '🏁 Course terminée !',
      `⏱️ Temps: ${formatTime(elapsedTime)}\n📏 Distance: ${(distance / 1000).toFixed(2)} km\n📊 Vitesse moyenne: ${calculateAverageSpeed()} km/h\n⚡ Vitesse max: ${maxSpeed.toFixed(1)} km/h\n🎯 Segments: ${segments.length + 1}\n👣 Points de traîner: ${trail.length}`,
      [{ text: 'Super !', style: 'default' }]
    );
  };

  const saveRunToAPI = async () => {
    try {
      const runData = {
        startTime: startTime,
        endTime: Date.now(),
        elapsedTime: elapsedTime,
        distance: distance,
        routeCoordinates: routeCoordinates,
        speed: speed,
        maxSpeed: maxSpeed,
        segments: segments,
        trail: trail
      };

      const formattedData = RunService.formatRunDataForAPI(runData);
      const result = await RunService.createRun(formattedData);

      if (result.success) {
        console.log('Course sauvegardée:', result.data);
      } else {
        console.error('Erreur sauvegarde:', result.message);
        Alert.alert('Avertissement', 'Course terminée mais non sauvegardée');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Avertissement', 'Course terminée mais non sauvegardée');
    }
  };

  const resetRun = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setStartTime(null);
    setPreviousLocation(null);
    setRouteCoordinates([]);
    setSegments([]);
    setCurrentSegment(null);
    setTrail([]);
    setFollowUser(true); // 🔧 NOUVEAU: Réactiver le suivi après reset
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

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const getMapRegion = () => {
    if (!location) return null;
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005, // 🔧 AMÉLIORATION: Zoom plus serré
      longitudeDelta: 0.005,
    };
  };

  const getPaceColor = (speed) => {
    if (speed < 6) return '#FF6B6B';
    if (speed < 12) return '#4ECDC4';
    return '#45B7D1';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>RunTracker</Text>
            <Text style={styles.headerSubtitle}>Pro</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.userWelcome}>Salut, {user?.first_name || user?.username} !</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('RunHistory')}
              style={styles.historyButton}
            >
              <Ionicons name="list-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.trailControlsContainer}>
          <View style={styles.gpsIndicator}>
            <View style={[styles.gpsDot, { backgroundColor: locationPermission ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.gpsText}>
              {locationPermission ? 'GPS' : 'NO GPS'}
            </Text>
          </View>
          
          <View style={styles.trailControls}>
            {/* 🔧 NOUVEAU: Bouton de suivi GPS */}
            <TouchableOpacity onPress={toggleFollowUser} style={styles.trailButton}>
              <Ionicons 
                name={followUser ? "navigate" : "navigate-outline"} 
                size={16} 
                color={followUser ? "#10B981" : "rgba(255, 255, 255, 0.6)"} 
              />
              <Text style={[styles.trailButtonText, { color: followUser ? "#10B981" : "rgba(255, 255, 255, 0.6)" }]}>
                Auto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleTrail} style={styles.trailButton}>
              <Ionicons 
                name={showTrail ? "footsteps" : "footsteps-outline"} 
                size={16} 
                color={showTrail ? "#10B981" : "rgba(255, 255, 255, 0.6)"} 
              />
              <Text style={[styles.trailButtonText, { color: showTrail ? "#10B981" : "rgba(255, 255, 255, 0.6)" }]}>
                Traîner
              </Text>
            </TouchableOpacity>
            
            {showTrail && (
              <TouchableOpacity onPress={changeTrailDensity} style={styles.trailButton}>
                <Ionicons name="options-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.trailButtonText}>
                  {trailDensity === 'dense' ? 'Dense' : trailDensity === 'normal' ? 'Normal' : 'Léger'}
                </Text>
              </TouchableOpacity>
            )}
            
            {trail.length > 0 && (
              <TouchableOpacity onPress={clearTrail} style={styles.trailButton}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={[styles.trailButtonText, { color: "#EF4444" }]}>
                  Effacer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {location && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={getMapRegion()}
              showsUserLocation={true}
              followsUserLocation={false} // 🔧 CHANGEMENT: Désactivé pour contrôle manuel
              showsMyLocationButton={false}
              mapType="standard"
              onPanDrag={handleMapPanDrag} // 🔧 NOUVEAU: Détecter le mouvement manuel
            >
              {showTrail && trail.map((point, index) => (
                <Circle
                  key={point.id}
                  center={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}
                  radius={TRAIL_CONFIG[trailDensity].radius}
                  fillColor={getTrailColor(point)}
                  strokeColor={getTrailColor(point)}
                  strokeWidth={1}
                />
              ))}
              
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#6366F1"
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              
              {routeCoordinates.length > 0 && (
                <Marker
                  coordinate={routeCoordinates[0]}
                  title="Départ"
                >
                  <View style={styles.startMarker}>
                    <Ionicons name="play" size={16} color="white" />
                  </View>
                </Marker>
              )}
              
              {!isRunning && routeCoordinates.length > 1 && (
                <Marker
                  coordinate={routeCoordinates[routeCoordinates.length - 1]}
                  title="Arrivée"
                >
                  <View style={styles.finishMarker}>
                    <Ionicons name="flag" size={16} color="white" />
                  </View>
                </Marker>
              )}
            </MapView>
            
            {/* 🔧 NOUVEAU: Bouton de centrage flottant */}
            {!followUser && location && (
              <TouchableOpacity 
                style={styles.centerButton} 
                onPress={centerOnUser}
              >
                <LinearGradient
                  colors={['rgba(99, 102, 241, 0.9)', 'rgba(139, 92, 246, 0.9)']}
                  style={styles.centerButtonGradient}
                >
                  <Ionicons name="locate" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <Animated.View style={[
              styles.speedOverlay,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                }],
              }
            ]}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.9)', 'rgba(139, 92, 246, 0.9)']}
                style={styles.speedOverlayGradient}
              >
                <Text style={styles.speedOverlayLabel}>VITESSE</Text>
                <Text style={[styles.speedOverlayValue, { color: getPaceColor(speed) }]}>
                  {speed.toFixed(1)}
                </Text>
                <Text style={styles.speedOverlayUnit}>km/h</Text>
              </LinearGradient>
            </Animated.View>

            {showTrail && isRunning && (
              <View style={styles.trailIndicator}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.9)']}
                  style={styles.trailIndicatorGradient}
                >
                  <Ionicons name="footsteps" size={16} color="white" />
                  <Text style={styles.trailIndicatorText}>{trail.length}</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        )}

        {/* Reste du code inchangé... */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="time-outline" size={24} color="#6366F1" />
              <Text style={styles.statLabel}>TEMPS</Text>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="walk-outline" size={24} color="#8B5CF6" />
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="speedometer-outline" size={24} color="#EC4899" />
              <Text style={styles.statLabel}>MOYENNE</Text>
              <Text style={styles.statValue}>{calculateAverageSpeed()}</Text>
              <Text style={styles.statUnit}>km/h</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.statCardGradient}
            >
              <Ionicons name="flash-outline" size={24} color="#10B981" />
              <Text style={styles.statLabel}>MAX</Text>
              <Text style={styles.statValue}>{maxSpeed.toFixed(1)}</Text>
              <Text style={styles.statUnit}>km/h</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {!isRunning ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={startRun}
                disabled={!locationPermission}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.startButtonGradient}
                >
                  <Ionicons name="play" size={32} color="white" />
                  <Text style={styles.startButtonText}>DÉMARRER</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity style={styles.controlButton} onPress={pauseRun}>
                <LinearGradient
                  colors={isPaused ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                  style={styles.controlButtonGradient}
                >
                  <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={stopRun}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.controlButtonGradient}
                >
                  <Ionicons name="stop" size={24} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          
          {!isRunning && (elapsedTime > 0 || distance > 0) && (
            <TouchableOpacity style={styles.resetButton} onPress={resetRun}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.resetButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#9CA3AF" />
                <Text style={styles.resetButtonText}>RESET</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isRunning ? (isPaused ? "⏸️ En pause" : "🏃‍♂️ Course en cours") : "🎯 Prêt à courir"}
          </Text>
          {user && (
            <Text style={styles.userStatusText}>
              Connecté : {user.username}
              {showTrail && trail.length > 0 && ` • ${trail.length} points`}
              {followUser && " • Suivi GPS actif"}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Écran d'authentification
function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return false;
      }
    } else {
      if (!formData.email || !formData.password || !formData.username || !formData.first_name) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return false;
      }
      if (formData.password !== formData.confirm_password) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return false;
      }
      if (formData.password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setAuthLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        result = await AuthService.login(formData.email, formData.password);
      } else {
        result = await AuthService.register({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name
        });
      }

      if (result.success) {
        resetForm();
        navigation.replace('Main');
      } else {
        Alert.alert('Erreur', result.message || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setAuthLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      first_name: '',
      last_name: '',
      confirm_password: ''
    });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Ionicons name="fitness" size={48} color="white" />
            <Text style={styles.headerTitle}>RunTracker Pro</Text>
            <Text style={styles.headerSubtitle}>
              {isLogin ? 'Connectez-vous pour continuer' : 'Créez votre compte'}
            </Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.formGradient}
              >
                <Text style={styles.formTitle}>
                  {isLogin ? 'Connexion' : 'Inscription'}
                </Text>

                {!isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Nom d'utilisateur"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={formData.username}
                        onChangeText={(value) => handleInputChange('username', value)}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputContainer, styles.halfInput]}>
                        <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Prénom"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={formData.first_name}
                          onChangeText={(value) => handleInputChange('first_name', value)}
                        />
                      </View>

                      <View style={[styles.inputContainer, styles.halfInput]}>
                        <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Nom"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={formData.last_name}
                          onChangeText={(value) => handleInputChange('last_name', value)}
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="rgba(255, 255, 255, 0.6)" 
                    />
                  </TouchableOpacity>
                </View>

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={formData.confirm_password}
                      onChangeText={(value) => handleInputChange('confirm_password', value)}
                      secureTextEntry={true}
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSubmit}
                  disabled={authLoading}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.submitButtonGradient}
                  >
                    {authLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name={isLogin ? "log-in" : "person-add"} size={20} color="white" />
                        <Text style={styles.submitButtonText}>
                          {isLogin ? 'SE CONNECTER' : 'S\'INSCRIRE'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchButton} onPress={switchMode}>
                  <Text style={styles.switchButtonText}>
                    {isLogin 
                      ? "Pas encore de compte ? S'inscrire" 
                      : "Déjà un compte ? Se connecter"}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Navigation principale
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Erreur auth check:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#EC4899']}
            style={styles.loadingGradient}
          >
            <Ionicons name="fitness" size={48} color="white" />
            <Text style={styles.loadingText}>RunTracker Pro</Text>
            <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "Main" : "Auth"}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainRunScreen} />
        <Stack.Screen name="RunHistory" component={RunHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    alignItems: 'center',
    paddingVertical: 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  userWelcome: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 12,
  },
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 12,
  },
  trailControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  trailControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
  },
  trailButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  // 🔧 NOUVEAU: Styles pour le bouton de centrage
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centerButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  formGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 16,
  },
  passwordToggle: {
    padding: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  mapContainer: {
    height: height * 0.35,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  speedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  speedOverlayGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  speedOverlayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  speedOverlayValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  speedOverlayUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  trailIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trailIndicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trailIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 6,
  },
  startMarker: {
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  finishMarker: {
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    height: 120,
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  startButton: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  startButtonGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '70%',
  },
  controlButton: {
    borderRadius: 30,
    overflow: 'hidden',
    margin: 8,
  },
  controlButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 16,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
});