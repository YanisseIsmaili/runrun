// components/DebugMode.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Joystick virtuel
function VirtualJoystick({ onMove, onStop, isVisible = true }) {
  const [isActive, setIsActive] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const JOYSTICK_SIZE = 80;
  const KNOB_SIZE = 30;
  const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

  const handleGestureEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    let limitedX = translationX;
    let limitedY = translationY;
    
    if (distance > MAX_DISTANCE) {
      limitedX = (translationX / distance) * MAX_DISTANCE;
      limitedY = (translationY / distance) * MAX_DISTANCE;
    }

    translateX.setValue(limitedX);
    translateY.setValue(limitedY);

    const speed = (distance / MAX_DISTANCE) * 20; // Max 20 km/h
    const direction = Math.atan2(limitedY, limitedX);

    onMove && onMove({ speed, direction, x: limitedX, y: limitedY });
  };

  const handleGestureStateChange = (event) => {
    if (event.nativeEvent.state === 4) { // BEGAN
      setIsActive(true);
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true }).start();
    } else if (event.nativeEvent.state === 5) { // END
      setIsActive(false);
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
      onStop && onStop();
    }
  };

  if (!isVisible) return null;

  return (
    <View style={debugStyles.joystickContainer}>
      <View style={debugStyles.joystickBackground}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={debugStyles.joystickGradient}
        >
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View
              style={[
                debugStyles.joystickKnob,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <LinearGradient
                colors={isActive ? ['#10B981', '#059669'] : ['#6366F1', '#8B5CF6']}
                style={debugStyles.knobGradient}
              >
                <Ionicons name="navigate" size={16} color="white" />
              </LinearGradient>
            </Animated.View>
          </PanGestureHandler>
        </LinearGradient>
      </View>
    </View>
  );
}

// Contrôleur GPS simulé
function GPSSimulator({ location, onLocationUpdate, isEnabled }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const lastUpdate = useRef(Date.now());

  const startSimulation = () => {
    setIsSimulating(true);
    lastUpdate.current = Date.now();
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setCurrentSpeed(0);
  };

  const handleJoystickMove = ({ speed, direction }) => {
    setCurrentSpeed(speed);
    
    if (!location || speed === 0) return;

    const now = Date.now();
    const deltaTime = (now - lastUpdate.current) / 1000;
    lastUpdate.current = now;

    const speedMs = (speed * 1000) / 3600;
    const distance = speedMs * deltaTime;
    
    const earthRadius = 6371000;
    const deltaLat = (distance * Math.sin(direction + Math.PI/2)) / earthRadius * (180 / Math.PI);
    const deltaLng = (distance * Math.cos(direction + Math.PI/2)) / earthRadius * (180 / Math.PI) / Math.cos(location.coords.latitude * Math.PI / 180);

    const newLocation = {
      coords: {
        latitude: location.coords.latitude + deltaLat,
        longitude: location.coords.longitude + deltaLng,
        speed: speedMs,
        accuracy: 10,
      },
      timestamp: now,
    };

    onLocationUpdate(newLocation);
  };

  const handleJoystickStop = () => {
    setCurrentSpeed(0);
  };

  if (!isEnabled) return null;

  return (
    <View style={debugStyles.simulatorContainer}>
      <View style={debugStyles.simulatorControls}>
        <TouchableOpacity
          onPress={isSimulating ? stopSimulation : startSimulation}
          style={debugStyles.simulatorButton}
        >
          <LinearGradient
            colors={isSimulating ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
            style={debugStyles.simulatorButtonGradient}
          >
            <Ionicons 
              name={isSimulating ? "stop" : "play"} 
              size={16} 
              color="white" 
            />
            <Text style={debugStyles.simulatorButtonText}>
              {isSimulating ? 'STOP SIM' : 'SIM GPS'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {isSimulating && (
          <View style={debugStyles.speedIndicator}>
            <Text style={debugStyles.speedText}>{currentSpeed.toFixed(1)} km/h</Text>
          </View>
        )}
      </View>

      {isSimulating && (
        <VirtualJoystick
          onMove={handleJoystickMove}
          onStop={handleJoystickStop}
          isVisible={isSimulating}
        />
      )}
    </View>
  );
}

// Bouton toggle debug mode
function DebugModeToggle({ isDebugMode, onToggle }) {
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={debugStyles.debugToggle}
    >
      <LinearGradient
        colors={isDebugMode ? ['#EF4444', '#DC2626'] : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
        style={debugStyles.debugToggleGradient}
      >
        <Ionicons 
          name={isDebugMode ? "bug" : "bug-outline"} 
          size={16} 
          color="white" 
        />
        <Text style={debugStyles.debugToggleText}>
          {isDebugMode ? 'DEBUG ON' : 'DEBUG'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const debugStyles = {
  debugToggle: {
    borderRadius: 15,
    overflow: 'hidden',
    marginLeft: 8,
  },
  debugToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  debugToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  joystickContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 80,
    height: 80,
    zIndex: 1000,
  },
  joystickBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  joystickGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  joystickKnob: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  knobGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  simulatorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  simulatorButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  simulatorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  simulatorButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    marginLeft: 6,
  },
  speedIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
};

export { DebugModeToggle, GPSSimulator, debugStyles };