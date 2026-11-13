import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { c, radius, type } from '../theme';

function ProgressBar({ label, value, goal, color, unit = 'g' }: { label: string; value: number; goal: number; color: string; unit?: string }) {
  const w = useRef(new Animated.Value(0)).current;
  const ratio = Math.min(1, value / goal);
  useEffect(() => {
    Animated.timing(w, { toValue: ratio, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [ratio, w]);
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.lblRow}><View style={[s.dot, { backgroundColor: color }]} /><Text style={type.body}>{label}</Text></View>
        <Text style={type.caption}><Text style={s.val}>{Math.round(value)}</Text> / {goal} {unit}</Text>
      </View>
      <View style={s.track}>
        <Animated.View style={[s.fill, { backgroundColor: value > goal ? c.fat : color, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}
export default memo(ProgressBar);
const s = StyleSheet.create({
  wrap: { marginBottom: 14 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lblRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 8, height: 8, borderRadius: 4 },
  val: { fontWeight: '700', color: c.ink }, track: { height: 8, borderRadius: radius.pill, backgroundColor: c.mint, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
