import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
// import { useRun } from '../../context/RunContext';
// import { useSettings } from '../../context/SettingsContext';

const { width, height } = Dimensions.get('window');

const RunningScreen = () => {
  // Remplacez temporairement par des valeurs par défaut
  const isRunning = false;
  const isPaused = false;
  const distance = 0;
  const duration = 0;
  const pace = '00:00';
  const calories = 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course</Text>
      </View>

      {/* Placeholder pour la carte */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>Carte (à implémenter)</Text>
        </View>
      </View>

      {/* Panneau de statistiques */}
      <View style={styles.statsPanel}>
        <View style={styles.primaryStats}>
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>00:00</Text>
            <Text style={styles.primaryStatLabel}>Temps</Text>
          </View>
          <View style={styles.primaryStatDivider} />
          <View style={styles.primaryStatItem}>
            <Text style={styles.primaryStatValue}>0.00 km</Text>
            <Text style={styles.primaryStatLabel}>Distance</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.mainButton}>
          <Ionicons name="play" size={32} color="white" />
          <Text style={styles.mainButtonText}>Démarrer</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  },
  statsPanel: {
    backgroundColor: 'white',
    padding: 20,
  },
  primaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  primaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  primaryStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RunningScreen;