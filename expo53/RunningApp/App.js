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
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import des composants et screens
import GeoDebugJoystick from './components/GeoDebugJoystick';
import RunHistoryScreen from './screens/RunHistoryScreen';

// Services existants
import AuthService from './services/AuthService';
import RunService from './services/RunService';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

// ÉCRANS D'AUTHENTIFICATION
function AuthCheckScreen({ navigation }) {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuthenticated = await AuthService.isAuthenticated();
    if (isAuthenticated) {
      navigation.replace('Main');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.authCheckContainer}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D1B69']}
        style={styles.authCheckGradient}
      >
        <Ionicons name="flash" size={64} color="#6366F1" />
        <Text style={styles.authCheckText}>RunTracker</Text>
      </LinearGradient>
    </View>
  );
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await AuthService.login(email, password);
      } else {
        if (!username || !firstName || !lastName) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs');
          setLoading(false);
          return;
        }
        result = await AuthService.register({
          email,
          password,
          username,
          first_name: firstName,
          last_name: lastName,
        });
      }

      if (result.success) {
        navigation.replace('Main');
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
    setLoading(false);
  };

  return (
    <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D1B69', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loginGradient}
      >
        <ScrollView contentContainerStyle={styles.loginScrollView}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#EC4899', '#8B5CF6', '#6366F1']}
              style={styles.logoBackground}
            >
              <Ionicons name="flash" size={40} color="white" />
            </LinearGradient>
            <Text style={styles.logoText}>RunTracker</Text>
            <Text style={styles.logoSubtext}>Votre compagnon de course</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Connexion
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Inscription
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom d'utilisateur"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#EC4899', '#8B5CF6', '#6366F1']}
                style={styles.authButtonGradient}
              >
                <Text style={styles.authButtonText}>
                  {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'S\'inscrire'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}

// COMPOSANTS EXISTANTS (RunPreview, LoadingOverlay)
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
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <Ionicons name="footsteps" size={16} color="#6366F1" />
          <Text style={styles.runPreviewDate}>{formatDate(run.date || run.start_time)}</Text>
        </View>
        
        <View style={styles.runPreviewStats}>
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>{formatDistance(run.distance)}</Text>
            <Text style={styles.runStatLabel}>Distance</Text>
          </View>
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>{formatTime(run.duration)}</Text>
            <Text style={styles.runStatLabel}>Temps</Text>
          </View>
          <View style={styles.runStat}>
            <Text style={styles.runStatValue}>{(run.maxSpeed || run.max_speed || 0).toFixed(1)}</Text>
            <Text style={styles.runStatLabel}>km/h max</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function LoadingOverlay({ isVisible, message, runs }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
  });

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.loadingOverlay,
        { opacity: fadeAnim }
      ]}
    >
      <LinearGradient
        colors={['rgba(15, 15, 35, 0.95)', 'rgba(26, 26, 58, 0.95)', 'rgba(45, 27, 105, 0.95)']}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingHeader}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="location" size={24} color="#6366F1" />
          </View>
          <Text style={styles.loadingTitle}>{message}</Text>
          
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressWidth }
              ]}
            />
          </View>
        </View>

        {runs && runs.length > 0 && (
          <View style={styles.runsContainer}>
            <Text style={styles.runsTitle}>Vos dernières courses</Text>
            <ScrollView 
              style={styles.runsScrollView}
              showsVerticalScrollIndicator={false}
            >
              {runs.slice(0, 5).map((run, index) => (
                <RunPreview key={run.id} run={run} index={index} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.encouragementContainer}>
          <Ionicons name="flash" size={20} color="#EC4899" />
          <Text style={styles.encouragementText}>
            {runs && runs.length > 0 
              ? "Prêt pour une nouvelle course ?" 
              : "Votre première course vous attend !"}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ÉCRAN PRINCIPAL
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
      // Synchroniser les courses en attente
      await RunService.syncPendingRuns();
      
      // Récupérer les courses depuis l'API
      const result = await RunService.getUserRuns(1, 20);
      if (result.success && result.data && result.data.runs) {
        const runs = result.data.runs.map(run => ({
          ...run,
          date: run.start_time || run.date,
          maxSpeed: run.max_speed || run.maxSpeed || 0
        }));
        setSavedRuns(runs.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else {
        // Fallback sur données locales
        const localRuns = await RunService.getAllRuns();
        setSavedRuns(localRuns.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (error) {
      console.error('Erreur chargement courses:', error);
      // Fallback sur données locales
      const localRuns = await RunService.getAllRuns();
      setSavedRuns(localRuns.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const logout = async () => {
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

  const initializeLocation = async () => {
    try {
      setLoadingMessage('Demande d\'autorisation GPS...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingMessage('Permission GPS refusée');
        setTimeout(() => {
          setIsLocationLoading(false);
          Alert.alert('Permission refusée', 'Géolocalisation requise');
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
      setLocation(currentLocation);
      
      setTimeout(() => {
        setMapInitialized(true);
        setIsLocationLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      setLoadingMessage('Erreur de géolocalisation');
      setTimeout(() => {
        setIsLocationLoading(false);
        Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
      }, 1000);
    }
  };

  const handleDebugLocationUpdate = (newLocation) => {
    setLocation(newLocation);
    
    if (isRunning && !isPaused && previousLocation) {
      const currentSpeed = (newLocation.coords.speed && newLocation.coords.speed > 0) ? 
        newLocation.coords.speed * 3.6 : 0;
      setSpeed(currentSpeed);
      
      if (currentSpeed > maxSpeed) {
        setMaxSpeed(currentSpeed);
      }
      
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
    }
    
    setPreviousLocation(newLocation);
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          handleDebugLocationUpdate(newLocation);
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
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

  const startRun = () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setDistance(0);
    setRouteCoordinates([]);
    setSpeed(0);
    setMaxSpeed(0);
    setFollowUser(true);
    setElapsedTime(0);
    
    if (location) {
      setRouteCoordinates([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);
      setPreviousLocation(location);
    }
    
    startLocationTracking();
  };

  const pauseRun = () => {
    setIsPaused(true);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const resumeRun = () => {
    setIsPaused(false);
    startLocationTracking();
  };

  const stopRun = async () => {
    Alert.alert(
      'Arrêter la course',
      'Voulez-vous vraiment arrêter la course ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            setIsRunning(false);
            setIsPaused(false);
            
            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }
            
            try {
              await RunService.saveRun({
                distance,
                duration: Math.floor(elapsedTime / 1000),
                route: routeCoordinates,
                maxSpeed,
                date: new Date().toISOString()
              });
              
              // Recharger les courses depuis l'API
              await loadSavedRuns();
              
              Alert.alert('Course sauvegardée !', 'Votre course a été enregistrée localement et sur le serveur.');
            } catch (error) {
              console.error('Erreur sauvegarde:', error);
              Alert.alert('Erreur', 'Impossible de sauvegarder la course');
            }
          }
        }
      ]
    );
  };

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
  };

  const formatTime = (time) => {
    const seconds = Math.floor(time / 1000) % 60;
    const minutes = Math.floor(time / (1000 * 60)) % 60;
    const hours = Math.floor(time / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!locationPermission && !isLocationLoading) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#0F0F23', '#1A1A3A']}
          style={styles.errorGradient}
        >
          <Ionicons name="location-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.errorTitle}>Géolocalisation indisponible</Text>
          <Text style={styles.errorMessage}>
            Veuillez autoriser l'accès à votre position pour utiliser l'application
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={initializeLocation}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <GeoDebugJoystick 
      onLocationUpdate={handleDebugLocationUpdate}
      isRunning={isRunning}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {location && mapInitialized ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            onPanDrag={() => setFollowUser(false)}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Ma position"
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
            
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#4CAF50"
                strokeWidth={4}
              />
            )}
            
            <Circle
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={location.coords.accuracy || 10}
              fillColor="rgba(76, 175, 80, 0.1)"
              strokeColor="rgba(76, 175, 80, 0.3)"
              strokeWidth={1}
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <LinearGradient
              colors={['#0F0F23', '#1A1A3A']}
              style={styles.mapPlaceholderGradient}
            >
              <Ionicons name="map-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.mapPlaceholderText}>Carte en cours de chargement...</Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.runInterface}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Temps</Text>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{(distance / 1000).toFixed(2)} km</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Vitesse</Text>
              <Text style={styles.statValue}>{speed.toFixed(1)} km/h</Text>
            </View>
          </View>
          
          <View style={styles.controlsContainer}>
            {!isRunning ? (
              <TouchableOpacity 
                style={[styles.startButton, (!location || isLocationLoading) && styles.startButtonDisabled]} 
                onPress={startRun}
                disabled={!location || isLocationLoading}
              >
                <Ionicons name="play" size={30} color="white" />
                <Text style={styles.buttonText}>
                  {isLocationLoading ? 'Chargement...' : 'Démarrer'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.runningControls}>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.pauseButton]} 
                  onPress={isPaused ? resumeRun : pauseRun}
                >
                  <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.stopButton]} 
                  onPress={stopRun}
                >
                  <Ionicons name="stop" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.navigationMenu}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('RunHistory')}
          >
            <Ionicons name="list" size={24} color="white" />
            <Text style={styles.navButtonText}>Historique</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.navButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        
        {location && mapInitialized && (
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={() => {
              setFollowUser(true);
              if (location && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }, 1000);
              }
            }}
          >
            <Ionicons name="locate" size={24} color={followUser ? "#4CAF50" : "#666"} />
          </TouchableOpacity>
        )}

        <LoadingOverlay
          isVisible={isLocationLoading}
          message={loadingMessage}
          runs={savedRuns}
        />
      </View>
    </GeoDebugJoystick>
  );
}

// NAVIGATION PRINCIPALE
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="AuthCheck"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AuthCheck" component={AuthCheckScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainRunScreen} />
        <Stack.Screen name="RunHistory" component={RunHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // Styles AuthCheck
  authCheckContainer: {
    flex: 1,
  },
  authCheckGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCheckText: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginTop: 20,
    letterSpacing: 2,
  },

  // Styles Login
  loginContainer: {
    flex: 1,
  },
  loginGradient: {
    flex: 1,
  },
  loginScrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toggleTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  authButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 8,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  // Styles App
  container: {
    flex: 1,
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
    borderRadius: 2,
  },
  runsContainer: {
    flex: 1,
    marginTop: 20,
  },
  runsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  runsScrollView: {
    flex: 1,
  },
  runPreview: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  runPreviewGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  runPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  runPreviewDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
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
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  runStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  encouragementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  encouragementText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
  },
  mapPlaceholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  runInterface: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  navigationMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  navButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  centerButton: {
    position: 'absolute',
    top: 100,
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
});