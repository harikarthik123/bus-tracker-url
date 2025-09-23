import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminI18n, setAdminLanguage } from '../utils/i18n';

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

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" />
			<LinearGradient
				colors={["#198754", "#0d6efd"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={styles.headerGradient}
			>
				<View style={styles.headerContent}>
					<View style={styles.headerLeft}>
						<Text style={styles.brand}>BusBee</Text>
						<Text style={styles.welcome}>{t('admin.welcome')}</Text>
					</View>
					<View style={styles.rightControls}>
						<TouchableOpacity
							activeOpacity={0.9}
							style={[styles.langDropdown, langMenuOpen && styles.langDropdownActive]}
							onPress={() => setLangMenuOpen((v) => !v)}
						>
							<Text style={styles.langDropdownText}>{LANG_OPTIONS.find(l => l.code === lang)?.label} ▾</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.logoutButton} onPress={async () => {
							try { await AsyncStorage.removeItem('token'); router.replace('/LoginScreen'); } catch {}
						}}>
							<Text style={styles.logoutText}>{/* keep label English for clarity */}Logout</Text>
						</TouchableOpacity>
					</View>
				</View>
				{/* Popover moved outside header to allow full-screen backdrop */}
			</LinearGradient>
			{langMenuOpen && (
				<>
					<TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setLangMenuOpen(false)} />
					<View style={styles.langMenuPopover}>
						{LANG_OPTIONS.map((opt) => (
							<TouchableOpacity key={opt.code} style={[styles.langMenuItem, lang === opt.code && styles.langMenuItemActive]} onPress={() => selectLanguage(opt.code as any)}>
								<Text style={styles.langMenuItemText}>{opt.label}</Text>
							</TouchableOpacity>
						))}
					</View>
				</>
			)}
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.grid}>
					{CARD_DATA.map((card) => (
						<TouchableOpacity
							key={card.title}
							style={styles.card}
							activeOpacity={0.9}
							onPress={() => router.push(card.route)}
						>
							<View style={[styles.iconCircle, { backgroundColor: card.color }]}>
								<Text style={styles.iconEmoji}>{card.icon}</Text>
							</View>
							<Text style={styles.cardTitle}>{card.title}</Text>
							<Text style={styles.cardSub}>{card.sub}</Text>
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const CARD_WIDTH = (Dimensions.get('window').width - 60) / 2;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
			backgroundColor: '#f8f9fa',
	},
	headerGradient: {
			paddingTop: 18,
			paddingBottom: 18,
			paddingHorizontal: 20,
	},
	headerContent: {
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
			color: '#ffffff',
	},
	welcome: {
			marginTop: 2,
			fontSize: 14,
			color: '#ffffff',
			opacity: 0.9,
	},
	rightControls: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 10,
	},
	langDropdown: {
			backgroundColor: 'rgba(255,255,255,0.25)',
			borderRadius: 16,
			paddingHorizontal: 12,
			paddingVertical: 6,
	},
	langDropdownActive: {
			backgroundColor: 'rgba(255,255,255,0.35)',
	},
	langDropdownText: {
			color: '#ffffff',
			fontWeight: '600',
			fontSize: 12,
	},
	langMenuPopover: {
			position: 'absolute',
			right: 20,
			top: 70,
			backgroundColor: 'rgba(255,255,255,0.95)',
			borderRadius: 12,
			paddingVertical: 6,
			minWidth: 160,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 10,
			elevation: 8,
			zIndex: 1001,
	},
	backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'transparent',
			zIndex: 1000,
	},
	langMenuItem: {
			paddingVertical: 10,
			paddingHorizontal: 14,
	},
	langMenuItemActive: {
			backgroundColor: 'rgba(13,110,253,0.08)'
	},
	langMenuItemText: {
			color: '#1f2d3d',
			fontSize: 14,
			fontWeight: '600',
	},
	logoutButton: {
			backgroundColor: '#dc3545',
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 16,
	},
	logoutText: {
			color: '#ffffff',
			fontWeight: '600',
			fontSize: 12,
	},
	scroll: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 10,
	},
	grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between',
			alignItems: 'flex-start',
	},
	card: {
			width: CARD_WIDTH,
			backgroundColor: '#ffffff',
			borderRadius: 16,
			padding: 16,
			marginBottom: 16,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.08,
			shadowRadius: 6,
			elevation: 2,
	},
	iconCircle: {
			width: 52,
			height: 52,
			borderRadius: 12,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: 12,
	},
	iconEmoji: {
			fontSize: 24,
			color: '#ffffff',
	},
	cardTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: '#1f2d3d',
			marginBottom: 6,
			textAlign: 'center',
	},
	cardSub: {
			fontSize: 12,
			color: '#6c757d',
			textAlign: 'center',
	},
});

export default AdminDashboard;
