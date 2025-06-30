// screens/RunHistoryScreen.js - VERSION CORRIGÉE
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
        console.log('🔄 Rafraîchissement des courses...');
      } else if (pageNum === 1) {
        setLoading(true);
        console.log('📊 Chargement initial des courses...');
      } else {
        console.log(`📊 Chargement page ${pageNum}...`);
      }

      const result = await RunService.getUserRuns(pageNum, 20);
      console.log('📄 Réponse API complète:', result);
      
      if (result.status === "success" && result.data) {
        // ✅ SEULEMENT données de l'API - PAS de fallback local
        let newRuns = [];
        console.log('🔍 Structure complète API:', JSON.stringify(result, null, 2));
        if (result.data.runs && Array.isArray(result.data.runs)) {
          newRuns = result.data.runs;
        } else if (Array.isArray(result.data)) {
          newRuns = result.data;
        } else {
          console.log('⚠️ Aucune donnée API disponible');
          newRuns = [];
        }
        
        // Appliquer le filtre
        if (filter !== 'all') {
          newRuns = newRuns.filter(run => run.status === filter);
        }
        
        console.log(`✅ ${newRuns.length} courses API récupérées`);
        
        if (refresh || pageNum === 1) {
          setRuns(newRuns);
        } else {
          setRuns(prev => [...prev, ...newRuns]);
        }
        
        // Gestion de la pagination
        if (result.data.pagination) {
          setHasMore(result.data.pagination.page < result.data.pagination.pages);
        } else {
          setHasMore(newRuns.length === 20);
        }
        
        setPage(pageNum);
      } else {
        console.log('❌ Pas de données API disponibles');
        setRuns([]); // Vide si pas de données API
      }
    } catch (error) {
      console.error('💥 Erreur loadRuns:', error);
      setRuns([]); // Vide si erreur API
      Alert.alert('Erreur', 'Impossible de charger les courses depuis l\'API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRuns();
  }, [filter]);

  const onRefresh = () => loadRuns(1, true);
  
  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      loadRuns(page + 1);
    }
  };

  const deleteRun = async (runId) => {
    Alert.alert(
      'Supprimer le tracé',
      'Êtes-vous sûr de vouloir supprimer cette course ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Suppression de la course:', runId);
              const result = await RunService.deleteRun(runId);
              
              if (result.success) {
                setRuns(prev => prev.filter(run => run.id !== runId && run.id !== parseInt(runId)));
                console.log('✅ Course supprimée');
              } else {
                Alert.alert('Erreur', result.message || 'Impossible de supprimer la course');
              }
            } catch (error) {
              console.error('❌ Erreur suppression:', error);
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
      if (data.coordinates && Array.isArray(data.coordinates)) {
        return data.coordinates.filter(coord => 
          coord && coord.latitude && coord.longitude &&
          typeof coord.latitude === 'number' && typeof coord.longitude === 'number'
        );
      }
      if (Array.isArray(data)) {
        return data.filter(coord => 
          coord && coord.latitude && coord.longitude &&
          typeof coord.latitude === 'number' && typeof coord.longitude === 'number'
        );
      }
      return [];
    } catch (error) {
      console.log('⚠️ Erreur parsing GPS data:', error);
      return [];
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    if (!meters || meters <= 0) return '0m';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.log('⚠️ Erreur formatage date:', error);
      return 'Date invalide';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'finished': return 'terminés';
      case 'in_progress': return 'en cours';
      case 'paused': return 'en pause';
      default: return 'tous';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finished': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'paused': return '#f44336';
      default: return '#666';
    }
  };

  const FilterButton = ({ filterValue, title, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Ionicons 
        name={icon} 
        size={14} 
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
              <Text style={styles.statValue}>{item.distance_km ? `${item.distance_km}km` : formatDistance(item.distance)}</Text>
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

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.loadingFooterText}>Chargement...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.emptyStateGradient}
      >
        <Ionicons name="fitness-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
        <Text style={styles.emptyStateTitle}>
          {filter === 'all' 
            ? 'Aucune course enregistrée'
            : `Aucun tracé "${getStatusText(filter)}"`
          }
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          {runs.length === 0 
            ? 'Commencez votre première course'
            : `Aucun tracé "${getStatusText(filter)}"`
          }
        </Text>
        {filter !== 'all' && (
          <TouchableOpacity 
            onPress={() => setFilter('all')}
            style={styles.showAllButton}
          >
            <Text style={styles.showAllButtonText}>Voir tous les tracés</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement des courses...</Text>
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
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
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
          ListFooterComponent={renderFooter}
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
    paddingBottom: 10,
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
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
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    padding: 4,
  },
  mapContainer: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  miniMap: {
    flex: 1,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingFooterText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  showAllButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});