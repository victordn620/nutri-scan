import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeIn from '../../src/components/FadeIn';
import { addEntry, setFavorite } from '../../src/db';
import { useProduct } from '../../src/hooks/useProduct';
import { c, MAX_W, radius, shadow, space, type } from '../../src/theme';
import { MEALS, type Meal } from '../../src/types';
import { parseGrams, productMacros } from '../../src/utils/nutrition';

const MEAL_ICON: Record<Meal, keyof typeof Ionicons.glyphMap> = { 'Café da manhã': 'cafe-outline', Almoço: 'restaurant-outline', Jantar: 'moon-outline', Lanche: 'nutrition-outline' };

export default function ProductScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [grams, setGrams] = useState('100');
  const [meal, setMeal] = useState<Meal>('Lanche');
  const [favorite, setFavoriteState] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const st = useProduct(code, attempt);
  useEffect(() => { if (st.status === 'ok') setFavoriteState(st.favorite); }, [st]);

  if (st.status === 'loading') return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} color={c.primary} />;
  if (st.status !== 'ok') return (
    <View style={s.center}>
      <View style={s.badge}><Ionicons name={st.status === 'notfound' ? 'search-outline' : 'cloud-offline-outline'} size={32} color={c.primary} /></View>
      <Text style={s.msg}>{st.status === 'notfound' ? 'Produto não encontrado na base Open Food Facts.' : 'Erro de conexão. Tente novamente.'}</Text>
      <Pressable style={s.cta} onPress={() => setAttempt((value) => value + 1)}><Text style={s.ctaTxt}>Tentar novamente</Text></Pressable>
      <Pressable onPress={() => router.push('/search')}><Text style={{ color: c.primary, fontWeight: '700' }}>Pesquisar manualmente</Text></Pressable>
    </View>
  );

  const { product: p } = st;
  const g = parseGrams(grams);
  const f = g / 100;
  const bump = (d: number) => setGrams(String(Math.max(0, Math.round(g + d))));
  const macros = productMacros(p, g).map((macro, index) => ({ l: macro.label, v: macro.value, col: [c.protein, c.carbs, c.fat][index] }));
  const total = macros.reduce((a, m) => a + m.v, 0);
  const rows: [string, number | null, string][] = [['Calorias', p.kcal, 'kcal'], ['Proteínas', p.protein, 'g'], ['Carboidratos', p.carbs, 'g'], ['Gorduras', p.fat, 'g'], ['Gorduras saturadas', p.saturatedFat, 'g'], ['Fibras', p.fiber, 'g'], ['Açúcares', p.sugars, 'g'], ['Sódio', p.sodium == null ? null : p.sodium * 1000, 'mg']];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <View style={s.hero}>
            <View style={s.imgBox}>{p.image ? <Image source={{ uri: p.image, cache: 'force-cache' }} style={s.img} resizeMode="contain" /> : <Ionicons name="nutrition-outline" size={40} color={c.primary} />}</View>
            <View style={{ flex: 1 }}><Text style={type.title} numberOfLines={3}>{p.name}</Text><Text style={type.caption}>{p.brand || 'Sem marca'}{p.quantity ? ` · ${p.quantity}` : ''}</Text></View>
            <Pressable onPress={async () => { try { const next = !favorite; await setFavorite(db, p.code, next); setFavoriteState(next); } catch { Alert.alert('Não foi possível salvar', 'Tente novamente.'); } }} hitSlop={10}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={26} color={favorite ? c.fat : c.primary} />
            </Pressable>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={s.kcalCard}>
            <Text style={s.kcalBig}>{p.kcal == null ? '—' : Math.round(p.kcal * f)}<Text style={s.kcalUnit}> kcal</Text></Text>
            <Text style={s.kcalSub}>em {g} g de produto</Text>
            <View style={s.split}>{macros.map((m) => <View key={m.l} style={{ flex: total > 0 ? Math.max(m.v, total * 0.03) : 1, backgroundColor: m.col }} />)}</View>
            <View style={s.legend}>{macros.map((m) => (
              <View key={m.l} style={s.legItem}><View style={[s.dot, { backgroundColor: m.col }]} /><Text style={s.legTxt}>{m.l} <Text style={{ fontWeight: '700' }}>{m.v.toFixed(1)} g</Text></Text></View>))}</View>
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <Text style={s.lbl}>Quantidade</Text>
          <View style={s.qty}>
            <Pressable style={s.round} onPress={() => bump(-10)} hitSlop={8}><Ionicons name="remove" size={22} color={c.primary} /></Pressable>
            <TextInput style={s.qtyInput} keyboardType="decimal-pad" value={grams} onChangeText={setGrams} selectTextOnFocus />
            <Text style={type.caption}>g</Text>
            <Pressable style={s.round} onPress={() => bump(10)} hitSlop={8}><Ionicons name="add" size={22} color={c.primary} /></Pressable>
          </View>
          <View style={s.chips}>{[50, 100, 150, 200].map((n) => (
            <Pressable key={n} onPress={() => setGrams(String(n))} style={[s.chip, g === n && s.chipOn]}><Text style={[s.chipTxt, g === n && { color: '#fff' }]}>{n} g</Text></Pressable>))}</View>

          <Text style={s.lbl}>Refeição</Text>
          <View style={s.chips}>{MEALS.map((m) => (
            <Pressable key={m} onPress={() => setMeal(m)} style={[s.chip, meal === m && s.chipOn]}>
              <Ionicons name={MEAL_ICON[m]} size={16} color={meal === m ? '#fff' : c.primary} /><Text style={[s.chipTxt, meal === m && { color: '#fff' }]}>{m}</Text></Pressable>))}</View>
        </FadeIn>

        <FadeIn delay={260}>
          <Text style={s.lbl}>Informação nutricional</Text>
          <View style={s.table}>
            <View style={s.tr}><Text style={{ flex: 1 }} /><Text style={s.th}>100 g</Text><Text style={[s.th, { color: c.primary }]}>{g} g</Text></View>
            {rows.map(([l, v, u]) => (
              <View key={l} style={[s.tr, s.trLine]}><Text style={[type.body, { flex: 1 }]}>{l}</Text>
                <Text style={s.cell}>{v == null ? 'Não disponível' : `${v.toFixed(1)} ${u}`}</Text><Text style={[s.cell, s.cellOn]}>{v == null ? 'Não disponível' : `${(v * f).toFixed(1)} ${u}`}</Text></View>))}
          </View>
        </FadeIn>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + space.sm }]}>
        <Pressable style={[s.cta, (g === 0 || saving) && { opacity: 0.4 }]} disabled={g === 0 || saving} onPress={async () => { setSaving(true); try { await addEntry(db, p, g, meal); router.replace('/'); } catch { Alert.alert('Não foi possível adicionar', 'Verifique o armazenamento e tente novamente.'); } finally { setSaving(false); } }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="add-circle" size={20} color="#fff" />}<Text style={s.ctaTxt}>{saving ? 'Adicionando...' : 'Adicionar ao diário'}</Text></Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: c.bg, gap: space.md },
  badge: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' }, msg: { textAlign: 'center', color: c.muted },
  scroll: { padding: space.md, paddingBottom: 120, maxWidth: MAX_W, width: '100%', alignSelf: 'center' },
  hero: { flexDirection: 'row', gap: space.md, alignItems: 'center', marginBottom: space.md },
  imgBox: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, img: { width: 88, height: 88 },
  kcalCard: { backgroundColor: c.primary, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, ...shadow },
  kcalBig: { color: '#fff', fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] }, kcalUnit: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  kcalSub: { color: 'rgba(255,255,255,0.7)', marginBottom: space.md },
  split: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', gap: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md }, legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 }, legTxt: { color: '#fff', fontSize: 13 },
  lbl: { ...type.section, marginTop: space.md, marginBottom: space.sm },
  qty: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.card, borderRadius: radius.md, padding: space.sm, ...shadow },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { flex: 1, textAlign: 'right', fontSize: 24, fontWeight: '800', color: c.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  chipOn: { backgroundColor: c.primary, borderColor: c.primary }, chipTxt: { fontWeight: '600', color: c.ink, fontSize: 13 },
  table: { backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, ...shadow },
  tr: { flexDirection: 'row', paddingVertical: 9 }, trLine: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  th: { width: 84, textAlign: 'right', ...type.caption }, cell: { width: 84, textAlign: 'right', color: c.muted, fontVariant: ['tabular-nums'] },
  cellOn: { color: c.primary, fontWeight: '700' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.sm, backgroundColor: c.bg, borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  cta: { flexDirection: 'row', gap: 8, backgroundColor: c.primary, paddingVertical: 15, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', maxWidth: MAX_W, width: '100%', alignSelf: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
