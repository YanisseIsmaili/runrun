
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../services/AuthService';

const { width, height } = Dimensions.get('window');

export default function MainRunScreen({ navigation }) {
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
  const [user, setUser] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeScreen();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    if (!isRunning) {
      Animated.loop(
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
      ).start();
    }
  };

  const initializeScreen = async () => {
    try {
      await loadUserData();
      await initializeLocation();
    } catch (error) {
      console.error('Erreur initialisation:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Activez la géolocalisation pour continuer');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    }
  };

  const startRun = () => {
    setIsRunning(true);
    setRunData({ ...runData, startTime: new Date() });
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const pauseRun = () => setIsPaused(true);
  const resumeRun = () => setIsPaused(false);

  const stopRun = () => {
    Alert.alert(
      'Arrêter la course',
      'Voulez-vous vraiment arrêter la course ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            startAnimations();
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      {/* Vue GPS sans MapView */}
      <View style={styles.mapWrapper}>
        <View style={styles.mapPlaceholder}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.gpsBackground}
          >
            {currentLocation ? (
              <View style={styles.gpsContent}>
                <View style={styles.gpsIconContainer}>
                  <Ionicons name="location" size={50} color="#00E676" />
                  <View style={styles.pulseRing} />
                  <View style={styles.pulseRing2} />
                </View>
                
                <Text style={styles.gpsTitle}>GPS Connecté</Text>
                <Text style={styles.coordsText}>
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
                
                {route.length > 0 && (
                  <View style={styles.routeInfo}>
                    <Ionicons name="trail-sign" size={24} color="#00E676" />
                    <Text style={styles.routeText}>{route.length} points enregistrés</Text>
                  </View>
                )}
                
                <View style={styles.gpsStats}>
                  <View style={styles.gpsStat}>
                    <Ionicons name="speedometer" size={16} color="#00BCD4" />
                    <Text style={styles.gpsStatText}>Précision: {Math.round(Math.random() * 5 + 3)}m</Text>
                  </View>
                  <View style={styles.gpsStat}>
                    <Ionicons name="wifi" size={16} color="#4CAF50" />
                    <Text style={styles.gpsStatText}>Signal: Fort</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.gpsContent}>
                <Ionicons name="search" size={50} color="#FF9800" />
                <Text style={styles.gpsTitle}>Recherche GPS...</Text>
                <Text style={styles.gpsSubtitle}>Positionnement en cours</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Header utilisateur */}
        <View style={styles.topBar}>
          <View style={styles.userCard}>
            <View style={styles.userIcon}>
              <Ionicons name="person" size={14} color="#00E676" />
            </View>
            <Text style={styles.userText}>
              {user?.username || user?.email || 'Utilisateur'}
            </Text>
          </View>
        </View>

        {/* Stats pendant la course */}
        {isRunning && (
          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Ionicons name="time" size={14} color="#00E676" />
              <Text style={styles.statNum}>{formatTime(runData.duration)}</Text>
              <Text style={styles.statLabel}>Temps</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="walk" size={14} color="#00BCD4" />
              <Text style={styles.statNum}>{(runData.distance / 1000).toFixed(2)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="speedometer" size={14} color="#FF6B35" />
              <Text style={styles.statNum}>{runData.avgSpeed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km/h</Text>
            </View>
          </View>
        )}

        {/* Contrôles pendant la course */}
        {isRunning && (
          <View style={styles.runControls}>
            <TouchableOpacity 
              style={styles.runBtn}
              onPress={isPaused ? resumeRun : pauseRun}
            >
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.runBtn, styles.stopBtn]} onPress={stopRun}>
              <Ionicons name="stop" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barre de navigation du bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.navBtn}
          onPress={() => navigation.navigate('RunHistory')}
        >
          <View style={styles.navIcon}>
            <Ionicons name="list" size={20} color="#6366F1" />
          </View>
          <Text style={styles.navText}>Historique</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity 
            style={styles.startBtn}
            onPress={isRunning ? stopRun : startRun}
          >
            <LinearGradient
              colors={isRunning ? ['#F44336', '#D32F2F'] : ['#00E676', '#00C853']}
              style={styles.startGradient}
            >
              <Ionicons 
                name={isRunning ? "stop" : "play"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.startText}>
                {isRunning ? 'STOP' : 'START'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.navBtn} onPress={handleLogout}>
          <View style={styles.navIcon}>
            <Ionicons name="exit" size={20} color="#F44336" />
          </View>
          <Text style={styles.navText}>Sortir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Connecté : {user?.username || user?.email || 'ntm'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  
  // Vue GPS sans MapView
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
  },
  gpsBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsContent: {
    alignItems: 'center',
    padding: 40,
  },
  gpsIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    top: -15,
    left: -15,
  },
  pulseRing2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
    top: -25,
    left: -25,
  },
  gpsTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gpsSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  coordsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  routeText: {
    color: '#00E676',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  gpsStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  gpsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gpsStatText: {
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
    fontSize: 12,
  },

  // Header
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  userIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Stats
  statsCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 170 : 150,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: 16,
    zIndex: 1000,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },

  // Contrôles course
  runControls: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    zIndex: 1000,
  },
  runBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#F44336',
  },

  // Navigation du bas
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  navBtn: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
  },
  startBtn: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  startGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footer: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
});