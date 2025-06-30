import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider } from './src/context/AuthContext';
import { RunProvider } from './src/context/RunContext';
import { SettingsProvider } from './src/context/SettingsContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import RunningScreen from './src/screens/main/RunningScreen';
import HistoryScreen from './src/screens/main/HistoryScreen';
import ProposedRunsScreen from './src/screens/main/ProposedRunsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import RunDetailScreen from './src/screens/main/RunDetailScreen';

// Navigation
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Onglets principaux
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Run':  // Changé de 'Running' vers 'Run'
              iconName = focused ? 'play-circle' : 'play-circle-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Proposed':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Run"  // Changé de 'Running' vers 'Run' pour correspondre à la navigation
        component={RunningScreen}
        options={{ title: 'Course' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Historique' }}
      />
      <Tab.Screen 
        name="Proposed" 
        component={ProposedRunsScreen}
        options={{ title: 'Parcours' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// Navigation principale
function AppNavigation() {
  return (
    <Stack.Navigator 
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Connexion',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          title: 'Inscription',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RunDetail" 
        component={RunDetailScreen}
        options={{ title: 'Détails de la course' }}
      />
      {/* Ajout de l'écran Statistics manquant */}
      <Stack.Screen 
        name="Statistics" 
        component={ProfileScreen} // Temporairement, on peut créer un vrai écran plus tard
        options={{ title: 'Statistiques' }}
      />
      {/* Ajout de l'écran Settings */}
      <Stack.Screen 
        name="Settings" 
        component={ProfileScreen} // Temporairement
        options={{ title: 'Paramètres' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Demander les permissions de notification
    async function requestNotificationPermissions() {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission de notification refusée');
        }
      }
    }

    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <RunProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigation />
            </NavigationContainer>
          </RunProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 