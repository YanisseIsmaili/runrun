import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

// Import conditionnel de MapView pour éviter les erreurs
let MapView, Polyline;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
} catch (error) {
  MapView = null;
}

const { width, height } = Dimensions.get('window');

const RunDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { run } = route.params || {};

  // Contextes
  const runContext = useRun();
  const { deleteRun, formatDuration } = runContext || {};
  const settingsContext = useSettings();
  const { formatDistance } = settingsContext || { formatDistance: (d) => `${d.toFixed(2)} km` };

  // États locaux
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    if (run && run.locations && run.locations.length > 0) {
      // Calculer la région de la carte basée sur les coordonnées
      const coordinates = run.locations.filter(loc => loc && loc.latitude && loc.longitude);
      if (coordinates.length > 0) {
        const latitudes = coordinates.map(coord => coord.latitude);
        const longitudes = coordinates.map(coord => coord.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const deltaLat = (maxLat - minLat) * 1.2; // Ajouter du padding
        const deltaLng = (maxLng - minLng) * 1.2;
        
        setMapRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(deltaLat, 0.01),
          longitudeDelta: Math.max(deltaLng, 0.01),
        });
      }
    }
  }, [run]);

  if (!run) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
          <Text style={styles.errorTitle}>Course introuvable</Text>
          <Text style={styles.errorMessage}>
            Les détails de cette course ne sont pas disponibles.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Traitement sécurisé des données de la course
  const getDistanceInMeters = (run) => {
    // Si distanceMeters existe, l'utiliser directement
    if (run.distanceMeters && typeof run.distanceMeters === 'number') {
      return run.distanceMeters;
    }
    
    // Si distance existe et semble être en km (< 100), convertir en mètres
    if (run.distance && typeof run.distance === 'number') {
      if (run.distance < 100) {
        return run.distance * 1000; // Conversion km -> mètres
      } else {
        return run.distance; // Déjà en mètres
      }
    }
    
    return 0;
  };

  const runData = {
    id: run.id,
    date: run.startTime || run.start_time || run.date,
    distance: getDistanceInMeters(run),
    duration: run.duration || 0,
    calories: run.calories_burned || run.calories || 0,
    pace: run.pace || '00:00',
    averageSpeed: run.avg_speed || run.averageSpeed || 0,
    maxSpeed: run.max_speed || run.maxSpeed || 0,
    elevationGain: run.elevation_gain || 0,
    heartRate: run.avg_heart_rate || 0,
    maxHeartRate: run.max_heart_rate || 0,
    locations: run.locations || [],
    notes: run.notes || '',
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error) {
      return { date: 'Date inconnue', time: '' };
    }
  };

  const formatPace = () => {
    if (runData.pace && runData.pace !== '00:00') {
      return runData.pace;
    }
    if (runData.distance > 0 && runData.duration > 0) {
      const distanceKm = runData.distance / 1000;
      const paceSecPerKm = runData.duration / distanceKm;
      const minutes = Math.floor(paceSecPerKm / 60);
      const seconds = Math.floor(paceSecPerKm % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '00:00';
  };

  const formatSpeed = (speed) => {
    if (typeof speed === 'number' && speed > 0) {
      // Si la vitesse semble être en m/s (valeurs généralement < 20), la convertir en km/h
      if (speed < 20) {
        return (speed * 3.6).toFixed(1);
      }
      // Si déjà en km/h ou valeur aberrante, limiter à des valeurs réalistes
      if (speed > 50) {
        return '0.0'; // Vitesse trop élevée, probablement une erreur
      }
      return speed.toFixed(1);
    }
    return '0.0';
  };

  const formatDistanceKm = (distanceInMeters) => {
    if (typeof distanceInMeters !== 'number' || distanceInMeters <= 0) {
      return '0.00 km';
    }
    
    // Limiter à des distances réalistes pour une course à pied (max 100km)
    if (distanceInMeters > 100000) {
      console.warn('Distance aberrante détectée:', distanceInMeters, 'mètres');
      return '0.00 km';
    }
    
    const km = distanceInMeters / 1000;
    return formatDistance ? formatDistance(km) : `${km.toFixed(2)} km`;
  };

  const handleShare = async () => {
    try {
      const dateFormatted = formatDate(runData.date);
              const message = `🏃‍♂️ Ma course du ${dateFormatted.date}

📊 Statistiques:
• Distance: ${formatDistanceKm(runData.distance)}
• Temps: ${formatDuration ? formatDuration(runData.duration) : '0:00'}
• Allure: ${formatPace()}/km
• Calories: ${runData.calories} kcal

#Running #Course #Fitness`;

      await Share.share({
        message,
        title: 'Ma course',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager la course');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteRun) {
        await deleteRun(runData.id);
        setShowDeleteModal(false);
        navigation.goBack();
        Alert.alert('Succès', 'Course supprimée');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la course');
    }
  };

  const renderMapView = () => {
    if (!MapView || !runData.locations || runData.locations.length === 0) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={styles.mapPlaceholderText}>
            {!MapView ? 'Carte non disponible' : 'Aucun tracé GPS disponible'}
          </Text>
        </View>
      );
    }

    const validCoordinates = runData.locations.filter(loc => 
      loc && loc.latitude && loc.longitude
    );

    if (validCoordinates.length === 0) {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
          <Text style={styles.mapPlaceholderText}>Coordonnées GPS invalides</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        region={mapRegion}
        scrollEnabled={true}
        zoomEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {validCoordinates.length > 1 && Polyline && (
          <Polyline
            coordinates={validCoordinates.map(loc => ({
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

  const dateFormatted = formatDate(runData.date);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Détails de la course</Text>
          <Text style={styles.headerSubtext}>{dateFormatted.date}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte/Tracé */}
        <View style={styles.mapContainer}>
          {renderMapView()}
          
          {/* Overlay avec infos principales */}
          <View style={styles.mapOverlay}>
            <View style={styles.mainStats}>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>
                  {formatDistanceKm(runData.distance)}
                </Text>
                <Text style={styles.mainStatLabel}>Distance</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>
                  {formatDuration ? formatDuration(runData.duration) : '0:00'}
                </Text>
                <Text style={styles.mainStatLabel}>Temps</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{formatPace()}</Text>
                <Text style={styles.mainStatLabel}>Allure/km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Ionicons name="speedometer-outline" size={20} color="#4CAF50" />
                <Text style={styles.statCardTitle}>Vitesse</Text>
              </View>
              <Text style={styles.statCardValue}>{formatSpeed(runData.averageSpeed)} km/h</Text>
              <Text style={styles.statCardLabel}>Moyenne</Text>
              {runData.maxSpeed > 0 && (
                <Text style={styles.statCardSecondary}>
                  Max: {formatSpeed(runData.maxSpeed)} km/h
                </Text>
              )}
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Ionicons name="flame-outline" size={20} color="#FF9800" />
                <Text style={styles.statCardTitle}>Calories</Text>
              </View>
              <Text style={styles.statCardValue}>{runData.calories}</Text>
              <Text style={styles.statCardLabel}>kcal brûlées</Text>
            </View>

            {runData.elevationGain > 0 && (
              <View style={styles.statCard}>
                <View style={styles.statCardHeader}>
                  <Ionicons name="trending-up-outline" size={20} color="#2196F3" />
                  <Text style={styles.statCardTitle}>Dénivelé</Text>
                </View>
                <Text style={styles.statCardValue}>{runData.elevationGain}m</Text>
                <Text style={styles.statCardLabel}>D+</Text>
              </View>
            )}

            {runData.heartRate > 0 && (
              <View style={styles.statCard}>
                <View style={styles.statCardHeader}>
                  <Ionicons name="heart-outline" size={20} color="#f44336" />
                  <Text style={styles.statCardTitle}>Fréquence cardiaque</Text>
                </View>
                <Text style={styles.statCardValue}>{runData.heartRate} bpm</Text>
                <Text style={styles.statCardLabel}>Moyenne</Text>
                {runData.maxHeartRate > 0 && (
                  <Text style={styles.statCardSecondary}>
                    Max: {runData.maxHeartRate} bpm
                  </Text>
                )}
              </View>
            )}

            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Ionicons name="location-outline" size={20} color="#9C27B0" />
                <Text style={styles.statCardTitle}>Suivi GPS</Text>
              </View>
              <Text style={styles.statCardValue}>{runData.locations.length}</Text>
              <Text style={styles.statCardLabel}>Points GPS</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Ionicons name="time-outline" size={20} color="#607D8B" />
                <Text style={styles.statCardTitle}>Heure</Text>
              </View>
              <Text style={styles.statCardValue}>{dateFormatted.time}</Text>
              <Text style={styles.statCardLabel}>Début</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {runData.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{runData.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Run')}>
            <Ionicons name="play-outline" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Refaire ce parcours</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={48} color="#ff4444" />
            <Text style={styles.modalTitle}>Supprimer la course ?</Text>
            <Text style={styles.modalMessage}>
              Cette action est irréversible. Toutes les données de cette course seront perdues.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.modalConfirmText}>Supprimer</Text>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.3,
    position: 'relative',
    backgroundColor: '#e8f5e8',
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
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  mainStats: {
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
  mainStat: {
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mainStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statsSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 10,
    color: '#666',
  },
  statCardSecondary: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  notesSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  notesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RunDetailScreen;