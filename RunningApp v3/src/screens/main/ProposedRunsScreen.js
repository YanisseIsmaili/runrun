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

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [routes, searchTerm, filters, sortBy, sortOrder]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🗺️ Chargement des parcours proposés...');
      
      // Appel à l'API pour récupérer les routes avec statut actif
      const response = await apiService.getRoutes({ status: 'active', limit: 50 });
      console.log('✅ Réponse API routes:', response.data);

      let routesData = [];
      
      if (response.data && response.data.status === 'success') {
        // Structure API standard: {status: 'success', data: {routes: [...], pagination: {...}}}
        if (response.data.data && response.data.data.routes) {
          routesData = response.data.data.routes;
        } else if (Array.isArray(response.data.data)) {
          routesData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        // Structure tableau direct
        routesData = response.data;
      }

      console.log(`📊 ${routesData.length} parcours chargés`);
      setRoutes(routesData);
      
    } catch (err) {
      console.error('❌ Erreur chargement parcours:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de chargement des parcours';
      setError(errorMessage);
      
      // Données de démonstration en cas d'erreur
      const demoRoutes = [
        {
          id: 1,
          name: 'Parcours du Parc Central',
          description: 'Circuit autour du parc avec dénivelé modéré',
          distance: 5.2,
          estimated_duration: 1800,
          difficulty: 'Facile',
          elevation_gain: 50.0,
          waypoints: [
            { lat: 48.8566, lng: 2.3522, name: 'Départ' },
            { lat: 48.8576, lng: 2.3532, name: 'Point 1' },
            { lat: 48.8586, lng: 2.3542, name: 'Arrivée' }
          ]
        },
        {
          id: 2,
          name: 'Circuit Urbain',
          description: 'Parcours en ville avec plusieurs arrêts',
          distance: 8.5,
          estimated_duration: 2700,
          difficulty: 'Moyen',
          elevation_gain: 25.0,
          waypoints: [
            { lat: 48.8566, lng: 2.3522, name: 'Départ' },
            { lat: 48.8576, lng: 2.3532, name: 'Centre-ville' },
            { lat: 48.8586, lng: 2.3542, name: 'Retour' }
          ]
        },
        {
          id: 3,
          name: 'Trail Montagne',
          description: 'Parcours difficile en montagne',
          distance: 12.3,
          estimated_duration: 4500,
          difficulty: 'Difficile',
          elevation_gain: 300.0,
          waypoints: [
            { lat: 48.8566, lng: 2.3522, name: 'Base' },
            { lat: 48.8576, lng: 2.3532, name: 'Sommet' },
            { lat: 48.8586, lng: 2.3542, name: 'Retour base' }
          ]
        }
      ];
      
      console.log('📝 Utilisation des données de démonstration');
      setRoutes(demoRoutes);
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

    // Filtre par recherche textuelle
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(route => 
        route.name?.toLowerCase().includes(searchLower) ||
        route.description?.toLowerCase().includes(searchLower) ||
        route.difficulty?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par difficulté
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(route => route.difficulty === filters.difficulty);
    }

    // Filtre par distance
    if (filters.minDistance) {
      const minDist = parseFloat(filters.minDistance);
      filtered = filtered.filter(route => (route.distance || 0) >= minDist);
    }

    if (filters.maxDistance) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter(route => (route.distance || 0) <= maxDist);
    }

    // Filtre par durée
    if (filters.minDuration) {
      const minDur = parseInt(filters.minDuration) * 60; // Convertir en secondes
      filtered = filtered.filter(route => (route.estimated_duration || 0) >= minDur);
    }

    if (filters.maxDuration) {
      const maxDur = parseInt(filters.maxDuration) * 60;
      filtered = filtered.filter(route => (route.estimated_duration || 0) <= maxDur);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'distance':
          aValue = a.distance || 0;
          bValue = b.distance || 0;
          break;
        case 'duration':
          aValue = a.estimated_duration || 0;
          bValue = b.estimated_duration || 0;
          break;
        case 'difficulty':
          const difficultyOrder = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
          aValue = difficultyOrder[a.difficulty] || 0;
          bValue = difficultyOrder[b.difficulty] || 0;
          break;
        case 'name':
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRoutes(filtered);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Facile': return '#4CAF50';
      case 'Moyen': return '#FF9800';
      case 'Difficile': return '#f44336';
      default: return '#666';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'Facile': return 'leaf-outline';
      case 'Moyen': return 'flash-outline';
      case 'Difficile': return 'flame-outline';
      default: return 'help-outline';
    }
  };

  const handleRoutePress = (route) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const handleStartRoute = (route) => {
    setShowRouteModal(false);
    Alert.alert(
      'Démarrer le parcours',
      `Voulez-vous commencer "${route.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Démarrer', 
          onPress: () => {
            // Navigation vers l'écran de course avec les données du parcours
            navigation.navigate('Run', { proposedRoute: route });
          }
        }
      ]
    );
  };

  const resetFilters = () => {
    setFilters({
      difficulty: 'all',
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
      setSortOrder('asc');
    }
  };

  const renderRouteItem = ({ item: route }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => handleRoutePress(route)}
      activeOpacity={0.7}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeDescription} numberOfLines={2}>
            {route.description}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(route.difficulty) }]}>
          <Ionicons name={getDifficultyIcon(route.difficulty)} size={14} color="white" />
          <Text style={styles.difficultyText}>{route.difficulty}</Text>
        </View>
      </View>

      <View style={styles.routeStats}>
        <View style={styles.statItem}>
          <Ionicons name="navigate-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatDistance(route.distance || 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatDuration(route.estimated_duration)}</Text>
        </View>
        {route.elevation_gain > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color="#666" />
            <Text style={styles.statText}>{route.elevation_gain}m D+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRouteModal = () => {
    if (!selectedRoute) return null;

    const waypoints = selectedRoute.waypoints || [];

    return (
      <Modal
        visible={showRouteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.routeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRoute.name}</Text>
              <TouchableOpacity onPress={() => setShowRouteModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Minimap ou placeholder */}
              <View style={styles.mapContainer}>
                {MapView && waypoints.length > 0 ? (
                  <MapView
                    style={styles.miniMap}
                    region={{
                      latitude: waypoints[0].lat,
                      longitude: waypoints[0].lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    {waypoints.map((waypoint, index) => (
                      <Marker
                        key={index}
                        coordinate={{
                          latitude: waypoint.lat,
                          longitude: waypoint.lng,
                        }}
                        title={waypoint.name}
                      />
                    ))}
                    {waypoints.length > 1 && (
                      <Polyline
                        coordinates={waypoints.map(wp => ({
                          latitude: wp.lat,
                          longitude: wp.lng,
                        }))}
                        strokeColor="#4CAF50"
                        strokeWidth={3}
                      />
                    )}
                  </MapView>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="map-outline" size={48} color="#ccc" />
                    <Text style={styles.mapPlaceholderText}>
                      {MapView ? 'Aperçu du parcours' : 'Carte non disponible'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{selectedRoute.description}</Text>
              </View>

              {/* Statistiques détaillées */}
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Détails du parcours</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="navigate-outline" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{formatDistance(selectedRoute.distance || 0)}</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="time-outline" size={24} color="#2196F3" />
                    <Text style={styles.statValue}>{formatDuration(selectedRoute.estimated_duration)}</Text>
                    <Text style={styles.statLabel}>Durée estimée</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name={getDifficultyIcon(selectedRoute.difficulty)} size={24} color={getDifficultyColor(selectedRoute.difficulty)} />
                    <Text style={styles.statValue}>{selectedRoute.difficulty}</Text>
                    <Text style={styles.statLabel}>Difficulté</Text>
                  </View>
                  {selectedRoute.elevation_gain > 0 && (
                    <View style={styles.statCard}>
                      <Ionicons name="trending-up-outline" size={24} color="#FF9800" />
                      <Text style={styles.statValue}>{selectedRoute.elevation_gain}m</Text>
                      <Text style={styles.statLabel}>Dénivelé +</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Points de passage */}
              {waypoints.length > 0 && (
                <View style={styles.waypointsSection}>
                  <Text style={styles.sectionTitle}>Points de passage</Text>
                  {waypoints.map((waypoint, index) => (
                    <View key={index} style={styles.waypointItem}>
                      <View style={styles.waypointNumber}>
                        <Text style={styles.waypointNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.waypointName}>{waypoint.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartRoute(selectedRoute)}
              >
                <Ionicons name="play" size={20} color="white" />
                <Text style={styles.startButtonText}>Commencer ce parcours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un parcours..."
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

            <ScrollView style={styles.filtersContent}>
              {/* Filtre par difficulté */}
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
  routeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  routeStats: {
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
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  miniMap: {
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
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsSection: {
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
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  waypointsSection: {
    marginBottom: 16,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  waypointNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waypointNumberText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  waypointName: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  startButtonText: {
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