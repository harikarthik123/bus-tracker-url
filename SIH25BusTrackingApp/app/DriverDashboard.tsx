import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Platform, SafeAreaView, StatusBar, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriverI18n } from './utils/i18n';
import { useOnline } from './utils/useOnline';
// Assuming your backend is running on http://bus-tracker-url.onrender.com
const API_URL = 'http://192.168.137.1:5000/api/driver'; 
const DriverDashboard = () => {
  const router = useRouter();
  const { t, lang, setLang } = useDriverI18n();
  const online = useOnline();
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
  const headerOpacity = React.useRef(new Animated.Value(0)).current;
  const contentTranslate = React.useRef(new Animated.Value(24)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#F59E0B", "#FDE68A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.headerRow, { opacity: headerOpacity }] }>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>BusBee</Text>
            <Text style={styles.welcome}>{t('driver.header.title')}</Text>
            <Text style={styles.subtitleHeader}>{t('driver.header.sub')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: online ? '#16a34a' : '#dc2626', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>{online ? 'Online' : 'Offline'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <Animated.ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { transform: [{ translateY: contentTranslate }] }]}>
        {/* Bus Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🚌</Text>
            </View>
            <Text style={styles.cardTitle}>{t('driver.assigned.title')}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('driver.labels.busNumber')}</Text>
              <Text style={styles.infoValue}>{assignedBus ? assignedBus.busNumber : 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('driver.labels.registration')}</Text>
              <Text style={styles.infoValue}>{assignedBus ? assignedBus.regNo : 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('driver.labels.route')}</Text>
              <Text style={styles.infoValue}>{assignedRoute ? assignedRoute.name : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* GPS Tracking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: isGpsTrackingEnabled ? '#16A34A' : '#9CA3AF' }]}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>{t('driver.live.title')}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{t('driver.live.toggle')}</Text>
                <Text style={styles.toggleDescription}>
                  {isGpsTrackingEnabled ? t('driver.live.on') : t('driver.live.off')}
                </Text>
              </View>
              <Switch
                onValueChange={setIsGpsTrackingEnabled}
                value={isGpsTrackingEnabled}
                trackColor={{ false: '#D1D5DB', true: '#F59E0B' }}
                thumbColor={isGpsTrackingEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            {isGpsTrackingEnabled && (
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t('driver.status.active')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Alerts Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: driverAlerts.length > 0 ? '#DC2626' : '#16A34A' }]}>
              <Text style={styles.cardIcon}>🚨</Text>
            </View>
            <Text style={styles.cardTitle}>{t('driver.alerts.title')}</Text>
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
                <Text style={styles.noAlertsText}>{t('driver.alerts.none.title')}</Text>
                <Text style={styles.noAlertsSubtext}>{t('driver.alerts.none.sub')}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  scrollView: {
    width: '100%',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  
  // Header (gradient)
  headerGradient: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  welcome: {
    marginTop: 2,
    fontSize: 16,
    color: '#1F2937',
  },
  subtitleHeader: {
    fontSize: 12,
    color: '#374151',
    opacity: 0.9,
  },
  
  // Logout Button
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2d3d',
  },
  cardContent: {
    paddingHorizontal: 5,
  },
  
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2d3d',
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
    color: '#1f2d3d',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6c757d',
  },
  
  // Status Indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginRight: 8,
  },
  statusText: {
    color: '#B45309',
    fontWeight: '600',
  },
  
  // Alerts
  alertsList: {
    width: '100%',
  },
  alertItem: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  cautionText: {
    color: '#B45309',
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
