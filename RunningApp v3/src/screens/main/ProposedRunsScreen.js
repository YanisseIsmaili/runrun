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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';
import * as apiService from '../../services/api';

// Import conditionnel de MapView pour éviter les erreurs
let MapView, Polyline, Marker;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
} catch (error) {
  MapView = null;
}

const ProposedRunsScreen = ({ navigation }) => {
  // Contextes
  const settingsContext = useSettings();
  const { formatDistance } = settingsContext || { formatDistance: (d) => `${d.toFixed(2)} km` };

  // États locaux
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: 'all', // all, Facile, Moyen, Difficile
    minDistance: '',
    maxDistance: '',
    minDuration: '',
    maxDuration: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, distance, duration, difficulty
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Charger les données au montage
  useEffect(() => {
    loadRoutes();
  }, []);

  // Mettre à jour les routes filtrées quand les données changent
  useEffect(() => {
    applyFiltersAndSort();
  }, [routes, searchTerm, sortBy, sortOrder, filters]);

  const loadRoutes = async () => {
    try {
      setError(null);
      const response = await apiService.getProposedRoutes();
      
      if (response?.status === 'success' && response?.data) {
        setRoutes(response.data);
      } else if (Array.isArray(response)) {
        setRoutes(response);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.error('Erreur chargement routes:', error);
      setError('Erreur de chargement des parcours');
      Alert.alert('Erreur', 'Impossible de charger les parcours proposés');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  }, []);

  const applyFiltersAndSort = () => {
    let filtered = [...routes];

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par difficulté
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(route => route.difficulty === filters.difficulty);
    }

    // Filtrage par distance
    if (filters.minDistance) {
      const min = parseFloat(filters.minDistance);
      filtered = filtered.filter(route => route.distance >= min);
    }
    if (filters.maxDistance) {
      const max = parseFloat(filters.maxDistance);
      filtered = filtered.filter(route => route.distance <= max);
    }

    // Filtrage par durée
    if (filters.minDuration) {
      const min = parseInt(filters.minDuration);
      filtered = filtered.filter(route => route.estimatedDuration >= min);
    }
    if (filters.maxDuration) {
      const max = parseInt(filters.maxDuration);
      filtered = filtered.filter(route => route.estimatedDuration <= max);
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'distance':
          aVal = a.distance || 0;
          bVal = b.distance || 0;
          break;
        case 'duration':
          aVal = a.estimatedDuration || 0;
          bVal = b.estimatedDuration || 0;
          break;
        case 'difficulty':
          const difficultyOrder = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
          aVal = difficultyOrder[a.difficulty] || 0;
          bVal = difficultyOrder[b.difficulty] || 0;
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    setFilteredRoutes(filtered);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'remove-outline';
    return sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
  };

  const resetFilters = () => {
    setFilters({
      difficulty: 'all',
      minDistance: '',
      maxDistance: '',
      minDuration: '',
      maxDuration: '',
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile': return '#4CAF50';
      case 'moyen': return '#FF9800';
      case 'difficile': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const openRouteDetails = (route) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const renderRouteItem = ({ item }) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => openRouteDetails(item)}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{item.name || 'Parcours sans nom'}</Text>
        <View style={[
          styles.difficultyBadge, 
          { backgroundColor: getDifficultyColor(item.difficulty) }
        ]}>
          <Text style={styles.difficultyText}>{item.difficulty || 'N/A'}</Text>
        </View>
      </View>

      <Text style={styles.routeDescription} numberOfLines={2}>
        {item.description || 'Aucune description disponible'}
      </Text>

      <View style={styles.routeStats}>
        <View style={styles.statItem}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatDistance(item.distance || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatDuration(item.estimatedDuration)}</Text>
        </View>
        {item.elevation && (
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.elevation}m</Text>
          </View>
        )}
      </View>

      {item.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="pin-outline" size={14} color="#999" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRouteModal = () => (
    <Modal
      visible={showRouteModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRouteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.routeModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRoute?.name}</Text>
            <TouchableOpacity onPress={() => setShowRouteModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.routeDetailHeader}>
              <View style={[
                styles.difficultyBadge, 
                { backgroundColor: getDifficultyColor(selectedRoute?.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>{selectedRoute?.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.routeDetailDescription}>
              {selectedRoute?.description || 'Aucune description disponible'}
            </Text>

            <View style={styles.routeDetailStats}>
              <View style={styles.detailStatCard}>
                <Ionicons name="location" size={24} color="#4CAF50" />
                <Text style={styles.detailStatValue}>{formatDistance(selectedRoute?.distance || 0)}</Text>
                <Text style={styles.detailStatLabel}>Distance</Text>
              </View>
              <View style={styles.detailStatCard}>
                <Ionicons name="time" size={24} color="#4CAF50" />
                <Text style={styles.detailStatValue}>{formatDuration(selectedRoute?.estimatedDuration)}</Text>
                <Text style={styles.detailStatLabel}>Durée estimée</Text>
              </View>
              {selectedRoute?.elevation && (
                <View style={styles.detailStatCard}>
                  <Ionicons name="trending-up" size={24} color="#4CAF50" />
                  <Text style={styles.detailStatValue}>{selectedRoute.elevation}m</Text>
                  <Text style={styles.detailStatLabel}>Dénivelé</Text>
                </View>
              )}
            </View>

            {selectedRoute?.location && (
              <View style={styles.locationInfo}>
                <Ionicons name="pin" size={20} color="#666" />
                <Text style={styles.locationInfoText}>{selectedRoute.location}</Text>
              </View>
            )}

            {/* Carte si disponible */}
            {MapView && selectedRoute?.coordinates && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedRoute.coordinates[0]?.latitude || 0,
                    longitude: selectedRoute.coordinates[0]?.longitude || 0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  {selectedRoute.coordinates.length > 0 && (
                    <>
                      <Polyline
                        coordinates={selectedRoute.coordinates}
                        strokeWidth={3}
                        strokeColor="#4CAF50"
                      />
                      <Marker
                        coordinate={selectedRoute.coordinates[0]}
                        title="Départ"
                        pinColor="green"
                      />
                      <Marker
                        coordinate={selectedRoute.coordinates[selectedRoute.coordinates.length - 1]}
                        title="Arrivée"
                        pinColor="red"
                      />
                    </>
                  )}
                </MapView>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.startRouteButton}
              onPress={() => {
                setShowRouteModal(false);
                navigation.navigate('Run', { selectedRoute });
              }}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.startRouteButtonText}>Commencer ce parcours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      {/* Barre de recherche */}
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un parcours..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
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
          onPress={() => toggleSort('name')}
        >
          <Ionicons name={getSortIcon('name')} size={16} color="#666" />
          <Text style={styles.sortText}>Nom</Text>
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
          onPress={() => toggleSort('difficulty')}
        >
          <Ionicons name={getSortIcon('difficulty')} size={16} color="#666" />
          <Text style={styles.sortText}>Difficulté</Text>
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
        {filteredRoutes.length} parcours disponible{filteredRoutes.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucun parcours trouvé</Text>
      <Text style={styles.emptySubtitle}>
        {error ? 'Erreur de chargement des parcours' : 
         searchTerm || Object.values(filters).some(f => f && f !== 'all')
          ? 'Essayez de modifier vos filtres'
          : 'Aucun parcours disponible pour le moment'}
      </Text>
      {error && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadRoutes}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parcours proposés</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      {loading && filteredRoutes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement des parcours...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoutes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredRoutes.length === 0 ? styles.emptyContainer : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal des détails de parcours */}
      {renderRouteModal()}

      {/* Modal de filtres - CORRIGÉ */}
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

            <ScrollView style={styles.filtersContent}>
              {/* Filtre par difficulté - CORRIGÉ */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Difficulté</Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'all', label: 'Toutes' },
                    { value: 'Facile', label: 'Facile' },
                    { value: 'Moyen', label: 'Moyen' },
                    { value: 'Difficile', label: 'Difficile' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filters.difficulty === option.value && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters(prev => ({...prev, difficulty: option.value}))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.difficulty === option.value && styles.filterOptionTextActive
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
            </ScrollView>

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
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    paddingBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 8,
  },
  sortText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    marginLeft: 'auto',
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  routeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  routeModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  routeDetailHeader: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  routeDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  detailStatCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  locationInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startRouteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default ProposedRunsScreen;