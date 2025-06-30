import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../services/api';

const ProfileScreen = () => {
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
        height: user.height ? user.height.toString() : '',
        weight: user.weight ? user.weight.toString() : '',
      });
    }
  }, [user]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setProfileData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
      height: user.height ? user.height.toString() : '',
      weight: user.weight ? user.weight.toString() : '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validation des données
      const errors = [];
      
      if (profileData.height && (isNaN(parseFloat(profileData.height)) || parseFloat(profileData.height) <= 0)) {
        errors.push('Taille invalide');
      }
      
      if (profileData.weight && (isNaN(parseFloat(profileData.weight)) || parseFloat(profileData.weight) <= 0)) {
        errors.push('Poids invalide');
      }
      
      if (errors.length > 0) {
        Alert.alert('Erreur de validation', errors.join('\n'));
        return;
      }

      const updateData = {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
        date_of_birth: profileData.date_of_birth ? profileData.date_of_birth.toISOString().split('T')[0] : null,
      };

      // Appel API pour mise à jour du profil
      const updatedUser = await updateProfileCorrect(updateData);
      
      if (updatedUser) {
        await updateUser(updatedUser, false);
        setEditing(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      const message = error.response?.data?.message || error.message || 'Impossible de mettre à jour le profil';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await handleImageUpload(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const handleImageUpload = async (imageAsset) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await axiosInstance.post('/api/uploads/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.status === 'success') {
        const profileResponse = await getCurrentUserCorrect();
        if (profileResponse) {
          await updateUser(profileResponse, false);
        }
        Alert.alert('Succès', 'Photo de profil mise à jour');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de télécharger l\'image');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setUploadLoading(true);
            try {
              await axiosInstance.delete('/api/uploads/profile-image');
              const profileResponse = await getCurrentUserCorrect();
              if (profileResponse) {
                await updateUser(profileResponse, false);
              }
              Alert.alert('Succès', 'Photo de profil supprimée');
            } catch (error) {
              console.error('Erreur suppression image:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'image');
            } finally {
              setUploadLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    }
  };

  const showDatePickerModal = () => {
    setTempDate(profileData.date_of_birth || new Date());
    setShowDateModal(true);
  };

  const confirmDate = () => {
    setProfileData({ ...profileData, date_of_birth: tempDate });
    setShowDateModal(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR');
  };

  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section photo de profil */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={!editing ? handleImagePicker : undefined}
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
                style={styles.textInput}
                value={profileData.first_name}
                onChangeText={(text) => setProfileData({ ...profileData, first_name: text })}
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
                style={styles.textInput}
                value={profileData.last_name}
                onChangeText={(text) => setProfileData({ ...profileData, last_name: text })}
                placeholder="Votre nom"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.last_name || 'Non renseigné'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date de naissance</Text>
            {editing ? (
              <TouchableOpacity
                style={styles.dateInput}
                onPress={showDatePickerModal}
              >
                <Text style={[styles.dateText, !profileData.date_of_birth && styles.placeholderText]}>
                  {profileData.date_of_birth ? formatDate(profileData.date_of_birth) : 'Sélectionner une date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoValue}>
                {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('fr-FR') : 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Taille (cm)</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={profileData.height}
                onChangeText={(text) => setProfileData({ ...profileData, height: text })}
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
                style={styles.textInput}
                value={profileData.weight}
                onChangeText={(text) => setProfileData({ ...profileData, weight: text })}
                placeholder="Votre poids en kg"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.infoValue}>
                {user?.weight ? `${user.weight} kg` : 'Non renseigné'}
              </Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmation de déconnexion */}
      <Modal
        transparent={true}
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalText}>
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

      {/* Modal de sélection de date */}
      <Modal
        transparent={true}
        visible={showDateModal}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>
            
            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Jour</Text>
                <TextInput
                  style={styles.dateInputField}
                  value={tempDate.getDate().toString().padStart(2, '0')}
                  onChangeText={(text) => {
                    const day = parseInt(text) || 1;
                    if (day >= 1 && day <= 31) {
                      const newDate = new Date(tempDate);
                      newDate.setDate(day);
                      setTempDate(newDate);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Mois</Text>
                <TextInput
                  style={styles.dateInputField}
                  value={(tempDate.getMonth() + 1).toString().padStart(2, '0')}
                  onChangeText={(text) => {
                    const month = parseInt(text) || 1;
                    if (month >= 1 && month <= 12) {
                      const newDate = new Date(tempDate);
                      newDate.setMonth(month - 1);
                      setTempDate(newDate);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Année</Text>
                <TextInput
                  style={styles.dateInputField}
                  value={tempDate.getFullYear().toString()}
                  onChangeText={(text) => {
                    const year = parseInt(text) || new Date().getFullYear();
                    if (year >= 1900 && year <= new Date().getFullYear()) {
                      const newDate = new Date(tempDate);
                      newDate.setFullYear(year);
                      setTempDate(newDate);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmDate}
              >
                <Text style={styles.modalConfirmText}>Confirmer</Text>
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
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
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  deleteImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  deleteImageText: {
    color: '#f44336',
    marginLeft: 8,
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
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  editButtonText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoSection: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 0.45,
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
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
});

export default ProfileScreen;