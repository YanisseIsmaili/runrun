import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Informations utilisateur
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  
  // Préférences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [metricUnits, setMetricUnits] = useState(true);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à votre galerie.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      console.log('Image sélectionnée:', result.assets[0].uri);
    }
  };
  
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      if (!name.trim()) {
        Alert.alert('Erreur', 'Le nom ne peut pas être vide');
        return;
      }
      
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      Alert.alert('Succès', 'Votre profil a été mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* En-tête du profil */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.profileImageContainer} onPress={isEditing ? pickImage : null}>
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>
              {name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          {isEditing && (
            <View style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
          />
        ) : (
          <Text style={styles.userName}>{name || 'Utilisateur'}</Text>
        )}
        
        <Text style={styles.userEmail}>{email || 'email@example.com'}</Text>
        
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={16} color="white" />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActionsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setName(user?.name || '');
                setEmail(user?.email || '');
                setHeight(user?.height?.toString() || '');
                setWeight(user?.weight?.toString() || '');
                setAge(user?.age?.toString() || '');
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size={20} color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Informations personnelles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabel}>
            <Ionicons name="body-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoLabelText}>Taille (cm)</Text>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={height}
              onChangeText={setHeight}
              placeholder="Taille en cm"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.infoValue}>{height || '-'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabel}>
            <Ionicons name="fitness-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoLabelText}>Poids (kg)</Text>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="Poids en kg"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.infoValue}>{weight || '-'}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabel}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.infoLabelText}>Âge</Text>
          </View>
          
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={age}
              onChangeText={setAge}
              placeholder="Âge"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.infoValue}>{age || '-'}</Text>
          )}
        </View>
      </View>
      
      {/* Préférences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Ionicons name="notifications-outline" size={20} color="#4CAF50" />
            <Text style={styles.settingLabelText}>Notifications</Text>
          </View>
          
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="white"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Ionicons name="moon-outline" size={20} color="#4CAF50" />
            <Text style={styles.settingLabelText}>Mode sombre</Text>
          </View>
          
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="white"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Ionicons name="options-outline" size={20} color="#4CAF50" />
            <Text style={styles.settingLabelText}>Unités métriques</Text>
          </View>
          
          <Switch
            value={metricUnits}
            onValueChange={setMetricUnits}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="white"
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Ionicons name="volume-high-outline" size={20} color="#4CAF50" />
            <Text style={styles.settingLabelText}>Retour vocal</Text>
          </View>
          
          <Switch
            value={voiceFeedbackEnabled}
            onValueChange={setVoiceFeedbackEnabled}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor="white"
          />
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        
        <TouchableOpacity style={styles.accountAction}>
          <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" />
          <Text style={styles.accountActionText}>Modifier le mot de passe</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountAction}>
          <Ionicons name="cloud-download-outline" size={20} color="#4CAF50" />
          <Text style={styles.accountActionText}>Exporter mes données</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountAction}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
          <Text style={styles.accountActionText}>Confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.versionText}>Running App v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 2,
    width: '80%',
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  editActionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#EEEEEE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#757575',
  },
  infoInput: {
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 80,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabelText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  accountActionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default ProfileScreen;