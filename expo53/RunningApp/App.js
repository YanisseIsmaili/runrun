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
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function RunningApp() {
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
  
  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const segmentStartTime = useRef(null);
  const segmentStartDistance = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const SEGMENT_DISTANCE = 500;

  // Animation pulse pour le bouton principal
  useEffect(() => {
    if (isRunning && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRunning, isPaused]);

  // Animation slide pour les stats
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isRunning ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRunning]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

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
        Alert.alert('Permission refusée', 'Géolocalisation requise pour le tracking.');
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
      
      if (mapRef.current && currentLocation) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
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
          distanceInterval: 5,
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
            
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }
          }
          
          setPreviousLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
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

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
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

  const stopRun = () => {
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
    stopLocationTracking();
    
    Alert.alert(
      '🏁 Course terminée !',
      `⏱️ Temps: ${formatTime(elapsedTime)}\n📏 Distance: ${(distance / 1000).toFixed(2)} km\n📊 Vitesse moyenne: ${calculateAverageSpeed()} km/h\n⚡ Vitesse max: ${maxSpeed.toFixed(1)} km/h\n🎯 Segments: ${segments.length + 1}`,
      [{ text: 'Super !', style: 'default' }]
    );
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
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const getMapRegion = () => {
    if (!location) return null;
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
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
      
      {/* Header avec gradient */}
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
          <View style={styles.gpsIndicator}>
            <View style={[styles.gpsDot, { backgroundColor: locationPermission ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.gpsText}>
              {locationPermission ? 'GPS' : 'NO GPS'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Carte avec overlay moderne */}
        {location && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={getMapRegion()}
              showsUserLocation={true}
              followsUserLocation={isRunning && !isPaused}
              showsMyLocationButton={false}
              mapType="standard"
              customMapStyle={darkMapStyle}
            >
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#6366F1"
                  strokeWidth={5}
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
            
            {/* Overlay vitesse en temps réel */}
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
                <Text style={styles.speedOverlayLabel}>VITESSE ACTUELLE</Text>
                <Text style={[styles.speedOverlayValue, { color: getPaceColor(speed) }]}>
                  {speed.toFixed(1)}
                </Text>
                <Text style={styles.speedOverlayUnit}>km/h</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {/* Statistiques principales avec cartes glassmorphism */}
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

        {/* Segments avec design moderne */}
        {segments.length > 0 && (
          <View style={styles.segmentsContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.segmentsGradient}
            >
              <View style={styles.segmentsHeader}>
                <Ionicons name="analytics-outline" size={24} color="#6366F1" />
                <Text style={styles.segmentsTitle}>Segments ({SEGMENT_DISTANCE}m)</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentsList}>
                {segments.map((segment, index) => (
                  <View key={index} style={styles.segmentCard}>
                    <Text style={styles.segmentNumber}>#{segment.number + 1}</Text>
                    <Text style={styles.segmentTime}>{formatTime(segment.duration)}</Text>
                    <Text style={styles.segmentSpeed}>{segment.averageSpeed.toFixed(1)} km/h</Text>
                  </View>
                ))}
                
                {currentSegment && isRunning && (
                  <View style={[styles.segmentCard, styles.currentSegmentCard]}>
                    <Text style={styles.segmentNumber}>#{currentSegment.number + 1}</Text>
                    <Text style={styles.segmentTime}>
                      {formatTime(Date.now() - currentSegment.startTime)}
                    </Text>
                    <Text style={styles.segmentSpeed}>{speed.toFixed(1)} km/h</Text>
                    <View style={styles.currentSegmentIndicator} />
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        )}

        {/* Boutons de contrôle */}
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

        {/* Status avec emoji animé */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isRunning ? (isPaused ? "⏸️ En pause" : "🏃‍♂️ Course en cours") : "🎯 Prêt à courir"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1d2c4d"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8ec3b9"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1a3646"}]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
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
  segmentsContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  segmentsGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  segmentsList: {
    flexDirection: 'row',
  },
  segmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentSegmentCard: {
    borderColor: '#6366F1',
    borderWidth: 2,
    position: 'relative',
  },
  currentSegmentIndicator: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  segmentNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  segmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  segmentSpeed: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
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
});