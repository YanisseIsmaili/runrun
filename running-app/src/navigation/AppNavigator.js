import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens - Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Screens - Main
import DashboardScreen from '../screens/main/DashboardScreen';
import RunningScreen from '../screens/main/RunningScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Context
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation pour les utilisateurs non authentifiés
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Navigation en bas de l'écran pour les utilisateurs authentifiés
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Running') {
          iconName = focused ? 'fitness' : 'fitness-outline';
        } else if (route.name === 'History') {
          iconName = focused ? 'time' : 'time-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ title: 'Tableau de bord' }} 
    />
    <Tab.Screen 
      name="Running" 
      component={RunningScreen} 
      options={{ title: 'Courir' }}
    />
    <Tab.Screen 
      name="History" 
      component={HistoryScreen} 
      options={{ title: 'Historique' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Profil' }}
    />
  </Tab.Navigator>
);

// Navigateur principal qui gère l'état d'authentification
const AppNavigator = () => {
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;