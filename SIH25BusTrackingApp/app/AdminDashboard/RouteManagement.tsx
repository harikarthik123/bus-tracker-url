import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, Alert, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOnline } from '../utils/useOnline';
import { useAdminI18n } from '../utils/i18n';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList as GestureFlatList } from 'react-native-gesture-handler';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

import { API_URLS } from '../../config/api';
const API_URL = API_URLS.ADMIN;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface StopType {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

interface CoordinateType {
  latitude: number;
  longitude: number;
}

interface RouteType {
  _id: string;
  name: string;
  stops: StopType[];
  duration: string;
  routeCoordinates: CoordinateType[];
}

const RouteManagement = () => {
  const router = useRouter();
  const { t } = useAdminI18n();
  const online = useOnline();
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [stops, setStops] = useState<StopType[]>([]);
  const [newStopName, setNewStopName] = useState('');
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716, // Default to Bangalore
    longitude: 77.5946,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<CoordinateType[]>([]); // For Polyline
  const [mapMode, setMapMode] = useState<'route' | 'stop' | null>(null); // 'route' or 'stop'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [activeCard, setActiveCard] = useState<'add' | 'view' | 'upload' | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/routes`, {
        headers: { 'x-auth-token': token },
      });
      setRoutes(response.data);

    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes.');
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    if (mapMode === 'route') {
      setRouteCoordinates(prev => [...prev, { latitude, longitude }]);
    } else if (mapMode === 'stop') {
      setStops(prev => [...prev, { name: `Stop ${prev.length + 1}`, latitude, longitude, order: prev.length + 1 }]);
    }
  };

  const handleAddStop = () => {
    if (!newStopName || routeCoordinates.length === 0) {
      Alert.alert('Error', 'Please set a stop name and define route points on the map.');
      return;
    }
    // For simplicity, let's add a stop at the last clicked route coordinate for now, or the center of the map if no route points.
    const lastRouteCoordinate = routeCoordinates[routeCoordinates.length - 1];
    const stopLocation = lastRouteCoordinate || { latitude: mapRegion.latitude, longitude: mapRegion.longitude };

    const newStop = {
      name: newStopName,
      latitude: stopLocation.latitude,
      longitude: stopLocation.longitude,
      order: stops.length + 1,
    };
    setStops(prev => [...prev, newStop]);
    setNewStopName('');
  };

  const handleRemoveStop = (order: number) => {
    setStops(stops.filter((stop) => stop.order !== order));
  };

  const handleAddRoute = async () => {
    if (!name || !duration || routeCoordinates.length < 2 || stops.length === 0) {
      Alert.alert('Error', 'Please fill in route name, duration, define at least two route points, and add at least one stop.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${API_URL}/routes`, { name, duration, routeCoordinates, stops }, { headers: { 'x-auth-token': token } });
      setRoutes(prev => [...prev, response.data.route]);
      setName('');
      setDuration('');
      setStops([]);
      setRouteCoordinates([]);
      setMapMode(null);
      Alert.alert('Success', 'Route created successfully!');
    } catch (error) {
      console.error('Error creating route:', error);
      Alert.alert('Error', 'Failed to create route.');
    }
  };

  const handleEditRoute = (route: any) => {
    setEditingRouteId(route._id);
    setName(route.name);
    setDuration(route.duration);
    setStops(route.stops);
    setRouteCoordinates(route.routeCoordinates || []); // Load existing route coordinates
    if (route.routeCoordinates && route.routeCoordinates.length > 0) {
      setMapRegion({
        latitude: route.routeCoordinates[0].latitude,
        longitude: route.routeCoordinates[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  const handleUpdateRoute = async () => {
    if (!name || !duration || routeCoordinates.length < 2 || stops.length === 0 || !editingRouteId) {
      Alert.alert('Error', 'Please fill in route name, duration, define at least two route points, add at least one stop, and select a route to update.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/routes/${editingRouteId}`,
        { name, duration, routeCoordinates, stops },
        { headers: { 'x-auth-token': token } }
      );
      setRoutes(prev => prev.map(r => (r._id === editingRouteId ? response.data.route : r)));
      setName('');
      setDuration('');
      setStops([]);
      setRouteCoordinates([]);
      setEditingRouteId(null);
      setMapMode(null);
      Alert.alert('Success', 'Route updated successfully!');
    } catch (error) {
      console.error('Error updating route:', error);
      Alert.alert('Error', 'Failed to update route.');
    }
  };

  const handleDeleteRoute = async (id: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/routes/${id}`, { headers: { 'x-auth-token': token } });
              setRoutes(prev => prev.filter(r => r._id !== id));
            } catch (err) {
              console.error('Error deleting route:', err);
              Alert.alert('Error', 'Failed to delete route.');
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
      form.append('file', { uri: file.uri, name: file.name || 'routes.csv', type: 'text/csv' });
      await axios.post(`${API_URL}/routes/bulk`, form, { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Routes uploaded.');
      fetchRoutes();
    } catch (e) {
      console.error('Upload routes CSV error', e);
      Alert.alert('Error', 'Upload failed. Ensure required columns are present.');
    }
  };

  const handleUploadShape = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({ type: ['application/geo+json', 'application/json', 'application/gpx+xml', 'application/xml', 'text/xml'] as any });
      if (pick.canceled || !pick.assets?.[0]) return;
      if (!name) {
        Alert.alert('Route Name Required', 'Enter/select a route name before uploading shape.');
        return;
      }
      const file = pick.assets[0];
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      // @ts-ignore
      form.append('file', { uri: file.uri, name: file.name || 'route-shape', type: file.mimeType || 'application/octet-stream' });
      form.append('route_name', name);
      await axios.post(`${API_URL}/routes/shape`, form, { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Route shape uploaded.');
      fetchRoutes();
    } catch (e) {
      console.error('Upload route shape error', e);
      Alert.alert('Error', 'Upload failed. Provide valid GeoJSON (LineString/MultiLineString) or GPX.');
    }
  };

  const toggleRouteExpansion = (routeId: string) => {
    setExpandedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const renderRouteItem = ({ item }: { item: any }) => {
    const isExpanded = expandedRoutes.has(item._id);
    
    return (
      <View style={styles.routeItem}>
        <View style={styles.routeContent}>
          <TouchableOpacity 
            style={styles.routeHeader} 
            onPress={() => toggleRouteExpansion(item._id)}
            activeOpacity={0.7}
          >
            <View style={styles.routeHeaderLeft}>
              <Text style={styles.routeName}>{item.name}</Text>
              <Text style={styles.routeDetails}>Duration: {item.duration}</Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.routeDetailsContainer}>
              <Text style={styles.routeDetails}>Stops ({item.stops?.length || 0}):</Text>
              {item.stops?.slice(0, 5).map((stop: any, index: number) => (
                <Text key={index} style={styles.stopText}>  {stop.order}. {stop.name} (Lat: {stop.latitude.toFixed(4)}, Lng: {stop.longitude.toFixed(4)})</Text>
              ))}
              {item.stops?.length > 5 && (
                <Text style={styles.moreText}>... and {item.stops.length - 5} more stops</Text>
              )}
              
              <Text style={styles.routeDetails}>Route Points ({item.routeCoordinates?.length || 0}):</Text>
              {item.routeCoordinates?.slice(0, 3).map((coord: any, index: number) => (
                <Text key={`coord-${index}`} style={styles.stopText}>  {index + 1}. Lat: {coord.latitude.toFixed(4)}, Lng: {coord.longitude.toFixed(4)}</Text>
              ))}
              {item.routeCoordinates?.length > 3 && (
                <Text style={styles.moreText}>... and {item.routeCoordinates.length - 3} more points</Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.routeActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEditRoute(item)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRoute(item._id)}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('screen.route.title')}</Text>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Cards grid */}
        <View style={styles.cardRow}>
          <TouchableOpacity style={[styles.cardItem, styles.cardAdd, activeCard === 'add' && styles.cardItemActive]} onPress={() => setActiveCard('add')}>
            <MaterialIcons name="add-road" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>Add Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardItem, styles.cardView, activeCard === 'view' && styles.cardItemActive]} onPress={() => setActiveCard('view')}>
            <MaterialIcons name="map" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>View Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cardItem, styles.cardUpload, activeCard === 'upload' && styles.cardItemActive]} onPress={() => setActiveCard('upload')}>
            <MaterialIcons name="file-upload" size={28} color="#ffffff" />
            <Text style={[styles.cardLabel, { color: '#ffffff' }]}>Upload File</Text>
          </TouchableOpacity>
        </View>

        {(activeCard === 'add' || editingRouteId) && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Route Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Duration (e.g., 30 minutes)"
            value={duration}
            onChangeText={setDuration}
          />

          <Text style={styles.subTitle}>Define Route on Map</Text>
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={[styles.mapModeButton, mapMode === 'route' && styles.activeMapMode]}
              onPress={() => setMapMode('route')}
            >
              <Text style={mapMode === 'route' ? styles.activeMapModeText : styles.mapModeText}>Draw Route</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapModeButton, mapMode === 'stop' && styles.activeMapMode]}
              onPress={() => setMapMode('stop')}
            >
              <Text style={mapMode === 'stop' ? styles.activeMapModeText : styles.mapModeText}>Add Stops</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.clearMapButton}
              onPress={() => { setRouteCoordinates([]); setStops([]); setMapMode(null); setNewStopName(''); }}
            >
              <Text style={styles.buttonText}>Clear Map</Text>
            </TouchableOpacity>
          </View>

          {mapMode === 'stop' && (
            <TextInput
              style={styles.input}
              placeholder="New Stop Name (click on map to place)"
              value={newStopName}
              onChangeText={setNewStopName}
            />
          )}

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={handleMapPress}
            showsUserLocation
          >
            {routeCoordinates.length > 0 && (
              <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="red" />
            )}
            {stops.map((stop: any, index: number) => (
              <Marker
                key={`stop-${index}`}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={stop.name}
                pinColor="blue"
              />
            ))}
          </MapView>

          <Text style={styles.subTitle}>Current Route Points</Text>
          {routeCoordinates.map((coord, index) => (
            <Text key={`coord-display-${index}`} style={styles.stopText}>
              {index + 1}. Lat: {coord.latitude.toFixed(4)}, Lng: {coord.longitude.toFixed(4)}
            </Text>
          ))}

          <Text style={styles.subTitle}>Current Stops</Text>
          <View style={styles.stopsListContainer}>
            {stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <Text style={styles.stopText}>{stop.order}. {stop.name} (Lat: {stop.latitude.toFixed(4)}, Lng: {stop.longitude.toFixed(4)})</Text>
                <TouchableOpacity onPress={() => handleRemoveStop(stop.order)}>
                  <Text style={styles.removeStopText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, editingRouteId ? styles.updateButton : styles.createButton]}
            onPress={editingRouteId ? handleUpdateRoute : handleAddRoute}
          >
            <Text style={styles.buttonText}>
              {editingRouteId ? 'Update Route' : 'Add Route'}
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {activeCard === 'upload' && (
        <>
        <View style={styles.uploadBox}>
          <Text style={styles.uploadTitle}>File Upload (CSV/XLSX)</Text>
          <Text style={styles.uploadHint}>Required per row: name, stopName, latitude, longitude, order. Optional: duration</Text>
          <TouchableOpacity style={[styles.actionButton, styles.createButton, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={handleUploadCsv}>
            <MaterialIcons name="file-upload" size={18} color="#1F2937" />
            <Text style={styles.buttonText}>Upload CSV</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.uploadBox}>
          <Text style={styles.uploadTitle}>Route Shape Upload (GeoJSON/GPX)</Text>
          <Text style={styles.uploadHint}>File field name: file. Max size: 10 MB. Uses current Route Name.</Text>
          <TouchableOpacity style={[styles.actionButton, styles.createButton, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={handleUploadShape}>
            <MaterialIcons name="polyline" size={18} color="#1F2937" />
            <Text style={styles.buttonText}>Upload Shape</Text>
          </TouchableOpacity>
        </View>
        </>
        )}

        {activeCard === 'view' && (
        <>
        <Text style={styles.listTitle}>Existing Routes</Text>
        <TextInput
          style={styles.input}
          placeholder="Search routes by name"
          value={searchQuery}
          onChangeText={(v) => { setSearchQuery(v); if (v) setShowAll(false); }}
          autoCapitalize="none"
        />
        {(!searchQuery && !showAll) ? (
          <View style={{ width: '100%', marginBottom: 10 }}>
            <TouchableOpacity style={[styles.actionButton, styles.updateButton]} onPress={() => setShowAll(true)}>
              <Text style={styles.buttonText}>View All</Text>
            </TouchableOpacity>
            <Text style={{ color: '#6b7280', marginTop: 8, textAlign: 'center' }}>Search routes or tap View All.</Text>
          </View>
        ) : null}
        <FlatList
          data={(searchQuery ? routes.filter(r => (r.name||'').toLowerCase().includes(searchQuery.toLowerCase())) : (showAll ? routes : []))}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item._id.toString()}
          ListEmptyComponent={<Text>No routes added yet.</Text>}
          style={styles.routeList}
        />
        </>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
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
    backgroundColor: '#000000',
    marginHorizontal: 4,
    elevation: 2,
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20 },
  cardItem: { borderRadius: 12, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', elevation: 2, margin: 8, minWidth: 110, maxWidth: 160, flexGrow: 0 },
  cardItemActive: { borderColor: '#F59E0B', borderWidth: 2 },
  cardLabel: { marginTop: 8, fontWeight: '800' },
  cardAdd: { backgroundColor: '#10b981', paddingHorizontal: 14 },
  cardView: { backgroundColor: '#3b82f6', paddingHorizontal: 14 },
  cardUpload: { backgroundColor: '#f59e0b', paddingHorizontal: 14 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
    width: '100%',
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
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    width: '100%',
  },
  mapModeButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  activeMapMode: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  mapModeText: { color: '#1F2937', fontWeight: '700' },
  activeMapModeText: { color: '#1F2937', fontWeight: '800' },
  clearMapButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
  },
  stopInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  addStopButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  stopsListContainer: {
    width: '100%',
    marginBottom: 20,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stopText: {
    fontSize: 14,
    color: '#555',
  },
  removeStopText: {
    color: '#dc3545',
    fontWeight: 'bold',
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
  routeList: {
    width: '100%',
  },
  routeItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'column',
  },
  routeContent: {
    flex: 1,
    marginBottom: 10,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  routeHeaderLeft: {
    flex: 1,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  routeDetailsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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

export default RouteManagement;
