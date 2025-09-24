import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then(state => {
      if (!mounted) return;
      const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? state.isConnected));
      setOnline(isOnline);
    });
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? state.isConnected));
      setOnline(isOnline);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return online;
}


