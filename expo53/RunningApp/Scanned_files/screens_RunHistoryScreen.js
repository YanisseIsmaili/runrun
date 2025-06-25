// screens/RunHistoryScreen.js - Version corrigée
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
  const [selectedRun, setSelectedRun] = useState(null);
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
      
      if (result.success) {
        let newRuns = result.data.runs || [];
        
        if (filter !== 'all') {
          newRuns = newRuns.filter(run => run.status === filter);
        }
        
        if (refresh || pageNum === 1) {
          setRuns(newRuns);
        } else {
          setRuns(prev => [...prev, ...newRuns]);
        }
        
        setHasMore(result.data.pagination?.page < result.data.pagination?.pages);
        setPage(pageNum);
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les tracés');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRuns();
  }, [filter]);

  const onRefresh = () => loadRuns(1, true);
  const loadMore = () => hasMore && !loading && loadRuns(page + 1);

  const deleteRun = async (runId) => {
    Alert.alert(
      'Supprimer le tracé',
      'Êtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await RunService.deleteRun(runId);
              if (result.success) {
                setRuns(prev => prev.filter(run => run.id !== runId));
              } else {
                Alert.alert('Erreur', result.message);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const getTrailFromGpsData = (gpsData) => {
    if (!gpsData) return [];
    try {
      const data = typeof gpsData === 'string' ? JSON.parse(gpsData) : gpsData;
      if (data.coordinates) return data.coordinates;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  };

  const getTrailColor = (speed = 0) => {
    if (speed < 6) return 'rgba(255, 107, 107, 0.7)';
    if (speed < 12) return 'rgba(78, 205, 196, 0.7)';
    return 'rgba(69, 183, 209, 0.7)';
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '0m';
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'paused': return '#6366F1';
      default: return '#9CA3AF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'finished': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'paused': return 'En pause';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'finished': return 'checkmark-circle';
      case 'in_progress': return 'play-circle';
      case 'paused': return 'pause-circle';
      default: return 'help-circle';
    }
  };

  const FilterButton = ({ filterValue, title, icon }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterValue && styles.filterButtonActive]}
      onPress={() => setFilter(filterValue)}
    >
      <Ionicons 
        name={icon} 
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

  const renderRunItem = ({ item }) => {
    const trail = getTrailFromGpsData(item.gps_data);
    const hasMap = trail.length > 0;

    return (
      <View style={styles.runCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.runCardGradient}
        >
          <View style={styles.runHeader}>
            <View style={styles.runHeaderLeft}>
              <Ionicons 
                name={getStatusIcon(item.status)} 
                size={20} 
                color={getStatusColor(item.status)} 
              />
              <Text style={styles.runDate}>{formatDate(item.start_time)}</Text>
            </View>
            <View style={styles.runHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => deleteRun(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {hasMap && (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                region={{
                  latitude: trail[0].latitude || 0,
                  longitude: trail[0].longitude || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Polyline
                  coordinates={trail}
                  strokeColor="#6366F1"
                  strokeWidth={3}
                />
                {trail.map((point, index) => 
                  index % 3 === 0 && point.latitude && point.longitude && (
                    <Circle
                      key={index}
                      center={point}
                      radius={2}
                      fillColor={getTrailColor(point.speed)}
                      strokeColor="transparent"
                    />
                  )
                )}
              </MapView>
              <TouchableOpacity 
                style={styles.expandMapButton}
                onPress={() => setSelectedRun(selectedRun?.id === item.id ? null : item)}
              >
                <Ionicons 
                  name={selectedRun?.id === item.id ? "contract" : "expand"} 
                  size={16} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.runStats}>
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={18} color="#8B5CF6" />
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#6366F1" />
              <Text style={styles.statLabel}>Temps</Text>
              <Text style={styles.statValue}>{formatTime(item.duration)}</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={18} color="#EC4899" />
              <Text style={styles.statLabel}>Vitesse</Text>
              <Text style={styles.statValue}>
                {item.avg_speed ? `${item.avg_speed.toFixed(1)} km/h` : '0.0 km/h'}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="footsteps-outline" size={18} color="#10B981" />
              <Text style={styles.statLabel}>Points GPS</Text>
              <Text style={styles.statValue}>{trail.length}</Text>
            </View>
          </View>

          {selectedRun?.id === item.id && hasMap && (
            <View style={styles.expandedMapContainer}>
              <MapView
                style={styles.expandedMap}
                region={{
                  latitude: trail[Math.floor(trail.length / 2)]?.latitude || 0,
                  longitude: trail[Math.floor(trail.length / 2)]?.longitude || 0,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Polyline
                  coordinates={trail}
                  strokeColor="#6366F1"
                  strokeWidth={4}
                />
                {trail.map((point, index) => 
                  point.latitude && point.longitude && (
                    <Circle
                      key={index}
                      center={point}
                      radius={3}
                      fillColor={getTrailColor(point.speed)}
                      strokeColor="transparent"
                    />
                  )
                )}
              </MapView>
              
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>{'< 6 km/h'}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.legendText}>6-12 km/h</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#45B7D1' }]} />
                  <Text style={styles.legendText}>{'> 12 km/h'}</Text>
                </View>
              </View>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text-outline" size={14} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.emptyGradient}
      >
        <Ionicons name="map-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
        <Text style={styles.emptyTitle}>Aucun tracé trouvé</Text>
        <Text style={styles.emptySubtitle}>
          {filter === 'all' 
            ? 'Commencez votre première course'
            : `Aucun tracé "${getStatusText(filter)}"`
          }
        </Text>
      </LinearGradient>
    </View>
  );

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Tracés</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <FilterButton filterValue="all" title="Tous" icon="apps-outline" />
          <FilterButton filterValue="finished" title="Terminés" icon="checkmark-circle-outline" />
          <FilterButton filterValue="in_progress" title="En cours" icon="play-circle-outline" />
        </View>
      </LinearGradient>

      {runs.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={runs}
          renderItem={renderRunItem}
          keyExtractor={(item) => item.id.toString()}
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
    paddingBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  runCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  runCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    flex: 1,
  },
  runDate: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  runHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  miniMapContainer: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  miniMap: {
    flex: 1,
  },
  expandMapButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
  },
  expandedMapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  expandedMap: {
    flex: 1,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
});