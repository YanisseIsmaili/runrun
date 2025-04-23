import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const RunningMap = ({ initialRegion, locationHistory, followUser }) => {
  const mapRef = useRef(null);

  // Suivre la position de l'utilisateur lorsque la course est en cours
  useEffect(() => {
    if (followUser && locationHistory.length > 0 && mapRef.current) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      mapRef.current.animateCamera({
        center: {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        },
        pitch: 0,
        heading: 0,
        altitude: 0,
        zoom: 17,
      });
    }
  }, [locationHistory, followUser]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={followUser}
        showsCompass={true}
        scrollEnabled={!followUser}
        zoomEnabled={!followUser}
        rotateEnabled={!followUser}
      >
        {locationHistory.length > 0 && (
          <>
            <Polyline
              coordinates={locationHistory}
              strokeWidth={5}
              strokeColor="#4CAF50"
            />
            
            {/* Marqueur pour le point de départ */}
            <Marker
              coordinate={locationHistory[0]}
              title="Départ"
              pinColor="green"
            />
            
            {/* Marqueur pour la position actuelle */}
            <Marker
              coordinate={locationHistory[locationHistory.length - 1]}
              title="Position actuelle"
              pinColor="blue"
            />
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