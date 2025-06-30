import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Circle } from 'react-native-maps';
import RunService from '../services/RunService';

const { width } = Dimensions.get('window');

export default function RunHistoryScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadRuns = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const result = await RunService.getUserRuns(pageNum, 20);
      
      if (result.status === "success" && result.data) {
        let newRuns = [];
        if (result.data.runs && Array.isArray(result.data.runs)) {
          newRuns = result.data.runs;
        } else if (Array.isArray(result.data)) {
          newRuns = result.data;
        }
        
        if (filter !== 'all') {
          newRuns = newRuns.filter(run => run.status === filter);
        }
        
        if (refresh || pageNum === 1) {
          setRuns(newRuns);
        } else {
          setRuns(prev => [...prev, ...newRuns]);
        }
        
        setHasMore(newRuns.length === 20);
      } else {
        const localRuns = await RunService.getLocalRuns();
        setRuns(localRuns);
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Erreur chargement courses:', error);
      const localRuns = await RunService.getLocalRuns();
      setRuns(localRuns);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const onRefresh = () => loadRuns(1, true);
  const loadMore = () => {
    if (!loading && hasMore) {
      loadRuns(page + 1);
      setPage(prev => prev + 1);
    }
  };

  const deleteRun = async (runId) => {
    Alert.alert(
      'Supprimer la course',
      'Êtes-vous sûr de vouloir supprimer cette course ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await RunService.deleteRun(runId);
              setRuns(prev => prev.filter(run => run.id !== runId));
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la course');
            }
          }
        }
      ]
    );
  };

  const getTrailFromGpsData = (gpsData) => {
    if (!gpsData) return [];
    
    try {
      const parsed = typeof gpsData === 'string' ? JSON.parse(gpsData) : gpsData;
      return parsed.coordinates || parsed || [];
    } catch (error) {
      return [];
    }
  };

  const formatTime = (duration) => {
    if (!duration) return '0:00';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '0m';
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'paused': return '#2196F3';
      default: return '#757575';
    }
  };

  const FilterButton = ({ title, filterValue }) => (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Ionicons 
        name="checkmark-circle" 
        size={16} 
        color={filter === filterValue ? 'white' : 'rgba(255, 255, 255, 0.6)'} 
      />
      <Text style={[
        styles.filterButtonText,
        filter === filterValue && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderRunItem = ({ item, index }) => {
    const trail = getTrailFromGpsData(item.gps_data);
    const hasValidTrail = trail.length > 1;

    return (
      <View style={styles.runCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.runCardGradient}
        >
          <View style={styles.runHeader}>
            <View style={styles.runHeaderLeft}>
              <Ionicons name="fitness" size={16} color="#4CAF50" />
              <Text style={styles.runDate}>
                {formatDate(item.start_time || item.date)}
              </Text>
            </View>
            <View style={styles.runHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>
                  {item.status || 'Inconnu'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteRun(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>

          {hasValidTrail && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.miniMap}
                initialRegion={{
                  latitude: trail[0].latitude,
                  longitude: trail[0].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                
                // MASQUER L'ATTRIBUTION MAPS
                showsPointsOfInterest={false}
                showsCompass={false}
                showsScale={false}
                showsBuildings={false}
                showsTraffic={false}
                showsIndoors={false}
                loadingEnabled={false}
                provider={null}
              >
                <Polyline
                  coordinates={trail}
                  strokeColor="#4CAF50"
                  strokeWidth={3}
                />
                <Circle
                  center={trail[0]}
                  radius={50}
                  fillColor="rgba(76, 175, 80, 0.3)"
                  strokeColor="#4CAF50"
                  strokeWidth={2}
                />
                {trail.length > 1 && (
                  <Circle
                    center={trail[trail.length - 1]}
                    radius={50}
                    fillColor="rgba(244, 67, 54, 0.3)"
                    strokeColor="#f44336"
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>
          )}

          <View style={styles.runStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {item.distance_km ? `${item.distance_km}km` : formatDistance(item.distance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(item.duration)}</Text>
              <Text style={styles.statLabel}>Durée</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {item.avg_speed ? `${item.avg_speed.toFixed(1)} km/h` : '0 km/h'}
              </Text>
              <Text style={styles.statLabel}>Vitesse moy.</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {item.max_speed ? `${item.max_speed.toFixed(1)} km/h` : '0 km/h'}
              </Text>
              <Text style={styles.statLabel}>Vitesse max</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="fitness-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
      <Text style={styles.emptyStateTitle}>
        Aucune course trouvée
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        Commencez votre première course depuis l'écran principal
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Chargement des courses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Historique des courses</Text>
          
          <TouchableOpacity 
            onPress={onRefresh}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <FilterButton title="Toutes" filterValue="all" />
          <FilterButton title="Terminées" filterValue="finished" />
          <FilterButton title="En cours" filterValue="in_progress" />
        </View>

        <View style={styles.statsHeader}>
          <Text style={styles.statsHeaderText}>
            {runs.length} course{runs.length !== 1 ? 's' : ''} trouvée{runs.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {runs.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={runs}
          renderItem={renderRunItem}
          keyExtractor={(item) => (item.id || item.localId || Math.random()).toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  header: {
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsHeader: {
    alignItems: 'center',
    paddingBottom: 15,
  },
  statsHeaderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  runCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  runCardGradient: {
    padding: 16,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runDate: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  runHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  
  // Carte mini - ATTRIBUTION MASQUÉE
  mapContainer: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  miniMap: {
    flex: 1,
    marginBottom: -30, // Coupe l'attribution Maps
  },
  
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});