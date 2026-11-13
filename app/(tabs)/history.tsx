import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getGoals, getWeek, type DayTotal } from '../../src/db';
import WeekChart from '../../src/components/WeekChart';
import { c, radius, space, type } from '../../src/theme';

export default function History() {
  const db = useSQLiteContext();
  const [days, setDays] = useState<DayTotal[]>([]);
  const [goal, setGoal] = useState(2000);
  useFocusEffect(useCallback(() => { getWeek(db).then(setDays); getGoals(db).then((g) => setGoal(g.kcal)); }, [db]));

  return (
    <View style={s.wrap}>
      <FlatList data={days.slice().reverse()} keyExtractor={(item) => item.day}
        ListHeaderComponent={<><Text style={type.title}>Histórico nutricional</Text><Text style={s.subtitle}>Acompanhe seus últimos 7 dias</Text>
          <View style={s.chart}><WeekChart data={days} goal={goal} /></View><Text style={type.section}>Resumo diário</Text></>}
        renderItem={({ item }) => <View style={s.day}><Text style={s.dayTitle}>{item.day}</Text><Text style={s.value}>{Math.round(item.kcal)} kcal</Text>
          <Text style={s.macros}>P {item.protein.toFixed(1)} g · C {item.carbs.toFixed(1)} g · G {item.fat.toFixed(1)} g</Text></View>}
        ListEmptyComponent={<Text style={s.empty}>Ainda não há registros nutricionais.</Text>} />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, padding: space.md, backgroundColor: c.bg }, subtitle: { color: c.muted, marginTop: 4, marginBottom: space.md },
  chart: { backgroundColor: c.card, borderRadius: radius.md, padding: space.md, marginBottom: space.lg },
  day: { backgroundColor: c.card, borderRadius: radius.md, padding: space.md, marginTop: space.sm },
  dayTitle: { color: c.muted, fontSize: 13 }, value: { color: c.ink, fontSize: 20, fontWeight: '800', marginTop: 3 },
  macros: { color: c.muted, marginTop: 5 }, empty: { textAlign: 'center', color: c.muted, marginTop: 24 },
});
