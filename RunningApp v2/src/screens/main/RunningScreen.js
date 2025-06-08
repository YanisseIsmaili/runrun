import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRun } from '../../context/RunContext';

const { width, height } = Dimensions.get('window');

// Composant ActivityIndicator personnalisé
const CustomActivityIndicator = ({ size = 40, color = "#4CAF50", style }) => {
  const indicatorSize = typeof size === 'string' ? (size === 'large' ? 40 : 20) : size;
  
  return (
    <View style={[{ 
      width: indicatorSize, 
      height: indicatorSize,
      justifyContent: 'center',
      alignItems: 'center'
    }, style]}>
      <View
        style={{
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          borderWidth: 2,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </View>
  );
};

const RunningScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const {
    isRunning,
    isPaused,
    currentRun,
    locationHistory,
    distance,
    duration,
    speed,
    startRun,
    pauseRun,
    resumeRun,
    finishRun,
    formatDuration
  } = useRun();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      requestLocationPermission();
    }
  }, [isFocused]);

  useEffect(() => {
    const backAction = () => {
      if (isRunning || isPaused) {
        Alert.alert(
          'Course en cours',
          'Vous avez une course en cours. Voulez-vous vraiment quitter cet écran ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Quitter', style: 'destructive', onPress: () => navigation.goBack() }
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isRunning, isPaused, navigation]);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });

        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        });
      } else {
        Alert.alert(
          'Permission refusée',
          'L\'application a besoin de la permission d\'accès à la localisation pour fonctionner.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Erreur de localisation',
        'Impossible de déterminer votre position. Veuillez vérifier que le GPS est activé.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  const formatSpeed = (metersPerSecond) => {
    return (metersPerSecond * 3.6).toFixed(1);
  };

  const calculatePace = () => {
    if (!speed || speed === 0) return '--:--';
    
    const paceInMinutesPerKm = 16.6667 / speed;
    const minutes = Math.floor(paceInMinutesPerKm);
    const seconds = Math.floor((paceInMinutesPerKm - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartResume = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Permission requise',
        'L\'application a besoin d\'accéder à votre position pour suivre votre course.'
      );
      return;
    }

    if (isRunning) {
      pauseRun();
    } else if (currentRun && isPaused) {
      resumeRun();
    } else {
      startRun();
    }
  };

  const handleFinishConfirmation = () => {
    if (!currentRun) return;
    setShowConfirmationModal(true);
  };

  const handleFinishRun = () => {
    setShowConfirmationModal(false);
    finishRun();
  };

  return (
    <View style={styles.container}>
      {/* Carte */}
      {loading ? (
        <View style={styles.mapLoadingContainer}>
          <CustomActivityIndicator size={40} color="#4CAF50" />
          <Text style={styles.loadingText}>Récupération de votre position...</Text>
        </View>
      ) : initialRegion ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={isRunning}
          showsCompass={true}
          scrollEnabled={!isRunning}
          zoomEnabled={!isRunning}
          rotateEnabled={!isRunning}
        >
          {locationHistory.length > 0 && (
            <>
              <Polyline
                coordinates={locationHistory}
                strokeWidth={5}
                strokeColor="#4CAF50"
              />
              
              {locationHistory.length > 1 && (
                <>
                  <Marker
                    coordinate={locationHistory[0]}
                    title="Départ"
                    pinColor="green"
                  />
                  
                  <Marker
                    coordinate={locationHistory[locationHistory.length - 1]}
                    title="Position actuelle"
                    pinColor="blue"
                  />
                </>
              )}
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.mapLoadingContainer}>
          <Ionicons name="location-off-outline" size={50} color="#CCCCCC" />
          <Text style={styles.loadingText}>Position GPS non disponible</Text>
        </View>
      )}

      {/* Panneau d'informations */}
      <View style={styles.statsPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDistance(distance)}
            </Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDuration(duration)}
            </Text>
            <Text style={styles.statLabel}>DURÉE</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {calculatePace()}
            </Text>
            <Text style={styles.statLabel}>MIN/KM</Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          {(currentRun || isRunning || isPaused) && (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinishConfirmation}
            >
              <Ionicons name="flag-outline" size={22} color="white" />
              <Text style={styles.finishButtonText}>Terminer</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.startButton,
              isRunning ? styles.pauseButton : styles.resumeButton
            ]}
            onPress={handleStartResume}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={24}
              color="white"
            />
            <Text style={styles.startButtonText}>
              {currentRun
                ? (isRunning ? 'Pause' : 'Reprendre')
                : 'Démarrer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modale de confirmation */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Terminer la course ?</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir terminer cette course ? Cette action ne peut pas être annulée.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleFinishRun}
              >
                <Text style={styles.modalConfirmButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 16,
  },
  statsPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  finishButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginRight: 10,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 10,
  },
  modalCancelButtonText: {
    color: '#757575',
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#F44336',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default RunningScreen;