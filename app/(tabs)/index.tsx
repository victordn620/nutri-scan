import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalorieRing from '../../src/components/CalorieRing';
import FadeIn from '../../src/components/FadeIn';
import ProgressBar from '../../src/components/ProgressBar';
import { deleteEntry, getEntries, getGoals, getProfileName, getWeek, updateEntry, type DayTotal } from '../../src/db';
import WeekChart from '../../src/components/WeekChart';
import { c, MAX_W, radius, shadow, space, type } from '../../src/theme';
import { Entry, DEFAULT_GOALS, Meal, type Goals } from '../../src/types';

const MEAL_ICON: Record<Meal, keyof typeof Ionicons.glyphMap> = {
  'Café da manhã': 'cafe-outline', Almoço: 'restaurant-outline', Jantar: 'moon-outline', Lanche: 'nutrition-outline',
};

export default function Diary() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [week, setWeek] = useState<DayTotal[]>([]);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [userName, setUserName] = useState('');
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editGrams, setEditGrams] = useState('');
  const load = useCallback(() => { getEntries(db).then(setEntries); getWeek(db).then(setWeek); getGoals(db).then(setGoals); getProfileName(db).then(setUserName); }, [db]);
  useFocusEffect(load);

  const t = useMemo(() => entries.reduce((a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }), [entries]);
  const ring = Math.min(Math.min(width, MAX_W) * 0.52, 230); // anel proporcional à tela
  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const remove = (e: Entry) => Alert.alert('Remover', `Remover "${e.name}" do diário?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: async () => { await deleteEntry(db, e.id); load(); } },
  ]);

  return (
    <>
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: space.md, paddingTop: insets.top + space.md, maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}
      data={entries} keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={
        <>
          <View style={s.heading}><View><Text style={type.caption}>{date}</Text>
          <Text style={[type.title, { marginBottom: space.md }]}>{userName ? `Olá, ${userName}` : 'Seu dia'}, <Text style={{ color: c.primary }}>em foco</Text></Text>
          </View><Pressable onPress={() => router.push('/profile')} hitSlop={10}><Ionicons name="person-circle-outline" size={32} color={c.primary} /></Pressable></View>
          <FadeIn>
            <View style={s.hero}>
              <CalorieRing value={t.kcal} goal={goals.kcal} size={ring} />
              <Text style={s.heroSub}>{Math.round(t.kcal)} de {goals.kcal} kcal consumidas</Text>
            </View>
          </FadeIn>
          <FadeIn delay={120}>
            <View style={s.card}>
              <ProgressBar label="Proteínas" value={t.protein} goal={goals.protein} color={c.protein} />
              <ProgressBar label="Carboidratos" value={t.carbs} goal={goals.carbs} color={c.carbs} />
              <ProgressBar label="Gorduras" value={t.fat} goal={goals.fat} color={c.fat} />
            </View>
          </FadeIn>
          <FadeIn delay={200}>
            <View style={[s.card, { marginTop: space.md, paddingBottom: space.md }]}>
              <Text style={[type.section, { marginBottom: space.md }]}>Últimos 7 dias <Text style={type.caption}>· kcal</Text></Text>
              {week.length > 0 && <WeekChart data={week} goal={goals.kcal} />}
            </View>
          </FadeIn>
          <Text style={[type.section, { marginTop: space.lg, marginBottom: space.sm }]}>Refeições de hoje</Text>
        </>
      }
      ListEmptyComponent={
        <View style={s.empty}><Ionicons name="scan-outline" size={36} color={c.primary} />
          <Text style={s.emptyTxt}>Nada registrado ainda.{'\n'}Escaneie um produto para começar.</Text></View>}
      renderItem={({ item, index }) => (
        <FadeIn delay={Math.min(index, 6) * 50}>
          <Pressable style={s.row} onPress={() => { setEditing(item); setEditGrams(String(item.grams)); }} onLongPress={() => remove(item)}>
            <View style={s.icon}><Ionicons name={MEAL_ICON[item.meal] ?? 'nutrition-outline'} size={20} color={c.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{item.name}</Text>
              <Text style={type.caption}>{item.meal} · {item.grams} g</Text>
            </View>
            <Text style={s.kcal}>{Math.round(item.kcal)} <Text style={type.caption}>kcal</Text></Text>
          </Pressable>
        </FadeIn>
      )}
    />
    <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
      <View style={s.modalBackdrop}><View style={s.modalCard}>
        <Text style={type.section}>Editar quantidade</Text><Text style={type.caption}>{editing?.name}</Text>
        <TextInput style={s.editInput} keyboardType="decimal-pad" value={editGrams} onChangeText={setEditGrams} />
        <View style={s.modalActions}><Pressable onPress={() => setEditing(null)}><Text style={s.cancel}>Cancelar</Text></Pressable>
          <Pressable style={s.save} onPress={async () => { const grams = Number(editGrams.replace(',', '.')); if (editing && grams > 0) { await updateEntry(db, editing.id, grams); setEditing(null); load(); } }}><Text style={s.saveTxt}>Salvar</Text></Pressable></View>
      </View></View>
    </Modal>
    </>
  );
}
const s = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hero: { backgroundColor: c.primary, borderRadius: radius.lg, paddingVertical: space.lg, alignItems: 'center', marginBottom: space.md, ...shadow },
  heroSub: { color: 'rgba(255,255,255,0.8)', marginTop: space.md, fontSize: 13 },
  card: { backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, paddingBottom: space.xs, ...shadow },
  row: { flexDirection: 'row', backgroundColor: c.card, padding: 12, borderRadius: radius.md, marginBottom: 10, alignItems: 'center', gap: 12, ...shadow },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: c.ink }, kcal: { fontWeight: '800', color: c.ink, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', padding: space.xl, gap: 8 }, emptyTxt: { textAlign: 'center', color: c.muted, lineHeight: 21 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: space.lg },
  modalCard: { backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  editInput: { borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: 12, color: c.ink },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.md, marginTop: space.sm },
  cancel: { color: c.muted, fontWeight: '600' }, save: { backgroundColor: c.primary, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 10 }, saveTxt: { color: '#fff', fontWeight: '700' },
});
