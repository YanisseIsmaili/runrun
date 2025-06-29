// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/AuthService';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return false;
    }

    // Validation mot de passe
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // Validation confirmation mot de passe
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    // Validation nom d'utilisateur
    if (username.length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!email || !password || !username || !firstName || !lastName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔵 Tentative d\'inscription pour:', email);
      
      const result = await AuthService.register({
        email: email.toLowerCase().trim(),
        password,
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      
      if (result.success) {
        console.log('✅ Inscription réussie pour:', email);
        Alert.alert('Succès', 'Inscription réussie !', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Main')
          }
        ]);
      } else {
        console.log('❌ Inscription échouée:', result.message);
        
        // Gestion des erreurs spécifiques
        if (result.errors) {
          // Afficher les erreurs de validation
          const errorMessages = Object.values(result.errors).join('\n');
          Alert.alert('Erreurs de validation', errorMessages);
        } else if (result.message && result.message.includes('existe déjà')) {
          Alert.alert('Compte existant', 'Un compte avec cet email ou nom d\'utilisateur existe déjà');
        } else {
          Alert.alert('Erreur', result.message || 'Échec de l\'inscription');
        }
      }
    } catch (error) {
      console.error('💥 Erreur critique inscription:', error);
      Alert.alert('Erreur Technique', 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFirstName('');
    setLastName('');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inscription</Text>
          <TouchableOpacity 
            onPress={clearForm}
            style={styles.clearButton}
          >
            <Ionicons name="refresh-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor="#666"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#666"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
              placeholder="Mot de passe (min. 6 caractères)"
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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer mot de passe"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            {confirmPassword.length > 0 && (
              <View style={styles.validationIcon}>
                <Ionicons
                  name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={password === confirmPassword ? "#4CAF50" : "#f44336"}
                />
              </View>
            )}
          </View>

          {/* Indicateurs de validation */}
          <View style={styles.validationContainer}>
            <View style={styles.validationItem}>
              <Ionicons
                name={password.length >= 6 ? "checkmark-circle" : "radio-button-off"}
                size={16}
                color={password.length >= 6 ? "#4CAF50" : "#666"}
              />
              <Text style={[
                styles.validationText,
                { color: password.length >= 6 ? "#4CAF50" : "#666" }
              ]}>
                Au moins 6 caractères
              </Text>
            </View>
            
            <View style={styles.validationItem}>
              <Ionicons
                name={password === confirmPassword && password.length > 0 ? "checkmark-circle" : "radio-button-off"}
                size={16}
                color={password === confirmPassword && password.length > 0 ? "#4CAF50" : "#666"}
              />
              <Text style={[
                styles.validationText,
                { color: password === confirmPassword && password.length > 0 ? "#4CAF50" : "#666" }
              ]}>
                Mots de passe identiques
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#666', '#555'] : ['#4CAF50', '#45a049']}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Inscription...</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="white" />
                  <Text style={styles.buttonText}>S'inscrire</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? 
              <Text style={styles.linkHighlight}> Se connecter</Text>
            </Text>
          </TouchableOpacity>

          {/* Informations de test */}
          {__DEV__ && (
            <View style={styles.devInfo}>
              <Text style={styles.devInfoTitle}>Mode Développement</Text>
              <Text style={styles.devInfoText}>
                Remplissez le formulaire avec des données de test pour créer un compte rapidement.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 5,
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
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
  validationIcon: {
    padding: 5,
  },
  validationContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationText: {
    fontSize: 14,
    marginLeft: 8,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    marginTop: 20,
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
  loginLink: {
    padding: 15,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  devInfo: {
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  devInfoTitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devInfoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
});