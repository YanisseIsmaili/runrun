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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        Alert.alert('Succès', 'Connexion réussie !', [
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
        Alert.alert('Erreur', result.message || 'Échec de la connexion');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
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

              {/* Bouton de connexion */}
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

            {/* Version de test */}
            <View style={styles.testInfo}>
              <Text style={styles.testText}>Version de test</Text>
              <Text style={styles.testCredentials}>
                Email: test@example.com{'\n'}
                Mot de passe: password123
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
  },
});