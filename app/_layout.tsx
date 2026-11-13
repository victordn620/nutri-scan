import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrate } from '../src/db';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="nutriscan.db" onInit={migrate}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[code]" options={{ title: "Produto", headerStyle: { backgroundColor: "#F4F7F4" }, headerShadowVisible: false, headerTintColor: "#0B6B3A" }} />
        <Stack.Screen name="profile" options={{ title: 'Perfil', headerStyle: { backgroundColor: '#F4F7F4' }, headerShadowVisible: false, headerTintColor: '#0B6B3A' }} />
      </Stack>
    </SQLiteProvider>
  );
}
