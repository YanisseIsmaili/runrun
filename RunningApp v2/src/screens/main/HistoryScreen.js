import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Share,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRun } from '../../context/RunContext';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const HistoryScreen = ({ navigation }) => {
  const { runHistory, loading, fetchRunHistory, formatDuration, deleteRun } = useRun();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchRunHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRunHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2);
  };

  const calculatePace = (distance, duration) => {
    if (!distance || distance === 0 || !duration) return '--:--';
    
    const paceInMinutesPerKm = (duration / 60) / (distance / 1000);
    const minutes = Math.floor(paceInMinutesPerKm);
    const seconds = Math.floor((paceInMinutesPerKm - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openRunDetails = (run) => {
    setSelectedRun(run);
    setModalVisible(true);
  };

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

  const handleDeleteRun = (run) => {
    Alert.alert(
      'Supprimer la course',
      'Êtes-vous sûr de vouloir supprimer cette course ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: () => {
            deleteRun(run.id);
            if (modalVisible) {
              setModalVisible(false);
            }
          }
        }
      ]
    );
  };

  const getInitialRegion = (locations) => {
    if (!locations || locations.length === 0) {
      return {
        latitude: 48.856614,
        longitude: 2.3522219,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

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

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.2;
    const lngDelta = (maxLng - minLng) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lngDelta, 0.005),
    };
  };

  const RunHistoryItem = ({ run, onPress }) => (
    <TouchableOpacity style={styles.runItem} onPress={() => onPress(run)}>
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{formatDate(run.startTime)}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDistance(run.distance)} km</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDuration(run.duration)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{calculatePace(run.distance, run.duration)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );

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
              onPress={openRunDetails}
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

      {/* Modale de détails */}
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
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareRun(selectedRun)}
                >
                  <Ionicons name="share-social-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteRun(selectedRun)}
                >
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
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
                  <View style={styles.statDetailItem}>
                    <Ionicons name="trending-up-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statDetailValue}>
                      {formatDistance(selectedRun.distance)} km
                    </Text>
                    <Text style={styles.statDetailLabel}>Distance</Text>
                  </View>

                  <View style={styles.statDetailItem}>
                    <Ionicons name="time-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statDetailValue}>
                      {formatDuration(selectedRun.duration)}
                    </Text>
                    <Text style={styles.statDetailLabel}>Durée</Text>
                  </View>

                  <View style={styles.statDetailItem}>
                    <Ionicons name="speedometer-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statDetailValue}>
                      {calculatePace(selectedRun.distance, selectedRun.duration)}
                    </Text>
                    <Text style={styles.statDetailLabel}>Rythme</Text>
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
  runItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateContainer: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  date: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
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
  modalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    margin: 16,
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
  statDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statDetailLabel: {
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