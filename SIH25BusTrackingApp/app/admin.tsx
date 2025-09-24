import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingAssistant from '../components/FloatingAssistant';

const AdminDashboard = () => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/LoginScreen');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const adminFeatures = [
    {
      id: 'drivers',
      title: 'Driver Management',
      description: 'Manage driver accounts',
      icon: '👨‍💼',
      color: '#28a745',
      route: '/AdminDashboard/DriverManagement'
    },
    {
      id: 'buses',
      title: 'Bus Management',
      description: 'Manage fleet vehicles',
      icon: '🚌',
      color: '#007bff',
      route: '/AdminDashboard/BusManagement'
    },
    {
      id: 'routes',
      title: 'Route Management',
      description: 'Plan and manage routes',
      icon: '🗺️',
      color: '#6f42c1',
      route: '/AdminDashboard/RouteManagement'
    },
    {
      id: 'monitoring',
      title: 'Live Monitoring',
      description: 'Monitor bus locations',
      icon: '📍',
      color: '#fd7e14',
      route: '/AdminDashboard/LiveMonitoring'
    },
    {
      id: 'alerts',
      title: 'Alerts Management',
      description: 'Send and manage alerts',
      icon: '🚨',
      color: '#dc3545',
      route: '/AdminDashboard/AlertsManagement'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View system reports',
      icon: '📊',
      color: '#20c997',
      route: '/AdminDashboard/Analytics'
    }
    ,
    {
      id: 'assistant',
      title: 'Assistant',
      description: 'Guided help & FAQs',
      icon: '🤖',
      color: '#6c757d',
      route: '/ChatBot'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#28a745', '#007bff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft} />
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.languageSelector} onPress={handleLogout}>
              <Text style={styles.languageText}>EN</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresGrid}>
          {adminFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => router.push(feature.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <Text style={styles.icon}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Floating Assistant */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        <FloatingAssistant role="admin" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  dropdownArrow: {
    color: '#ffffff',
    fontSize: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    color: '#ffffff',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 16,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboard;
