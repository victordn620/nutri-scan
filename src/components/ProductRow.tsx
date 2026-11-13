import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '../types';
import { c, radius, shadow, type } from '../theme';

function ProductRow({ item, onPress }: { item: Product; onPress: (code: string) => void }) {
  return (
    <Pressable style={({ pressed }) => [s.row, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]} onPress={() => onPress(item.code)}>
      <View style={s.imgBox}>
        {item.image ? <Image source={{ uri: item.image, cache: 'force-cache' }} style={s.img} resizeMode="contain" /> : <Ionicons name="nutrition-outline" size={24} color={c.primary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        <Text style={type.caption} numberOfLines={1}>{item.brand || 'Sem marca'}</Text>
      </View>
      <View style={s.pill}><Text style={s.pillTxt}>{item.kcal == null ? '—' : `${Math.round(item.kcal)} kcal`}</Text></View>
    </Pressable>
  );
}
export default memo(ProductRow);
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: c.card, borderRadius: radius.md, marginBottom: 10, alignItems: 'center', ...shadow },
  imgBox: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: 56, height: 56 }, name: { fontSize: 15, fontWeight: '600', color: c.ink, marginBottom: 2 },
  pill: { backgroundColor: c.mint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillTxt: { color: c.primary, fontWeight: '700', fontSize: 12 },
});
