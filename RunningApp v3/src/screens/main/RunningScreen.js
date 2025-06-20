import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const RunningScreen = ({ navigation }) => {
  // État local temporaire en attendant les contextes
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [pace, setPace] = useState('00:00');
  const [calories, setCalories] = useState(0);
  
  const [showStopModal, setShowStopModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    if (isRunning && !isPaused) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    
    return () => stopLocationTracking();
  }, [isRunning, isPaused]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour la course.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      
      // Centrer la carte sur la position
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur localisation:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Démarrer le suivi en temps réel
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          setCurrentLocation(location);
          
          // Ajouter le point au parcours
          const newCoordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setRouteCoordinates(prev => [...prev, newCoordinate]);
          
          // Centrer la carte sur la nouvelle position
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }
        }
      );
    } catch (error) {
      console.error('Erreur suivi GPS:', error);
    }
  };

  const stopLocationTracking = () => {
    // Arrêter le suivi GPS
    // Cette fonction sera complétée avec la gestion du contexte
  };

  // Fonctions temporaires
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance) => `${distance.toFixed(2)} km`;

  const handleStartRun = async () => {
    setIsRunning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePauseResume = async () => {
    setIsPaused(!isPaused);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStopRun = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setShowStopModal(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const formatPace = (paceValue) => {
    if (!paceValue || paceValue === '00:00') return '00:00';
    return paceValue;
  };

  const formatSpeed = (speed) => {
    return speed ? speed.toFixed(1) : '0.0';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course en cours</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Zone carte temporaire sans MapView */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {currentLocation ? (
            <>
              <Ionicons name="location" size={48} color="#4CAF50" />
              <Text style={styles.placeholderText}>GPS Connecté</Text>
              <Text style={styles.placeholderSubtext}>
                Lat: {currentLocation.coords.latitude.toFixed(6)}{'\n'}
                Lng: {currentLocation.coords.longitude.toFixed(6)}
              </Text>
              {routeCoordinates.length > 0 && (
                <Text style={styles.routeInfo}>
                  Points tracés: {routeCoordinates.length}
                </Text>
              )}
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.placeholderText}>Chargement GPS...</Text>
              <Text style={styles.placeholderSubtext}>
                Recherche de votre position
              </Text>
            </>
          )}
        </View>
        
        {/* Indicateur d'état */}
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isRunning ? (isPaused ? '#FF9800' : '#4CAF50') : '#666' }
          ]} />
          <Text style={styles.statusText}>
            {isRunning ? (isPaused ? 'En pause' : 'En cours') : 'Arrêté'}
          </Text>
        </View>
      </View>

      {/* Panneau de statistiques */}
      <View style={styles.statsPanel}>
        {/* Statistiques principales */}
        <View style={styles.primaryStats}>
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>{formatDuration(duration)}</Text>
            <Text style={styles.primaryStatLabel}>Temps</Text>
          </View>
          <View style={styles.primaryStatDivider} />
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>
              {formatDistance(distance / 1000)}
            </Text>
            <Text style={styles.primaryStatLabel}>Distance</Text>
          </View>
        </View>

        {/* Statistiques secondaires */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStatItem}>
            <Ionicons name="speedometer-outline" size={20} color="#666" />
            <Text style={styles.secondaryStatValue}>{formatPace(pace)}</Text>
            <Text style={styles.secondaryStatLabel}>Allure/km</Text>
          </View>
          <View style={styles.secondaryStatItem}>
            <Ionicons name="flash-outline" size={20} color="#666" />
            <Text style={styles.secondaryStatValue}>{formatSpeed(currentSpeed)}</Text>
            <Text style={styles.secondaryStatLabel}>km/h</Text>
          </View>
          <View style={styles.secondaryStatItem}>
            <Ionicons name="flame-outline" size={20} color="#666" />
            <Text style={styles.secondaryStatValue}>{calories}</Text>
            <Text style={styles.secondaryStatLabel}>Calories</Text>
          </View>
        </View>

        {/* Boutons de contrôle */}
        <View style={styles.controlButtons}>
          {!isRunning ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartRun}
            >
              <Ionicons name="play" size={32} color="white" />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePauseResume}
              >
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Reprendre' : 'Pause'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => setShowStopModal(true)}
              >
                <Ionicons name="stop" size={24} color="white" />
                <Text style={styles.controlButtonText}>Arrêter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Modal de confirmation d'arrêt */}
      <Modal
        visible={showStopModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={48} color="#FF9800" />
            <Text style={styles.modalTitle}>Arrêter la course ?</Text>
            <Text style={styles.modalMessage}>
              Votre course sera sauvegardée et vous pourrez consulter vos statistiques.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowStopModal(false)}
              >
                <Text style={styles.modalCancelText}>Continuer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleStopRun}
              >
                <Text style={styles.modalConfirmText}>Arrêter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statsPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  primaryStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  primaryStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  secondaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  secondaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  secondaryStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  controlButtons: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: width * 0.7,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 0.45,
  },
  stopButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 0.45,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  routeInfo: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RunningScreen;