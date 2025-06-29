import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/AuthService';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Test complet de la structure API
  const testAPIStructure = async () => {
    setIsLoading(true);
    try {
      const result = await AuthService.testAPIStructure();
      
      let message = '🔍 Résultats des tests:\n\n';
      message += `Health: ${result.health?.status} ${result.health?.status === 200 ? '✅' : '❌'}\n`;
      message += `API Root: ${result.root?.status} ${result.root?.status !== 404 ? '✅' : '❌'}\n`;
      message += `Direct Auth: ${result.direct?.status} ${result.direct?.status !== 404 ? '✅' : '❌'}\n`;
      
      Alert.alert('🔧 Structure API', message, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('❌ Erreur test', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Liste tous les endpoints possibles
  const listAvailableRoutes = async () => {
    setIsLoading(true);
    try {
      const routes = await AuthService.listAvailableRoutes();
      
      let message = '🛣️ Endpoints testés:\n\n';
      Object.entries(routes).forEach(([endpoint, result]) => {
        const status = result.status === 'ERROR' ? '💥' : result.exists ? '✅' : '❌';
        message += `${endpoint}: ${result.status} ${status}\n`;
      });
      
      Alert.alert('🔍 Routes disponibles', message, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('❌ Erreur scan', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIConnection = async () => {
    setIsLoading(true);
    try {
      const result = await AuthService.testConnection();
      if (result.success) {
        Alert.alert('✅ Connexion API', 'Serveur accessible', [{ text: 'OK' }]);
      } else {
        Alert.alert('❌ Connexion API', `Erreur: ${result.error}`, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Test échoué', error.message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithTestCredentials = async () => {
    setIsLoading(true);
    try {
      const result = await AuthService.login('test@example.com', 'password123');
      
      if (result.success) {
        Alert.alert('✅ Login test', 'Connexion réussie !', [
          {
            text: 'OK',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(result.data.user);
              } else {
                navigation.replace('Main');
              }
            }
          }
        ]);
      } else {
        Alert.alert('❌ Login test', result.message || 'Échec');
      }
    } catch (error) {
      Alert.alert('❌ Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('❌ Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        Alert.alert('✅ Succès', 'Connexion réussie !', [
          {
            text: 'OK',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(result.data.user);
              } else {
                navigation.replace('Main');
              }
            }
          }
        ]);
      } else {
        Alert.alert('❌ Erreur', result.message || 'Échec de la connexion');
      }
    } catch (error) {
      Alert.alert('❌ Erreur', 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      'Contactez l\'administrateur pour réinitialiser votre mot de passe.',
      [{ text: 'OK' }]
    );
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo et titre */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.logo}
                >
                  <Ionicons name="fitness" size={40} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>RunTracker</Text>
              <Text style={styles.subtitle}>Votre compagnon de course</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              {/* Bouton de connexion principal */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#666', '#555'] : ['#4CAF50', '#45a049']}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Connexion...</Text>
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="white" />
                      <Text style={styles.buttonText}>Se connecter</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ✅ SECTION DEBUG AMÉLIORÉE */}
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>🔧 Diagnostic API</Text>
                
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={testAPIConnection}
                  disabled={isLoading}
                >
                  <Text style={styles.debugButtonText}>🌐 Test Health</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={testAPIStructure}
                  disabled={isLoading}
                >
                  <Text style={styles.debugButtonText}>🔍 Test Structure</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={listAvailableRoutes}
                  disabled={isLoading}
                >
                  <Text style={styles.debugButtonText}>🛣️ Scan Routes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={loginWithTestCredentials}
                  disabled={isLoading}
                >
                  <Text style={styles.debugButtonText}>🧪 Login Test</Text>
                </TouchableOpacity>
              </View>

              {/* Séparateur */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Bouton d'inscription */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerButtonText}>
                  Pas encore de compte ? 
                  <Text style={styles.registerLink}> S'inscrire</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info API détaillée */}
            <View style={styles.testInfo}>
              <Text style={styles.testText}>🧪 Diagnostic Mode</Text>
              <Text style={styles.testCredentials}>
                Test: test@example.com / password123
              </Text>
              <Text style={styles.apiInfo}>
                API: http://192.168.27.77:5000{'\n'}
                Health: /api/health ✅{'\n'}
                Auth: /api/auth/login ❓
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 350,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    color: '#4CAF50',
    textAlign: 'right',
    marginBottom: 30,
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  debugSection: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  debugTitle: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.4)',
  },
  debugButtonText: {
    color: '#FFA500',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  separatorText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    padding: 15,
  },
  registerButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 14,
  },
  registerLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  testInfo: {
    marginTop: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  testCredentials: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  apiInfo: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});