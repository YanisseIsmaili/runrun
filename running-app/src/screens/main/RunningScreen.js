import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Dimensions,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RunContext } from '../../context/RunContext';
import RunningMap from '../../components/RunningMap';

const { width, height } = Dimensions.get('window');

const RunningScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const {
    isRunning,
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
  } = useContext(RunContext);

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demander les permissions de localisation
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');

      if (status === 'granted') {
        try {
          setLoading(true);
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest
          });

          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
          });
        } catch (error) {
          console.error('Erreur lors de la récupération de la position:', error);
          Alert.alert(
            'Erreur de localisation',
            'Impossible de déterminer votre position actuelle. Veuillez vérifier que le GPS est activé.'
          );
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [isFocused]);

  // Gérer le bouton retour pour éviter de quitter accidentellement pendant une course
  useEffect(() => {
    const backAction = () => {
      if (isRunning) {
        Alert.alert(
          'Course en cours',
          'Vous avez une course en cours. Voulez-vous vraiment quitter cet écran ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => {} },
            { text: 'Quitter', style: 'destructive', onPress: () => navigation.goBack() }
          ]
        );
        return true; // Empêche le comportement par défaut
      }
      return false; // Laisse le comportement par défaut se produire
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isRunning, navigation]);

  // Formater la distance en km
  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  // Formater la vitesse en km/h
  const formatSpeed = (metersPerSecond) => {
    return (metersPerSecond * 3.6).toFixed(1);
  };

  // Gérer le démarrage ou la reprise d'une course
  const handleStartResume = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Permission requise',
        'L\'application a besoin d\'accéder à votre position pour suivre votre course.',
        [
          { text: 'Annuler' },
          { text: 'Paramètres', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    if (isRunning) {
      pauseRun();
    } else {
      if (currentRun) {
        resumeRun();
      } else {
        startRun();
      }
    }
  };

  // Afficher la modale de confirmation pour terminer une course
  const handleFinishConfirmation = () => {
    if (!currentRun) return;

    setShowConfirmationModal(true);
  };

  // Terminer une course
  const handleFinishRun = () => {
    setShowConfirmationModal(false);
    finishRun();
  };

  // Calculer le rythme actuel (min/km)
  const calculatePace = () => {
    if (!speed || speed === 0) return '--:--';
    
    // Convertir m/s en min/km
    const paceInMinutesPerKm = 16.6667 / speed;
    
    const minutes = Math.floor(paceInMinutesPerKm);
    const seconds = Math.floor((paceInMinutesPerKm - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Carte */}
      {loading ? (
        <View style={styles.mapLoadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Récupération de votre position...</Text>
        </View>
      ) : initialRegion ? (
        <RunningMap
          initialRegion={initialRegion}
          locationHistory={locationHistory}
          followUser={isRunning}
        />
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
          {currentRun && (
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

      {/* Modale de confirmation pour terminer une course */}
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