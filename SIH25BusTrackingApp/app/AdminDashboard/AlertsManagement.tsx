import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdminI18n } from '../utils/i18n';

import { API_URLS } from '../../config/api';
const API_URL = API_URLS.ADMIN;

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkBusId, setBulkBusId] = useState('');
  const [bulkRouteId, setBulkRouteId] = useState('');
  const [expandedForm, setExpandedForm] = useState<'global' | 'bus' | 'route' | 'caution' | null>(null);

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

  const renderItem = ({ item }: any) => {
    const isCaution = item.alertType === 'caution';
    const isBus = !isCaution && !!item.busId;
    const isRoute = !isCaution && !!item.routeId;
    const isExpanded = expandedId === item._id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpandedId(prev => (prev === item._id ? null : item._id))}
        style={[
        styles.alertCard,
        isCaution && styles.cardCaution,
        isBus && styles.cardBus,
        isRoute && styles.cardRoute,
      ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardIcon, isCaution && styles.iconCaution, isBus && styles.iconBus, isRoute && styles.iconRoute]}>
            {isCaution ? '⚠️' : isBus ? '🚌' : isRoute ? '🗺️' : '📢'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {isCaution ? 'Caution Alert' : isBus ? 'Bus Announcement' : isRoute ? 'Route Announcement' : 'Announcement'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>{describeAlert(item)}</Text>
          </View>
          {isExpanded && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteAlert(item._id)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.cardMessage, isCaution && styles.cautionMessage]} numberOfLines={isExpanded ? 0 : 2}>
          {item.message}
        </Text>

        {isExpanded && isCaution && item.reason ? (
          <View style={styles.reasonPill}>
            <Text style={styles.reasonPillLabel}>Reason</Text>
            <Text style={styles.reasonPillText}>{item.reason}</Text>
          </View>
        ) : null}

        {isExpanded && (
          <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('screen.alerts.title')}</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => {
            fetchAlerts();
            fetchBuses();
            fetchRoutes();
            Alert.alert('Success', 'Data refreshed successfully');
          }}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.form}>
          {/* Global Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setExpandedForm(expandedForm === 'global' ? null : 'global'); setAlertType('global'); }}
            style={[styles.formCard, expandedForm === 'global' && styles.formCardActive]}
          >
            <View style={styles.formCardHeader}>
              <Text style={styles.formCardIcon}>📢</Text>
              <Text style={styles.formCardTitle}>Global Alert</Text>
            </View>
            {expandedForm === 'global' && (
              <View>
                <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" style={[styles.input, { height: 80 }]} multiline />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Text style={styles.sendText}>{t('alerts.send')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Bus Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setExpandedForm(expandedForm === 'bus' ? null : 'bus'); setAlertType('bus'); }}
            style={[styles.formCard, expandedForm === 'bus' && styles.formCardActive]}
          >
            <View style={styles.formCardHeader}>
              <Text style={styles.formCardIcon}>🚌</Text>
              <Text style={styles.formCardTitle}>Bus Alert</Text>
            </View>
            {expandedForm === 'bus' && (
              <View>
                <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" style={[styles.input, { height: 80 }]} multiline />
                <Picker selectedValue={targetId} onValueChange={setTargetId} style={styles.picker}>
                  <Picker.Item label="Select Bus by ID (optional)" value="" />
                  {buses.map(b => <Picker.Item key={b._id} label={`Bus ${b.busNumber} (${b.regNo})`} value={b._id} />)}
                </Picker>
                <Text style={{ marginVertical: 6, color: '#666' }}>Or enter directly:</Text>
                <TextInput placeholder="Bus Number (optional)" value={busNumber} onChangeText={setBusNumber} style={styles.input} />
                <TextInput placeholder="Bus Reg. No (optional)" value={regNo} onChangeText={setRegNo} style={styles.input} />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Text style={styles.sendText}>{t('alerts.send')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Route Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setExpandedForm(expandedForm === 'route' ? null : 'route'); setAlertType('route'); }}
            style={[styles.formCard, expandedForm === 'route' && styles.formCardActive]}
          >
            <View style={styles.formCardHeader}>
              <Text style={styles.formCardIcon}>🗺️</Text>
              <Text style={styles.formCardTitle}>Route Alert</Text>
            </View>
            {expandedForm === 'route' && (
              <View>
                <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" style={[styles.input, { height: 80 }]} multiline />
                <Picker selectedValue={targetId} onValueChange={setTargetId} style={styles.picker}>
                  <Picker.Item label="Select..." value="" />
                  {routes.map(r => <Picker.Item key={r._id} label={r.name} value={r._id} />)}
                </Picker>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Text style={styles.sendText}>{t('alerts.send')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Caution Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => { setExpandedForm(expandedForm === 'caution' ? null : 'caution'); setAlertType('caution'); }}
            style={[styles.formCard, expandedForm === 'caution' && styles.formCardActive]}
          >
            <View style={styles.formCardHeader}>
              <Text style={styles.formCardIcon}>⚠️</Text>
              <Text style={styles.formCardTitle}>Caution Alert</Text>
            </View>
            {expandedForm === 'caution' && (
              <View>
                <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" style={[styles.input, { height: 80 }]} multiline />
                <View style={styles.cautionSection}>
                  <Text style={styles.cautionTitle}>Caution Alert Details</Text>
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
                        if (text) setSelectedRouteId('');
                      }} 
                      style={styles.input} 
                    />
                  </View>
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
                        if (text) setSelectedBusId('');
                      }} 
                      style={styles.input} 
                    />
                  </View>
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
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Text style={styles.sendText}>{t('alerts.send')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bulk Delete Options */}
        <View style={styles.bulkDeleteSection}>
          <Text style={styles.section}>{t('alerts.bulk')}</Text>
          <View style={styles.bulkDeleteGrid}>
            {/* Global Card */}
            <View style={[styles.bulkCard, styles.bulkCardGlobal]}>
              <View style={styles.bulkCardHeader}>
                <Text style={styles.bulkCardIcon}>📢</Text>
                <Text style={styles.bulkCardTitle}>Global Alerts</Text>
              </View>
              <Text style={styles.bulkCardHelp}>Delete all global announcements</Text>
              <TouchableOpacity style={[styles.bulkDeleteBtn, styles.globalDeleteBtn]} onPress={handleDeleteGlobalAlerts}>
                <Text style={styles.bulkDeleteBtnText}>Delete All</Text>
              </TouchableOpacity>
            </View>

            {/* Bus Card */}
            <View style={[styles.bulkCard, styles.bulkCardBus]}>
              <View style={styles.bulkCardHeader}>
                <Text style={styles.bulkCardIcon}>🚌</Text>
                <Text style={styles.bulkCardTitle}>Bus Alerts</Text>
              </View>
              <Picker selectedValue={bulkBusId} onValueChange={setBulkBusId} style={styles.bulkPicker}>
                <Picker.Item label="Select Bus..." value="" />
                {buses.map(b => (
                  <Picker.Item key={b._id} label={`Bus ${b.busNumber}${b.regNo ? ` (${b.regNo})` : ''}`} value={b._id} />
                ))}
              </Picker>
              <TouchableOpacity 
                style={[styles.bulkDeleteBtn, styles.busDeleteBtn, !bulkBusId && styles.disabledBtn]} 
                disabled={!bulkBusId}
                onPress={() => bulkBusId && handleDeleteBusAlerts(bulkBusId)}
              >
                <Text style={styles.bulkDeleteBtnText}>Delete All For Bus</Text>
              </TouchableOpacity>
            </View>

            {/* Route Card */}
            <View style={[styles.bulkCard, styles.bulkCardRoute]}>
              <View style={styles.bulkCardHeader}>
                <Text style={styles.bulkCardIcon}>🗺️</Text>
                <Text style={styles.bulkCardTitle}>Route Alerts</Text>
              </View>
              <Picker selectedValue={bulkRouteId} onValueChange={setBulkRouteId} style={styles.bulkPicker}>
                <Picker.Item label="Select Route..." value="" />
                {routes.map(r => (
                  <Picker.Item key={r._id} label={r.name} value={r._id} />
                ))}
              </Picker>
              <TouchableOpacity 
                style={[styles.bulkDeleteBtn, styles.routeDeleteBtn, !bulkRouteId && styles.disabledBtn]} 
                disabled={!bulkRouteId}
                onPress={() => bulkRouteId && handleDeleteRouteAlerts(bulkRouteId)}
              >
                <Text style={styles.bulkDeleteBtnText}>Delete All For Route</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.section}>{t('alerts.recent')}</Text>
        <FlatList data={alerts} renderItem={renderItem} keyExtractor={(i) => i._id} ListEmptyComponent={<Text>No alerts</Text>} style={{ width: '100%' }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flexGrow: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  navButton: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'transparent', borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  navButtonText: { color: '#1F2937', fontWeight: '800' },
  refreshButton: { marginLeft: 12 },
  refreshButtonText: { color: '#1F2937', fontWeight: '800', fontSize: 18 },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 24, elevation: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e5e7eb', elevation: 1 },
  formCardActive: { borderLeftColor: '#0d6efd', elevation: 2 },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  formCardIcon: { fontSize: 18, marginRight: 8 },
  formCardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2d3d' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginBottom: 12 },
  row: { marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: '600', color: '#333' },
  picker: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f8f8' },
  sendBtn: { backgroundColor: '#dc3545', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold' },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  bulkDeleteSection: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 24, elevation: 2 },
  bulkDeleteGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  bulkCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#0d6efd' },
  bulkCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bulkCardIcon: { fontSize: 18, marginRight: 8 },
  bulkCardTitle: { fontSize: 14, fontWeight: '800', color: '#1f2d3d', flex: 1 },
  bulkCardHelp: { fontSize: 12, color: '#6c757d', marginBottom: 8 },
  bulkCardGlobal: { borderLeftColor: '#0d6efd' },
  bulkCardBus: { borderLeftColor: '#198754' },
  bulkCardRoute: { borderLeftColor: '#6f42c1' },
  bulkDeleteBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  globalDeleteBtn: { backgroundColor: '#dc3545' },
  busDeleteBtn: { backgroundColor: '#fd7e14' },
  routeDeleteBtn: { backgroundColor: '#6f42c1' },
  bulkDeleteBtnText: { color: '#fff', fontWeight: 'bold' },
  bulkPicker: { backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, marginBottom: 8 },
  disabledBtn: { opacity: 0.5 },
  alertCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0d6efd'
  },
  cardCaution: { borderLeftColor: '#ffc107', backgroundColor: '#fffef4' },
  cardBus: { borderLeftColor: '#198754' },
  cardRoute: { borderLeftColor: '#6f42c1' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 18, marginRight: 10 },
  iconCaution: { },
  iconBus: { },
  iconRoute: { },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2d3d' },
  cardSubtitle: { fontSize: 12, color: '#6c757d' },
  deleteButton: { 
    padding: 8, 
    backgroundColor: '#dc3545', 
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center'
  },
  deleteButtonText: { fontSize: 16 },
  cardMessage: { fontSize: 15, color: '#2c3e50', marginBottom: 6 },
  cardTime: { fontSize: 12, color: '#6c757d', marginTop: 2 },
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
  cautionMessage: {
    color: '#856404',
    fontWeight: '600',
  },
  reasonPill: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ffeaa7', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, marginBottom: 4 },
  reasonPillLabel: { fontSize: 12, color: '#856404', fontWeight: '800', backgroundColor: '#fff3cd', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  reasonPillText: { fontSize: 13, color: '#856404' },
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


