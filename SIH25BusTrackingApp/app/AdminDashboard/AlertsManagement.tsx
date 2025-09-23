import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdminI18n } from '../utils/i18n';

const API_URL = 'https://bus-tracker-url.onrender.com/api/admin';

const AlertsManagement = () => {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<'global' | 'bus' | 'route' | 'caution'>('global');
  const [targetId, setTargetId] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [regNo, setRegNo] = useState('');
  const [cautionRouteName, setCautionRouteName] = useState('');
  const [cautionBusNumber, setCautionBusNumber] = useState('');
  const [cautionReason, setCautionReason] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');

  useEffect(() => {
    fetchAlerts();
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/alerts`, { headers: { 'x-auth-token': token } });
      setAlerts(res.data);
    } catch (e) {
      console.error('Fetch alerts failed', e);
      Alert.alert('Network', 'Unable to fetch alerts.');
    }
  };

  const fetchBuses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/buses`, { headers: { 'x-auth-token': token } });
      setBuses(res.data);
    } catch (e) {
      console.error('Fetch buses failed', e);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/routes`, { headers: { 'x-auth-token': token } });
      setRoutes(res.data);
    } catch (e) {
      console.error('Fetch routes failed', e);
    }
  };

  const handleSend = async () => {
    if (!message) {
      Alert.alert('Validation', 'Enter a message');
      return;
    }

    // Validation for caution alerts
    if (alertType === 'caution') {
      if ((!selectedRouteId && !cautionRouteName) || (!selectedBusId && !cautionBusNumber) || !cautionReason) {
        Alert.alert('Validation', 'Route name, bus number, and reason are required for caution alerts');
        return;
      }
    }

    try {
      const token = await AsyncStorage.getItem('token');
      
      let requestData: any = {
        message,
        alertType: alertType === 'caution' ? 'caution' : 'general',
      };

      if (alertType === 'caution') {
        // Get route name from dropdown selection or manual input
        let routeName = cautionRouteName;
        if (selectedRouteId) {
          const selectedRoute = routes.find(r => r._id === selectedRouteId);
          routeName = selectedRoute?.name || cautionRouteName;
        }

        // Get bus number from dropdown selection or manual input
        let busNumber = cautionBusNumber;
        if (selectedBusId) {
          const selectedBus = buses.find(b => b._id === selectedBusId);
          busNumber = selectedBus?.busNumber || cautionBusNumber;
        }

        requestData = {
          ...requestData,
          routeName: routeName,
          busNumber: busNumber,
          reason: cautionReason,
        };
      } else {
        requestData = {
          ...requestData,
          routeId: alertType === 'route' ? targetId : null,
          busId: alertType === 'bus' && targetId ? targetId : null,
          busNumber: alertType === 'bus' && !targetId ? (busNumber || undefined) : undefined,
          regNo: alertType === 'bus' && !targetId ? (regNo || undefined) : undefined,
        };
      }

      const res = await axios.post(`${API_URL}/alerts`, requestData, { 
        headers: { 'x-auth-token': token } 
      });
      
      setAlerts(prev => [res.data.alert, ...prev]);
      
      // Reset form
      setMessage('');
      setAlertType('global');
      setTargetId('');
      setBusNumber('');
      setRegNo('');
      setCautionRouteName('');
      setCautionBusNumber('');
      setCautionReason('');
      setSelectedRouteId('');
      setSelectedBusId('');
      
      Alert.alert('Success', 'Alert sent');
    } catch (e) {
      console.error('Send alert failed', e);
      Alert.alert('Error', 'Failed to send alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/alerts/${alertId}`, {
                headers: { 'x-auth-token': token }
              });
              setAlerts(prev => prev.filter(alert => alert._id !== alertId));
              Alert.alert('Success', 'Alert deleted successfully');
            } catch (e) {
              console.error('Delete alert failed', e);
              Alert.alert('Error', 'Failed to delete alert');
            }
          }
        }
      ]
    );
  };

  const handleDeleteBusAlerts = async (busId: string) => {
    const bus = buses.find(b => b._id === busId);
    const busName = bus ? `Bus ${bus.busNumber}${bus.regNo ? ` (${bus.regNo})` : ''}` : 'this bus';
    
    Alert.alert(
      'Delete Bus Alerts',
      `Are you sure you want to delete all alerts for ${busName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.delete(`${API_URL}/alerts/bus/${busId}`, {
                headers: { 'x-auth-token': token }
              });
              setAlerts(prev => prev.filter(alert => alert.busId !== busId));
              Alert.alert('Success', res.data.msg);
            } catch (e) {
              console.error('Delete bus alerts failed', e);
              Alert.alert('Error', 'Failed to delete bus alerts');
            }
          }
        }
      ]
    );
  };

  const handleDeleteRouteAlerts = async (routeId: string) => {
    const route = routes.find(r => r._id === routeId);
    const routeName = route ? route.name : 'this route';
    
    Alert.alert(
      'Delete Route Alerts',
      `Are you sure you want to delete all alerts for ${routeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.delete(`${API_URL}/alerts/route/${routeId}`, {
                headers: { 'x-auth-token': token }
              });
              setAlerts(prev => prev.filter(alert => alert.routeId !== routeId));
              Alert.alert('Success', res.data.msg);
            } catch (e) {
              console.error('Delete route alerts failed', e);
              Alert.alert('Error', 'Failed to delete route alerts');
            }
          }
        }
      ]
    );
  };

  const handleDeleteGlobalAlerts = async () => {
    Alert.alert(
      'Delete Global Alerts',
      'Are you sure you want to delete all global alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.delete(`${API_URL}/alerts/global`, {
                headers: { 'x-auth-token': token }
              });
              setAlerts(prev => prev.filter(alert => alert.routeId || alert.busId));
              Alert.alert('Success', res.data.msg);
            } catch (e) {
              console.error('Delete global alerts failed', e);
              Alert.alert('Error', 'Failed to delete global alerts');
            }
          }
        }
      ]
    );
  };

  const describeAlert = (a: any) => {
    if (a.alertType === 'caution') {
      return `⚠️ Caution: ${a.routeName} - Bus ${a.busNumber}`;
    }
    if (a.routeId) {
      const r = routes.find(r => r._id === a.routeId);
      return `Route: ${r?.name || 'Unknown'}`;
    }
    if (a.busId) {
      const b = buses.find(b => b._id === a.busId);
      return `Bus: ${b?.busNumber || 'Unknown'}${b?.regNo ? ` (${b.regNo})` : ''}`;
    }
    return 'Global';
  };

  const renderItem = ({ item }: any) => (
    <View style={[
      styles.alertItem,
      item.alertType === 'caution' && styles.cautionAlertItem
    ]}>
      <View style={styles.alertContent}>
        {item.alertType === 'caution' && (
          <View style={styles.cautionHeader}>
            <Text style={styles.cautionIcon}>⚠️</Text>
            <Text style={styles.cautionBadge}>CAUTION ALERT</Text>
          </View>
        )}
        <Text style={[
          styles.alertMessage,
          item.alertType === 'caution' && styles.cautionMessage
        ]}>
          {item.message}
        </Text>
        <Text style={styles.alertMeta}>{describeAlert(item)}</Text>
        {item.alertType === 'caution' && item.reason && (
          <Text style={styles.cautionReason}>
            <Text style={styles.cautionReasonLabel}>Reason: </Text>
            {item.reason}
          </Text>
        )}
        <Text style={styles.alertTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <View style={styles.alertActions}>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeleteAlert(item._id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('screen.alerts.title')}</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              fetchAlerts();
              fetchBuses();
              fetchRoutes();
              Alert.alert('Success', 'Data refreshed successfully');
            }}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" style={[styles.input, { height: 80 }]} multiline />
          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Picker selectedValue={alertType} onValueChange={(v) => setAlertType(v)} style={styles.picker}>
              <Picker.Item label="Global" value="global" />
              <Picker.Item label="Bus" value="bus" />
              <Picker.Item label="Route" value="route" />
              <Picker.Item label="⚠️ Caution Alert" value="caution" />
            </Picker>
          </View>
          {alertType !== 'global' && alertType !== 'caution' && (
            <View style={styles.row}>
              <Text style={styles.label}>{alertType === 'bus' ? 'Bus' : 'Route'}</Text>
              {alertType === 'bus' ? (
                <>
                  <Picker selectedValue={targetId} onValueChange={setTargetId} style={styles.picker}>
                    <Picker.Item label="Select Bus by ID (optional)" value="" />
                    {buses.map(b => <Picker.Item key={b._id} label={`Bus ${b.busNumber} (${b.regNo})`} value={b._id} />)}
                  </Picker>
                  <Text style={{ marginVertical: 6, color: '#666' }}>Or enter directly:</Text>
                  <TextInput placeholder="Bus Number (optional)" value={busNumber} onChangeText={setBusNumber} style={styles.input} />
                  <TextInput placeholder="Bus Reg. No (optional)" value={regNo} onChangeText={setRegNo} style={styles.input} />
                </>
              ) : (
                <Picker selectedValue={targetId} onValueChange={setTargetId} style={styles.picker}>
                  <Picker.Item label="Select..." value="" />
                  {routes.map(r => <Picker.Item key={r._id} label={r.name} value={r._id} />)}
                </Picker>
              )}
            </View>
          )}

          {alertType === 'caution' && (
            <View style={styles.cautionSection}>
              <Text style={styles.cautionTitle}>⚠️ Caution Alert Details</Text>
              
              {/* Route Selection */}
              <View style={styles.cautionRow}>
                <Text style={styles.cautionLabel}>Route Name *</Text>
                <Picker 
                  selectedValue={selectedRouteId} 
                  onValueChange={(value) => {
                    setSelectedRouteId(value);
                    if (value) {
                      const selectedRoute = routes.find(r => r._id === value);
                      setCautionRouteName(selectedRoute?.name || '');
                    } else {
                      setCautionRouteName('');
                    }
                  }} 
                  style={styles.cautionPicker}
                >
                  <Picker.Item label="Select Route..." value="" />
                  {routes.map(route => (
                    <Picker.Item 
                      key={route._id} 
                      label={route.name} 
                      value={route._id} 
                    />
                  ))}
                </Picker>
                <Text style={styles.cautionOrText}>OR</Text>
                <TextInput 
                  placeholder="Enter Route Name Manually *" 
                  value={cautionRouteName} 
                  onChangeText={(text) => {
                    setCautionRouteName(text);
                    if (text) setSelectedRouteId(''); // Clear dropdown if manual input
                  }} 
                  style={styles.input} 
                />
              </View>

              {/* Bus Selection */}
              <View style={styles.cautionRow}>
                <Text style={styles.cautionLabel}>Bus Number *</Text>
                <Picker 
                  selectedValue={selectedBusId} 
                  onValueChange={(value) => {
                    setSelectedBusId(value);
                    if (value) {
                      const selectedBus = buses.find(b => b._id === value);
                      setCautionBusNumber(selectedBus?.busNumber || '');
                    } else {
                      setCautionBusNumber('');
                    }
                  }} 
                  style={styles.cautionPicker}
                >
                  <Picker.Item label="Select Bus..." value="" />
                  {buses.map(bus => (
                    <Picker.Item 
                      key={bus._id} 
                      label={`Bus ${bus.busNumber} (${bus.regNo})`} 
                      value={bus._id} 
                    />
                  ))}
                </Picker>
                <Text style={styles.cautionOrText}>OR</Text>
                <TextInput 
                  placeholder="Enter Bus Number Manually *" 
                  value={cautionBusNumber} 
                  onChangeText={(text) => {
                    setCautionBusNumber(text);
                    if (text) setSelectedBusId(''); // Clear dropdown if manual input
                  }} 
                  style={styles.input} 
                />
              </View>

              {/* Reason */}
              <View style={styles.cautionRow}>
                <Text style={styles.cautionLabel}>Reason for Caution Alert *</Text>
                <TextInput 
                  placeholder="Enter the reason for this caution alert..." 
                  value={cautionReason} 
                  onChangeText={setCautionReason} 
                  style={[styles.input, { height: 80 }]} 
                  multiline 
                />
              </View>

              <Text style={styles.cautionNote}>
                * Required fields for caution alerts. Use dropdowns to select from database or enter manually.
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>{t('alerts.send')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Delete Options */}
        <View style={styles.bulkDeleteSection}>
          <Text style={styles.section}>{t('alerts.bulk')}</Text>
          <View style={styles.bulkDeleteButtons}>
            <TouchableOpacity 
              style={[styles.bulkDeleteButton, styles.globalDeleteButton]} 
              onPress={handleDeleteGlobalAlerts}
            >
              <Text style={styles.bulkDeleteButtonText}>Delete All Global Alerts</Text>
            </TouchableOpacity>
            
            {buses.map(bus => (
              <TouchableOpacity 
                key={bus._id}
                style={[styles.bulkDeleteButton, styles.busDeleteButton]} 
                onPress={() => handleDeleteBusAlerts(bus._id)}
              >
                <Text style={styles.bulkDeleteButtonText}>
                  Delete All Alerts for {bus.busNumber}
                </Text>
              </TouchableOpacity>
            ))}
            
            {routes.map(route => (
              <TouchableOpacity 
                key={route._id}
                style={[styles.bulkDeleteButton, styles.routeDeleteButton]} 
                onPress={() => handleDeleteRouteAlerts(route._id)}
              >
                <Text style={styles.bulkDeleteButtonText}>
                  Delete All Alerts for {route.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.section}>{t('alerts.recent')}</Text>
        <FlatList data={alerts} renderItem={renderItem} keyExtractor={(i) => i._id} ListEmptyComponent={<Text>No alerts</Text>} style={{ width: '100%' }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scroll: { flexGrow: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#007bff', borderRadius: 6 },
  navButtonText: { color: '#fff', fontWeight: 'bold' },
  refreshButton: { marginLeft: 12 },
  refreshButtonText: { color: '#007bff', fontWeight: 'bold', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '700', color: '#333' },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 24, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginBottom: 12 },
  row: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: '600', color: '#333' },
  picker: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f8f8' },
  sendBtn: { backgroundColor: '#dc3545', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold' },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  bulkDeleteSection: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 24, elevation: 2 },
  bulkDeleteButtons: { gap: 8 },
  bulkDeleteButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  globalDeleteButton: { backgroundColor: '#dc3545' },
  busDeleteButton: { backgroundColor: '#fd7e14' },
  routeDeleteButton: { backgroundColor: '#6f42c1' },
  bulkDeleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  alertItem: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10, 
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  alertContent: { flex: 1 },
  alertActions: { marginLeft: 12 },
  deleteButton: { 
    padding: 8, 
    backgroundColor: '#dc3545', 
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center'
  },
  deleteButtonText: { fontSize: 16 },
  alertMessage: { fontSize: 16, color: '#333' },
  alertMeta: { fontSize: 12, color: '#007bff', marginTop: 4 },
  alertTime: { fontSize: 12, color: '#666', marginTop: 4 },
  cautionSection: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginBottom: 12,
  },
  cautionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  cautionNote: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
    marginTop: 8,
  },
  cautionAlertItem: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  cautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cautionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  cautionBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    backgroundColor: '#ffeaa7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cautionMessage: {
    color: '#856404',
    fontWeight: '600',
  },
  cautionReason: {
    fontSize: 14,
    color: '#856404',
    marginTop: 4,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  cautionReasonLabel: {
    fontWeight: 'bold',
  },
  cautionRow: {
    marginBottom: 16,
  },
  cautionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  cautionPicker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#856404',
    borderRadius: 6,
    marginBottom: 8,
  },
  cautionOrText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    marginVertical: 4,
    fontStyle: 'italic',
  },
});

export default AlertsManagement;


