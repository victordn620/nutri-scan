import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { c, type } from '../../src/theme';

const icon = (on: keyof typeof Ionicons.glyphMap, off: keyof typeof Ionicons.glyphMap) =>
  ({ color, size, focused }: { color: ColorValue | null; size: number; focused: boolean }) => <Ionicons name={focused ? on : off} color={typeof color === 'number' ? c.primary : color ?? c.primary} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.muted,
      tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
      headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false, headerTitleStyle: type.title,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Diário', headerShown: false, tabBarIcon: icon('leaf', 'leaf-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Scanner', headerShown: false, tabBarIcon: icon('scan-circle', 'scan-circle-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar', tabBarIcon: icon('search', 'search-outline') }} />
      <Tabs.Screen name="history" options={{ title: 'Histórico', tabBarIcon: icon('time', 'time-outline') }} />
    </Tabs>
  );
}
