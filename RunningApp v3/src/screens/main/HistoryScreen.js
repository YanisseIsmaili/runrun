import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');

const HistoryScreen = ({ navigation }) => {
  const runContext = useRun();
  const {
    runHistory = [],
    loading: contextLoading,
    fetchRunHistory,
    deleteRun,
    formatDuration,
    error: contextError
  } = runContext || {};

  const settingsContext = useSettings();
  const { formatDistance } = settingsContext || { formatDistance: (d) => `${d.toFixed(2)} km` };

  // États locaux
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    minDistance: '',
    maxDistance: '',
    minDuration: '',
    maxDuration: '',
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [runHistory, searchTerm, sortBy, sortOrder, filters]);

  useEffect(() => {
    if (contextError) {
      Alert.alert('Erreur', contextError);
    }
  }, [contextError]);

  const loadHistory = async () => {
    try {
      if (fetchRunHistory) {
        await fetchRunHistory();
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  const applyFiltersAndSort = () => {
    let filtered = Array.isArray(runHistory) ? [...runHistory] : [];

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(run =>
        run.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(run.startTime || run.start_time).toLocaleDateString('fr-FR').includes(searchTerm)
      );
    }

    // Filtrage par plage de dates
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(run => 
        new Date(run.startTime || run.start_time) >= cutoffDate
      );
    }

    // Filtrage par distance
    if (filters.minDistance) {
      filtered = filtered.filter(run => {
        const distanceKm = run.distanceKm || (run.distance / 1000) || 0;
        return distanceKm >= parseFloat(filters.minDistance);
      });
    }
    if (filters.maxDistance) {
      filtered = filtered.filter(run => {
        const distanceKm = run.distanceKm || (run.distance / 1000) || 0;
        return distanceKm <= parseFloat(filters.maxDistance);
      });
    }

    // Filtrage par durée
    if (filters.minDuration) {
      filtered = filtered.filter(run => 
        (run.duration || 0) >= parseInt(filters.minDuration) * 60
      );
    }
    if (filters.maxDuration) {
      filtered = filtered.filter(run => 
        (run.duration || 0) <= parseInt(filters.maxDuration) * 60
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.startTime || a.start_time);
          bVal = new Date(b.startTime || b.start_time);
          break;
        case 'distance':
          aVal = a.distanceKm || (a.distance / 1000) || 0;
          bVal = b.distanceKm || (b.distance / 1000) || 0;
          break;
        case 'duration':
          aVal = a.duration || 0;
          bVal = b.duration || 0;
          break;
        default:
          aVal = new Date(a.startTime || a.start_time);
          bVal = new Date(b.startTime || b.start_time);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRuns(filtered);
  };

  const handleDeleteRun = async (runId) => {
    try {
      await deleteRun(runId);
      setShowDeleteModal(false);
      setSelectedRun(null);
      Alert.alert('Succès', 'Course supprimée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la course');
    }
  };

  const formatRunDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatRunTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSafeDistance = (run) => {
    const distanceKm = run.distanceKm || (run.distance / 1000) || 0;
    return formatDistance ? formatDistance(distanceKm) : `${distanceKm.toFixed(2)} km`;
  };

  const formatSafeDuration = (duration) => {
    return formatDuration ? formatDuration(duration) : '0:00';
  };

  const renderRunItem = ({ item }) => {
    const runDate = item.startTime || item.start_time;
    const pace = item.pace || '00:00';
    const calories = item.calories || item.calories_burned || 0;

    return (
      <TouchableOpacity
        style={styles.runItem}
        onPress={() => navigation.navigate('RunDetail', { run: item })}
      >
        <View style={styles.runHeader}>
          <View style={styles.runIcon}>
            <Ionicons name="footsteps" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.runInfo}>
            <Text style={styles.runDate}>
              {formatRunDate(runDate)} • {formatRunTime(runDate)}
            </Text>
            <Text style={styles.runNotes} numberOfLines={1}>
              {item.notes || 'Course sans notes'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setSelectedRun(item);
              setShowDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.runStats}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color="#666" />
            <Text style={styles.statText}>{formatSafeDistance(item)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statText}>{formatSafeDuration(item.duration)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={16} color="#666" />
            <Text style={styles.statText}>{pace}/km</Text>
          </View>
          
          {calories > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={16} color="#666" />
              <Text style={styles.statText}>{calories} kcal</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une course..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtres et tri */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#4CAF50" />
          <Text style={styles.filterButtonText}>Filtres</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            if (sortBy === 'date') {
              setSortBy('distance');
            } else if (sortBy === 'distance') {
              setSortBy('duration');
            } else {
              setSortBy('date');
            }
          }}
        >
          <Ionicons 
            name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} 
            size={16} 
            color="#4CAF50" 
          />
          <Text style={styles.sortButtonText}>
            {sortBy === 'date' ? 'Date' : sortBy === 'distance' ? 'Distance' : 'Durée'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <Ionicons 
            name={sortOrder === 'desc' ? "chevron-down" : "chevron-up"} 
            size={20} 
            color="#4CAF50" 
          />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredRuns.length} course{filteredRuns.length > 1 ? 's' : ''}
          {searchTerm || Object.values(filters).some(f => f && f !== 'all') ? ' trouvée(s)' : ' au total'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="footsteps-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucune course trouvée</Text>
      <Text style={styles.emptyMessage}>
        {runHistory.length === 0 
          ? "Commencez votre première course pour voir votre historique ici."
          : "Aucune course ne correspond à vos critères de recherche."
        }
      </Text>
      
      {runHistory.length === 0 && (
        <TouchableOpacity
          style={styles.startRunButton}
          onPress={() => navigation.navigate('Run')}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.startRunButtonText}>Commencer une course</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Run')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      {contextLoading && filteredRuns.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRuns}
          renderItem={renderRunItem}
          keyExtractor={(item) => item.id?.toString() || item.serverId?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredRuns.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

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
              Êtes-vous sûr de vouloir supprimer cette course ? Cette action est irréversible.
            </Text>
            
            {selectedRun && (
              <View style={styles.modalRunInfo}>
                <Text style={styles.modalRunText}>
                  {formatRunDate(selectedRun.startTime || selectedRun.start_time)} • {formatSafeDistance(selectedRun)}
                </Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal]}
                onPress={() => handleDeleteRun(selectedRun?.id || selectedRun?.serverId)}
              >
                <Text style={styles.deleteButtonText}>Supprimer</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    padding: 4,
  },
  headerContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#4CAF50',
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  sortButtonText: {
    marginLeft: 4,
    color: '#4CAF50',
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  list: {
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  runItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
  },
  runHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  runIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  runInfo: {
    flex: 1,
  },
  runDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  runNotes: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startRunButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  deleteButtonModal: {
    backgroundColor: '#F44336',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;