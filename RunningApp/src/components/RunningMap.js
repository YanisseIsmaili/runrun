import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const RunningMap = ({ initialRegion, locationHistory, followUser }) => {
  const mapRef = useRef(null);

  // Suivre la position de l'utilisateur lorsque la course est en cours
  useEffect(() => {
    if (followUser && locationHistory.length > 0 && mapRef.current) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      
      // Pour Expo SDK 53, utiliser animateToRegion avec une meilleure gestion
      try {
        mapRef.current.animateToRegion({
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      } catch (error) {
        console.warn('Erreur lors de l\'animation de la carte:', error);
      }
    }
  }, [locationHistory, followUser]);

  // Région par défaut si initialRegion n'est pas fournie
  const defaultRegion = {
    latitude: 48.856614,
    longitude: 2.3522219,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Configuration du provider pour Expo SDK 53
  const mapProvider = Platform.select({
    android: PROVIDER_GOOGLE,
    ios: undefined, // Utiliser Apple Maps sur iOS
  });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={initialRegion || defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={followUser}
        showsCompass={true}
        scrollEnabled={!followUser}
        zoomEnabled={true}
        rotateEnabled={!followUser}
        pitchEnabled={false}
        toolbarEnabled={false}
        loadingEnabled={true}
        mapType="standard"
        // Nouvelles propriétés pour Expo SDK 53
        showsPointsOfInterest={false}
        showsBuildings={true}
        showsTraffic={false}
        moveOnMarkerPress={false}
        // Performance optimizations pour SDK 53
        maxZoomLevel={20}
        minZoomLevel={3}
      >
        {locationHistory.length > 0 && (
          <>
            {/* Ligne du parcours avec style amélioré pour SDK 53 */}
            <Polyline
              coordinates={locationHistory}
              strokeWidth={5}
              strokeColor="#4CAF50"
              lineJoin="round"
              lineCap="round"
              // Nouvelles propriétés pour de meilleures performances
              geodesic={true}
              strokePattern={[]} // Ligne solide
            />
            
            {/* Marqueur pour le point de départ */}
            {locationHistory.length > 0 && (
              <Marker
                coordinate={locationHistory[0]}
                title="Départ"
                description="Point de départ de votre course"
                pinColor="green"
                identifier="start"
                // Optimisation pour SDK 53
                flat={false}
                anchor={{ x: 0.5, y: 1 }}
              />
            )}
            
            {/* Marqueur pour la position actuelle (seulement si différente du départ) */}
            {locationHistory.length > 1 && (
              <Marker
                coordinate={locationHistory[locationHistory.length - 1]}
                title="Position actuelle"
                description="Votre position en temps réel"
                pinColor="blue"
                identifier="current"
                // Optimisation pour SDK 53
                flat={false}
                anchor={{ x: 0.5, y: 1 }}
              />
            )}
          </>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default RunningMap;