import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="DriverManagement" options={{ headerShown: false }} />
      <Stack.Screen name="BusManagement" options={{ headerShown: false }} />
      <Stack.Screen name="RouteManagement" options={{ headerShown: false }} />
      <Stack.Screen name="LiveMonitoring" options={{ headerShown: false }} />
      <Stack.Screen name="AlertsManagement" options={{ headerShown: false }} />
    </Stack>
  );
}


