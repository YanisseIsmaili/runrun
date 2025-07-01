// screens/MainRunScreen.js - Mode local prioritaire avec sync API optionnelle
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import des services (optionnels)
import AuthService from '../services/AuthService';
import RunService from '../services/RunService';
import { THEME } from '../config/config';

const { width, height } = Dimensions.get('window');

// Composant Coach IA intégré
const AITrainer = ({ isRunning, runData, onMessage }) => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (isRunning && runData) {
      const interval = setInterval(() => {
        const motivationalMessages = [
          "💪 Excellent rythme ! Continue comme ça !",
          "🎯 Tu es dans ta zone optimale !",
          "🔥 Superbe performance !",
          "⚡ Tu peux accélérer maintenant !",
          "🏃‍♂️ Garde ce rythme parfait !",
          "🌟 Tu dépasses tes limites !",
          "💧 N'oublie pas de t'hydrater !",
          "🏆 Champion en action !"
        ];
        
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        setMessages(prev => [
          { id: Date.now(), text: randomMessage, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
        
        onMessage && onMessage(randomMessage);
      }, 45000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning, runData]);

  return (
    <>
      <TouchableOpacity
        style={styles.trainerButton}
        onPress={() => setVisible(!visible)}
      >
        <LinearGradient
          colors={visible ? THEME.gradients.cosmic : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
          style={styles.trainerButtonGradient}
        >
          <Ionicons name="fitness" size={16} color="white" />
          <Text style={styles.trainerText}>
            {visible ? 'COACH ON' : 'COACH'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {visible && (
        <View style={styles.trainerPanel}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(139,92,246,0.2)']}
            style={styles.trainerPanelGradient}
          >
            <View style={styles.trainerHeader}>
              <Text style={styles.trainerTitle}>🤖 AI Coach</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {isRunning && runData && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>📊 Analyse temps réel</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statText}>
                    Distance: {(runData.distance / 1000).toFixed(2)}km
                  </Text>
                  <Text style={styles.statText}>
                    Vitesse: {runData.speed.toFixed(1)} km/h
                  </Text>
                </View>
              </View>
            )}
            
            {messages.length > 0 && (
              <View style={styles.messagesSection}>
                <Text style={styles.sectionTitle}>💬 Messages du coach</Text>
                {messages.slice(0, 3).map(message => (
                  <View key={message.id} style={styles.messageItem}>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
      )}
    </>
  );
};

export default function MainRunScreen({ navigation, onLogout, hasLocationPermission: propLocationPermission }) {
  // États principaux
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [calories, setCalories] = useState(0);
  
  // États GPS et carte
  const [locationPermission, setLocationPermission] = useState(propLocationPermission || false);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [followUser, setFollowUser] = useState(true);
  const [trainerMessage, setTrainerMessage] = useState('');
  
  // États interface
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Refs
  const intervalRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const totalPausedTime = useRef(0);
  const pauseStartTime = useRef(null);

  useEffect(() => {
    initializeApp();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime - totalPausedTime.current;
        setElapsedTime(elapsed);
        calculateCalories(elapsed, distance);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, startTime]);

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
  };

  const initializeApp = async () => {
    try {
      // 1. Charger utilisateur local d'abord
      await loadLocalUser();
      
      // 2. Vérifier permissions GPS
      if (!propLocationPermission) {
        await requestLocationPermission();
      } else {
        setLocationPermission(true);
        await getCurrentLocation();
      }
      
      // 3. Tester API en arrière-plan (non bloquant)
      testApiConnection();
      
    } catch (error) {
      console.log('Erreur initialisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalUser = async () => {
    try {
      // Essayer d'abord AuthService
      if (AuthService) {
        const userData = await AuthService.getUser();
        if (userData) {
          setUser(userData);
          return;
        }
      }
      
      // Fallback : utilisateur local
      const localUser = await AsyncStorage.getItem('localUser');
      if (localUser) {
        setUser(JSON.parse(localUser));
      } else {
        // Créer utilisateur par défaut
        const defaultUser = {
          id: 'local_' + Date.now(),
          username: 'Coureur',
          email: 'local@runner.app',
          isLocal: true
        };
        await AsyncStorage.setItem('localUser', JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
    } catch (error) {
      console.log('Erreur chargement utilisateur:', error);
    }
  };

  const testApiConnection = async () => {
    try {
      if (AuthService && AuthService.testConnection) {
        const result = await AuthService.testConnection();
        setApiConnected(result.success);
      }
    } catch (error) {
      setApiConnected(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Permission refusée', 
          'Géolocalisation requise pour utiliser l\'app',
          [
            { text: 'Paramètres', onPress: () => Location.requestForegroundPermissionsAsync() },
            { text: 'Plus tard', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000,
      });
      setLocation(currentLocation);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      Alert.alert('GPS', 'Impossible d\'obtenir la position');
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (newLocation) => {
          setLocation(newLocation);
          
          if (isRunning && !isPaused && previousLocation) {
            // Calculer vitesse
            const currentSpeed = (newLocation.coords.speed && newLocation.coords.speed > 0) ? 
              newLocation.coords.speed * 3.6 : 0;
            setSpeed(currentSpeed);
            
            if (currentSpeed > maxSpeed) {
              setMaxSpeed(currentSpeed);
            }
            
            // Calculer distance
            const newDistance = calculateDistance(
              previousLocation.coords,
              newLocation.coords
            );
            
            if (newDistance > 0 && newDistance < 100) { // Filtrer valeurs aberrantes
              setDistance(prev => prev + newDistance);
              
              // Ajouter point au parcours
              const newCoordinate = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              setRouteCoordinates(prev => [...prev, newCoordinate]);
            }
          }
          
          setPreviousLocation(newLocation);
          
          // Centrer carte si suivi actif
          if (followUser && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 1000);
          }
        }
      );
    } catch (error) {
      console.error('Erreur tracking:', error);
    }
  };

  const calculateDistance = (coords1, coords2) => {
    const R = 6371000; // Rayon terre en mètres
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

  const calculateCalories = (timeMs, distanceM) => {
    // Formule approximative : poids * distance * facteur
    const weightKg = user?.weight || 70; // Poids par défaut
    const distanceKm = distanceM / 1000;
    const timeHours = timeMs / (1000 * 60 * 60);
    
    // Approximation : 1 kcal/kg/km en course
    const estimatedCalories = Math.round(weightKg * distanceKm);
    setCalories(estimatedCalories);
  };

  const startRun = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setCalories(0);
    setRouteCoordinates([]);
    setFollowUser(true);
    totalPausedTime.current = 0;
    
    if (location) {
      setRouteCoordinates([{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);
      setPreviousLocation(location);
    }
    
    await startLocationTracking();
    setTrainerMessage("🚀 C'est parti ! Commence par un échauffement en douceur.");
    
    // Sauvegarder démarrage en local
    await saveRunStart();
  };

  const pauseRun = () => {
    setIsPaused(true);
    pauseStartTime.current = Date.now();
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setTrainerMessage("⏸️ Pause bien méritée ! Hydrate-toi et reprends quand tu es prêt.");
  };

  const resumeRun = async () => {
    if (pauseStartTime.current) {
      totalPausedTime.current += Date.now() - pauseStartTime.current;
      pauseStartTime.current = null;
    }
    
    setIsPaused(false);
    await startLocationTracking();
    setTrainerMessage("▶️ C'est reparti ! Retrouve ton rythme progressivement.");
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
            await finishRun();
          }
        }
      ]
    );
  };

  const finishRun = async () => {
    setIsRunning(false);
    setIsPaused(false);
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    // Calculer temps final
    const finalTime = isPaused ? 
      elapsedTime : 
      Date.now() - startTime - totalPausedTime.current;
    
    const runData = {
      id: 'local_' + Date.now(),
      distance,
      duration: finalTime,
      route: routeCoordinates,
      maxSpeed,
      avgSpeed: distance > 0 ? (distance / (finalTime / 1000)) * 3.6 : 0,
      calories,
      date: new Date().toISOString(),
      isLocal: true
    };
    
    try {
      // 1. Toujours sauvegarder en local d'abord
      await saveLocalRun(runData);
      
      // 2. Essayer API si connectée
      if (apiConnected && RunService) {
        try {
          await RunService.saveRun(runData);
          console.log('✅ Course sauvée via API');
        } catch (apiError) {
          console.log('⚠️ API échoué, course gardée en local');
        }
      }
      
      Alert.alert(
        '🏁 Course terminée !',
        `Distance: ${(distance/1000).toFixed(2)}km\nTemps: ${formatTime(finalTime)}\nVitesse moy: ${runData.avgSpeed.toFixed(1)}km/h`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la course');
    }
  };

  const saveLocalRun = async (runData) => {
    try {
      const existingRuns = await AsyncStorage.getItem('localRuns');
      const runs = existingRuns ? JSON.parse(existingRuns) : [];
      runs.push(runData);
      await AsyncStorage.setItem('localRuns', JSON.stringify(runs));
    } catch (error) {
      throw new Error('Erreur sauvegarde locale');
    }
  };

  const saveRunStart = async () => {
    try {
      const runStart = {
        startTime,
        location: location?.coords,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem('currentRun', JSON.stringify(runStart));
    } catch (error) {
      console.log('Erreur sauvegarde démarrage:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: () => {
            if (onLogout) {
              onLogout();
            } else {
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  const handleTrainerMessage = (message) => {
    setTrainerMessage(message);
    setTimeout(() => setTrainerMessage(''), 5000);
  };

  const formatTime = (time) => {
    const seconds = Math.floor(time / 1000) % 60;
    const minutes = Math.floor(time / (1000 * 60)) % 60;
    const hours = Math.floor(time / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Interface de chargement
  if (isLoading) {
    return (
      <LinearGradient colors={THEME.gradients.background} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Initialisation...</Text>
      </LinearGradient>
    );
  }

  // Interface permissions GPS
  if (!locationPermission) {
    return (
      <LinearGradient colors={THEME.gradients.background} style={styles.loadingContainer}>
        <Ionicons name="location-outline" size={60} color={THEME.colors.primary} />
        <Text style={styles.permissionTitle}>Géolocalisation requise</Text>
        <Text style={styles.permissionText}>RunTracker a besoin d'accéder à votre position</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
          <LinearGradient colors={THEME.gradients.primary} style={styles.permissionButtonGradient}>
            <Text style={styles.permissionButtonText}>Autoriser</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Interface recherche GPS
  if (!location) {
    return (
      <LinearGradient colors={THEME.gradients.background} style={styles.loadingContainer}>
        <Ionicons name="locate" size={60} color={THEME.colors.accent} />
        <Text style={styles.permissionTitle}>Recherche position GPS</Text>
        <Text style={styles.permissionText}>Activation du GPS en cours...</Text>
        <ActivityIndicator size="large" color={THEME.colors.accent} style={{ marginTop: 20 }} />
      </LinearGradient>
    );
  }

  const runData = {
    distance,
    speed,
    elapsedTime,
    calories
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header utilisateur */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>
            Salut {user?.username || 'Coureur'} ! 👋
          </Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: apiConnected ? THEME.colors.success : THEME.colors.warning }]} />
            <Text style={styles.statusText}>{apiConnected ? 'Connecté' : 'Local'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Coach IA */}
      <AITrainer
        isRunning={isRunning}
        runData={runData}
        onMessage={handleTrainerMessage}
      />
      
      {/* Message flottant du coach */}
      {trainerMessage ? (
        <View style={styles.floatingMessage}>
          <LinearGradient colors={THEME.gradients.cosmic} style={styles.floatingMessageGradient}>
            <Ionicons name="chatbubble" size={16} color="white" />
            <Text style={styles.floatingMessageText}>{trainerMessage}</Text>
          </LinearGradient>
        </View>
      ) : null}
      
      {/* Carte principale */}
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
        {/* Marqueur utilisateur */}
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
        
        {/* Parcours */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={THEME.colors.primary}
            strokeWidth={4}
          />
        )}
        
        {/* Zone de précision GPS */}
        <Circle
          center={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          radius={location.coords.accuracy || 10}
          fillColor="rgba(255, 107, 53, 0.1)"
          strokeColor="rgba(255, 107, 53, 0.3)"
          strokeWidth={1}
        />
      </MapView>
      
      {/* Interface de course */}
      <View style={styles.runInterface}>
        <LinearGradient colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']} style={styles.interfaceGradient}>
          
          {/* Statistiques */}
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
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statValue}>{calories}</Text>
            </View>
          </View>
          
          {/* Contrôles */}
          <View style={styles.controlsContainer}>
            {!isRunning ? (
              <TouchableOpacity style={styles.startButton} onPress={startRun}>
                <LinearGradient colors={THEME.gradients.primary} style={styles.startButtonGradient}>
                  <Ionicons name="play" size={30} color="white" />
                  <Text style={styles.buttonText}>Démarrer</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.runningControls}>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.pauseButton]} 
                  onPress={isPaused ? resumeRun : pauseRun}
                >
                  <LinearGradient 
                    colors={isPaused ? THEME.gradients.success : THEME.gradients.warning} 
                    style={styles.controlButtonGradient}
                  >
                    <Ionicons name={isPaused ? "play" : "pause"} size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlButton, styles.stopButton]} 
                  onPress={stopRun}
                >
                  <LinearGradient colors={THEME.gradients.error} style={styles.controlButtonGradient}>
                    <Ionicons name="stop" size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigation.navigate('RunHistory')}
            >
              <Ionicons name="list" size={20} color="white" />
              <Text style={styles.navButtonText}>Historique</Text>
            </TouchableOpacity>
            
            {navigation.navigate && (
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => navigation.navigate('Challenges')}
              >
                <Ionicons name="trophy" size={20} color="white" />
                <Text style={styles.navButtonText}>Défis</Text>
              </TouchableOpacity>
            )}
          </View>
          
        </LinearGradient>
      </View>
      
      {/* Bouton recentrer */}
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
        <Ionicons name="locate" size={24} color={followUser ? THEME.colors.primary : THEME.colors.textMuted} />
      </TouchableOpacity>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  
  // Loading et permissions
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  loadingText: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
  },
  permissionTitle: {
    ...THEME.typography.title,
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.lg,
    textAlign: 'center',
  },
  permissionText: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginVertical: THEME.spacing.lg,
  },
  permissionButton: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    ...THEME.shadows.medium,
  },
  permissionButtonGradient: {
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  permissionButtonText: {
    ...THEME.typography.heading,
    color: 'white',
  },
  
  // Header
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    ...THEME.typography.heading,
    color: THEME.colors.textPrimary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: THEME.spacing.xs,
  },
  statusText: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
  },
  logoutButton: {
    padding: THEME.spacing.sm,
  },
  
  // Carte
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    borderWidth: 3,
    borderColor: 'white',
    ...THEME.shadows.medium,
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
  
  // Coach IA
  trainerButton: {
    position: 'absolute',
    top: 120,
    left: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    zIndex: 1000,
    ...THEME.shadows.medium,
  },
  trainerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  trainerText: {
    ...THEME.typography.caption,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: THEME.spacing.xs,
  },
  trainerPanel: {
    position: 'absolute',
    top: 160,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    zIndex: 999,
    ...THEME.shadows.large,
  },
  trainerPanelGradient: {
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  trainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  trainerTitle: {
    ...THEME.typography.heading,
    color: THEME.colors.textPrimary,
  },
  statsSection: {
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
  },
  messagesSection: {
    marginBottom: THEME.spacing.md,
  },
  messageItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: THEME.spacing.xs,
  },
  messageText: {
    ...THEME.typography.caption,
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  messageTime: {
    ...THEME.typography.overline,
    color: THEME.colors.textMuted,
  },
  
  // Message flottant
  floatingMessage: {
    position: 'absolute',
    top: height * 0.25,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    zIndex: 998,
    ...THEME.shadows.medium,
  },
  floatingMessageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  floatingMessageText: {
    ...THEME.typography.bodySmall,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
  
  // Interface de course
  runInterface: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    overflow: 'hidden',
  },
  interfaceGradient: {
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  
  // Statistiques
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: THEME.spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  statValue: {
    ...THEME.typography.heading,
    color: THEME.colors.textPrimary,
    fontWeight: 'bold',
  },
  
  // Contrôles
  controlsContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  startButton: {
    borderRadius: THEME.borderRadius.xl,
    overflow: 'hidden',
    ...THEME.shadows.large,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.lg,
  },
  buttonText: {
    ...THEME.typography.heading,
    color: 'white',
    marginLeft: THEME.spacing.md,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: THEME.spacing.xl,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    ...THEME.shadows.medium,
  },
  controlButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
  },
  navButtonText: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textPrimary,
    marginLeft: THEME.spacing.sm,
  },
  
  // Bouton recentrer
  centerButton: {
    position: 'absolute',
    top: 160,
    right: THEME.spacing.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.medium,
  },
});