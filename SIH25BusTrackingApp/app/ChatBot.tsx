import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Role = 'admin' | 'passenger';
type Msg = { id: string; from: 'bot' | 'user'; text: string };

const QUICK_TOPICS: Record<Role, { key: string; label: string }[]> = {
  admin: [
    { key: 'routes', label: 'Manage Routes & Stops' },
    { key: 'buses', label: 'Assign Buses & Drivers' },
    { key: 'live', label: 'Driver Live Locations' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'offline', label: 'Offline & Sync' },
    { key: 'faq', label: 'FAQs' },
  ],
  passenger: [
    { key: 'live', label: 'Live Bus Location' },
    { key: 'eta', label: 'Check ETA' },
    { key: 'search', label: 'Search Routes & Stops' },
    { key: 'notify', label: 'Notifications & Alerts' },
    { key: 'offline', label: 'Offline Mode' },
    { key: 'faq', label: 'FAQs' },
  ],
};

const RESPONSES: Record<string, string[]> = {
  // Admin
  routes: [
    'Add a route: Admin > Route Management > enter name, duration, draw route on map, add stops > Add Route.',
    'Edit/delete: open a route card > Edit or Delete.',
    'Bulk/file upload: use File Upload to import stops per route. Accepted: CSV/XLSX.',
    'Add a new stop quickly: switch to Add Stops mode on the map and tap to place.',
  ],
  buses: [
    'Add bus: Admin > Bus Management > bus number, reg. no, capacity > Add Bus.',
    'Assign driver/route: pick from dropdowns while adding/editing a bus.',
    'File upload: CSV/XLSX with busNumber, reg_no, capacity, optional route_id/route_name, driverId.',
  ],
  live: [
    'Live monitoring: Admin > Live Monitoring shows driver locations updated from the driver app.',
    'Troubleshooting: ensure driver is online with GPS enabled. Last known location may display when offline.',
  ],
  reports: [
    'Reports include route usage, occupancy, and driver performance (if enabled).',
    'Export options depend on your deployment. Ask for enablement if missing.',
  ],
  offline: [
    'Offline mode uses an Outbox. Your actions queue locally and sync when online.',
    'You can add/update entities offline; they will be sent automatically later.',
  ],
  faq: [
    'Why is a bus not moving? The driver may be offline or has GPS disabled; map shows last update.',
    'How to add a stop? Route Management > Add Stops mode > tap map > Save.',
    'How to test offline on mobile? Disable network; perform actions; reconnect to see them sync.',
  ],
  // Passenger
  eta: [
    'ETA combines planned route timing with recent driver location updates.',
    'If the driver is offline, ETA uses last known position and schedule as fallback.',
  ],
  search: [
    'Search by route name or stop: open the search bar and type; results filter as you type.',
  ],
  notify: [
    'Enable notifications to get arrival/delay alerts for selected routes and stops.',
  ],
};

export default function ChatBot() {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const initialRole: Role = (params?.role === 'passenger' ? 'passenger' : 'admin');
  const [role, setRole] = useState<Role>(initialRole);
  const [topic, setTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [dots, setDots] = useState<number>(0);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const topics = useMemo(() => QUICK_TOPICS[role], [role]);
  const content = topic ? RESPONSES[topic] || [] : [];

  useEffect(() => {
    if (isTyping) {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = setInterval(() => {
        setDots((d) => (d + 1) % 3);
      }, 350);
    } else {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setDots(0);
    }
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assistant</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Role header (language selection removed) */}
      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeTitle}>{role === 'admin' ? 'Welcome, Admin 👋' : 'Welcome aboard 👋'}</Text>
        <Text style={styles.welcomeSub}>{role === 'admin' ? 'Guide to manage routes, buses, drivers, and reports.' : 'Guide to live tracking, ETA, search, and alerts.'}</Text>
      </View>

      <Text style={styles.sectionLabel}>How can I help?</Text>
      <View style={styles.quickRow}>
        {topics.map((t) => (
          <TouchableOpacity key={t.key} style={styles.quickChip} onPress={() => {
            setTopic(t.key);
            setMessages(prev => [...prev, { id: `${Date.now()}-user`, from: 'user', text: t.label }]);
            const steps = RESPONSES[t.key] || [];
            setIsTyping(true);
            steps.forEach((line, idx) => {
              setTimeout(() => setMessages(prev2 => [...prev2, { id: `${Date.now()}-bot-${idx}`, from: 'bot', text: line }]), 400 * (idx + 1));
            });
            setTimeout(() => setIsTyping(false), 400 * steps.length + 350);
          }}>
            <Text style={styles.quickChipText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 24 }}>
        {messages.map(m => (
          m.from === 'bot' ? (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
              <View style={styles.avatar}><Text style={styles.avatarEmoji}>🤖</Text></View>
              <View style={styles.botBubble}><Text style={styles.botText}>{m.text}</Text></View>
            </View>
          ) : (
            <View key={m.id} style={{ alignItems: 'flex-end' }}>
              <View style={styles.userBubble}><Text style={styles.userText}>{m.text}</Text></View>
            </View>
          )
        ))}
        {isTyping && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
            <View style={styles.avatar}><Text style={styles.avatarEmoji}>🤖</Text></View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDot}>{dots === 0 ? '•  ' : dots === 1 ? '• •' : '• • •'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {!!topic && (
        <View style={[styles.actionRow, { paddingHorizontal: 16, marginBottom: 10 }] }>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {
            setMessages(prev => [...prev, { id: `${Date.now()}-u2`, from: 'user', text: 'Show Tutorial' }]);
            const steps = RESPONSES[topic] || [];
            setIsTyping(true);
            steps.forEach((line, idx) => {
              setTimeout(() => setMessages(prev2 => [...prev2, { id: `${Date.now()}-t${idx}`, from: 'bot', text: `Step ${idx+1}: ${line}` }]), 450 * (idx + 1));
            });
            setTimeout(() => setIsTyping(false), 450 * steps.length + 350);
          }}>
            <Text style={styles.primaryBtnText}>Show Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setTopic(null); setMessages([]); }}>
            <Text style={styles.secondaryBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#0d6efd', borderRadius: 6 },
  backText: { color: '#fff', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2d3d' },
  welcomeBox: { paddingHorizontal: 16, paddingTop: 10 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#1f2d3d' },
  welcomeSub: { color: '#6c757d', marginTop: 4 },
  sectionLabel: { paddingHorizontal: 16, marginTop: 4, color: '#6c757d', fontWeight: '600' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  quickChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 18 },
  quickChipText: { color: '#1f2d3d', fontWeight: '600', fontSize: 12 },
  chatArea: { flex: 1, paddingHorizontal: 16 },
  hint: { color: '#6c757d', paddingTop: 6 },
  botBubble: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 10, marginTop: 2, maxWidth: '82%' },
  botText: { color: '#1f2d3d' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#F59E0B', padding: 12, borderRadius: 10, marginTop: 10, maxWidth: '82%' },
  userText: { color: '#1F2937', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { backgroundColor: '#198754', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  secondaryBtnText: { color: '#1f2d3d', fontWeight: '700' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0d6efd', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarEmoji: { color: '#fff', fontSize: 18 },
  typingBubble: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  typingDot: { color: '#6c757d', letterSpacing: 2, fontWeight: '800' },
});


