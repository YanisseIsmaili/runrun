// components/GeoDebugJoystick.jsx
import React from 'react';
import { View } from 'react-native';

// Composant simplifié pour éviter les dépendances complexes
// Dans une version complète, ceci pourrait inclure un joystick virtuel pour tester le GPS
const GeoDebugJoystick = ({ children, onLocationUpdate, isRunning }) => {
  // Pour l'instant, on retourne simplement les enfants
  // Ce composant peut être étendu plus tard pour inclure des fonctionnalités de debug GPS
  
  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* Ici on pourrait ajouter des contrôles de debug en mode développement */}
      {__DEV__ && (
        <View style={{
          position: 'absolute',
          bottom: 200,
          left: 20,
          opacity: 0.1, // Très transparent pour ne pas gêner
        }}>
          {/* Zone réservée pour les contrôles de debug GPS */}
        </View>
      )}
    </View>
  );
};

export default GeoDebugJoystick;