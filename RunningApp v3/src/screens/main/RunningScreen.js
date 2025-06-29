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
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

// Import conditionnel de MapView
let MapView, Polyline, PROVIDER_GOOGLE;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  console.log('react-native-maps non disponible');
  MapView = null;
}

const { width, height } = Dimensions.get('window');

const RunningScreen = ({ navigation }) => {
  // Contextes
  const runContext = useRun();
  const {
    isRunning = false,
    isPaused = false,
    distance = 0,
    duration = 0,
    currentSpeed = 0,
    pace = '00:00',
    calories = 0,
    locationHistory = [],
    loading = false,
    error,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    formatDuration,
    clearError
  } = runContext || {};

  const settingsContext = useSettings();
  const { formatDistance } = settingsContext || { formatDistance: (d) => `${d.toFixed(2)} km` };

  // États locaux
  const [showStopModal, setShowStopModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const mapRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationHistory.length > 0) {
      const latest = locationHistory[locationHistory.length - 1];
      setCurrentLocation(latest);
      
      // Centrer la carte sur la position actuelle
      if (latest && mapRef.current) {
        const newRegion = {
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        
        try {
          mapRef.current.animateToRegion(newRegion, 1000);
        } catch (err) {
          console.log('Erreur animation carte:', err);
        }
      }
    }
  }, [locationHistory]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const requestLocationPermission = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Erreur permission localisation:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleStartRun = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permission requise',
        'L\'accès à la localisation est nécessaire pour enregistrer votre course.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Paramètres', onPress: requestLocationPermission }
        ]
      );
      return;
    }

    try {
      await startRun();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la course');
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeRun();
      } else {
        await pauseRun();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'état de la course');
    }
  };

  const handleFinishRun = async () => {
    if (distance < 50) { // Moins de 50 mètres
      Alert.alert(
        'Course trop courte',
        'Votre course doit faire au moins 50 mètres pour être enregistrée.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const completedRun = await finishRun();
      setShowStopModal(false);
      
      Alert.alert(
        'Course terminée !',
        `Distance: ${formatDistance(completedRun.distance)}\nTemps: ${formatDuration(completedRun.duration)}\nAllure: ${completedRun.pace}/km`,
        [
          { text: 'Voir détails', onPress: () => navigation.navigate('History') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de terminer la course');
    }
  };

  const formatSpeed = (speed) => {
    if (typeof speed !== 'number' || speed <= 0) return '0.0';
    return Math.min(speed, 50).toFixed(1); // Limiter à 50 km/h max
  };

  const formatDistanceDisplay = (distanceMeters) => {
    if (typeof distanceMeters !== 'number' || distanceMeters <= 0) return '0.00 km';
    return formatDistance ? formatDistance(distanceMeters / 1000) : `${(distanceMeters / 1000).toFixed(2)} km`;
  };

  const renderMapView = () => {
    if (!MapView) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={styles.mapPlaceholderText}>Carte non disponible</Text>
        </View>
      );
    }

    if (isLoadingLocation) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.mapPlaceholderText}>Chargement de la localisation...</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={isRunning}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        onRegionChangeComplete={(region) => setMapRegion(region)}
      >
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor="#4CAF50"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    );
  };

  const renderControls = () => {
    if (!isRunning) {
      return (
        <TouchableOpacity
          style={[styles.controlButton, styles.startButton]}
          onPress={handleStartRun}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <Ionicons name="play" size={32} color="white" />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.runningControls}>
        <TouchableOpacity
          style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
          onPress={handlePauseResume}
          disabled={loading}
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
          style={[styles.controlButton, styles.stopButton]}
          onPress={() => setShowStopModal(true)}
          disabled={loading}
        >
          <Ionicons name="stop" size={24} color="white" />
          <Text style={styles.controlButtonText}>Arrêter</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course</Text>
        <View style={styles.headerRight}>
          {(isRunning || isPaused) && (
            <View style={[styles.statusIndicator, isPaused ? styles.pausedStatus : styles.runningStatus]}>
              <Text style={styles.statusText}>
                {isPaused ? 'En pause' : 'En cours'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Carte */}
      <View style={styles.mapContainer}>
        {renderMapView()}
      </View>

      {/* Statistiques en temps réel */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{formatDistanceDisplay(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Temps</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{pace}</Text>
            <Text style={styles.statLabel}>Allure</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="car-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{formatSpeed(currentSpeed)} km/h</Text>
            <Text style={styles.statLabel}>Vitesse</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.statValue}>{locationHistory.length}</Text>
            <Text style={styles.statLabel}>Points GPS</Text>
          </View>
        </View>
      </View>

      {/* Contrôles */}
      <View style={styles.controlsContainer}>
        {renderControls()}
      </View>

      {/* Modal d'arrêt */}
      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="flag-outline" size={48} color="#4CAF50" />
            <Text style={styles.modalTitle}>Terminer la course ?</Text>
            <Text style={styles.modalMessage}>
              Voulez-vous terminer et sauvegarder cette course ?
            </Text>
            
            <View style={styles.modalStats}>
              <Text style={styles.modalStatText}>Distance: {formatDistanceDisplay(distance)}</Text>
              <Text style={styles.modalStatText}>Temps: {formatDuration(duration)}</Text>
              <Text style={styles.modalStatText}>Allure: {pace}/km</Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStopModal(false)}
              >
                <Text style={styles.cancelButtonText}>Continuer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleFinishRun}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Terminer</Text>
                )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    width: 24,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  runningStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pausedStatus: {
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  controlsContainer: {
    padding: 16,
  },
  controlButton: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flex: 0.45,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    flex: 0.45,
  },
  stopButton: {
    backgroundColor: '#F44336',
    flex: 0.45,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: width * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStats: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalStatText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RunningScreen;