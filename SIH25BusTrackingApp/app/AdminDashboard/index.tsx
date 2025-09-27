import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, ScrollView, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminI18n, setAdminLanguage } from '../utils/i18n';
import FloatingAssistant from '../../components/FloatingAssistant';
import LiveMonitoring from './LiveMonitoring';

const CARD_COLORS = {
	live: '#0d6efd',
	route: '#6f42c1',
	driver: '#198754',
	bus: '#0dcaf0',
	ann: '#dc3545',
	reports: '#20c997',
};

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ta', label: 'தமிழ்' },
];

const AdminDashboard = () => {
    const { t, lang, setLang } = useAdminI18n();
	const [langMenuOpen, setLangMenuOpen] = useState(false);
	const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 360);
    const spacing = Math.max(10, Math.min(18, Math.round(SCREEN_WIDTH * 0.04)));
    const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

	const CARD_DATA = useMemo(() => ([
		{ key: 'live', title: t('cards.live.title'), sub: t('cards.live.sub'), route: '/AdminDashboard/LiveMonitoring', icon: '📡', color: CARD_COLORS.live },
		{ key: 'route', title: t('cards.route.title'), sub: t('cards.route.sub'), route: '/AdminDashboard/RouteManagement', icon: '🗺️', color: CARD_COLORS.route },
		{ key: 'driver', title: t('cards.driver.title'), sub: '', route: '/AdminDashboard/DriverManagement', icon: '👨‍✈️', color: CARD_COLORS.driver },
		{ key: 'bus', title: t('cards.bus.title'), sub: '', route: '/AdminDashboard/BusManagement', icon: '🚌', color: CARD_COLORS.bus },
		{ key: 'ann', title: t('cards.ann.title'), sub: '', route: '/AdminDashboard/AlertsManagement', icon: '📢', color: CARD_COLORS.ann },
		{ key: 'reports', title: t('cards.reports.title'), sub: '', route: '/AdminDashboard/Analytics', icon: '📊', color: CARD_COLORS.reports },
	]), [t]);

	const selectLanguage = async (code: 'en' | 'hi' | 'pa' | 'ta') => {
		setLang(code);
		setLangMenuOpen(false);
	};
	const handleLogout = async () => {
		try {
			await AsyncStorage.removeItem('token');
			router.replace('/LoginScreen');
		} catch (error) {
			console.error('Error logging out:', error);
		}
	};

    const cardsOpacity = useRef(new Animated.Value(0)).current;
    const cardsTranslate = useRef(new Animated.Value(24)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardsOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardsTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        Animated.timing(drawerTranslateX, {
            toValue: langMenuOpen ? 0 : -DRAWER_WIDTH,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [langMenuOpen]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={["#F59E0B", "#FDE68A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: Math.round(spacing * 0.8) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing }}>
                    <TouchableOpacity onPress={() => setLangMenuOpen((v) => !v)} style={styles.hamburger}>
                        <Text style={styles.hamburgerText}>☰</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <TouchableOpacity style={styles.langPill} onPress={() => setLangDropdownOpen(v => !v)}><Text style={styles.langPillText}>{LANG_OPTIONS.find(l => l.code === lang)?.label} ▾</Text></TouchableOpacity>
                </View>
            </LinearGradient>

            {langDropdownOpen && (
                <>
                  <TouchableOpacity style={styles.langBackdrop} activeOpacity={1} onPress={() => setLangDropdownOpen(false)} />
                  <View style={styles.langDropdown}>
                    {LANG_OPTIONS.map(opt => (
                      <TouchableOpacity key={opt.code} style={styles.langOption} onPress={() => { selectLanguage(opt.code as any); setLangDropdownOpen(false); }}>
                        <Text style={[styles.langOptionText, opt.code === lang && { fontWeight: '800' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
            )}

            {langMenuOpen && (
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setLangMenuOpen(false)} />
            )}
            <Animated.View pointerEvents={langMenuOpen ? 'auto' : 'none'} style={[styles.drawer, { width: DRAWER_WIDTH, transform: [{ translateX: drawerTranslateX }] }]}>
                <View style={styles.drawerHeaderBar}>
                    <Text style={styles.drawerHeaderTitle}>Admin Menu</Text>
                    <TouchableOpacity onPress={() => setLangMenuOpen(false)}>
                        <Text style={styles.drawerClose}>✕</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.drawerInnerWrap, { paddingBottom: spacing }]}>
                <View style={[styles.drawerCard, { margin: spacing, padding: Math.max(10, Math.round(spacing * 0.8)) }]}>
                        {/* Language selector removed from hamburger drawer as requested */}
                        {CARD_DATA.filter(c => c.key !== 'live').map((card) => (
                            <TouchableOpacity key={card.key} style={[styles.drawerItem, { marginBottom: Math.round(spacing * 0.75) }]} onPress={() => { setLangMenuOpen(false); router.push(card.route as any); }}>
                                <Text style={styles.drawerItemIcon}>{card.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.drawerItemText}>{card.title}</Text>
                                    {card.sub && card.key !== 'route' ? <Text style={styles.drawerItemSub}>{card.sub}</Text> : null}
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.drawerLogout} onPress={async () => { try { await AsyncStorage.removeItem('token'); router.replace('/LoginScreen'); } catch {} }}>
                            <Text style={styles.drawerLogoutIcon}>↩︎</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.drawerLogoutText}>Logout</Text>
                                <Text style={styles.drawerLogoutSub}>Sign out of admin panel</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            <View style={styles.content}>
                <LiveMonitoring showHeader={false} />
            </View>

            <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
                <FloatingAssistant role="admin" />
            </View>
        </SafeAreaView>
    );
};

const CARD_WIDTH = (Dimensions.get('window').width - 60) / 2;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
    backgroundColor: '#F8F9FA',
	},
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
	hamburger: { padding: 8, backgroundColor: '#F59E0B', borderRadius: 8 },
  hamburgerText: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  headerTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  langPill: { backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  langPillText: { color: '#1F2937', fontWeight: '700', fontSize: 12 },
	backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1000 },
	drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'transparent', zIndex: 1001, elevation: 8 },
	drawerHeaderBar: { height: 56, backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
	drawerHeaderTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
	drawerClose: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
    drawerInnerWrap: { flex: 1, backgroundColor: '#FFFFFF' },
	drawerCard: { margin: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
	drawerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12 },
	drawerItemIcon: { width: 28, textAlign: 'center', marginRight: 10 },
	drawerItemText: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
	drawerItemSub: { color: '#6C757D', fontSize: 12, marginTop: 2 },
	drawerLogout: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc3545', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, marginTop: 8 },
	drawerLogoutIcon: { width: 28, textAlign: 'center', marginRight: 10, color: '#fff' },
	drawerLogoutText: { color: '#fff', fontWeight: '800' },
	drawerLogoutSub: { color: '#fff', opacity: 0.9, fontSize: 12 },
	content: { flex: 1 },
  langBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  langDropdown: { position: 'absolute', top: 54, right: 12, backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 6, minWidth: 140, borderColor: '#E5E7EB', borderWidth: 1, zIndex: 999 },
  langOption: { paddingHorizontal: 12, paddingVertical: 8 },
  langOptionText: { color: '#1F2937', fontSize: 14 },
});

export default AdminDashboard;
