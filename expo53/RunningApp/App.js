// App.js - Version complète avec SafeArea
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
  Platform,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import des composants et screens
import GeoDebugJoystick from './components/GeoDebugJoystick';
import RunHistoryScreen from './screens/RunHistoryScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SplashScreen from './screens/SplashScreen';

// Services
import AuthService from './services/AuthService';
import RunService from './services/RunService';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

// Zone boutons bottom sécurisée
function BottomButtonArea({ children }) {
  return (
    <View style={styles.bottomSafeArea}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.95)']}
        style={styles.bottomGradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

// Composant RunPreview
function RunPreview({ run, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * 200);
  }, []);

  const formatTime = (duration) => {
    if (!duration) return '0:00';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '0m';
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.runPreview,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.runPreviewGradient}
      >
        <View style={styles.runPreviewHeader}>
          <Text style={styles.runPreviewDate}>{formatDate(run.date || run.start_time)}</Text>
          <Ionicons name="fitness" size={16} color="#4CAF50" />
        </View>
        
        <View style={styles.runPreviewStats}>
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>{formatDistance(run.distance)}</Text>
            <Text style={styles.runStatLabel}>Distance</Text>
          </View>
          
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>{formatTime(run.duration)}</Text>
            <Text style={styles.runStatLabel}>Durée</Text>
          </View>
          
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>
              {run.maxSpeed ? `${run.maxSpeed.toFixed(1)} km/h` : '0 km/h'}
            </Text>
            <Text style={styles.runStatLabel}>Vitesse max</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Composant LoadingOverlay
function LoadingOverlay({ isVisible, message, runs = [] }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const rotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingHeader}>
          <Animated.View style={[styles.loadingIconContainer, { transform: [{ rotate: rotation }] }]}>
            <Ionicons name="sync" size={24} color="#6366F1" />
          </Animated.View>
          <Text style={styles.loadingTitle}>{message}</Text>
        </View>

        {runs.length > 0 && (
          <ScrollView style={styles.runsContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.runsTitle}>Courses récentes</Text>
            {runs.slice(0, 3).map((run, index) => (
              <RunPreview key={run.id || index} run={run} index={index} />
            ))}
          </ScrollView>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// Écran principal
function MainRunScreen({ navigation }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [runData, setRunData] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    startTime: null,
  });
  const [savedRuns, setSavedRuns] = useState([]);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initialisation...');
  const [locationPermission, setLocationPermission] = useState(false);
  const [user, setUser] = useState(null);

  const mapRef = useRef(null);
  const watchId = useRef(null);
  const intervalId = useRef(null);

  useEffect(() => {
    loadUserData();
    loadSavedRuns();
    initializeLocation();
    
    return () => {
      if (watchId.current) {
        Location.watchPositionAsync.remove && Location.watchPositionAsync.remove(watchId.current);
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadSavedRuns = async () => {
    try {
      setLoadingMessage('Chargement des courses...');
      
      const result = await RunService.getUserRuns(1, 20);
      if (result.success && result.data && result.data.runs) {
        const runs = result.data.runs.map(run => ({
          ...run,
          date: run.start_time || run.date,
          maxSpeed: run.max_speed || run.maxSpeed || 0
        }));
        setSavedRuns(runs.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        const localRuns = await RunService.getAllRuns();
        setSavedRuns(localRuns.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (error) {
      console.error('Erreur chargement courses:', error);
      const localRuns = await RunService.getAllRuns();
      setSavedRuns(localRuns.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const initializeLocation = async () => {
    try {
      setLoadingMessage('Demande d\'autorisation GPS...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingMessage('Permission GPS refusée');
        setTimeout(() => {
          setIsLocationLoading(false);
          Alert.alert('Permission refusée', 'La géolocalisation est requise pour l\'application');
        }, 1000);
        return;
      }

      setLocationPermission(true);
      setLoadingMessage('Recherche de votre position...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLoadingMessage('Position trouvée !');
      setCurrentLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLocationLoading(false);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      setLoadingMessage('Erreur de géolocalisation');
      setTimeout(() => setIsLocationLoading(false), 2000);
    }
  };

  const startRun = async () => {
    if (!locationPermission) {
      Alert.alert('Erreur', 'Permission GPS requise pour démarrer une course');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setIsRunning(true);
      setIsPaused(false);
      setRunData({
        distance: 0,
        duration: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        startTime: Date.now(),
      });
      setRoute([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);

      startLocationTracking();
      startTimer();

      Alert.alert('Course démarrée', 'Bonne course !');
    } catch (error) {
      console.error('Erreur démarrage course:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la course');
    }
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    Alert.alert('Course en pause', 'Appuyez sur Play pour reprendre ou Stop pour terminer');
  };

  const resumeRun = () => {
    setIsPaused(false);
    startTimer();
    Alert.alert('Course reprise', 'C\'est reparti !');
  };

  const stopRun = () => {
    Alert.alert(
      'Terminer la course',
      'Voulez-vous arrêter votre course ?',
      [
        { text: 'Continuer', style: 'cancel' },
        { 
          text: 'Terminer', 
          onPress: async () => {
            setIsRunning(false);
            setIsPaused(false);
            
            if (watchId.current) {
              watchId.current.remove();
            }
            if (intervalId.current) {
              clearInterval(intervalId.current);
            }

            // Sauvegarder la course
            const finalRunData = {
              ...runData,
              route: route,
              date: new Date().toISOString(),
            };

            try {
              await RunService.saveRun(finalRunData);
              Alert.alert('Course terminée', 'Bravo ! Votre course a été sauvegardée.');
              loadSavedRuns();
            } catch (error) {
              console.error('Erreur sauvegarde:', error);
              Alert.alert('Course terminée', 'Course terminée mais erreur de sauvegarde');
            }
          }
        }
      ]
    );
  };

  const startLocationTracking = async () => {
    try {
      watchId.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          if (isRunning && !isPaused) {
            const newCoord = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            
            setRoute(prev => [...prev, newCoord]);
            
            // Calculer la distance
            if (route.length > 0) {
              const lastCoord = route[route.length - 1];
              const newDistance = calculateDistance(lastCoord, newCoord);
              setRunData(prev => ({
                ...prev,
                distance: prev.distance + newDistance,
                maxSpeed: Math.max(prev.maxSpeed, location.coords.speed * 3.6 || 0),
              }));
            }
          }
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  const startTimer = () => {
    intervalId.current = setInterval(() => {
      setRunData(prev => {
        const newDuration = prev.duration + 1;
        const avgSpeed = prev.distance > 0 ? (prev.distance / newDuration) * 3.6 : 0;
        return {
          ...prev,
          duration: newDuration,
          avgSpeed: avgSpeed,
        };
      });
    }, 1000);
  };

  const calculateDistance = (coord1, coord2) => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = coord1.latitude * Math.PI/180;
    const φ2 = coord2.latitude * Math.PI/180;
    const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
    const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  };

  const centerOnUser = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion(currentLocation, 1000);
    }
  };

  const handleHistoryPress = () => {
    navigation.navigate('RunHistory');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          onPress: async () => {
            await AuthService.logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <GeoDebugJoystick>
        <View style={styles.container}>
          {/* Carte principale */}
          <View style={styles.mapContainer}>
            {currentLocation && (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={currentLocation}
                showsUserLocation={true}
                showsMyLocationButton={false}
                followsUserLocation={isRunning}
                mapType="standard"
              >
                {route.length > 0 && (
                  <Polyline
                    coordinates={route}
                    strokeColor="#4CAF50"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
                
                {route.length > 0 && (
                  <Marker
                    coordinate={route[0]}
                    title="Départ"
                    pinColor="#4CAF50"
                  />
                )}
              </MapView>
            )}
          </View>

          {/* Stats en cours de course */}
          {isRunning && (
            <View style={styles.statsOverlay}>
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
                style={styles.statsContainer}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(runData.distance / 1000).toFixed(2)}</Text>
                  <Text style={styles.statLabel}>km</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.floor(runData.duration / 60)}:{(runData.duration % 60).toString().padStart(2, '0')}</Text>
                  <Text style={styles.statLabel}>temps</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{runData.avgSpeed.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>km/h</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Bouton centrer */}
          <TouchableOpacity 
            style={styles.centerButton} 
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color={currentLocation ? "#4CAF50" : "#666"} />
          </TouchableOpacity>

          {/* Navigation bottom avec SafeArea */}
          <BottomButtonArea>
            {!isRunning ? (
              <View style={styles.navigationMenu}>
                <TouchableOpacity onPress={handleHistoryPress} style={styles.navButton}>
                  <Ionicons name="list" size={24} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.navButtonText}>Historique</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={startRun} 
                  style={[styles.startButton, !locationPermission && styles.startButtonDisabled]}
                  disabled={!locationPermission}
                >
                  <LinearGradient
                    colors={locationPermission ? ['#4CAF50', '#45a049'] : ['#666', '#555']}
                    style={styles.startButtonGradient}
                  >
                    <Ionicons name="play" size={24} color="white" />
                    <Text style={styles.startButtonText}>START</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogoutPress} style={styles.navButton}>
                  <Ionicons name="log-out" size={24} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.navButtonText}>Déconnexion</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.runningControls}>
                <TouchableOpacity 
                  onPress={isPaused ? resumeRun : pauseRun} 
                  style={[styles.controlButton, isPaused ? styles.playButton : styles.pauseButton]}
                >
                  <Ionicons name={isPaused ? "play" : "pause"} size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={stopRun} style={[styles.controlButton, styles.stopButton]}>
                  <Ionicons name="stop" size={28} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Info utilisateur */}
            {user && (
              <View style={styles.userInfoArea}>
                <Text style={styles.userInfoText}>
                  Connecté : {user.username || user.email}
                </Text>
              </View>
            )}
          </BottomButtonArea>

          <LoadingOverlay
            isVisible={isLocationLoading}
            message={loadingMessage}
            runs={savedRuns}
          />
        </View>
      </GeoDebugJoystick>
    </SafeAreaView>
  );
}

// Navigation principale
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  centerButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  bottomGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navigationMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  navButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 35,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    paddingVertical: 10,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  userInfoArea: {
    alignItems: 'center',
    paddingTop: 8,
  },
  userInfoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingHeader: {
    alignItems: 'center',
    marginBottom: 30,
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
  runsContainer: {
    flex: 1,
  },
  runsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  runPreview: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  runPreviewGradient: {
    padding: 15,
  },
  runPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  runPreviewDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  runPreviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runStat: {
    alignItems: 'center',
    flex: 1,
  },
  runStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  runStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});