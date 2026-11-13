import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, space } from '../theme';

export function LoadingState() {
  return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /><Text style={s.message}>Carregando...</Text></View>;
}

export function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return <View style={s.center}><Ionicons name={icon} size={38} color={c.primary} /><Text style={s.message}>{message}</Text></View>;
}

export function ErrorState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={s.center}><Ionicons name="cloud-offline-outline" size={38} color={c.primary} /><Text style={s.message}>{message}</Text>
    {onAction && actionLabel && <Pressable style={s.button} onPress={onAction}><Text style={s.buttonText}>{actionLabel}</Text></Pressable>}
  </View>;
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  message: { color: c.muted, textAlign: 'center', lineHeight: 21 },
  button: { backgroundColor: c.primary, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: 13 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
