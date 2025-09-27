import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAdminI18n } from '../utils/i18n';

import { API_URLS } from '../../config/api';
const ADMIN_API_URL = API_URLS.ADMIN;
const LOCATION_API_URL = API_URLS.LOCATION;

  const { width, height } = Dimensions.get('window');
  const spacing = Math.max(10, Math.min(18, Math.round(width * 0.04)));

type LiveMonitoringProps = {
  showHeader?: boolean;
};

const LiveMonitoring = ({ showHeader = true }: LiveMonitoringProps) => {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null); // Default to null (All Routes)
  const [isOnline, setIsOnline] = useState(true);
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const [busETAs, setBusETAs] = useState<{ [key: string]: string }>({});
  const [userLocation, setUserLocation] = useState<any>(null);
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlerts = async (initial: boolean = true) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${ADMIN_API_URL}/alerts`, { headers: { 'x-auth-token': token } });
      setAlerts(res.data);
    } catch (e) {
      if (initial) console.error('Fetch alerts failed', e);
    }
  };

  const fetchBuses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${ADMIN_API_URL}/buses`, { headers: { 'x-auth-token': token } });
      setBuses(res.data);
    } catch (e) {
      console.error('Fetch buses failed', e);
      setIsOnline(false);
      Alert.alert('Network', 'Unable to fetch buses.');
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${ADMIN_API_URL}/routes`, { headers: { 'x-auth-token': token } });
      setRoutes(res.data);
    } catch (e) {
      console.error('Fetch routes failed', e);
      setIsOnline(false);
    }
  };

  const fetchBusLocations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${LOCATION_API_URL}/live`, { headers: { 'x-auth-token': token } });
      console.log('Fetched Bus Locations:', res.data); // Debugging log
      console.log('Total locations received:', res.data.length);
      
      const validLocations = res.data.filter((loc: any) => loc.busId && loc.busId._id);
      console.log('Locations with valid busId:', validLocations.length);
      
      // Log detailed info about each location
      validLocations.forEach((loc: any, index: number) => {
        console.log(`Location ${index + 1}:`, {
          busId: loc.busId._id,
          busNumber: loc.busId.busNumber,
          isActive: loc.isActive,
          lastActive: loc.lastActive,
          lat: loc.lat,
          lng: loc.lng,
          speed: loc.speed
        });
      });
      
      setBusLocations(validLocations);
    } catch (e: any) {
      console.error('Fetch locations failed', e);
      console.error('Error details:', e.response?.data);
      setIsOnline(false);
    }
  };

  const fetchETAs = async () => {
    const newETAs: { [key: string]: string } = {};
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    for (const loc of busLocations) {
      if (!loc.busId || !loc.busId._id) {
        console.warn('Skipping ETA fetch for location with missing busId:', loc); // Debugging log
        continue;
      }
      try {
        const res = await axios.get(`${LOCATION_API_URL}/eta/${loc.busId._id}`, {
          headers: { 'x-auth-token': token },
        });
        newETAs[loc.busId._id] = res.data.eta ? `${Math.round(res.data.eta)} min` : 'N/A';
      } catch (err) {
        console.error(`Error fetching ETA for bus ${loc.busId._id}:`, err);
        newETAs[loc.busId._id] = 'Error';
      }
    }
    setBusETAs(newETAs);
  };

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
    fetchAlerts();
    fetchBusLocations(); // Initial fetch
    getUserLocation(); // Get admin's current location

    const interval = setInterval(() => {
      if (isOnline) {
        fetchBusLocations();
        fetchAlerts(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    if (busLocations.length > 0) {
      fetchETAs();
    }
    const etaInterval = setInterval(() => {
      if (isOnline && busLocations.length > 0) {
        fetchETAs();
      }
    }, 10000); // Fetch ETA every 10 seconds
    return () => clearInterval(etaInterval);
  }, [busLocations, isOnline]);

  const getRoutePolyline = (route: any) => {
    if (!route?.routeCoordinates) return [] as any[];
    return route.routeCoordinates.map((coord: any) => ({ latitude: coord.latitude, longitude: coord.longitude }));
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      console.log('User location:', location.coords);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const navigateToRoute = (route: any) => {
    if (!mapRef || !route?.routeCoordinates || route.routeCoordinates.length === 0) return;
    
    // Calculate bounds for the route
    const coordinates = route.routeCoordinates;
    const latitudes = coordinates.map((coord: any) => coord.latitude);
    const longitudes = coordinates.map((coord: any) => coord.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latitudeDelta = (maxLat - minLat) * 1.2; // Add some padding
    const longitudeDelta = (maxLng - minLng) * 1.2;
    
    // Animate to the route
    mapRef.animateToRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latitudeDelta, 0.01), // Minimum zoom level
      longitudeDelta: Math.max(longitudeDelta, 0.01),
    }, 1000);
  };

  const getInitialRegion = () => {
    if (userLocation) {
      return { 
        latitude: userLocation.latitude, 
        longitude: userLocation.longitude, 
        latitudeDelta: 0.0922, 
        longitudeDelta: 0.0421 
      };
    }
    
    // If no user location, try to fit all routes
    if (routes.length > 0) {
      const allCoordinates: any[] = [];
      routes.forEach(route => {
        if (route.routeCoordinates) {
          allCoordinates.push(...route.routeCoordinates);
        }
      });
      
      if (allCoordinates.length > 0) {
        const latitudes = allCoordinates.map(coord => coord.latitude);
        const longitudes = allCoordinates.map(coord => coord.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
        const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.01);
        
        return { latitude: centerLat, longitude: centerLng, latitudeDelta, longitudeDelta };
      }
    }
    
    // Default to Bangalore
    return { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchBuses(),
        fetchRoutes(),
        fetchAlerts(),
        fetchBusLocations(),
        getUserLocation()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard • Live Monitoring</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]} 
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Text style={styles.refreshButtonText}>{isRefreshing ? '⟳' : '↻'}</Text>
            </TouchableOpacity>
            <View style={[styles.status, { backgroundColor: isOnline ? '#28a745' : '#dc3545' }]}>
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.filters, { padding: spacing }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing/2 }}>
          <TouchableOpacity 
            style={[styles.filterBtn, { marginRight: spacing/2 }, !selectedRoute && styles.activeFilter]} 
            onPress={() => setSelectedRoute(null)}
          >
            <Text style={[styles.filterText, !selectedRoute && styles.activeFilterText]}>{t('common.allRoutes')}</Text>
          </TouchableOpacity>
          {routes.map(r => (
            <TouchableOpacity 
              key={r._id} 
              style={[styles.filterBtn, { marginRight: spacing/2 }, selectedRoute?._id === r._id && styles.activeFilter]} 
              onPress={() => {
                setSelectedRoute(r);
                navigateToRoute(r);
              }}
            >
              <Text style={[styles.filterText, selectedRoute?._id === r._id && styles.activeFilterText]}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.debugText}>
          Debug: {busLocations.length} buses total ({busLocations.filter(loc => loc.isActive === undefined ? true : loc.isActive === true).length} active, {busLocations.filter(loc => loc.isActive === false).length} last known) | User: {userLocation ? 'Located' : 'Not located'}
        </Text>
        {/* Routes legend removed as requested */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>Bus Status Legend:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#fff', backgroundColor: '#0d6efd' }}>
                <Text style={{ fontSize: 14 }}>🚌</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>Active</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#fff', backgroundColor: '#6c757d' }}>
                <Text style={{ fontSize: 14 }}>🚌</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>Last Known</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#fff', backgroundColor: '#dc3545' }}>
                <Text style={{ fontSize: 14 }}>🚌</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>Alert</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={(ref) => setMapRef(ref)}
          style={styles.map}
          initialRegion={getInitialRegion()}
          region={getInitialRegion()}
          showsUserLocation
        >
          {/* Render live bus locations */}
          {busLocations
            .filter(loc => loc.busId && loc.busId._id && (!selectedRoute || (selectedRoute && loc.busId.route?._id === selectedRoute._id)))
            .map(loc => {
              // Handle isActive field properly - check for undefined, null, or false
              const isActive = loc.isActive === undefined ? true : loc.isActive === true;
              const hasAlert = alerts.some(a => a.busId === loc.busId?._id);
              
              console.log(`Rendering marker for bus ${loc.busId?.busNumber}:`, {
                isActive: loc.isActive,
                processedIsActive: isActive,
                hasAlert
              });
              
              let pinColor = '#007bff'; // Default active color
              if (!isActive) {
                pinColor = '#6c757d'; // Inactive/last known location
              } else if (hasAlert) {
                pinColor = '#dc3545'; // Alert color (only for active buses)
              }
              
              const statusText = isActive ? 'Active' : 'Last Known';
              const lastActiveTime = loc.lastActive ? new Date(loc.lastActive).toLocaleTimeString() : 'Unknown';
              
              return (
                <Marker
                  key={loc._id}
                  coordinate={{ latitude: loc.lat || 0, longitude: loc.lng || 0 }}
                  title={`Bus ${loc.busId?.busNumber}${loc.busId?.regNo ? ` (${loc.busId.regNo})` : ''} - ${statusText}`}
                  description={
                    isActive 
                      ? `Speed: ${loc.speed !== undefined ? loc.speed.toFixed(1) : 'N/A'} km/h | ETA: ${busETAs[loc.busId._id] || '...'}`
                      : `Last seen: ${lastActiveTime}`
                  }
                >
                  <View style={[
                    styles.busMarker,
                    { 
                      backgroundColor: pinColor
                    }
                  ]}>
                    <Text style={styles.busIcon}>🚌</Text>
                    {hasAlert && isActive && (
                      <View style={styles.alertIndicator}>
                        <Text style={styles.alertIcon}>⚠️</Text>
                      </View>
                    )}
                  </View>
                </Marker>
              );
            })}

          {/* Render route polylines */}
          {selectedRoute ? (
            // Show only selected route
            selectedRoute.routeCoordinates && (
              <Polyline coordinates={getRoutePolyline(selectedRoute)} strokeColor="#007bff" strokeWidth={3} />
            )
          ) : (
            // Show all routes when "All Routes" is selected
            routes.map((route, index) => 
              route.routeCoordinates && (
                <Polyline 
                  key={route._id} 
                  coordinates={getRoutePolyline(route)} 
                  strokeColor={`hsl(${(index * 137.5) % 360}, 70%, 50%)`} 
                  strokeWidth={3} 
                />
              )
            )
          )}

          {/* Render route stops */}
          {selectedRoute ? (
            // Show only selected route stops
            selectedRoute.stops && selectedRoute.stops.map((stop: any, index: number) => (
              <Marker
                key={`stop-${stop._id || index}`}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={stop.name}
                pinColor="green"
              />
            ))
          ) : (
            // Show all stops from all routes when "All Routes" is selected
            routes.map((route, routeIndex) => 
              route.stops && route.stops.map((stop: any, stopIndex: number) => (
                <Marker
                  key={`stop-${route._id}-${stop._id || stopIndex}`}
                  coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                  title={`${stop.name} (${route.name})`}
                  pinColor="green"
                />
              ))
            )
          )}
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  refreshButton: { 
    marginRight: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: '#F59E0B', 
    borderRadius: 6 
  },
  refreshButtonDisabled: { backgroundColor: '#6c757d' },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  filters: { padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 18, marginRight: 10 },
  activeFilter: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  filterText: { color: '#6C757D' },
  activeFilterText: { color: '#FFFFFF' },
  debugText: { fontSize: 12, color: '#666', paddingHorizontal: 12, paddingBottom: 8 },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  busIcon: {
    fontSize: 20,
  },
  alertIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffc107',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  alertIcon: {
    fontSize: 12,
  },
  mapWrap: { flex: 1, margin: 16, borderRadius: 10, overflow: 'hidden', backgroundColor: '#DDD' },
  map: { flex: 1 },
});

export default LiveMonitoring;


