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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

const HistoryScreen = ({ navigation }) => {
  // Contextes
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
  const [sortBy, setSortBy] = useState('date'); // date, distance, duration
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, week, month, year
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

    // Filtre par recherche textuelle
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(run => {
        const distance = formatSafeDistance(run);
        const duration = formatSafeDuration(run.duration || 0);
        const date = formatRunDate(run.startTime || run.start_time);
        
        return (
          distance.toLowerCase().includes(searchLower) ||
          duration.toLowerCase().includes(searchLower) ||
          date.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtre par date
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

      filtered = filtered.filter(run => {
        const runDate = new Date(run.startTime || run.start_time);
        return runDate >= cutoffDate;
      });
    }

    // Filtre par distance
    if (filters.minDistance) {
      const minDist = parseFloat(filters.minDistance) * 1000; // Convertir en mètres
      filtered = filtered.filter(run => {
        const runDist = getDistanceInMeters(run);
        return runDist >= minDist;
      });
    }

    if (filters.maxDistance) {
      const maxDist = parseFloat(filters.maxDistance) * 1000;
      filtered = filtered.filter(run => {
        const runDist = getDistanceInMeters(run);
        return runDist <= maxDist;
      });
    }

    // Filtre par durée
    if (filters.minDuration) {
      const minDur = parseInt(filters.minDuration) * 60; // Convertir en secondes
      filtered = filtered.filter(run => (run.duration || 0) >= minDur);
    }

    if (filters.maxDuration) {
      const maxDur = parseInt(filters.maxDuration) * 60;
      filtered = filtered.filter(run => (run.duration || 0) <= maxDur);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'distance':
          aValue = getDistanceInMeters(a);
          bValue = getDistanceInMeters(b);
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.startTime || a.start_time).getTime();
          bValue = new Date(b.startTime || b.start_time).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredRuns(filtered);
  };

  // Fonction pour traiter la distance de manière sécurisée
  const getDistanceInMeters = (run) => {
    // Si distanceMeters existe, l'utiliser directement
    if (run.distanceMeters && typeof run.distanceMeters === 'number') {
      return run.distanceMeters;
    }
    
    // Si distance existe et semble être en km (< 100), convertir en mètres
    if (run.distance && typeof run.distance === 'number') {
      if (run.distance < 100) {
        return run.distance * 1000; // Conversion km -> mètres
      } else if (run.distance > 100000) {
        // Distance aberrante, probablement une erreur
        console.warn('Distance aberrante détectée:', run.distance);
        return 0;
      } else {
        return run.distance; // Déjà en mètres
      }
    }
    
    return 0;
  };

  const formatSafeDistance = (run) => {
    const distanceInMeters = getDistanceInMeters(run);
    
    if (distanceInMeters <= 0 || distanceInMeters > 100000) {
      return '0.00 km';
    }
    
    const distanceKm = distanceInMeters / 1000;
    return formatDistance ? formatDistance(distanceKm) : `${distanceKm.toFixed(2)} km`;
  };

  const formatSafeDuration = (dur) => {
    if (typeof dur !== 'number' || isNaN(dur)) return '0:00';
    return formatDuration ? formatDuration(dur) : '0:00';
  };

  const formatRunDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const formatPace = (run) => {
    const distance = getDistanceInMeters(run);
    const duration = run.duration || 0;
    
    if (!distance || !duration || distance === 0) return '00:00';
    const distanceKm = distance / 1000;
    const paceSecPerKm = duration / distanceKm;
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRunPress = (run) => {
    navigation.navigate('RunDetail', { run });
  };

  const handleDeleteRun = (run) => {
    setSelectedRun(run);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedRun || !deleteRun) return;

    try {
      await deleteRun(selectedRun.id);
      setShowDeleteModal(false);
      setSelectedRun(null);
      Alert.alert('Succès', 'Course supprimée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la course');
    }
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      minDistance: '',
      maxDistance: '',
      minDuration: '',
      maxDuration: '',
    });
    setSearchTerm('');
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'swap-vertical-outline';
    return sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderRunItem = ({ item: run }) => {
    const pace = formatPace(run);

    return (
      <TouchableOpacity
        style={styles.runItem}
        onPress={() => handleRunPress(run)}
        activeOpacity={0.7}
      >
        <View style={styles.runHeader}>
          <View style={styles.runIcon}>
            <Ionicons name="footsteps" size={20} color="#4CAF50" />
          </View>
          <View style={styles.runInfo}>
            <Text style={styles.runDistance}>{formatSafeDistance(run)}</Text>
            <Text style={styles.runDate}>{formatRunDate(run.startTime || run.start_time)}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRun(run)}
          >
            <Ionicons name="trash-outline" size={16} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.runStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.statText}>{formatSafeDuration(run.duration || 0)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={14} color="#666" />
            <Text style={styles.statText}>{pace}/km</Text>
          </View>
          {run.calories_burned || run.calories ? (
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={14} color="#666" />
              <Text style={styles.statText}>{run.calories_burned || run.calories} cal</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="footsteps-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucune course trouvée</Text>
      <Text style={styles.emptySubtitle}>
        {searchTerm || Object.values(filters).some(f => f && f !== 'all')
          ? 'Essayez de modifier vos filtres'
          : 'Commencez votre première course !'}
      </Text>
      {!searchTerm && !Object.values(filters).some(f => f && f !== 'all') && (
        <TouchableOpacity
          style={styles.startRunButton}
          onPress={() => navigation.navigate('Run')}
        >
          <Text style={styles.startRunButtonText}>Nouvelle course</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une course..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Boutons de tri et filtres */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => toggleSort('date')}
        >
          <Ionicons name={getSortIcon('date')} size={16} color="#666" />
          <Text style={styles.sortText}>Date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => toggleSort('distance')}
        >
          <Ionicons name={getSortIcon('distance')} size={16} color="#666" />
          <Text style={styles.sortText}>Distance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => toggleSort('duration')}
        >
          <Ionicons name={getSortIcon('duration')} size={16} color="#666" />
          <Text style={styles.sortText}>Durée</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={16} color="#4CAF50" />
          <Text style={styles.filterText}>Filtres</Text>
        </TouchableOpacity>
      </View>

      {/* Compteur de résultats */}
      <Text style={styles.resultsCount}>
        {filteredRuns.length} course{filteredRuns.length !== 1 ? 's' : ''}
        {searchTerm || Object.values(filters).some(f => f && f !== 'all') ? ' trouvée(s)' : ' au total'}
      </Text>
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
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredRuns.length === 0 ? styles.emptyContainer : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de filtres */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filtersModal}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.filtersContent}>
              {/* Filtre par période */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Période</Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'all', label: 'Toutes' },
                    { value: 'week', label: '7 derniers jours' },
                    { value: 'month', label: '30 derniers jours' },
                    { value: 'year', label: '12 derniers mois' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.dateRange === option.value && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters(prev => ({...prev, dateRange: option.value}))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.dateRange === option.value && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filtre par distance */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance (km)</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Min"
                    value={filters.minDistance}
                    onChangeText={(text) => setFilters(prev => ({...prev, minDistance: text}))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Max"
                    value={filters.maxDistance}
                    onChangeText={(text) => setFilters(prev => ({...prev, maxDistance: text}))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Filtre par durée */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Durée (minutes)</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Min"
                    value={filters.minDuration}
                    onChangeText={(text) => setFilters(prev => ({...prev, minDuration: text}))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Max"
                    value={filters.maxDuration}
                    onChangeText={(text) => setFilters(prev => ({...prev, maxDuration: text}))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.filtersFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="trash-outline" size={48} color="#ff4444" />
            <Text style={styles.deleteModalTitle}>Supprimer la course ?</Text>
            <Text style={styles.deleteModalMessage}>
              Cette action est irréversible. La course sera définitivement supprimée.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Supprimer</Text>
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
    justifyContent: 'space-between',
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
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listHeader: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
  },
  filterText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  runItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
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
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  runInfo: {
    flex: 1,
  },
  runDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  runDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startRunButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#666',
  },
  filtersFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteModalContent: {
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
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HistoryScreen;