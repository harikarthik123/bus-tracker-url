import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://bus-tracker-url.onrender.com/api/auth'; // Replace with your backend URL

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('passenger'); // 'admin', 'driver', 'passenger'

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
    <View style={styles.container}>
      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'admin' && styles.selectedRoleButton]}
          onPress={() => setRole('admin')}
        >
          <Text style={[styles.roleButtonText, role === 'admin' && styles.selectedRoleButtonText]}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'driver' && styles.selectedRoleButton]}
          onPress={() => setRole('driver')}
        >
          <Text style={[styles.roleButtonText, role === 'driver' && styles.selectedRoleButtonText]}>Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'passenger' && styles.selectedRoleButton]}
          onPress={() => setRole('passenger')}
        >
          <Text style={[styles.roleButtonText, role === 'passenger' && styles.selectedRoleButtonText]}>Passenger</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.loginAsText}>Login as {role}</Text>

      {role !== 'passenger' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      )}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {role === 'passenger' && (
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/PassengerSignupScreen')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  roleToggle: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
  },
  selectedRoleButton: {
    backgroundColor: '#2c3e50',
  },
  roleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedRoleButtonText: {
    color: '#fff',
  },
  loginAsText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#555',
  },
  signUpLink: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
});
export default LoginScreen;
