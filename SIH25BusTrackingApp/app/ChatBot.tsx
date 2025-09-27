import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from './utils/i18n';

type Role = 'admin' | 'passenger';
type Msg = { id: string; from: 'bot' | 'user'; text: string };

// Dynamic multilingual responses using translation system

export default function ChatBot() {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const { t } = useLanguage();
  const initialRole: Role = (params?.role === 'passenger' ? 'passenger' : 'admin');
  const [role, setRole] = useState<Role>(initialRole);
  const [topic, setTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [dots, setDots] = useState<number>(0);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const topics = useMemo(() => {
    const topicKeys = role === 'admin' 
      ? ['routes', 'buses', 'live', 'reports', 'offline', 'faq']
      : ['live', 'eta', 'search', 'notify', 'offline', 'faq'];
    
    return topicKeys.map(key => ({
      key,
      label: t(`chatbot.${role}.${key}`)
    }));
  }, [role, t]);

  const getResponses = (topicKey: string) => {
    const responses = [];
    let i = 1;
    while (t(`chatbot.responses.${role}.${topicKey}.${i}`) !== `chatbot.responses.${role}.${topicKey}.${i}`) {
      responses.push(t(`chatbot.responses.${role}.${topicKey}.${i}`));
      i++;
    }
    return responses;
  };

  const content = topic ? getResponses(topic) : [];

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
          <Text style={styles.backText}>{t('chatbot.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('chatbot.title')}</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Role header */}
      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeTitle}>
          {role === 'admin' ? t('chatbot.welcomeAdmin') : t('chatbot.welcomePassenger')}
        </Text>
        <Text style={styles.welcomeSub}>
          {role === 'admin' ? t('chatbot.subtitleAdmin') : t('chatbot.subtitlePassenger')}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>{t('chatbot.howCanIHelp')}</Text>
      <View style={styles.quickRow}>
        {topics.map((t) => (
          <TouchableOpacity key={t.key} style={styles.quickChip} onPress={() => {
            setTopic(t.key);
            setMessages(prev => [...prev, { id: `${Date.now()}-user`, from: 'user', text: t.label }]);
            const steps = getResponses(t.key);
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
            setMessages(prev => [...prev, { id: `${Date.now()}-u2`, from: 'user', text: t('chatbot.showTutorial') }]);
            const steps = getResponses(topic);
            setIsTyping(true);
            steps.forEach((line, idx) => {
              setTimeout(() => setMessages(prev2 => [...prev2, { id: `${Date.now()}-t${idx}`, from: 'bot', text: `Step ${idx+1}: ${line}` }]), 450 * (idx + 1));
            });
            setTimeout(() => setIsTyping(false), 450 * steps.length + 350);
          }}>
            <Text style={styles.primaryBtnText}>{t('chatbot.showTutorial')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setTopic(null); setMessages([]); }}>
            <Text style={styles.secondaryBtnText}>{t('chatbot.clear')}</Text>
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


