import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { DayTotal } from '../db';
import { c, radius, type } from '../theme';

const H = 120;
export default function WeekChart({ data, goal }: { data: DayTotal[]; goal: number }) {
  const vals = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const scale = Math.max(goal * 1.15, ...data.map((d) => d.kcal));
  const key = data.map((d) => Math.round(d.kcal)).join(',');
  useEffect(() => {
    Animated.stagger(60, data.map((d, i) =>
      Animated.timing(vals[i], { toValue: d.kcal / scale, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }))).start();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View>
      <View style={{ height: H }}>
        <View style={[s.goal, { bottom: (goal / scale) * H }]} />
        <View style={s.bars}>
          {data.map((d, i) => (
            <View key={d.day} style={s.col}>
              <Animated.View style={[s.bar, {
                height: vals[i].interpolate({ inputRange: [0, 1], outputRange: [3, H] }),
                backgroundColor: d.kcal > goal ? c.fat : i === 6 ? c.primary : '#BFE5CC' }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={s.labels}>{data.map((d, i) => (
        <Text key={d.day} style={[type.caption, s.lbl, i === 6 && { color: c.primary, fontWeight: '700' }]}>{d.label}</Text>))}</View>
    </View>
  );
}
const s = StyleSheet.create({
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, col: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: radius.sm / 2, minHeight: 3 },
  goal: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.accent },
  labels: { flexDirection: 'row', gap: 8, marginTop: 6 }, lbl: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
});
