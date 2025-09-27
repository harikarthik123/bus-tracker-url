import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useLanguage } from '../app/utils/i18n';
import { useRouter } from 'expo-router';

type Props = {
  role: 'admin' | 'passenger';
};

export default function FloatingAssistant({ role }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const { width, height } = Dimensions.get('window');
  const margin = 20;
  // Start near bottom-right corner
  const startX = Math.max(0, width - 56 - margin);
  const startY = Math.max(0, height - 56 - margin - 80); // offset for tab/header
  const position = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        position.setOffset({ x: (position as any).x._value, y: (position as any).y._value });
      },
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        position.flattenOffset();
      },
    })
  ).current;

  const openChat = () => {
    router.push({ pathname: '/ChatBot', params: { role } } as any);
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: position.getTranslateTransform() }]} {...panResponder.panHandlers}>
      <TouchableOpacity onPress={openChat} activeOpacity={0.9} style={styles.fab}>
        <Text style={styles.emoji}>🤖</Text>
      </TouchableOpacity>
      <View style={styles.badge}><Text style={styles.badgeText}>{role === 'admin' ? t('assistant.admin') : t('assistant.you')}</Text></View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.liveDot,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', zIndex: 9999 },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#0d6efd',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
  emoji: { fontSize: 26, color: '#fff' },
  badge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#198754', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  liveDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
});


