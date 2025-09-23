import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
// Assuming your backend is running on http://bus-tracker-url.onrender.com
const API_URL = 'https://bus-tracker-url.onrender.com/api/driver'; 
const DriverDashboard = () => {
  const router = useRouter();
  const [assignedBus, setAssignedBus] = useState<any>(null);
  const [assignedRoute, setAssignedRoute] = useState<any>(null);
  const [isGpsTrackingEnabled, setIsGpsTrackingEnabled] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [driverAlerts, setDriverAlerts] = useState<any[]>([]);

  // Fetch driver data
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/LoginScreen');
          return;
        }
        const res = await axios.get(`${API_URL}/me`, {
          headers: { 'x-auth-token': token },
        });
        setAssignedBus(res.data.busId);
        setAssignedRoute(res.data.busId?.route);
      } catch (err: any) {
        console.error('Error fetching driver data:', err);
        Alert.alert('Error', err.response?.data?.msg || 'Failed to fetch driver data.');
        router.replace('/LoginScreen');
      }
    };
    fetchDriverData();
  }, []);

  // Fetch alerts
  useEffect(() => {
    const fetchDriverAlerts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/alerts`, {
          headers: { 'x-auth-token': token },
        });
        setDriverAlerts(res.data);
      } catch (err) {
        console.error('Error fetching driver alerts:', err);
      }
    };

    fetchDriverAlerts();
    const interval = setInterval(fetchDriverAlerts, 15000); // Refresh alerts every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // GPS tracking effect
  useEffect(() => {
    let foregroundSubscription: Location.LocationSubscription | null = null;
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to enable tracking.');
        setIsGpsTrackingEnabled(false);
        return;
      }

      foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          if (!isGpsTrackingEnabled) return; // Only send if toggle is still enabled
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              console.warn('No token found for location update.');
              return;
            }
            await axios.post(
              `${API_URL}/location`,
              {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                speed: location.coords.speed || 0,
              },
              {
                headers: { 'x-auth-token': token },
              }
            );
            console.log('Location updated:', location.coords.latitude, location.coords.longitude);
          } catch (err) {
            console.error('Error sending location update:', err);
          }
        }
      );
      setLocationSubscription(foregroundSubscription);
    };

    const stopLocationTracking = async () => {
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
        console.log('Location tracking stopped.');
        
        // Clear location data from server when tracking is disabled
        try {
          const token = await AsyncStorage.getItem('token');
          if (token && assignedBus) {
            await axios.delete(`${API_URL}/location`, {
              headers: { 'x-auth-token': token }
            });
            console.log('Location data cleared from server (tracking disabled)');
          }
        } catch (locationError) {
          console.error('Error clearing location data:', locationError);
        }
      }
    };

    if (isGpsTrackingEnabled) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking(); // Cleanup on unmount
    };
  }, [isGpsTrackingEnabled]);

  // Cleanup location data when component unmounts (app closed, navigation away)
  useEffect(() => {
    return () => {
      // This runs when component unmounts
      const cleanupLocation = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token && assignedBus) {
            await axios.delete(`${API_URL}/location`, {
              headers: { 'x-auth-token': token }
            });
            console.log('Location data cleared on app close/unmount');
          }
        } catch (error) {
          console.error('Error clearing location on unmount:', error);
        }
      };
      cleanupLocation();
    };
  }, [assignedBus]);
  const handleLogout = async () => {
    try {
      // Stop location tracking
      if (locationSubscription) {
        locationSubscription.remove();
      }
      
      // Clear location data from server
      try {
        const token = await AsyncStorage.getItem('token');
        if (token && assignedBus) {
          await axios.delete(`${API_URL}/location`, {
            headers: { 'x-auth-token': token }
          });
          console.log('Location data cleared from server');
        }
      } catch (locationError) {
        console.error('Error clearing location data:', locationError);
      }
      
      // Clear local storage and navigate
      await AsyncStorage.removeItem('token');
      router.replace('/LoginScreen');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>Fleet Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bus Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🚌</Text>
            </View>
            <Text style={styles.cardTitle}>Assigned Vehicle</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bus Number:</Text>
              <Text style={styles.infoValue}>{assignedBus ? assignedBus.busNumber : 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration:</Text>
              <Text style={styles.infoValue}>{assignedBus ? assignedBus.regNo : 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Route:</Text>
              <Text style={styles.infoValue}>{assignedRoute ? assignedRoute.name : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* GPS Tracking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: isGpsTrackingEnabled ? '#28a745' : '#6c757d' }]}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>Live Tracking</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>GPS Location Tracking</Text>
                <Text style={styles.toggleDescription}>
                  {isGpsTrackingEnabled ? 'Your location is being tracked' : 'Location tracking is disabled'}
                </Text>
              </View>
              <Switch
                onValueChange={setIsGpsTrackingEnabled}
                value={isGpsTrackingEnabled}
                trackColor={{ false: '#767577', true: '#28a745' }}
                thumbColor={isGpsTrackingEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            {isGpsTrackingEnabled && (
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alerts Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: driverAlerts.length > 0 ? '#dc3545' : '#28a745' }]}>
              <Text style={styles.cardIcon}>🚨</Text>
            </View>
            <Text style={styles.cardTitle}>Active Alerts</Text>
          </View>
          <View style={styles.cardContent}>
            {driverAlerts.length > 0 ? (
              <View style={styles.alertsList}>
                {driverAlerts.map((alert, index) => (
                  <View key={alert._id || index} style={styles.alertItem}>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertText}>{alert.message}</Text>
                      <Text style={styles.alertTimestamp}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    {alert.alertType === 'caution' && (
                      <View style={styles.cautionBadge}>
                        <Text style={styles.cautionText}>⚠️ CAUTION</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAlertsContainer}>
                <Text style={styles.noAlertsIcon}>✅</Text>
                <Text style={styles.noAlertsText}>No active alerts</Text>
                <Text style={styles.noAlertsSubtext}>All systems operating normally</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  scrollView: {
    width: '100%',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  
  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardContent: {
    paddingHorizontal: 5,
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  
  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 15,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  
  // Status Indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  statusText: {
    color: '#28a745',
    fontWeight: '600',
  },
  
  // Alerts
  alertsList: {
    width: '100%',
  },
  alertItem: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertContent: {
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  
  // Caution Badge
  cautionBadge: {
    backgroundColor: '#fff3e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  cautionText: {
    color: '#e65100',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // No Alerts
  noAlertsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAlertsIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  noAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default DriverDashboard;
