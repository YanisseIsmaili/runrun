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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

// Import conditionnel de MapView
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
  const [deleting, setDeleting] = useState(false);

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
        const deltaLat = (maxLat - minLat) * 1.2; // Padding
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

  // Données formatées pour l'affichage
  const runData = {
    id: run.id || run.serverId,
    date: run.startTime || run.start_time,
    endDate: run.endTime || run.end_time,
    distance: run.distanceMeters || (run.distance * 1000) || 0, // en mètres pour l'affichage
    distanceKm: run.distanceKm || run.distance || 0, // en km
    duration: run.duration || 0,
    averageSpeed: run.averageSpeed || (run.avg_speed ? run.avg_speed * 3.6 : 0), // km/h
    maxSpeed: run.maxSpeed || (run.max_speed ? run.max_speed * 3.6 : 0), // km/h
    pace: run.pace || '00:00',
    calories: run.calories || run.calories_burned || 0,
    notes: run.notes || '',
    locations: run.locations || [],
    status: run.status || 'finished',
  };

  const formatRunDate = () => {
    const date = new Date(runData.date);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const formatPace = () => {
    if (runData.pace && runData.pace !== '00:00') {
      return runData.pace;
    }
    
    if (runData.distanceKm > 0 && runData.duration > 0) {
      const paceSecPerKm = runData.duration / runData.distanceKm;
      const minutes = Math.floor(paceSecPerKm / 60);
      const seconds = Math.floor(paceSecPerKm % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '00:00';
  };

  const formatSpeed = (speed) => {
    if (typeof speed === 'number' && speed > 0) {
      return Math.min(speed, 50).toFixed(1); // Limiter à 50 km/h max
    }
    return '0.0';
  };

  const formatDistanceKm = (distanceInMeters) => {
    if (typeof distanceInMeters !== 'number' || distanceInMeters <= 0) {
      return '0.00 km';
    }
    
    const km = distanceInMeters / 1000;
    return formatDistance ? formatDistance(km) : `${km.toFixed(2)} km`;
  };

  const handleShare = async () => {
    try {
      const dateFormatted = formatRunDate();
      const message = `🏃‍♂️ Ma course du ${dateFormatted.date}

📊 Statistiques:
• Distance: ${formatDistanceKm(runData.distance)}
• Temps: ${formatDuration ? formatDuration(runData.duration) : '0:00'}
• Allure: ${formatPace()}/km
• Vitesse moy.: ${formatSpeed(runData.averageSpeed)} km/h
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
    if (!deleteRun) {
      Alert.alert('Erreur', 'Fonction de suppression non disponible');
      return;
    }

    try {
      setDeleting(true);
      await deleteRun(runData.id);
      setShowDeleteModal(false);
      navigation.goBack();
      Alert.alert('Succès', 'Course supprimée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la course');
    } finally {
      setDeleting(false);
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

    return (
      <MapView
        style={styles.map}
        region={mapRegion}
        scrollEnabled={true}
        zoomEnabled={true}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={true}
      >
        <Polyline
          coordinates={runData.locations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
          }))}
          strokeColor="#4CAF50"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      </MapView>
    );
  };

  const dateFormatted = formatRunDate();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la course</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations principales */}
        <View style={styles.section}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dateFormatted.date}</Text>
            <Text style={styles.timeText}>Démarrage à {dateFormatted.time}</Text>
          </View>
          
          <View style={styles.mainStats}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>
                {formatDistanceKm(runData.distance)}
              </Text>
              <Text style={styles.mainStatLabel}>Distance</Text>
            </View>
            
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>
                {formatDuration ? formatDuration(runData.duration) : '0:00'}
              </Text>
              <Text style={styles.mainStatLabel}>Temps</Text>
            </View>
            
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{formatPace()}</Text>
              <Text style={styles.mainStatLabel}>Allure/km</Text>
            </View>
          </View>
        </View>

        {/* Carte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracé de la course</Text>
          <View style={styles.mapContainer}>
            {renderMapView()}
          </View>
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="speedometer-outline" size={24} color="#2196F3" />
              <Text style={styles.statValue}>
                {formatSpeed(runData.averageSpeed)} km/h
              </Text>
              <Text style={styles.statLabel}>Vitesse moyenne</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flash-outline" size={24} color="#FF9800" />
              <Text style={styles.statValue}>
                {formatSpeed(runData.maxSpeed)} km/h
              </Text>
              <Text style={styles.statLabel}>Vitesse max</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color="#F44336" />
              <Text style={styles.statValue}>{runData.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="location-outline" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>{runData.locations.length}</Text>
              <Text style={styles.statLabel}>Points GPS</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {runData.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{runData.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={48} color="#F44336" />
            <Text style={styles.modalTitle}>Supprimer la course</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir supprimer cette course ?{'\n'}
              Cette action est irréversible.
            </Text>
            
            <View style={styles.modalRunInfo}>
              <Text style={styles.modalRunText}>
                {dateFormatted.date} • {formatDistanceKm(runData.distance)}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
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
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
    fontSize: 16,
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
    fontSize: 20,
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
    lineHeight: 24,
  },
  modalRunInfo: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  modalRunText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
  deleteButton: {
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RunDetailScreen;