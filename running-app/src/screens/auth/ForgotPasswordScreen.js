import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as authService from '../../services/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    // Validation basique
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email);
      setSent(true);
    } catch (error) {
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de l\'envoi du mail de réinitialisation'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </Text>
        
        {!sent ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.resetButtonText}>Réinitialiser le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Email envoyé!</Text>
            <Text style={styles.successText}>
              Si un compte existe avec l'adresse email {email}, vous recevrez bientôt un email avec les instructions pour réinitialiser votre mot de passe.
            </Text>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 10,
  },
  resetButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 30,
  },
  backToLoginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  backToLoginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;