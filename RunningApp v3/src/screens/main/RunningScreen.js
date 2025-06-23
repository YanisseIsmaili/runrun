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

// Import conditionnel de MapView pour éviter les erreurs
let MapView, Polyline, PROVIDER_GOOGLE;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  console.log('react-native-maps non disponible, utilisation du mode sans carte');
  MapView = null;
}

const { width, height } = Dimensions.get('window');

const RunningScreen = ({ navigation }) => {
  // Contextes avec protection
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
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    formatDuration,
    error
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
    if (locationHistory.length > 0 && mapRef.current && MapView) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      if (lastLocation && lastLocation.latitude && lastLocation.longitude) {
        const newRegion = {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setMapRegion(newRegion);
        
        // Centrer la carte sur la position actuelle
        try {
          mapRef.current.animateToRegion(newRegion, 1000);
        } catch (error) {
          console.log('Erreur animation carte:', error);
        }
      }
    }
  }, [locationHistory]);

  const requestLocationPermission = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour enregistrer votre parcours.',
          [
            { text: 'Réessayer', onPress: requestLocationPermission },
            { text: 'Retour', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }

      setLocationPermission(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Erreur permission localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la localisation');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);
      setMapRegion({
        ...newLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      if (mapRef.current && MapView) {
        try {
          mapRef.current.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        } catch (error) {
          console.log('Erreur animation initiale carte:', error);
        }
      }
    } catch (error) {
      console.error('Erreur localisation actuelle:', error);
    }
  };

  const handleStartRun = async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      if (Haptics?.impactAsync) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (startRun) {
        await startRun();
      }
    } catch (error) {
      console.error('Erreur démarrage course:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la course');
    }
  };

  const handlePauseResume = async () => {
    try {
      if (Haptics?.impactAsync) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (isPaused && resumeRun) {
        await resumeRun();
      } else if (pauseRun) {
        await pauseRun();
      }
    } catch (error) {
      console.error('Erreur pause/reprise:', error);
    }
  };

  const handleStopRun = () => {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setShowStopModal(true);
  };

  const confirmStopRun = async () => {
    try {
      setShowStopModal(false);
      if (finishRun) {
        await finishRun();
      }
      navigation.goBack();
    } catch (error) {
      console.error('Erreur arrêt course:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter la course');
    }
  };

  const getStatusColor = () => {
    if (!isRunning) return '#666';
    if (isPaused) return '#FF9800';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!isRunning) return 'Prêt à commencer';
    if (isPaused) return 'En pause';
    return 'Course en cours';
  };

  const formatSafeDistance = (dist) => {
    if (typeof dist !== 'number' || isNaN(dist)) return '0.00 km';
    return formatDistance ? formatDistance(dist / 1000) : `${(dist / 1000).toFixed(2)} km`;
  };

  const formatSafeDuration = (dur) => {
    if (typeof dur !== 'number' || isNaN(dur)) return '0:00';
    return formatDuration ? formatDuration(dur) : '0:00';
  };

  const formatSafeSpeed = (speed) => {
    if (typeof speed !== 'number' || isNaN(speed) || speed <= 0) {
      return '0.0';
    }
    return speed.toFixed(1);
  };

  // Debug: Afficher les valeurs en temps réel
  useEffect(() => {
    if (isRunning) {
      console.log('🏃‍♂️ Stats écran course:', {
        distance: `${formatSafeDistance(distance)}`,
        duration: `${formatSafeDuration(duration)}`,
        speed: `${formatSafeSpeed(currentSpeed)} km/h`,
        pace: pace,
        calories: calories,
        isRunning,
        isPaused
      });
    }
  }, [distance, duration, currentSpeed, pace, calories, isRunning, isPaused]);

  // Rendu du composant carte ou placeholder
  const renderMapComponent = () => {
    if (!MapView) {
      // Mode sans carte - placeholder amélioré
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color="#4CAF50" />
          <Text style={styles.mapPlaceholderTitle}>Mode GPS</Text>
          <Text style={styles.mapPlaceholderText}>
            {currentLocation ? '📍 Position acquise' : '🔍 Recherche position...'}
          </Text>
          {currentLocation && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesText}>
                📊 Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                📊 Lon: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          {isRunning && (
            <View style={styles.trackingIndicator}>
              <Ionicons name="radio-outline" size={16} color="#4CAF50" />
              <Text style={styles.trackingText}>Suivi GPS actif</Text>
            </View>
          )}
        </View>
      );
    }

    // Mode avec carte
    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={isRunning && !isPaused}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        loadingEnabled={true}
        mapType="standard"
        onMapReady={() => console.log('🗺️ Carte prête')}
        onError={(error) => console.log('❌ Erreur carte:', error)}
      >
        {/* Tracé du parcours */}
        {locationHistory.length > 1 && Polyline && (
          <Polyline
            coordinates={locationHistory
              .filter(loc => loc && loc.latitude && loc.longitude)
              .map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))}
            strokeColor="#4CAF50"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    );
  };

  if (isLoadingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Accès à la localisation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Course</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Zone carte/GPS */}
      <View style={styles.mapContainer}>
        {renderMapComponent()}

        {/* Overlay d'informations rapides */}
        <View style={styles.mapOverlay}>
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{formatSafeDistance(distance)}</Text>
              <Text style={styles.quickStatLabel}>Distance</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{formatSafeDuration(duration)}</Text>
              <Text style={styles.quickStatLabel}>Temps</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{pace}</Text>
              <Text style={styles.quickStatLabel}>Allure/km</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Panneau de statistiques */}
      <View style={styles.statsPanel}>
        {/* Statistiques principales */}
        <View style={styles.primaryStats}>
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>{formatSafeDistance(distance)}</Text>
            <Text style={styles.primaryStatLabel}>Distance</Text>
          </View>
          
          <View style={styles.primaryStatDivider} />
          
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>{formatSafeDuration(duration)}</Text>
            <Text style={styles.primaryStatLabel}>Temps</Text>
          </View>
          
          <View style={styles.primaryStatDivider} />
          
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>{pace}</Text>
            <Text style={styles.primaryStatLabel}>Allure/km</Text>
          </View>
        </View>

        {/* Statistiques secondaires */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStatItem}>
            <Ionicons name="speedometer-outline" size={16} color="#666" />
            <Text style={styles.secondaryStatValue}>{formatSafeSpeed(currentSpeed)}</Text>
            <Text style={styles.secondaryStatLabel}>km/h</Text>
          </View>
          
          <View style={styles.secondaryStatItem}>
            <Ionicons name="flame-outline" size={16} color="#666" />
            <Text style={styles.secondaryStatValue}>{calories || 0}</Text>
            <Text style={styles.secondaryStatLabel}>Cal</Text>
          </View>
          
          <View style={styles.secondaryStatItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.secondaryStatValue}>{locationHistory.length}</Text>
            <Text style={styles.secondaryStatLabel}>Points</Text>
          </View>
        </View>

        {/* Boutons de contrôle */}
        <View style={styles.controlButtons}>
          {!isRunning ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStartRun}>
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.controlButtonText}>
                  {isPaused ? "Reprendre" : "Pause"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.stopButton} onPress={handleStopRun}>
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.controlButtonText}>Arrêter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Information du parcours */}
        {locationHistory.length > 0 && (
          <Text style={styles.routeInfo}>
            Parcours enregistré • {locationHistory.length} points GPS
          </Text>
        )}
      </View>

      {/* Modal de confirmation d'arrêt */}
      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="stop-circle-outline" size={48} color="#f44336" />
            <Text style={styles.modalTitle}>Arrêter la course ?</Text>
            <Text style={styles.modalMessage}>
              Voulez-vous vraiment arrêter votre course ? Elle sera sauvegardée dans votre historique.
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
                onPress={confirmStopRun}
              >
                <Text style={styles.modalConfirmText}>Arrêter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Affichage des erreurs */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  centerButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  trackingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  quickStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
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
    maxHeight: height * 0.4,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  primaryStatDivider: {
    width: 1,
    height: 40,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  secondaryStatLabel: {
    fontSize: 10,
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
  routeInfo: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 16,
    textAlign: 'center',
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
  modalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default RunningScreen;