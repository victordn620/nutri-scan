import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { c } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CalorieRing({ value, goal, size }: { value: number; goal: number; size: number }) {
  const p = useRef(new Animated.Value(0)).current;
  const sw = size * 0.09, r = (size - sw) / 2, C = 2 * Math.PI * r;
  const ratio = Math.min(1, value / goal);
  const over = value > goal;

  useEffect(() => {
    Animated.timing(p, { toValue: ratio, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [ratio, p]);

  const left = Math.max(0, Math.round(goal - value));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={sw} fill="none" />
          <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={over ? c.fat : c.accent} strokeWidth={sw} fill="none"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={p.interpolate({ inputRange: [0, 1], outputRange: [C, 0] })} />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, s.center]}>
        <Text style={[s.big, { fontSize: size * 0.2 }]}>{over ? Math.round(value - goal) : left}</Text>
        <Text style={s.cap}>{over ? 'kcal acima da meta' : 'kcal restantes'}</Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  big: { color: '#fff', fontWeight: '800', fontVariant: ['tabular-nums'] }, cap: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
});
