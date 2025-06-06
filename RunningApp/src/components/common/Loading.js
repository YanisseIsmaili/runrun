import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';

const Loading = ({ visible = false, text = 'Chargement...', transparent = true }) => {
  if (!visible) return null;
  
  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          {text && <Text style={styles.text}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const LoadingOverlay = ({ text = 'Chargement...' }) => {
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
});

export { Loading, LoadingOverlay };
export default Loading;