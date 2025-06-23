import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useRun } from '../../context/RunContext';
import { useSettings } from '../../context/SettingsContext';

const ProfileScreen = ({ navigation }) => {
  // Contextes
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const runContext = useRun();
  const { runHistory = [] } = runContext || {};
  const settingsContext = useSettings();

  // États locaux
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    height: '',
    weight: '',
    date_of_birth: '',
  });
  const [tempSettings, setTempSettings] = useState({
    notifications: true,
    darkMode: false,
    units: 'metric', // metric ou imperial
    privacy: 'public', // public, friends, private
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        height: user.height ? user.height.toString() : '',
        weight: user.weight ? user.weight.toString() : '',
        date_of_birth: user.date_of_birth || '',
      });
    }
  }, [user]);

  // Statistiques calculées
  const getProfileStats = () => {
    if (!Array.isArray(runHistory) || runHistory.length === 0) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        totalDuration: 0,
        averagePace: '00:00',
        bestDistance: 0,
      };
    }

    const totalRuns = runHistory.length;
    const totalDistance = runHistory.reduce((sum, run) => {
      const distance = run.distanceMeters || (run.distance * 1000) || 0;
      return sum + distance;
    }, 0);
    const totalDuration = runHistory.reduce((sum, run) => sum + (run.duration || 0), 0);
    const bestDistance = Math.max(...runHistory.map(run => 
      run.distanceMeters || (run.distance * 1000) || 0
    ));

    const averagePace = totalDistance > 0 && totalDuration > 0 
      ? formatPace(totalDuration / (totalDistance / 1000))
      : '00:00';

    return {
      totalRuns,
      totalDistance,
      totalDuration,
      averagePace,
      bestDistance,
    };
  };

  const formatPace = (secondsPerKm) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters) => {
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Réinitialiser les données
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        height: user.height ? user.height.toString() : '',
        weight: user.weight ? user.weight.toString() : '',
        date_of_birth: user.date_of_birth || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validation des données
      if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
        Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
        return;
      }

      if (!profileData.email.trim()) {
        Alert.alert('Erreur', 'L\'email est obligatoire');
        return;
      }

      // Préparer les données pour l'API
      const updateData = {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        email: profileData.email.trim(),
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
        date_of_birth: profileData.date_of_birth || null,
      };

      await updateUser(updateData);
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      // La navigation vers Login sera gérée par AuthContext
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // TODO: Implémenter l'upload de l'image
        Alert.alert('Info', 'Upload d\'image à implémenter');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const stats = getProfileStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section profil */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            <View style={styles.avatar}>
              {user?.profile_picture ? (
                <Text style={styles.avatarText}>Photo</Text>
              ) : (
                <Ionicons name="person" size={40} color="#666" />
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>
            {user?.first_name || user?.firstName || 'Utilisateur'} {user?.last_name || user?.lastName || ''}
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

        {/* Formulaire d'édition */}
        {editing && (
          <View style={styles.editForm}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={profileData.first_name}
                  onChangeText={(text) => setProfileData(prev => ({...prev, first_name: text}))}
                  placeholder="Votre prénom"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Nom</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={profileData.last_name}
                  onChangeText={(text) => setProfileData(prev => ({...prev, last_name: text}))}
                  placeholder="Votre nom"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({...prev, email: text}))}
                placeholder="votre.email@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Taille (cm)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={profileData.height}
                  onChangeText={(text) => setProfileData(prev => ({...prev, height: text}))}
                  placeholder="175"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={profileData.weight}
                  onChangeText={(text) => setProfileData(prev => ({...prev, weight: text}))}
                  placeholder="70"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date de naissance</Text>
              <TextInput
                style={styles.fieldInput}
                value={profileData.date_of_birth}
                onChangeText={(text) => setProfileData(prev => ({...prev, date_of_birth: text}))}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        )}

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mes statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="footsteps" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.totalRuns}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="speedometer" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
              <Text style={styles.statLabel}>Distance totale</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
              <Text style={styles.statLabel}>Temps total</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{formatDistance(stats.bestDistance)}</Text>
              <Text style={styles.statLabel}>Meilleure distance</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('History')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="list" size={24} color="#666" />
              <Text style={styles.actionText}>Historique des courses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowSettingsModal(true)}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="settings" size={24} color="#666" />
              <Text style={styles.actionText}>Paramètres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="help-circle" size={24} color="#666" />
              <Text style={styles.actionText}>Aide et support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="information-circle" size={24} color="#666" />
              <Text style={styles.actionText}>À propos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de déconnexion */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={48} color="#f44336" />
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            
            <View style={styles.modalButtons}>
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
                <Text style={styles.modalConfirmText}>Déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal des paramètres */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Paramètres</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsContent}>
              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Notifications</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Activer les notifications</Text>
                  <Switch
                    value={tempSettings.notifications}
                    onValueChange={(value) => setTempSettings(prev => ({...prev, notifications: value}))}
                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                    thumbColor={tempSettings.notifications ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Affichage</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Mode sombre</Text>
                  <Switch
                    value={tempSettings.darkMode}
                    onValueChange={(value) => setTempSettings(prev => ({...prev, darkMode: value}))}
                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                    thumbColor={tempSettings.darkMode ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Unités</Text>
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => setTempSettings(prev => ({
                    ...prev, 
                    units: prev.units === 'metric' ? 'imperial' : 'metric'
                  }))}
                >
                  <Text style={styles.settingLabel}>Système d'unités</Text>
                  <Text style={styles.settingValue}>
                    {tempSettings.units === 'metric' ? 'Métrique (km)' : 'Impérial (mi)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.settingsFooter}>
              <TouchableOpacity
                style={styles.saveSettingsButton}
                onPress={() => {
                  // TODO: Sauvegarder les paramètres
                  setShowSettingsModal(false);
                  Alert.alert('Succès', 'Paramètres sauvegardés');
                }}
              >
                <Text style={styles.saveSettingsText}>Sauvegarder</Text>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#666',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
    marginLeft: 4,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  editForm: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  settingsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    width: '100%',
    marginTop: 'auto',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  settingsFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveSettingsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveSettingsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;