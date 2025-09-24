import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useOnline } from '@/app/utils/useOnline';

export default function ConnectivityBanner() {
  const online = useOnline();
  const translateY = useRef(new Animated.Value(-60)).current;
  const [message, setMessage] = useState<string>('');
  const [bg, setBg] = useState<string>('#dc2626');

  useEffect(() => {
    if (!online) {
      setMessage('You are offline');
      setBg('#dc2626');
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else {
      if (message) {
        setMessage('Back online');
        setBg('#16a34a');
        Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
          setTimeout(() => {
            Animated.timing(translateY, { toValue: -60, duration: 200, useNativeDriver: true }).start(() => setMessage(''));
          }, 1200);
        });
      } else {
        Animated.timing(translateY, { toValue: -60, duration: 200, useNativeDriver: true }).start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return (
    <>
      {/* Slide-in transient message */}
      {Boolean(message) && (
        <Animated.View style={[styles.banner, { backgroundColor: bg, transform: [{ translateY }] }]}> 
          <Text style={styles.bannerText}>{message}</Text>
        </Animated.View>
      )}
      {/* Always-visible status pill */}
      <View pointerEvents="none" style={styles.pillContainer}>
        <View style={[styles.pill, { backgroundColor: online ? '#16a34a' : '#dc2626' }]}>
          <Text style={styles.pillText}>{online ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.select({ ios: 44, android: 10, default: 0 }),
    paddingBottom: 10,
    alignItems: 'center',
  },
  bannerText: {
    color: 'white',
    fontWeight: '600',
  },
  pillContainer: {
    position: 'absolute',
    top: Platform.select({ ios: 70, android: 40, default: 30 }),
    right: 12,
    zIndex: 1001,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});


