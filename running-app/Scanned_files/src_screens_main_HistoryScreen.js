import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RunContext } from '../../context/RunContext';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import RunHistoryItem from '../../components/RunHistoryItem';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
  const { runHistory, loading, fetchRunHistory, formatDuration } = useContext(RunContext);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchRunHistory();
  }, []);

  // Rafraîchir les données
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRunHistory();
    setRefreshing(false);
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater la distance en km
  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  // Calculer le rythme moyen (min/km)
  const calculatePace = (distance, duration) => {
    if (!distance || distance === 0 || !duration) return '--:--';
    
    const paceInMinutesPerKm = (duration / 60) / (distance / 1000);
    
    const minutes = Math.floor(paceInMinutesPerKm);
    const seconds = Math.floor((paceInMinutesPerKm - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Ouvrir la modale de détails d'une course
  const openRunDetails = (run) => {
    setSelectedRun(run);
    setModalVisible(true);
  };

  // Partager les détails d'une course
  const shareRun = async (run) => {
    try {
      const message = `J'ai couru ${formatDistance(run.distance)} km en ${formatDuration(run.duration)} le ${formatDate(run.startTime)}. Rythme moyen: ${calculatePace(run.distance, run.duration)} min/km.`;
      await Share.share({
        message,
        title: 'Ma course avec Running App',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Calculer la région initiale pour la carte
  const getInitialRegion = (locations) => {
    if (!locations || locations.length === 0) {
      return {
        latitude: 48.856614,
        longitude: 2.3522219,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Trouver les coordonnées min et max
    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(loc => {
      minLat = Math.min(minLat, loc.latitude);
      maxLat = Math.max(maxLat, loc.latitude);
      minLng = Math.min(minLng, loc.longitude);
      maxLng = Math.max(maxLng, loc.longitude);
    });

    // Calculer le centre
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculer les deltas avec un peu de marge
    const latDelta = (maxLat - minLat) * 1.2;
    const lngDelta = (maxLng - minLng) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  // Rendu d'un élément vide si aucune course
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>Vous n'avez pas encore enregistré de course</Text>
      <TouchableOpacity
        style={styles.startRunButton}
        onPress={() => navigation.navigate('Running')}
      >
        <Text style={styles.startRunButtonText}>Commencer une course</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement de vos courses...</Text>
        </View>
      ) : (
        <FlatList
          data={runHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RunHistoryItem
              run={item}
              onPress={() => openRunDetails(item)}
              formatDate={formatDate}
              formatDistance={formatDistance}
              formatDuration={formatDuration}
              calculatePace={calculatePace}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      {/* Modale de détails d'une course */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedRun && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails de la course</Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareRun(selectedRun)}
              >
                <Ionicons name="share-social-outline" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              {selectedRun.locations && selectedRun.locations.length > 0 ? (
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={getInitialRegion(selectedRun.locations)}
                >
                  <Polyline
                    coordinates={selectedRun.locations}
                    strokeWidth={4}
                    strokeColor="#4CAF50"
                  />
                </MapView>
              ) : (
                <View style={styles.noMapContainer}>
                  <Ionicons name="map-outline" size={40} color="#CCCCCC" />
                  <Text style={styles.noMapText}>Parcours non disponible</Text>
                </View>
              )}
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailCard}>
                <Text style={styles.detailDate}>
                  {formatDate(selectedRun.startTime)}
                </Text>
                <Text style={styles.detailTime}>
                  {formatTime(selectedRun.startTime)}
                </Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="trending-up-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statValue}>
                      {formatDistance(selectedRun.distance)} km
                    </Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statValue}>
                      {formatDuration(selectedRun.duration)}
                    </Text>
                    <Text style={styles.statLabel}>Durée</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Ionicons name="speedometer-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statValue}>
                      {calculatePace(selectedRun.distance, selectedRun.duration)}
                    </Text>
                    <Text style={styles.statLabel}>Rythme</Text>
                  </View>
                </View>

                <View style={styles.additionalStatsContainer}>
                  <View style={styles.additionalStatItem}>
                    <Text style={styles.additionalStatLabel}>Vitesse moyenne</Text>
                    <Text style={styles.additionalStatValue}>
                      {((selectedRun.distance / 1000) / (selectedRun.duration / 3600)).toFixed(1)} km/h
                    </Text>
                  </View>

                  <View style={styles.additionalStatItem}>
                    <Text style={styles.additionalStatLabel}>Calories (estimation)</Text>
                    <Text style={styles.additionalStatValue}>
                      {Math.round(selectedRun.distance / 1000 * 65)} kcal
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  startRunButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#EEEEEE',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    marginTop: 10,
    color: '#757575',
  },
  detailsContainer: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailTime: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  additionalStatsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  additionalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  additionalStatLabel: {
    color: '#757575',
    fontSize: 14,
  },
  additionalStatValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HistoryScreen;