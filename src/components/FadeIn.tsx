import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

/** Entrada suave (fade + subida de 12 px), 100% no thread nativo. */
export default function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}
