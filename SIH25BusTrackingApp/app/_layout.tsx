import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import decodeToken from '../app/utils/jwt'; // Updated import
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AnimatedLoader from '../components/AnimatedLoader';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'LoginScreen',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('LoginScreen');
  const [showLoader, setShowLoader] = useState(true);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
