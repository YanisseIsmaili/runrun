import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../services/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: null,
    height: '',
    weight: '',
  });

  // Fonctions API locales
  const updateProfileCorrect = async (profileData) => {
    console.log('👤 Updating profile via correct endpoint');
    try {
      const response = await axiosInstance.put('/api/users/profile', profileData);
      console.log('✅ Profile updated:', response.data);
      
      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('🚨 Update profile failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur de mise à jour du profil');
    }
  };

  const getCurrentUserCorrect = async () => {
    console.log('👤 Getting current user via correct endpoint');
    try {
      const response = await axiosInstance.get('/api/users/profile');
      console.log('✅ Current user retrieved:', response.data);
      
      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }
      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('🚨 Get current user failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erreur de récupération du profil utilisateur');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
      });
      
      if (user.date_of_birth) {
        setTempDate(new Date(user.date_of_birth));
      }
    }
  }, [user]);

  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??';
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Restaurer les données originales
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Préparer les données à envoyer
      const dataToSend = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        date_of_birth: profileData.date_of_birth ? profileData.date_of_birth.toISOString().split('T')[0] : null,
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
      };

      console.log('💾 Saving profile data:', dataToSend);

      const updatedUser = await updateProfileCorrect(dataToSend);
      
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const uploadProfilePicture = async (imageAsset) => {
    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('profile_picture', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'profile.jpg',
      });

      const response = await axiosInstance.post('/api/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.status === 'success' && response.data?.data) {
        const updatedUser = response.data.data;
        if (updateUser) {
          updateUser(updatedUser);
        }
        Alert.alert('Succès', 'Photo de profil mise à jour');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      Alert.alert(
        'Supprimer la photo',
        'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                setUploadLoading(true);
                const response = await axiosInstance.delete('/api/users/profile/picture');
                
                if (response.data?.status === 'success') {
                  const updatedUser = { ...user, profile_picture: null };
                  if (updateUser) {
                    updateUser(updatedUser);
                  }
                  Alert.alert('Succès', 'Photo de profil supprimée');
                }
              } catch (error) {
                console.error('Erreur suppression image:', error);
                Alert.alert('Erreur', 'Erreur lors de la suppression');
              } finally {
                setUploadLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      
      // 🔄 REDIRECTION FORCÉE VERS LOGIN
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Non renseigné';
    return date.toLocaleDateString('fr-FR');
  };

  // Gestionnaires pour le sélecteur de date personnalisé
  const openDatePicker = () => {
    setTempDate(profileData.date_of_birth || new Date());
    setShowDateModal(true);
  };

  const confirmDateSelection = () => {
    setProfileData(prev => ({
      ...prev,
      date_of_birth: new Date(tempDate)
    }));
    setShowDateModal(false);
  };

  const cancelDateSelection = () => {
    setTempDate(profileData.date_of_birth || new Date());
    setShowDateModal(false);
  };

  // Générateurs de listes pour les sélecteurs
  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    return days;
  };

  const generateMonths = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months.map((month, index) => ({ label: month, value: index }));
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(i);
    }
    return years;
  };

  const updateDateField = (field, value) => {
    const newDate = new Date(tempDate);
    
    switch (field) {
      case 'day':
        newDate.setDate(value);
        break;
      case 'month':
        newDate.setMonth(value);
        break;
      case 'year':
        newDate.setFullYear(value);
        break;
    }
    
    setTempDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section avatar et infos de base */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={editing ? handleImagePicker : undefined}
            disabled={uploadLoading}
          >
            <View style={styles.avatar}>
              {user?.profile_picture ? (
                <Image
                  source={{ uri: user.profile_picture }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              {uploadLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </View>
            
            {!editing && (
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {user?.profile_picture && editing && (
            <TouchableOpacity 
              style={styles.deleteImageButton}
              onPress={handleDeleteImage}
              disabled={uploadLoading}
            >
              <Ionicons name="trash-outline" size={16} color="#f44336" />
              <Text style={styles.deleteImageText}>Supprimer la photo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.userName}>
            {user?.first_name || 'Utilisateur'} {user?.last_name || ''}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {!editing ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={16} color="#4CAF50" />
              <Text style={styles.editButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.disabledButton]} 
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section informations personnelles */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Prénom</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={profileData.first_name}
                onChangeText={(text) => setProfileData(prev => ({...prev, first_name: text}))}
                placeholder="Votre prénom"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.first_name || 'Non renseigné'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nom</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={profileData.last_name}
                onChangeText={(text) => setProfileData(prev => ({...prev, last_name: text}))}
                placeholder="Votre nom"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.last_name || 'Non renseigné'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date de naissance</Text>
            {editing ? (
              <TouchableOpacity style={styles.dateSelector} onPress={openDatePicker}>
                <Text style={[styles.infoValue, !profileData.date_of_birth && styles.placeholderText]}>
                  {formatDate(profileData.date_of_birth)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoValue}>{formatDate(user?.date_of_birth ? new Date(user.date_of_birth) : null)}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Taille (cm)</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={profileData.height}
                onChangeText={(text) => setProfileData(prev => ({...prev, height: text}))}
                placeholder="Votre taille en cm"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.infoValue}>
                {user?.height ? `${user.height} cm` : 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Poids (kg)</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={profileData.weight}
                onChangeText={(text) => setProfileData(prev => ({...prev, weight: text}))}
                placeholder="Votre poids en kg"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.infoValue}>
                {user?.weight ? `${user.weight} kg` : 'Non renseigné'}
              </Text>
            )}
          </View>
        </View>

        {/* Section paramètres */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>Aide</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de déconnexion */}
      <Modal
        transparent={true}
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection de date - COMPLET */}
      <Modal
        transparent={true}
        visible={showDateModal}
        animationType="slide"
        onRequestClose={cancelDateSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une date</Text>
              <TouchableOpacity onPress={cancelDateSelection}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateSelectorsContainer}>
              {/* Sélecteur de jour */}
              <View style={styles.dateSelectorColumn}>
                <Text style={styles.dateSelectorLabel}>Jour</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {generateDays().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dateOption,
                        tempDate.getDate() === day && styles.dateOptionSelected
                      ]}
                      onPress={() => updateDateField('day', day)}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getDate() === day && styles.dateOptionTextSelected
                      ]}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sélecteur de mois */}
              <View style={styles.dateSelectorColumn}>
                <Text style={styles.dateSelectorLabel}>Mois</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {generateMonths().map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.dateOption,
                        tempDate.getMonth() === month.value && styles.dateOptionSelected
                      ]}
                      onPress={() => updateDateField('month', month.value)}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getMonth() === month.value && styles.dateOptionTextSelected
                      ]}>
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sélecteur d'année */}
              <View style={styles.dateSelectorColumn}>
                <Text style={styles.dateSelectorLabel}>Année</Text>
                <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.dateOption,
                        tempDate.getFullYear() === year && styles.dateOptionSelected
                      ]}
                      onPress={() => updateDateField('year', year)}
                    >
                      <Text style={[
                        styles.dateOptionText,
                        tempDate.getFullYear() === year && styles.dateOptionTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.dateModalFooter}>
              <TouchableOpacity
                style={styles.dateModalCancelButton}
                onPress={cancelDateSelection}
              >
                <Text style={styles.dateModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateModalConfirmButton}
                onPress={confirmDateSelection}
              >
                <Text style={styles.dateModalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  deleteImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteImageText: {
    marginLeft: 8,
    color: '#f44336',
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 25,
  },
  editButtonText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  settingsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#999',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    backgroundColor: 'white',
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateModalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateSelectorsContainer: {
    flexDirection: 'row',
    height: 300,
  },
  dateSelectorColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  dateSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  dateScrollView: {
    flex: 1,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dateOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  dateModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  dateModalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  dateModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  dateModalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;