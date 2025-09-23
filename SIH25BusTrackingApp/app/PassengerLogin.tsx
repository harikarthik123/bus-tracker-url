import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const API_URL = 'https://bus-tracker-url.onrender.com/api/auth'; // Update with your API URL

const PassengerLogin = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogin = async () => {
    if (!phoneNumber) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }

    try {
      const response = await axios.post(`${API_URL}/login-passenger`, {
        phone: phoneNumber,
      });

      if (response.status === 200) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);
        router.replace('/PassengerDashboard'); // Navigate to passenger dashboard on successful login
      } else {
        Alert.alert('Error', 'Invalid phone number.');
      }
    } catch (error) {
      console.error('Login error', error);
      Alert.alert('Error', 'Failed to login. Please check your credentials and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passenger Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        // placeholder="+91 xxxxx xxxxx"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/PassengerSignupScreen')}>
        <Text style={styles.registerText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f7f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    marginTop: 15,
    color: '#007bff',
    textAlign: 'center',
  },
});

export default PassengerLogin;