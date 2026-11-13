import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addEntry } from '../../src/db';
import { c, radius, space, type } from '../../src/theme';
import { MEALS, type Meal, type Product } from '../../src/types';
import { identifyFoods, type IdentifiedFood } from '../../src/vision';
import { searchProducts } from '../../src/api';
import { parseGrams } from '../../src/utils/nutrition';

type ScanState = 'camera' | 'analysing' | 'results';
type PortionUnit = 'g' | 'porção' | 'unidade';
type FoodMatch = { food: IdentifiedFood; product: Product | null; quantity: string; unit: PortionUnit; equivalentGrams: string };

const nutritionSummary = (product: Product, grams: number) => {
  const value = (amount: number | null, unit: string) => amount == null ? '—' : `${(amount * grams / 100).toFixed(1)}${unit}`;
  const sodium = product.sodium == null ? '—' : `${(product.sodium * grams * 10).toFixed(1)}mg`;
  return `${value(product.kcal, ' kcal')} · P ${value(product.protein, 'g')} · C ${value(product.carbs, 'g')} · G ${value(product.fat, 'g')} · G sat ${value(product.saturatedFat, 'g')} · Fib ${value(product.fiber, 'g')} · Aç ${value(product.sugars, 'g')} · Na ${sodium}`;
};

const nutritionGrams = (match: FoodMatch) =>
  match.unit === 'g' ? parseGrams(match.quantity) : parseGrams(match.equivalentGrams);

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const db = useSQLiteContext();
  const camera = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(false);
  const [state, setState] = useState<ScanState>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [foods, setFoods] = useState<FoodMatch[]>([]);
  const [meal, setMeal] = useState<Meal>('Lanche');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const analysisPulse = useRef(new Animated.Value(0.85)).current;

  useFocusEffect(useCallback(() => {
    setActive(true);
    return () => setActive(false);
  }, []));

  useEffect(() => {
    if (state !== 'analysing') return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(analysisPulse, { toValue: 1.08, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(analysisPulse, { toValue: 0.85, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [analysisPulse, state]);

  const analysePhoto = async (uri: string) => {
    setError('');
    setState('analysing');
    try {
      const optimized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.62, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!optimized.base64 || !optimized.uri) throw new Error('Não foi possível preparar a imagem.');
      setPhoto(optimized.uri);
      const identified = await identifyFoods(optimized.base64);
      setFoods(await resolveNutrition(identified));
      setState('results');
    } catch (cause) {
      setState('camera');
      setError((cause as Error).message || 'Não foi possível analisar a fotografia.');
    }
  };

  const takePhoto = async () => {
    if (!camera.current || state !== 'camera') return;
    setError('');
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.85, exif: false });
      if (!picture?.uri) throw new Error('A câmera não retornou uma imagem válida.');
      await analysePhoto(picture.uri);
    } catch (cause) {
      setState('camera');
      setError((cause as Error).message || 'Não foi possível analisar a fotografia.');
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) await analysePhoto(result.assets[0].uri);
  };

  const resolveNutrition = async (identified: IdentifiedFood[]): Promise<FoodMatch[]> =>
    Promise.all(identified.map(async (food) => {
      const base = { food, product: null, quantity: '100', unit: 'g' as PortionUnit, equivalentGrams: '100' };
      if (!food.name.trim()) return base;
      try {
        const products = await searchProducts(food.name);
        const query = food.name.toLocaleLowerCase();
        const product = products.find((item) => {
          const name = item.name.toLocaleLowerCase();
          return name.includes(query) || query.includes(name);
        }) ?? null;
        return { ...base, product };
      } catch {
        return base;
      }
    }));

  const confirmFoods = async () => {
    if (foods.length === 0) return;
    setSaving(true);
    try {
      const selectedMatches = foods.filter((match) => match.food.name.trim());
      const selectedFoods = selectedMatches.map((match) => match.food);
      if (selectedFoods.length === 0) {
        Alert.alert('Informe um alimento', 'Digite o nome de pelo menos um alimento antes de confirmar.');
        return;
      }
      const resolved = await resolveNutrition(selectedFoods);
      const currentMatches = resolved.map((match, index) => ({
        ...match,
        quantity: selectedMatches[index].quantity,
        unit: selectedMatches[index].unit,
        equivalentGrams: selectedMatches[index].equivalentGrams,
      }));
      setFoods(currentMatches);
      const missing: string[] = [];
      for (const match of currentMatches) {
        const amount = match.unit === 'g' ? parseGrams(match.quantity) : parseGrams(match.equivalentGrams);
        if (match.product && amount > 0) await addEntry(db, match.product, amount, meal);
        else missing.push(match.food.name);
      }
      if (missing.length > 0) {
        Alert.alert('Alguns alimentos não foram adicionados', `Não encontramos dados nutricionais para: ${missing.join(', ')}.`);
      } else {
        Alert.alert('Diário atualizado', `${currentMatches.length} alimento(s) adicionado(s) ao diário.`);
      }
      reset();
    } catch {
      Alert.alert('Não foi possível adicionar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setFoods([]);
    setError('');
    setState('camera');
  };

  if (!permission) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;
  if (!permission.granted) return (
    <View style={s.center}>
      <Ionicons name="camera-outline" size={40} color={c.primary} />
      <Text style={type.title}>Permita o acesso à câmera</Text>
      <Text style={s.message}>O NutriScan usa a câmera para fotografar os alimentos.</Text>
      <Pressable style={s.button} onPress={requestPermission}><Text style={s.buttonText}>Permitir acesso</Text></Pressable>
    </View>
  );

  if (state === 'results') return (
    <ScrollView style={s.page} contentContainerStyle={[s.content, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}>
      <Text style={type.title}>Confira a identificação</Text>
      <Text style={s.message}>Corrija os nomes se necessário antes de adicionar ao diário.</Text>
      {photo && <Image source={{ uri: photo }} style={s.preview} />}
      {foods.length === 0 ? <Text style={s.message}>Nenhum alimento foi identificado com confiança suficiente.</Text> :
        foods.map((match, index) => <View style={s.foodCard} key={match.food.id}>
          <View style={s.foodRow}>
            <TextInput style={s.foodInput} value={match.food.name} onChangeText={(name) => setFoods((current) => current.map((item, i) => i === index ? { ...item, food: { ...item.food, name }, product: null } : item))} />
            <Text style={s.confidence}>{match.food.confidence == null ? 'Manual' : `${Math.round(match.food.confidence * 100)}%`}</Text>
            <Pressable onPress={() => setFoods((current) => current.filter((_, i) => i !== index))} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={c.fat} />
            </Pressable>
          </View>
          <View style={s.quantityRow}>
            <TextInput style={s.quantityInput} keyboardType="decimal-pad" value={match.quantity}
              onChangeText={(quantity) => setFoods((current) => current.map((item, i) => i === index ? { ...item, quantity } : item))} />
            {(['g', 'porção', 'unidade'] as PortionUnit[]).map((unit) => <Pressable key={unit}
              style={[s.unitChip, match.unit === unit && s.unitChipSelected]}
              onPress={() => setFoods((current) => current.map((item, i) => i === index ? { ...item, unit, equivalentGrams: unit === 'g' ? item.quantity : '' } : item))}>
              <Text style={[s.unitText, match.unit === unit && { color: '#fff' }]}>{unit}</Text>
            </Pressable>)}
          </View>
          {match.unit !== 'g' && <View><Text style={s.unitHint}>Informe o equivalente em gramas para calcular os nutrientes.</Text>
            <TextInput style={s.foodInput} keyboardType="decimal-pad" placeholder="Gramas equivalentes" placeholderTextColor={c.muted}
              value={match.equivalentGrams} onChangeText={(equivalentGrams) => setFoods((current) => current.map((item, i) => i === index ? { ...item, equivalentGrams } : item))} /></View>}
          {match.product && nutritionGrams(match) > 0 ? <Text style={s.nutrition}>{nutritionSummary(match.product, nutritionGrams(match))} · Open Food Facts</Text> :
            <Text style={s.unavailable}>Dados nutricionais não disponíveis para este alimento.</Text>}
        </View>)}
      <Pressable style={s.addManual} onPress={() => setFoods((current) => [...current, { food: { id: `manual-${Date.now()}`, name: '', confidence: null }, product: null, quantity: '100', unit: 'g', equivalentGrams: '100' }])}>
        <Ionicons name="add-circle-outline" size={19} color={c.primary} /><Text style={s.addManualText}>Adicionar alimento manualmente</Text>
      </Pressable>
      <Text style={s.label}>Refeição</Text>
      <View style={s.chips}>{MEALS.map((item) => <Pressable key={item} style={[s.chip, item === meal && s.chipSelected]} onPress={() => setMeal(item)}>
        <Text style={[s.chipText, item === meal && { color: '#fff' }]}>{item}</Text>
      </Pressable>)}</View>
      <Pressable style={[s.button, (saving || foods.length === 0) && { opacity: 0.5 }]} disabled={saving || foods.length === 0} onPress={confirmFoods}>
        {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="add-circle-outline" size={20} color="#fff" />}
        <Text style={s.buttonText}>{saving ? 'Adicionando...' : 'Adicionar ao diário'}</Text>
      </Pressable>
      <Pressable style={s.secondary} onPress={reset}><Text style={s.secondaryText}>Tirar outra foto</Text></Pressable>
    </ScrollView>
  );

  return (
    <View style={s.cameraPage}>
      {active && state === 'camera' && <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />}
      <View style={[s.overlay, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md }]}>
        <Text style={s.cameraTitle}>Fotografar alimento</Text>
        <View style={s.guide}><Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.8)" /></View>
        {state === 'analysing' ? <View style={s.loading}>
          <Animated.View style={[s.analysisOrb, { transform: [{ scale: analysisPulse }] }]}><ActivityIndicator color="#fff" /></Animated.View>
          <Text style={s.loadingText}>Analisando seus alimentos...</Text>
        </View> :
          <><Pressable style={s.capture} onPress={takePhoto}><View style={s.captureInner} /></Pressable>
            <Pressable style={s.galleryButton} onPress={pickPhoto}><Ionicons name="images-outline" size={18} color="#fff" /><Text style={s.galleryText}>Selecionar da galeria</Text></Pressable></>}
        {!!error && <Text style={s.error}>{error}</Text>}
        <Text style={s.hint}>Enquadre os alimentos com boa iluminação</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.md, backgroundColor: c.bg },
  message: { color: c.muted, textAlign: 'center', lineHeight: 21 },
  button: { minHeight: 48, backgroundColor: c.primary, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  page: { flex: 1, backgroundColor: c.bg }, content: { padding: space.md, gap: space.sm },
  preview: { width: '100%', height: 190, borderRadius: radius.md, marginVertical: space.md, backgroundColor: c.mint },
  foodCard: { backgroundColor: c.card, borderRadius: radius.md, padding: space.sm, gap: 5 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  foodInput: { flex: 1, backgroundColor: c.card, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: 12, color: c.ink },
  confidence: { color: c.primary, fontWeight: '700', width: 48, textAlign: 'right' },
  addManual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.sm }, addManualText: { color: c.primary, fontWeight: '700' },
  nutrition: { color: c.ink, fontSize: 12, lineHeight: 18 }, unavailable: { color: c.muted, fontSize: 12, lineHeight: 18 },
  label: { ...type.section, marginTop: space.md }, input: { backgroundColor: c.card, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: 12, color: c.ink },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }, quantityInput: { flex: 1, backgroundColor: c.bg, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: 10, color: c.ink },
  unitChip: { borderWidth: 1, borderColor: c.primary, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 8 }, unitChipSelected: { backgroundColor: c.primary }, unitText: { color: c.primary, fontSize: 12, fontWeight: '700' },
  unitHint: { color: c.muted, fontSize: 12, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }, chip: { borderWidth: 1, borderColor: c.primary, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 9 }, chipSelected: { backgroundColor: c.primary }, chipText: { color: c.primary, fontSize: 13 },
  secondary: { alignItems: 'center', padding: space.sm }, secondaryText: { color: c.primary, fontWeight: '700' },
  cameraPage: { flex: 1, backgroundColor: '#000' }, overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(5,25,14,0.28)' },
  cameraTitle: { color: '#fff', fontSize: 19, fontWeight: '800' }, guide: { width: '82%', aspectRatio: 1, borderWidth: 2, borderColor: c.accent, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  capture: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, captureInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: c.accent },
  loading: { alignItems: 'center', gap: space.sm }, analysisOrb: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(52,210,123,0.85)', alignItems: 'center', justifyContent: 'center' }, loadingText: { color: '#fff', fontWeight: '700' },
  galleryButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(11,107,58,0.88)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill }, galleryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint: { color: '#fff', fontSize: 13, backgroundColor: 'rgba(11,107,58,0.85)', padding: 10, borderRadius: radius.pill }, error: { color: '#fff', textAlign: 'center', backgroundColor: 'rgba(180,30,30,0.85)', padding: 10, borderRadius: radius.md },
});
