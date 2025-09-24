import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Easing, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const API_URL = 'http://192.168.137.1:5000/api/auth'; // Replace with your backend URL

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('passenger'); // 'admin', 'driver', 'passenger'

  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');
  const mutedBackground = useThemeColor({}, 'mutedBackground');
  const card = useThemeColor({}, 'card');

  const roleAccent = useMemo(() => {
    // Use consistent orange theme for all roles
    return '#D97706'; // amber-600 - consistent orange for all roles
  }, [role]);

  const selectedTextColor = useMemo(() => {
    // Always use white text for better contrast on orange background
    return '#FFFFFF';
  }, [roleAccent]);

  const styles = getStyles({ tint, textColor, background, border, mutedBackground, card, accent: roleAccent });

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(16)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [toggleWidth, setToggleWidth] = useState(0);

  const onToggleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setToggleWidth(w);
  };

  useEffect(() => {
    if (!toggleWidth) return;
    const segment = toggleWidth / 3;
    const index = role === 'admin' ? 0 : role === 'driver' ? 1 : 2;
    Animated.timing(indicatorX, { toValue: index * segment, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [role, toggleWidth]);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(headerTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    try {
      if (role === 'passenger') {
        // Directly login passenger
        console.log('Phone Number:', phone); // Add this line
        try {
          const response = await axios.post(`${API_URL}/login-passenger`, { phone: phone }); // Use phone directly
          const { token } = response.data;
          await AsyncStorage.setItem('token', token);
          router.replace('/PassengerDashboard');
        } catch (error: any) {
          console.error('Login Error:', error.response?.data?.msg || error.message); // Add this line
          Alert.alert('Login Failed', error.response?.data?.msg || 'Invalid phone number.');
        }
      } else {
        const response = await axios.post(`${API_URL}/login`, { email, password, role });
        const { token } = response.data;
        await AsyncStorage.setItem('token', token);

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userRole = decodedToken.user.role;

        if (userRole === 'admin') {
          router.replace('/AdminDashboard');
        } else if (userRole === 'driver') {
          router.replace('/DriverDashboard');
        } else if (userRole === 'passenger') {
          router.replace('/PassengerDashboard');
        }
      }
    } catch (error) {
      const err = error as unknown;
      console.error(err);
      let message = 'An error occurred';
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as any)?.msg || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }]}>
        <ThemedText type="title" style={styles.title}>Welcome back</ThemedText>
        <ThemedText type="subtitle" style={[styles.subtitle, { color: roleAccent }]}>Sign in to continue</ThemedText>
      </Animated.View>

      <View style={styles.roleToggle} onLayout={onToggleLayout}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.roleIndicator,
            {
              width: toggleWidth ? toggleWidth / 3 : 0,
              transform: [{ translateX: indicatorX }],
              backgroundColor: roleAccent,
            },
          ]}
        />
        <TouchableOpacity
          style={[styles.roleButton, role === 'admin' && styles.selectedRoleButton]}
          onPress={() => setRole('admin')}
        >
          <ThemedText style={[styles.roleButtonText, role === 'admin' && styles.selectedRoleButtonText]}>Admin</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'driver' && styles.selectedRoleButton]}
          onPress={() => setRole('driver')}
        >
          <ThemedText style={[styles.roleButtonText, role === 'driver' && styles.selectedRoleButtonText]}>Driver</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'passenger' && styles.selectedRoleButton]}
          onPress={() => setRole('passenger')}
        >
          <ThemedText style={[styles.roleButtonText, role === 'passenger' && styles.selectedRoleButtonText]}>Passenger</ThemedText>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.cardContainer, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
        <ThemedText style={styles.loginAsText}>Login as {role}</ThemedText>

        {role !== 'passenger' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={border}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={border}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={border}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        )}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: roleAccent }]}
            onPress={handleLogin}
            onPressIn={() => {
              Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
            }}
            onPressOut={() => {
              Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
            }}
          >
            <ThemedText style={styles.loginButtonText}>Login</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {role === 'passenger' && (
          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/PassengerSignupScreen')}>
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ThemedView>
  );
};

const getStyles = (c: { tint: string; textColor: string; background: string; border: string; mutedBackground: string; card: string; accent: string; }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFBEB',
      padding: 20,
    },
    headerContainer: {
      width: '100%',
      marginBottom: 12,
    },
    title: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    subtitle: {
      marginTop: 6,
      color: c.tint,
    },
    roleToggle: {
      flexDirection: 'row',
      marginTop: 12,
      marginBottom: 20,
      backgroundColor: c.mutedBackground,
      borderRadius: 999,
      overflow: 'hidden',
      position: 'relative',
    },
    roleIndicator: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      borderRadius: 999,
    },
    roleButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: 'transparent',
    },
    selectedRoleButton: {
      backgroundColor: c.accent,
    },
    roleButtonText: {
      color: c.textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    selectedRoleButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cardContainer: {
      width: '100%',
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    loginAsText: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 16,
    },
    input: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      padding: 14,
      borderRadius: 10,
      marginBottom: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.border,
      color: '#0F172A',
    },
    loginButton: {
      width: '100%',
      backgroundColor: c.tint,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    signUpContainer: {
      flexDirection: 'row',
      marginTop: 16,
    },
    signUpText: {
      fontSize: 14,
      color: c.textColor,
    },
    signUpLink: {
      fontSize: 14,
      color: c.tint,
      fontWeight: 'bold',
    },
  });
export default LoginScreen;
