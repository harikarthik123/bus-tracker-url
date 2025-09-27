import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import decodeToken from '../app/utils/jwt'; // Updated import
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AnimatedLoader from '../components/AnimatedLoader';
import ConnectivityBanner from '../components/ConnectivityBanner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { enableQueryPersistence } from './utils/queryPersistence';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { startOutboxProcessor } from './utils/outbox';
import { LanguageProvider } from './utils/i18n';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'LoginScreen',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('LoginScreen');
  const [showLoader, setShowLoader] = useState(true);

  // Suppress all console logs and LogBox warnings in production and dev
  useEffect(() => {
    try {
      LogBox.ignoreAllLogs(true);
      // eslint-disable-next-line no-console
      console.log = () => {};
      // eslint-disable-next-line no-console
      console.info = () => {};
      // eslint-disable-next-line no-console
      console.warn = () => {};
      // eslint-disable-next-line no-console
      console.error = () => {};
      // eslint-disable-next-line no-console
      console.debug = () => {};
    } catch {}
  }, []);

  // React Query online manager + persistence
  useEffect(() => {
    enableQueryPersistence();
    startOutboxProcessor(queryClient);
    NetInfo.fetch().then(state => {
      onlineManager.setOnline(Boolean(state.isConnected && (state.isInternetReachable ?? state.isConnected)));
    });
    const unsub = NetInfo.addEventListener(state => {
      onlineManager.setOnline(Boolean(state.isConnected && (state.isInternetReachable ?? state.isConnected)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = decodeToken(token);
          if (decoded && decoded.user && decoded.user.role) {
            const role = decoded.user.role;
            if (role === 'admin') {
              setInitialRoute('AdminDashboard');
            } else if (role === 'driver') {
              setInitialRoute('DriverDashboard');
            } else if (role === 'passenger') {
              setInitialRoute('PassengerDashboard');
            }
          } else {
            await AsyncStorage.removeItem('token'); // Invalid token, remove it
            setInitialRoute('LoginScreen');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch (error) {
        console.error('Failed to check login status', error);
        setInitialRoute('LoginScreen');
      } finally {
        setIsAppReady(true);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  if (!isAppReady || showLoader) {
    return <AnimatedLoader onAnimationComplete={handleLoaderComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFBEB' }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack initialRouteName={initialRoute}>
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="PassengerSignupScreen" options={{ title: 'Sign Up', presentation: 'modal' }} />
            <Stack.Screen name="OTPScreen" options={{ title: 'Verify OTP', presentation: 'modal' }} />
            {/* Rely on file-system routing for AdminDashboard, DriverDashboard, PassengerDashboard and nested AdminDashboard screens */}
            </Stack>
            <StatusBar style="auto" />
            <ConnectivityBanner />
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
