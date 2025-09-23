import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location'; // Import the Location module
import { useRouter } from 'expo-router';

// Backend URLs
const API_URL = 'https://bus-tracker-rjir.onrender.com/api/passenger';
const LOCATION_API_URL = 'https://bus-tracker-rjir.onrender.com/api/location';

const PassengerDashboard = () => {
  const [search, setSearch] = useState('');
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [busLocations, setBusLocations] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null); // Corrected type definition
  const router = useRouter();
  const [selectedBusStatus, setSelectedBusStatus] = useState<string>('active'); // 'active', 'lastKnown', 'alert', 'all'
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data fetching
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/LoginScreen');
          return;
        }

        // Fetch Routes
        const routesResponse = await axios.get(`${API_URL}/all-routes`, {
          headers: { 'x-auth-token': token },
        });
        setRoutes(routesResponse.data);
        setFilteredRoutes(routesResponse.data);

        // Fetch Alerts
        const alertsResponse = await axios.get(`${API_URL}/alerts`, {
          headers: { 'x-auth-token': token },
        });
        setAlerts(alertsResponse.data);

         // Fetch Bus Locations
         const busLocationsResponse = await axios.get(`${LOCATION_API_URL}/live`, {
          headers: { 'x-auth-token': token },
        });
        setBusLocations(busLocationsResponse.data);

        getUserLocation();

      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        Alert.alert('Error', 'Failed to fetch data. Please check your connection.');
      }
    };

    fetchAllData();
  }, []);

  // Search routes
  useEffect(() => {
    if (search) {
      const filtered = routes.filter(
        (route: any) =>
          route.name.toLowerCase().includes(search.toLowerCase()) ||
          (route.startPoint && route.startPoint.toLowerCase().includes(search.toLowerCase())) ||
          (route.endPoint && route.endPoint.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(routes);
    }
  }, [search, routes]);

  // IVR Call Integration (placeholder) - Backend call removed
  const handleIVRCall = async () => {
    Alert.alert('IVR Call', 'This feature is currently disabled.');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/LoginScreen');
  };

  const onRouteSelect = (route: any) => {
    setSelectedRoute(route);
    setSearch(''); // Clear search bar
    setFilteredRoutes(routes); // Reset list
    navigateToRoute(route);
  };

  const navigateToRoute = (route: any) => {
    if (!mapRef.current || !route?.routeCoordinates || route.routeCoordinates.length === 0) {
        // Fallback to start/end points if routeCoordinates are not available
        if (mapRef.current && route.startPointLat && route.startPointLng && route.endPointLat && route.endPointLng) {
            const coordinates = [
                { latitude: route.startPointLat, longitude: route.startPointLng },
                { latitude: route.endPointLat, longitude: route.endPointLng },
            ];
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
        return;
    }

    const coordinates = route.routeCoordinates.map((coord: any) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
    });
};

const getRoutePolyline = (route: any) => {
    if (!route?.routeCoordinates) return [];
    return route.routeCoordinates.map((coord: any) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
    }));
};

const getFilteredBusLocations = () => {
    let filteredLocations = busLocations;

    if (selectedBusStatus === 'active') {
      filteredLocations = filteredLocations.filter(loc => loc.isActive === undefined ? true : loc.isActive === true);
    } else if (selectedBusStatus === 'lastKnown') {
      filteredLocations = filteredLocations.filter(loc => loc.isActive === false);
    } else if (selectedBusStatus === 'alert') {
      filteredLocations = filteredLocations.filter(loc => alerts.some(a => a.busId === loc.busId?._id));
    }

    return filteredLocations.filter(loc => !selectedRoute || (selectedRoute && loc.busId?.route?._id === selectedRoute._id));
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

  const handleMapRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch Bus Locations
      const token = await AsyncStorage.getItem('token');
      const busLocationsResponse = await axios.get(`${LOCATION_API_URL}/live`, {
        headers: { 'x-auth-token': token },
      });
      setBusLocations(busLocationsResponse.data);
      getUserLocation();
    } catch (error: any) {
      console.error('Error refreshing map data:', error.message);
      Alert.alert('Error', 'Failed to refresh map data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Passenger Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
      {/* Search Bar */}
      <View style={styles.card}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buses or routes..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <FlatList
            data={filteredRoutes}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onRouteSelect(item)}>
                <Text style={styles.dropdownItem}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
          />
        )}
      </View>

      {/* Bus Status Filters */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filter Bus Locations</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedBusStatus === 'active' && styles.selectedFilter,
            ]}
            onPress={() => setSelectedBusStatus('active')}
          >
            <Text style={[styles.filterText, selectedBusStatus === 'active' && styles.selectedFilterText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedBusStatus === 'lastKnown' && styles.selectedFilter,
            ]}
            onPress={() => setSelectedBusStatus('lastKnown')}
          >
            <Text style={[styles.filterText, selectedBusStatus === 'lastKnown' && styles.selectedFilterText]}>Last Known</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedBusStatus === 'alert' && styles.selectedFilter,
            ]}
            onPress={() => setSelectedBusStatus('alert')}
          >
            <Text style={[styles.filterText, selectedBusStatus === 'alert' && styles.selectedFilterText]}>Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedBusStatus === 'all' && styles.selectedFilter,
            ]}
            onPress={() => setSelectedBusStatus('all')}
          >
            <Text style={[styles.filterText, selectedBusStatus === 'all' && styles.selectedFilterText]}>All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Bus Locations</Text>
        <TouchableOpacity 
          style={styles.mapRefreshButton} 
          onPress={handleMapRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.mapRefreshButtonText}>{isRefreshing ? '⟳' : '↻'}</Text>
        </TouchableOpacity>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={getInitialRegion()}
          region={getInitialRegion()}
          showsUserLocation
        >
          {getFilteredBusLocations().map((bus) => {
            const isActive = bus.isActive === undefined ? true : bus.isActive === true;
            const hasAlert = alerts.some(a => a.busId === bus.busId?._id);

            let pinColor = '#007bff'; // Default active color
            if (!isActive) {
              pinColor = '#6c757d'; // Inactive/last known location
            } else if (hasAlert) {
              pinColor = '#dc3545'; // Alert color (only for active buses)
            }
            
            return (
              <Marker
                key={bus._id}
                coordinate={{ latitude: bus.lat, longitude: bus.lng }}
                title={bus.busId?.busNumber || 'Unknown Bus'}
                description={`Speed: ${bus.speed?.toFixed(1) || 'N/A'} km/h`}
                onPress={() => setSelectedBus(bus)}
              >
                  <View style={[styles.busMarker, { backgroundColor: pinColor }]}>
                      <Text style={styles.busIcon}>🚌</Text>
                  </View>
              </Marker>
            );
          })}
          {selectedRoute && (
            <>
              {/* Route Polyline */}
              <Polyline
                coordinates={getRoutePolyline(selectedRoute)}
                strokeColor="#007bff"
                strokeWidth={4}
              />
              {/* Start and End Markers */}
              {selectedRoute.startPointLat && (
                <Marker
                  coordinate={{ latitude: selectedRoute.startPointLat, longitude: selectedRoute.startPointLng }}
                  title={selectedRoute.name}
                  description={`Start: ${selectedRoute.startPoint}`}
                  pinColor="green"
                />
              )}
              {selectedRoute.endPointLat && (
                <Marker
                  coordinate={{ latitude: selectedRoute.endPointLat, longitude: selectedRoute.endPointLng }}
                  title={selectedRoute.name}
                  description={`End: ${selectedRoute.endPoint}`}
                  pinColor="red"
                />
              )}
            </>
          )}
        </MapView>
        {selectedBus && (
          <View style={styles.etaBox}>
            <Text style={styles.etaText}>
              Bus {selectedBus.busNumber} ETA: {selectedBus.eta || 'N/A'} min
            </Text>
            <TouchableOpacity style={styles.ivrButton} onPress={handleIVRCall}>
              <Text style={styles.ivrButtonText}>Call IVR for ETA</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Alerts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alerts</Text>
        {alerts.length > 0 ? (
          <FlatList
            data={alerts}
            renderItem={({ item }) => (
              <View style={styles.alertItem}>
                <Text style={styles.alertText}>{item.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item._id}
          />
        ) : (
          <Text style={styles.noAlerts}>No active alerts</Text>
        )}
      </View>

      {/* Routes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Routes</Text>
        {filteredRoutes.length > 0 ? (
          <FlatList
            data={filteredRoutes}
            renderItem={({ item }) => (
              <View style={styles.routeItem}>
                <Text style={styles.routeName}>{item.name}</Text>
                <Text style={styles.routeInfo}>
                  {item.startPoint} to {item.endPoint}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item._id}
          />
        ) : (
          <Text style={styles.noAlerts}>No routes available</Text>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa', padding: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2c3e50' },
  label: { fontSize: 15, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
  },
  prefixPicker: { marginLeft: 10 },
  prefixText: { fontSize: 15, padding: 6, color: '#007bff' },
  selectedPrefix: { fontWeight: 'bold', color: '#28a745' },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
  },
  dropdownItem: {
    padding: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  map: { width: '100%', height: 300, borderRadius: 10 },
  etaBox: {
    marginTop: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  etaText: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },
  ivrButton: {
    backgroundColor: '#ffc107',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  ivrButtonText: { color: '#2c3e50', fontWeight: 'bold' },
  busMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 16,
  },
  alertItem: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  alertText: { fontSize: 14, color: '#2c3e50' },
  alertTime: { fontSize: 12, color: '#666' },
  noAlerts: { color: '#888', textAlign: 'center', marginTop: 10 },
  routeItem: {
    backgroundColor: '#e9f7ef',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  routeInfo: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedFilter: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterText: {
    color: '#fff',
  },
  mapRefreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 6,
    zIndex: 1,
  },
  mapRefreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PassengerDashboard;
