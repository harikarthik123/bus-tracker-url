import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URLS, BASE_ORIGIN } from '../config/api';

const API_URL = API_URLS.PASSENGER;

export default function PassengerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/me`, { headers: { 'x-auth-token': token } });
        setName(res.data?.name || '');
        setPhone(res.data?.phone || '');
        setAvatarUrl(res.data?.avatarUrl || null);
      } catch (e) {
        Alert.alert('Profile', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Media permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) setAvatarBase64(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
      if (asset.uri) setAvatarUrl(asset.uri);
    }
  };

  const save = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(`${API_URL}/me`, { name, phone, avatarBase64 }, { headers: { 'x-auth-token': token } });
      setAvatarUrl(res.data.avatarUrl || avatarUrl);
      setAvatarBase64(null);
      Alert.alert('Saved', 'Profile updated');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cardCenter}>
          <TouchableOpacity onPress={pickImage}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl.startsWith('http') ? avatarUrl : `${BASE_ORIGIN}${avatarUrl}` }} 
                style={styles.avatar} 
                resizeMode="cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={{ fontSize: 24 }}>👤</Text></View>
            )}
          </TouchableOpacity>
          <Text style={{ color: '#6c757d', marginTop: 8 }}>Tap avatar to change</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Your phone" />
          <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveText}>Save Changes</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>
          <Text style={{ color: '#6c757d' }}>Passwordless login by phone. OTP to be added later.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'transparent', borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  backText: { color: '#1f2d3d', fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2d3d' },
  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, elevation: 2 },
  cardCenter: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 14, elevation: 2, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2d3d', marginBottom: 8 },
  label: { marginTop: 8, marginBottom: 4, color: '#2c3e50', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 10 },
  saveBtn: { marginTop: 12, backgroundColor: '#0d6efd', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#e5e7eb' },
  avatarPlaceholder: { backgroundColor: '#f1f3f5', alignItems: 'center', justifyContent: 'center' },
});


