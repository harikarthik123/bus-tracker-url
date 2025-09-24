import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView, Platform, ScrollView, Animated, Easing } from 'react-native';
import FloatingAssistant from '../components/FloatingAssistant';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location'; // Import the Location module
import { useRouter } from 'expo-router';

// Backend URLs
const API_URL = 'http://192.168.137.1:5000/api/passenger';
const LOCATION_API_URL = 'http://192.168.137.1:5000/api/location';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerX = useRef(new Animated.Value(-280)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const alertsY = useRef(0);
  const routesY = useRef(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [busSearch, setBusSearch] = useState('');
  const [showTraffic, setShowTraffic] = useState(false);

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

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(drawerX, {
      toValue: drawerOpen ? 0 : -280,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const goToAlerts = () => {
    closeDrawer();
    setShowAlerts(true);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTo({ y: alertsY.current, animated: true }); });
  };
  const goToRoutes = () => {
    closeDrawer();
    setShowRoutes(true);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTo({ y: routesY.current, animated: true }); });
  };
  const goToNearbyStops = async () => {
    closeDrawer();
    setShowNearby(true);
    await getUserLocation();
  };
  const useMyLocation = async () => {
    closeDrawer();
    await getUserLocation();
  };

  const getStopsInfo = (route: any) => {
    if (!route) return { start: null, end: null, count: 0 };
    const stops = route.stops || [];
    const sorted = [...stops].sort((a, b) => (a.order || 0) - (b.order || 0));
    const start = sorted[0]?.name || route.startPoint || null;
    const end = sorted[sorted.length - 1]?.name || route.endPoint || null;
    return { start, end, count: sorted.length };
  };

  const getNearestStopIndex = (route: any) => {
    if (!route?.stops || route.stops.length === 0) return -1;
    const candidates = getFilteredBusLocations().filter(loc => loc.busId?.route?._id === route._id);
    if (candidates.length === 0) return -1;
    const bus = candidates[0];
    let bestIdx = -1;
    let bestDist = Number.MAX_VALUE;
    route.stops.forEach((s: any, idx: number) => {
      const d = (bus.lat - s.latitude) * (bus.lat - s.latitude) + (bus.lng - s.longitude) * (bus.lng - s.longitude);
      if (d < bestDist) { bestDist = d; bestIdx = idx; }
    });
    return bestIdx;
  };

  const filteredBuses = busSearch
    ? getFilteredBusLocations().filter((b:any) => (b.busId?.busNumber || '').toLowerCase().includes(busSearch.toLowerCase()))
    : [];

  const centerOnBus = (bus:any) => {
    setSelectedBus(bus);
    if (mapRef.current) {
      mapRef.current.animateToRegion({ latitude: bus.lat, longitude: bus.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Hamburger + Logout */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburger} onPress={openDrawer}><Text style={styles.hamburgerText}>☰</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Passenger Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Animated.ScrollView ref={scrollRef as any} style={{ opacity: fadeIn }}>
      {/* Bus Search */}
      <View style={styles.card}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your bus (by bus number)..."
          value={busSearch}
          onChangeText={setBusSearch}
        />
        {busSearch.length > 0 && (
          <FlatList
            data={filteredBuses}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => centerOnBus(item)}>
                <Text style={styles.dropdownItem}>{item.busId?.busNumber || 'Unknown Bus'}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
          />
        )}
      </View>

      {/* Selected Route Details */}
      {selectedRoute && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Route</Text>
          {(() => { const info = getStopsInfo(selectedRoute); return (
            <View>
              <Text style={{ color: '#1f2937', fontWeight: '600' }}>Start: <Text style={{ fontWeight: '800' }}>{info.start || 'N/A'}</Text></Text>
              <Text style={{ color: '#1f2937', fontWeight: '600' }}>End: <Text style={{ fontWeight: '800' }}>{info.end || 'N/A'}</Text></Text>
              <Text style={{ color: '#6b7280' }}>Total stops: {info.count}</Text>
            </View>
          ); })()}
        </View>
      )}

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
      <View style={styles.card} onLayout={(e) => { /* placeholder for potential future use */ }}>
        <Text style={styles.cardTitle}>Live Bus Locations</Text>
        <TouchableOpacity 
          style={styles.mapRefreshButton} 
          onPress={handleMapRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.mapRefreshButtonText}>{isRefreshing ? '⟳' : '↻'}</Text>
        </TouchableOpacity>
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          style={[styles.map, selectedRoute ? styles.mapLarge : styles.mapSmall]}
          initialRegion={getInitialRegion()}
          region={getInitialRegion()}
          showsUserLocation
          showsTraffic={showTraffic}
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

      {/* Alerts (hidden on home until opened from drawer) */}
      {showAlerts && (
      <View style={styles.card} onLayout={(e) => { alertsY.current = e.nativeEvent.layout.y - 8; }}>
        <Text style={styles.cardTitle}>Alerts</Text>
        {alerts.length > 0 ? (
          <FlatList
            data={alerts}
            renderItem={({ item, index }) => (
              <Animated.View style={{
                opacity: fadeIn,
                transform: [{ translateY: Animated.multiply(fadeIn, new Animated.Value(0)) }]
              }}>
                <View style={styles.alertItem}>
                  <Text style={styles.alertText}>{item.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              </Animated.View>
            )}
            keyExtractor={(item) => item._id}
          />
        ) : (
          <Text style={styles.noAlerts}>No active alerts</Text>
        )}
      </View>
      )}

      {/* Routes (hidden on home until opened from drawer) */}
      {showRoutes && (
      <View style={styles.card} onLayout={(e) => { routesY.current = e.nativeEvent.layout.y - 8; }}>
        <Text style={styles.cardTitle}>Routes</Text>
        {routes.length > 0 ? (
          <FlatList
            data={routes}
            renderItem={({ item, index }) => (
              <Animated.View style={{
                opacity: fadeIn,
                transform: [{ translateY: Animated.multiply(fadeIn, new Animated.Value(0)) }]
              }}>
                <TouchableOpacity onPress={() => onRouteSelect(item)}>
                  <View style={styles.routeItem}>
                    <Text style={styles.routeName}>{item.name}</Text>
                    <Text style={styles.routeInfo}>{(item.stops?.[0]?.name || 'Start')} to {(item.stops?.[item.stops?.length-1]?.name || 'End')}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            keyExtractor={(item) => item._id}
          />
        ) : (
          <Text style={styles.noAlerts}>No routes available</Text>
        )}
      </View>
      )}

      {/* Nearby Stops */}
      {showNearby && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nearby Stops</Text>
        {(() => {
          const stops = routes.flatMap((r:any)=> r.stops || []);
          const list = userLocation ? stops
            .map((s:any)=> ({...s, dist: Math.hypot((s.latitude - userLocation.latitude), (s.longitude - userLocation.longitude)) }))
            .sort((a:any,b:any)=> a.dist - b.dist)
            .slice(0, 10) : [];
          return list.length>0 ? (
            <FlatList data={list} keyExtractor={(i:any,idx:number)=> `${i.name}-${idx}`}
              renderItem={({item}) => (
                <TouchableOpacity onPress={() => { if (mapRef.current) mapRef.current.animateToRegion({ latitude: item.latitude, longitude: item.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400); }}>
                  <Text style={styles.dropdownItem}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (<Text style={styles.noAlerts}>Turn on location to see nearby stops</Text>);
        })()}
      </View>
      )}
      </Animated.ScrollView>
      {/* Drawer */}
      {drawerOpen && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDrawer} />
      )}
      <Animated.View pointerEvents={drawerOpen ? 'auto' : 'none'} style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
        <View style={styles.drawerHeaderBar}>
          <Text style={styles.drawerHeaderTitle}>Menu</Text>
          <TouchableOpacity onPress={closeDrawer}><Text style={styles.drawerClose}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.drawerInnerWrap}>
          <TouchableOpacity style={styles.drawerItem} onPress={goToAlerts}>
            <Text style={styles.drawerItemIcon}>📢</Text>
            <Text style={styles.drawerItemText}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={goToRoutes}>
            <Text style={styles.drawerItemIcon}>🗺️</Text>
            <Text style={styles.drawerItemText}>Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={goToNearbyStops}>
            <Text style={styles.drawerItemIcon}>📍</Text>
            <Text style={styles.drawerItemText}>Nearby Stops</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={useMyLocation}>
            <Text style={styles.drawerItemIcon}>🎯</Text>
            <Text style={styles.drawerItemText}>Use My Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={() => setShowTraffic(v => !v)}>
            <Text style={styles.drawerItemIcon}>🛣️</Text>
            <Text style={styles.drawerItemText}>{showTraffic ? 'Hide Traffic' : 'Show Traffic'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stops timeline for selected route */}
      {selectedRoute && (
        <View style={[styles.card, { paddingTop: 10 }]}> 
          <Text style={styles.cardTitle}>Stops Timeline</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.timelineRail} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              {(selectedRoute.stops || []).sort((a:any,b:any)=>(a.order||0)-(b.order||0)).map((s:any, idx:number) => {
                const busIdx = getNearestStopIndex(selectedRoute);
                const isBusHere = idx === busIdx;
                return (
                  <View key={`${s.name}-${idx}`} style={styles.timelineRow}>
                    <View style={[styles.timelineDot, isBusHere && { backgroundColor: '#0d6efd' }]} />
                    <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      {isBusHere && <Text style={{ marginRight: 6 }}>🚌</Text>}
                      <Text style={{ color: '#1f2937' }}>{s.name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
      {/* Floating Assistant for Passenger */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        <FloatingAssistant role="passenger" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBEB', padding: 10 },
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
    backgroundColor: '#F59E0B',
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
  hamburger: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F59E0B', borderRadius: 6 },
  hamburgerText: { color: '#1F2937', fontWeight: '800' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 280, backgroundColor: '#FFFFFF', elevation: 8, zIndex: 1001 },
  drawerHeaderBar: { height: 56, backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  drawerHeaderTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  drawerClose: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  drawerInnerWrap: { padding: 12 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12 },
  drawerItemIcon: { width: 28, textAlign: 'center', marginRight: 10 },
  drawerItemText: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
  timelineRail: { width: 2, backgroundColor: '#e5e7eb', marginLeft: 8 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb', marginLeft: -7 },
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
    backgroundColor: '#F59E0B',
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
