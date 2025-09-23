import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // If you have expo/vector-icons installed
import { useAdminI18n } from '../utils/i18n';

const API_URL = 'https://bus-tracker-url.onrender.com/api/admin/drivers'; // API URL for driver management

const DriverManagement = () => {
  const router = useRouter();
  const { t } = useAdminI18n();
  type Driver = { _id: string; name: string; email: string; driverId?: string; busId?: string | null; syncStatus?: string; password?: string };
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverId, setDriverId] = useState('');
  const [busId, setBusId] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { 'x-auth-token': token },
      });
      setDrivers(response.data as Driver[]);

    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to fetch drivers.');
    }
  };

  const handleAddDriver = async () => {
    if (!name || !email || !password || !driverId) {
      Alert.alert('Error', 'Please fill in all fields (Name, Email, Password, Driver ID).');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(API_URL, { name, email, password, driverId, busId: busId || null }, { headers: { 'x-auth-token': token } });
      setDrivers((prev: Driver[]) => [...prev, response.data.driver as Driver]);
      setName('');
      setEmail('');
      setPassword('');
      setDriverId('');
      setBusId('');
      Alert.alert('Success', 'Driver created successfully!');
    } catch (error) {
      console.error('Error creating driver:', error);
      Alert.alert('Error', 'Failed to create driver.');
    }
  };

  const syncDriver = async (driver: Driver) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/${driver._id}`, { name: driver.name, email: driver.email, password: driver.password, busId: driver.busId }, { headers: { 'x-auth-token': token } });
      fetchDrivers();
    } catch (error) {
      console.error('Error syncing driver with backend:', driver, error);
      Alert.alert('Sync Error', `Failed to sync driver ${driver.name}.`);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriverId(driver._id as string);
    setName(driver.name);
    setEmail(driver.email);
    setPassword(''); 
    setDriverId(driver.driverId || '');
    setBusId(driver.busId || '');
  };

  const handleUpdateDriver = async () => {
    if (!name || !email || !editingDriverId) {
      Alert.alert('Error', 'Please fill in all fields (Name, Email) and select a driver to update.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/${editingDriverId}`, { name, email, password, driverId, busId: busId || null }, { headers: { 'x-auth-token': token } });
      setDrivers((prev: Driver[]) => prev.map((d) => (d._id === (editingDriverId as string) ? (response.data.driver as Driver) : d)));
    } catch (error) {
      console.error('Error updating driver:', error);
      Alert.alert('Error', 'Failed to update driver.');
    }

    setName('');
    setEmail('');
    setPassword('');
    setDriverId('');
    setBusId('');
    setEditingDriverId(null);
  };

  const handleDeleteDriver = async (id: string) => {
    Alert.alert(
      'Delete Driver',
      'Are you sure you want to delete this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/${id}`, { headers: { 'x-auth-token': token } });
              setDrivers((prev: Driver[]) => prev.filter((d) => d._id !== id));
            } catch (err) {
              console.error('Error deleting driver:', err);
              Alert.alert('Error', 'Failed to delete driver.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderDriverItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverDetails}>Email: {item.email}</Text>
        {item.busId && <Text style={styles.driverDetails}>Bus ID: {item.busId}</Text>}
        {item.syncStatus !== 'synced' && (
          <Text style={styles.syncStatus}>{item.syncStatus}</Text>
        )}
      </View>
      <View style={styles.driverActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleEditDriver(item)}
          activeOpacity={0.7}
        >
          {/* Replace emoji with <MaterialIcons name="edit" size={22} color="#007bff" /> if using icons */}
          <Text style={styles.iconText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDeleteDriver(item._id)}
          activeOpacity={0.7}
        >
          {/* Replace emoji with <MaterialIcons name="delete" size={22} color="#dc3545" /> if using icons */}
          <Text style={styles.iconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
          <Text style={styles.navButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('screen.driver.title')}</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{editingDriverId ? t('driver.update') : t('driver.add')}</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('driver.form.name')}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder={t('driver.form.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('driver.form.password')} 
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder={t('driver.form.driverId')}
              value={driverId}
              onChangeText={setDriverId}
            />
            <TextInput
              style={styles.input}
              placeholder={t('driver.form.busId')}
              value={busId}
              onChangeText={setBusId}
            />

            <TouchableOpacity
              style={[styles.actionButton, editingDriverId ? styles.updateButton : styles.createButton]}
              onPress={editingDriverId ? handleUpdateDriver : handleAddDriver}
            >
              <Text style={styles.buttonText}>
                {editingDriverId ? t('driver.update') : t('driver.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('driver.list.title')}</Text>
          <FlatList
            data={drivers}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderDriverItem}
            ListEmptyComponent={<Text style={{ padding: 20, color: '#888', textAlign: 'center' }}>{t('driver.list.empty')}</Text>}
            contentContainerStyle={styles.listContent}
            style={styles.driverList}
            scrollEnabled={false} // Add this line
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    paddingHorizontal: 0,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#007bff',
    marginHorizontal: 4,
    elevation: 2,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e3e3',
    marginHorizontal: 18,
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 7,
    marginBottom: 13,
    fontSize: 16,
    backgroundColor: '#f7f9fa',
  },
  actionButton: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  updateButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  driverList: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 40,
  },
  driverCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  driverDetails: {
    fontSize: 15,
    color: '#555',
    marginBottom: 2,
  },
  syncStatus: {
    fontSize: 13,
    color: '#e67e22',
    marginTop: 2,
  },
  driverActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  iconButton: {
    backgroundColor: '#f0f2f5',
    borderRadius: 6,
    padding: 8,
    marginLeft: 6,
    elevation: 1,
  },
  iconText: {
    fontSize: 20,
  },
});

export default DriverManagement;
