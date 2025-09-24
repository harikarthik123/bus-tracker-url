import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.137.1:5000/api/admin';

type Driver = { _id: string; name: string; driverId?: string };
type RouteType = { _id: string; name: string; stops?: Array<any> };
type Bus = { _id: string; busNumber: string; regNo: string; capacity: number; driver?: any; route?: any };
type AlertItem = { _id: string; message: string; createdAt: string; routeId?: string; busId?: string };

export default function Analytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = { 'x-auth-token': token } as any;
        const [b, r, d, a] = await Promise.all([
          axios.get(`${API_URL}/buses`, { headers }),
          axios.get(`${API_URL}/routes`, { headers }),
          axios.get(`${API_URL}/drivers`, { headers }),
          axios.get(`${API_URL}/alerts`, { headers }).catch(() => ({ data: [] })),
        ]);
        setBuses(b.data || []);
        setRoutes(r.data || []);
        setDrivers(d.data || []);
        setAlerts(a.data || []);
      } catch (e) {
        // Swallow for now, show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    const totalBuses = buses.length;
    const totalDrivers = drivers.length;
    const totalRoutes = routes.length;
    const totalAlerts30d = alerts.length; // backend returns all; assume recent in demo

    const assignedBuses = buses.filter(b => !!b.driver).length;
    const routedBuses = buses.filter(b => !!b.route).length;

    const avgCapacity = totalBuses ? Math.round(buses.reduce((s, b) => s + (Number(b.capacity) || 0), 0) / totalBuses) : 0;

    // Top routes by number of stops
    const routesByStops = [...routes]
      .map(r => ({ name: r.name, stops: (r.stops || []).length }))
      .sort((a, b) => b.stops - a.stops)
      .slice(0, 5);

    // Unassigned overview
    const unassignedDrivers = drivers.filter(d => !buses.find(b => (typeof b.driver === 'string' ? b.driver : b.driver?._id) === d._id)).length;
    const unassignedBuses = totalBuses - assignedBuses;

    return { totalBuses, totalDrivers, totalRoutes, totalAlerts30d, assignedBuses, routedBuses, avgCapacity, routesByStops, unassignedDrivers, unassignedBuses };
  }, [buses, drivers, routes, alerts]);

  const KPI = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <View style={[styles.kpiCard, accent ? { borderLeftColor: accent } : null]}>
      <Text style={styles.kpiValue}>{String(value)}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );

  const Bar = ({ value, max, label }: { value: number; max: number; label: string }) => {
    const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
    return (
      <View style={styles.barRow}>
        <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.barValue}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Analytics & Reports</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KPI label="Total Buses" value={kpis.totalBuses} accent="#0dcaf0" />
          <KPI label="Total Drivers" value={kpis.totalDrivers} accent="#198754" />
          <KPI label="Total Routes" value={kpis.totalRoutes} accent="#6f42c1" />
          <KPI label="Alerts (recent)" value={kpis.totalAlerts30d} accent="#dc3545" />
        </View>

        <View style={styles.kpiGrid}>
          <KPI label="Assigned Buses" value={`${kpis.assignedBuses}/${kpis.totalBuses}`} accent="#20c997" />
          <KPI label="On a Route" value={`${kpis.routedBuses}/${kpis.totalBuses}`} accent="#0d6efd" />
          <KPI label="Avg Capacity" value={kpis.avgCapacity} accent="#ffc107" />
          <KPI label="Unassigned Drivers" value={kpis.unassignedDrivers} accent="#6c757d" />
        </View>

        {/* Top Routes by stops */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Routes (by number of stops)</Text>
          {kpis.routesByStops.length === 0 ? (
            <Text style={styles.empty}>No routes data</Text>
          ) : (
            <View>
              {kpis.routesByStops.map((r, idx) => (
                <Bar key={idx} value={r.stops} max={kpis.routesByStops[0].stops || 1} label={r.name} />
              ))}
            </View>
          )}
        </View>

        {/* Recent Alerts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          {alerts.length === 0 ? (
            <Text style={styles.empty}>No alerts</Text>
          ) : (
            <FlatList
              data={[...alerts].slice(0, 10)}
              renderItem={({ item }) => (
                <View style={styles.alertRow}>
                  <Text style={styles.alertMsg} numberOfLines={1}>{item.message}</Text>
                  <Text style={styles.alertTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              )}
              keyExtractor={(i) => i._id}
            />
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Export CSV</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Export XLSX</Text></TouchableOpacity>
          </View>
        </View>

        {/* Data Summaries */}
        <View style={styles.card}> 
          <Text style={styles.cardTitle}>Data Summary</Text>
          <Text style={styles.summaryText}>Buses assigned to drivers: {kpis.assignedBuses} of {kpis.totalBuses}</Text>
          <Text style={styles.summaryText}>Buses placed on routes: {kpis.routedBuses} of {kpis.totalBuses}</Text>
          <Text style={styles.summaryText}>Unassigned drivers: {kpis.unassignedDrivers}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#0d6efd', borderRadius: 6 },
  backText: { color: '#fff', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2d3d' },
  scroll: { padding: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  kpiCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#1f2d3d' },
  kpiLabel: { marginTop: 2, color: '#6c757d', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1f2d3d', marginBottom: 8 },
  empty: { color: '#6c757d' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { flex: 1, color: '#1f2d3d' },
  barTrack: { flex: 3, height: 10, backgroundColor: '#f1f3f5', borderRadius: 6, marginHorizontal: 8, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#0d6efd' },
  barValue: { width: 32, color: '#1f2d3d', textAlign: 'right' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  alertMsg: { flex: 1, color: '#2c3e50', paddingRight: 10 },
  alertTime: { color: '#6c757d' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  secondaryBtn: { backgroundColor: '#e9ecef', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  secondaryBtnText: { fontWeight: '700', color: '#1f2d3d' },
  summaryText: { color: '#2c3e50', marginBottom: 4 },
});


