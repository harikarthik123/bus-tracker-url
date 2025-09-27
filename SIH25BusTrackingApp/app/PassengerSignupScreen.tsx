import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from './utils/i18n';
import LanguageSelector from '../components/LanguageSelector';

import { API_URLS } from '../config/api';
const API_URL = API_URLS.AUTH;

const PassengerSignupScreen = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSignup = async () => {
    try {
      const response = await axios.post(`${API_URL}/register-passenger`, { name, phone });
      Alert.alert(t('signup.success'), t('signup.successMessage'));
      router.replace('/LoginScreen'); // Navigate back to login after signup
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('signup.failed'), error.response?.data?.msg || t('signup.errorMessage'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('signup.title')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('signup.namePlaceholder')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder={t('signup.phonePlaceholder')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>{t('signup.signupButton')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/LoginScreen')}>
        <Text style={styles.loginLink}>{t('signup.loginPrompt')}</Text>
      </TouchableOpacity>

      <View style={styles.languageSelectorContainer}>
        <LanguageSelector />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB', // Orange-tinted background
    padding: 20,
  },
  title: {
    fontSize: 24,
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
    borderColor: '#F59E0B', // Orange border
  },
  signupButton: {
    width: '100%',
    backgroundColor: '#D97706', // Orange button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    fontSize: 14,
    color: '#D97706', // Orange text
    fontWeight: 'bold',
  },
  languageSelectorContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default PassengerSignupScreen;
