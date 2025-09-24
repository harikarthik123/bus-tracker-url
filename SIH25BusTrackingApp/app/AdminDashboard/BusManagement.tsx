import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnline } from '../utils/useOnline';
import { useAdminI18n } from '../utils/i18n';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { enqueueRequest } from '../utils/outbox';

const API_URL = 'http://192.168.137.1:5000/api/admin'; // Base API URL for admin management

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
  const online = useOnline();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [busNumber, setBusNumber] = useState('');
  const [regNo, setRegNo] = useState('');
  const [capacity, setCapacity] = useState('');
  const [driverId, setDriverId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

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

  const handleUploadCsv = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (pick.canceled || !pick.assets?.[0]) return;
      const file = pick.assets[0];
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      // @ts-ignore
      form.append('file', { uri: file.uri, name: file.name || 'buses.csv', type: 'text/csv' });
      await axios.post(`${API_URL}/buses/bulk`, form, { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Buses uploaded.');
      fetchBuses();
    } catch (e) {
      console.error('Upload buses CSV error', e);
      Alert.alert('Error', 'Upload failed. Ensure required columns are present.');
    }
  };

  const handleAddBus = async () => {
    if (!busNumber || !regNo || !capacity) {
      Alert.alert('Error', 'Please fill in bus number, reg. no and capacity.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { busNumber, regNo, capacity: parseInt(capacity), driver: driverId || null, route: routeId || null };
      const temp: Bus = { _id: `temp-${Date.now()}`, busNumber, regNo, capacity: parseInt(capacity), driver: driverId || null, route: routeId || null, syncStatus: 'pending' } as any;
      setBuses((prev: Bus[]) => [...prev, temp]);
      await enqueueRequest({ url: `${API_URL}/buses`, method: 'post', data: payload, headers: { 'x-auth-token': token || '' } });
      fetchBuses();
      setBusNumber('');
      setRegNo('');
      setCapacity('');
      setDriverId('');
      setRouteId('');
      Alert.alert('Success', 'Bus created successfully!');
    } catch (error) {
      console.error('Error creating bus:', error);
      Alert.alert('Error', 'Failed to create bus. Stored offline if applicable.');
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
      const payload = { busNumber, regNo, capacity: parseInt(capacity), driver: driverId || null, route: routeId || null };
      setBuses((prev: Bus[]) => prev.map((b) => (b._id === (editingBusId as string) ? ({ ...b, ...payload, syncStatus: 'pending' }) as Bus : b)));
      await enqueueRequest({ url: `${API_URL}/buses/${editingBusId}`, method: 'put', data: payload, headers: { 'x-auth-token': token || '' } });
      fetchBuses();
      setBusNumber('');
      setRegNo('');
      setCapacity('');
      setDriverId('');
      setRouteId('');
      setEditingBusId(null);
      Alert.alert('Success', 'Bus updated successfully!');
    } catch (error) {
      console.error('Error updating bus:', error);
      Alert.alert('Error', 'Failed to update bus. Stored offline if applicable.');
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
              setBuses((prev: Bus[]) => prev.filter((b) => b._id !== id));
              await enqueueRequest({ url: `${API_URL}/buses/${id}`, method: 'delete', headers: { 'x-auth-token': token || '' } });
            } catch (err) {
              console.error('Error deleting bus:', err);
              Alert.alert('Error', 'Failed to delete bus. Stored offline if applicable.');
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
        <View style={styles.uploadBox}>
          <Text style={styles.uploadTitle}>File Upload (CSV/XLSX)</Text>
          <Text style={styles.uploadHint}>Required: busNumber, reg_no, capacity. Optional: route_id/route_name, driverId</Text>
          <TouchableOpacity style={[styles.actionButton, styles.createButton]} onPress={handleUploadCsv}>
            <Text style={styles.buttonText}>Upload CSV</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder={"Search by bus number or reg no"}
          value={searchQuery}
          onChangeText={(v) => { setSearchQuery(v); if (v) setShowAll(false); }}
          autoCapitalize="none"
        />
        {(!searchQuery && !showAll) ? (
          <View style={{ width: '100%', marginBottom: 10 }}>
            <TouchableOpacity style={[styles.actionButton, styles.updateButton]} onPress={() => setShowAll(true)}>
              <Text style={styles.buttonText}>View All</Text>
            </TouchableOpacity>
            <Text style={{ color: '#6b7280', marginTop: 8, textAlign: 'center' }}>Search buses or tap View All.</Text>
          </View>
        ) : null}
        <FlatList
          data={(searchQuery ? buses.filter(b => (b.busNumber||'').toLowerCase().includes(searchQuery.toLowerCase()) || (b.regNo||'').toLowerCase().includes(searchQuery.toLowerCase())) : (showAll ? buses : []))}
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
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F59E0B',
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
    backgroundColor: '#F59E0B',
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
  uploadBox: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    color: '#6b7280',
    marginBottom: 10,
  },
});

export default BusManagement;
