import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminI18n } from '../utils/i18n';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://bus-tracker-rjir.onrender.com/api/admin'; // Base API URL for admin management

type Driver = {
  _id: string;
  name: string;
  driverId?: string;
};

type RouteType = {
  _id: string;
  name: string;
};

type Bus = {
  _id: string;
  busNumber: string;
  regNo: string;
  capacity: number;
  driver?: { _id: string; name?: string } | string | null;
  route?: { _id: string; name?: string } | string | null;
  syncStatus?: string;
};

const BusManagement = () => {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [busNumber, setBusNumber] = useState('');
  const [regNo, setRegNo] = useState('');
  const [capacity, setCapacity] = useState('');
  const [driverId, setDriverId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [editingBusId, setEditingBusId] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses();
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/buses`, {
        headers: { 'x-auth-token': token },
      });
      setBuses(response.data as Bus[]);

    } catch (error) {
      console.error('Error fetching buses:', error);
      Alert.alert('Error', 'Failed to fetch buses.');
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/drivers`, {
        headers: { 'x-auth-token': token },
      });
      setDrivers(response.data as Driver[]);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/routes`, {
        headers: { 'x-auth-token': token },
      });
      setRoutes(response.data as RouteType[]);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleAddBus = async () => {
    if (!busNumber || !regNo || !capacity) {
      Alert.alert('Error', 'Please fill in bus number, reg. no and capacity.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/buses`, {
        busNumber,
        regNo,
        capacity: parseInt(capacity),
        driver: driverId || null,
        route: routeId || null,
      }, { headers: { 'x-auth-token': token } });

      setBuses((prev: Bus[]) => [...prev, response.data.bus as Bus]);
      setBusNumber('');
      setRegNo('');
      setCapacity('');
      setDriverId('');
      setRouteId('');
      Alert.alert('Success', 'Bus created successfully!');
    } catch (error) {
      console.error('Error creating bus:', error);
      Alert.alert('Error', 'Failed to create bus.');
    }
  };

  const handleEditBus = (bus: Bus) => {
    setEditingBusId(bus._id as string);
    setBusNumber(bus.busNumber);
    setRegNo(bus.regNo);
    setCapacity(bus.capacity.toString());
    const dId = typeof bus.driver === 'string' ? bus.driver : bus.driver?._id || '';
    const rId = typeof bus.route === 'string' ? bus.route : bus.route?._id || '';
    setDriverId(dId);
    setRouteId(rId);
  };

  const handleUpdateBus = async () => {
    if (!busNumber || !capacity || !editingBusId) {
      Alert.alert('Error', 'Please fill in bus number, capacity, and select a bus to update.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/buses/${editingBusId}`, {
        busNumber,
        regNo,
        capacity: parseInt(capacity),
        driver: driverId || null,
        route: routeId || null,
      }, { headers: { 'x-auth-token': token } });

      setBuses((prev: Bus[]) => prev.map((b) => (b._id === (editingBusId as string) ? (response.data.bus as Bus) : b)));
      setBusNumber('');
      setRegNo('');
      setCapacity('');
      setDriverId('');
      setRouteId('');
      setEditingBusId(null);
      Alert.alert('Success', 'Bus updated successfully!');
    } catch (error) {
      console.error('Error updating bus:', error);
      Alert.alert('Error', 'Failed to update bus.');
    }

    setBusNumber('');
    setCapacity('');
    setDriverId('');
    setRouteId('');
    setEditingBusId(null);
  };

  const handleDeleteBus = async (id: string) => {
    Alert.alert(
      'Delete Bus',
      'Are you sure you want to delete this bus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/buses/${id}`, { headers: { 'x-auth-token': token } });
              setBuses((prev: Bus[]) => prev.filter((b) => b._id !== id));
            } catch (err) {
              console.error('Error deleting bus:', err);
              Alert.alert('Error', 'Failed to delete bus.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderBusItem = ({ item }: { item: Bus }) => (
    <View style={styles.busItem}>
      <View>
        <Text style={styles.busDetails}>Bus No: {item.busNumber} {item.syncStatus !== 'synced' && `(${item.syncStatus})`}</Text>
        <Text style={styles.busDetails}>Reg. No: {item.regNo}</Text>
        <Text style={styles.busDetails}>Capacity: {item.capacity}</Text>
        {item.driver && (
          <Text style={styles.busDetails}>
            Driver: {
              (() => {
                const driverRefId = typeof item.driver === 'string' ? item.driver : item.driver?._id;
                const d = drivers.find((drv) => drv._id === driverRefId);
                return d ? `${d.name}${d.driverId ? ` - ${d.driverId}` : ''}` : 'N/A';
              })()
            }
          </Text>
        )}
        {item.route && (
          <Text style={styles.busDetails}>
            Route: {routes.find((r) => r._id === (typeof item.route === 'string' ? item.route : item.route?._id))?.name || 'N/A'}
          </Text>
        )}
      </View>
      <View style={styles.busActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditBus(item)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteBus(item._id)}>
          <Text style={styles.buttonText}>Delete</Text>
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
        <Text style={styles.title}>{t('screen.bus.title')}</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('bus.form.busNumber')}
            value={busNumber}
            onChangeText={setBusNumber}
          />
          <TextInput
            style={styles.input}
            placeholder={t('bus.form.regNo')}
            value={regNo}
            onChangeText={setRegNo}
          />
          <TextInput
            style={styles.input}
            placeholder={t('bus.form.capacity')}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />
          <Picker
            selectedValue={driverId}
            style={styles.picker}
            onValueChange={(itemValue) => setDriverId(itemValue)}
          >
            <Picker.Item label="Select Driver (Optional)" value="" />
          {drivers.map((driver) => (
            <Picker.Item key={driver._id} label={`${driver.name}${driver.driverId ? ` - ${driver.driverId}` : ''}`} value={driver._id} />
          ))}
          </Picker>
          <Picker
            selectedValue={routeId}
            style={styles.picker}
            onValueChange={(itemValue) => setRouteId(itemValue)}
          >
            <Picker.Item label="Select Route (Optional)" value="" />
            {routes.map((route) => (
              <Picker.Item key={route._id} label={route.name} value={route._id} />
            ))}
          </Picker>

          <TouchableOpacity
            style={[styles.actionButton, editingBusId ? styles.updateButton : styles.createButton]}
            onPress={editingBusId ? handleUpdateBus : handleAddBus}
          >
            <Text style={styles.buttonText}>
              {editingBusId ? t('bus.update') : t('bus.add')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listTitle}>Existing Buses</Text>
        <FlatList
          data={buses}
          renderItem={renderBusItem}
          keyExtractor={(item) => item._id.toString()}
          ListEmptyComponent={<Text>No buses added yet.</Text>}
          style={styles.busList}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  picker: {
    width: '100%',
    padding: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  updateButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  busList: {
    width: '100%',
  },
  busItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busDetails: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  busActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
});

export default BusManagement;
