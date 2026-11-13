import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getGoals, getProfileName, saveGoals, saveProfileName } from '../src/db';
import { c, radius, space, type } from '../src/theme';
import { DEFAULT_GOALS, type Goals } from '../src/types';

export default function Profile() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  useEffect(() => { getGoals(db).then(setGoals); getProfileName(db).then(setName); }, [db]);
  const field = (key: keyof Goals, label: string) => (
    <View style={s.field} key={key}><Text style={s.label}>{label}</Text>
      <TextInput style={s.input} keyboardType="decimal-pad" value={String(goals[key])}
        onChangeText={(v) => setGoals((old) => ({ ...old, [key]: Math.max(0, Number(v.replace(',', '.')) || 0) }))} />
    </View>
  );
  return <ScrollView style={s.wrap} contentContainerStyle={s.content}>
    <Text style={type.title}>Perfil e configurações</Text>
    <Text style={s.note}>Defina seus dados e metas conforme sua preferência. Estes valores não são recomendações médicas.</Text>
    <Text style={s.section}>Seu nome</Text>
    <TextInput style={s.input} placeholder="Como quer ser chamado?" placeholderTextColor={c.muted} value={name} onChangeText={setName} />
    <Text style={s.section}>Metas diárias</Text>
    {field('kcal', 'Calorias (kcal)')}{field('protein', 'Proteínas (g)')}{field('carbs', 'Carboidratos (g)')}{field('fat', 'Gorduras (g)')}
    <Pressable style={s.button} onPress={async () => { await saveGoals(db, goals); await saveProfileName(db, name); router.back(); }}><Text style={s.buttonText}>Salvar metas</Text></Pressable>
  </ScrollView>;
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg }, content: { padding: space.md, gap: space.sm },
  note: { color: c.muted, lineHeight: 20, marginBottom: space.md }, section: { ...type.section, marginTop: space.md },
  label: { ...type.caption, marginBottom: 4 }, field: { marginBottom: space.sm },
  input: { backgroundColor: c.card, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 13, color: c.ink, borderWidth: 1, borderColor: c.border },
  button: { backgroundColor: c.primary, borderRadius: radius.pill, alignItems: 'center', padding: 15, marginTop: space.lg },
  buttonText: { color: '#fff', fontWeight: '700' },
});
