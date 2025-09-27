import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useOnline } from '../utils/useOnline';
import { MaterialIcons } from '@expo/vector-icons'; // If you have expo/vector-icons installed
import { useAdminI18n } from '../utils/i18n';
import * as DocumentPicker from 'expo-document-picker';
import { enqueueRequest } from '../utils/outbox';

import { API_URLS } from '../../config/api';
const API_URL = API_URLS.ADMIN + '/drivers';

  const DriverManagement = () => {
  const router = useRouter();
  const { t } = useAdminI18n();
  const online = useOnline();
  type Driver = { _id: string; name: string; email: string; driverId?: string; busId?: string | null; syncStatus?: string; password?: string };
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<'add' | 'view' | 'upload' | null>(null);
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
      const payload = { name, email, password, driverId, busId: busId || null };
      const temp: Driver = { _id: `temp-${Date.now()}`, name, email, driverId, busId, syncStatus: 'pending' } as any;
      setDrivers((prev: Driver[]) => [...prev, temp]);
      await enqueueRequest({ url: API_URL, method: 'post', data: payload, headers: { 'x-auth-token': token || '' } });
      fetchDrivers();
      setName('');
      setEmail('');
      setPassword('');
      setDriverId('');
      setBusId('');
      Alert.alert('Success', 'Driver created successfully!');
    } catch (error) {
      console.error('Error creating driver:', error);
      Alert.alert('Error', 'Failed to create driver. Stored offline if applicable.');
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
      const payload = { name, email, password, driverId, busId: busId || null };
      setDrivers((prev: Driver[]) => prev.map((d) => (d._id === (editingDriverId as string) ? ({ ...d, ...payload, syncStatus: 'pending' }) as Driver : d)));
      await enqueueRequest({ url: `${API_URL}/${editingDriverId}`, method: 'put', data: payload, headers: { 'x-auth-token': token || '' } });
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      Alert.alert('Error', 'Failed to update driver. Stored offline if applicable.');
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
              setDrivers((prev: Driver[]) => prev.filter((d) => d._id !== id));
              await enqueueRequest({ url: `${API_URL}/${id}`, method: 'delete', headers: { 'x-auth-token': token || '' } });
            } catch (err) {
              console.error('Error deleting driver:', err);
              Alert.alert('Error', 'Failed to delete driver. Stored offline if applicable.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleUploadCsv = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (pick.canceled || !pick.assets?.[0]) return;
      const file = pick.assets[0];
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      // @ts-ignore
      form.append('file', { uri: file.uri, name: file.name || 'drivers.csv', type: 'text/csv' });
      await axios.post(API_URL + '/bulk', form, { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Drivers uploaded.');
      fetchDrivers();
    } catch (e) {
      console.error('Upload drivers CSV error', e);
      Alert.alert('Error', 'Upload failed. Ensure required columns are present.');
    }
  };

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const renderDriverItem = ({ item }: { item: Driver }) => (
    <TouchableOpacity onPress={() => setSelectedRow(selectedRow === item._id ? null : item._id)} activeOpacity={0.85}>
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
        <Text style={[styles.tableCell, { flex: 2 }]}>{item.driverId || '-'}</Text>
        <Text style={[styles.tableCell, { flex: 3 }]}>{item.email}</Text>
      </View>
      {selectedRow === item._id && (
        <View style={styles.tableActions}>
          <TouchableOpacity style={[styles.smallBtn, styles.smallEdit]} onPress={() => handleEditDriver(item)}>
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, styles.smallDelete]} onPress={() => handleDeleteDriver(item._id)}>
            <Text style={styles.smallBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('screen.driver.title')}</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Cards grid */}
        <View style={styles.cardRow}>
          <TouchableOpacity style={[styles.cardItem, styles.cardAdd, activeCard === 'add' && styles.cardItemActive]} onPress={() => { setActiveCard('add'); }}>
            <MaterialIcons name="person-add" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>Add Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardItem, styles.cardView, activeCard === 'view' && styles.cardItemActive]} onPress={() => { setActiveCard('view'); }}>
            <MaterialIcons name="people" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>View Drivers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardItem, styles.cardUpload, activeCard === 'upload' && styles.cardItemActive]} onPress={() => { setActiveCard('upload'); }}>
            <MaterialIcons name="file-upload" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>Upload File</Text>
          </TouchableOpacity>
        </View>

        {/* Upload section */}
        {activeCard === 'upload' && (
          <>
            <View style={styles.divider} />
            <View style={styles.uploadBox}>
              <Text style={styles.uploadTitle}>File Upload (CSV/XLSX)</Text>
              <Text style={styles.uploadHint}>Required: driverId, name, email, password. Optional: busId/busNumber/regNo</Text>
              <TouchableOpacity style={[styles.actionButton, styles.createButton, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={handleUploadCsv}>
                <MaterialIcons name="file-upload" size={18} color="#1F2937" />
                <Text style={styles.buttonText}>Upload CSV</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={styles.section}>
          {activeCard === 'add' || editingDriverId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>{editingDriverId ? t('driver.update') : 'Add Driver'}</Text>
          </View>
          ) : null}
          {(activeCard === 'add' || editingDriverId) && (
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
              <MaterialIcons name={editingDriverId ? 'save' : 'person-add'} size={18} color="#1F2937" />
              <Text style={styles.buttonText}>
                {editingDriverId ? t('driver.update') : t('driver.add')}
              </Text>
            </TouchableOpacity>
          </View>
          )}
        </View>
        {activeCard === 'view' && (
        <>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('driver.list.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by name, email or driverId"
            value={searchQuery}
            onChangeText={(v) => { setSearchQuery(v); if (v) setShowAll(false); }}
            autoCapitalize="none"
          />
          {(!searchQuery && !showAll) ? (
            <View>
              <TouchableOpacity style={[styles.actionButton, styles.updateButton]} onPress={() => setShowAll(true)}>
                <MaterialIcons name="visibility" size={18} color="#fff" />
                <Text style={styles.buttonText}>View All</Text>
              </TouchableOpacity>
              <Text style={{ color: '#6b7280', marginTop: 8 }}>Start typing to search drivers or tap View All.</Text>
            </View>
          ) : null}
          {/* Drivers table */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadCell, { flex: 2 }]}>Driver Name</Text>
            <Text style={[styles.tableHeadCell, { flex: 2 }]}>Driver ID</Text>
            <Text style={[styles.tableHeadCell, { flex: 3 }]}>Email</Text>
          </View>
          <FlatList
            data={(searchQuery ? drivers.filter(d => (d.name||'').toLowerCase().includes(searchQuery.toLowerCase()) || (d.email||'').toLowerCase().includes(searchQuery.toLowerCase()) || (d.driverId||'').toLowerCase().includes(searchQuery.toLowerCase())) : (showAll ? drivers : []))}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderDriverItem}
            ListEmptyComponent={<Text style={{ padding: 20, color: '#888', textAlign: 'center' }}>{t('driver.list.empty')}</Text>}
            contentContainerStyle={styles.listContent}
            style={styles.driverList}
            scrollEnabled={false} // Add this line
          />
        </View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#000000',
    marginHorizontal: 4,
    elevation: 2,
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e3e3',
    marginHorizontal: 18,
    marginVertical: 8,
  },
  uploadBox: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
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
  section: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 40 },
  cardItem: { borderRadius: 12, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', elevation: 2, margin: 8, minWidth: 110, maxWidth: 160, flexGrow: 0 },
  cardItemActive: { borderColor: '#F59E0B', borderWidth: 2 },
  cardLabel: { marginTop: 8, fontWeight: '800' },
  cardAdd: { backgroundColor: '#10b981' },
  cardView: { backgroundColor: '#3b82f6' },
  cardUpload: { backgroundColor: '#f59e0b' },
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
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  smallEdit: { backgroundColor: '#0d6efd' },
  smallDelete: { backgroundColor: '#dc3545' },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  createButton: {
    backgroundColor: '#F59E0B',
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
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  tableHeadCell: { fontWeight: '800', color: '#1f2937' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1 },
  tableCell: { color: '#1f2937' },
  tableActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 8 },
  addToggleButton: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addToggleText: { color: '#1F2937', fontWeight: '800', marginLeft: 6 },
  headerAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  headerActionText: { marginLeft: 6, color: '#1F2937', fontWeight: '800' },
});

export default DriverManagement;
