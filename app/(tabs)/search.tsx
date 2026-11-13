import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchProducts } from '../../src/api';
import ProductRow from '../../src/components/ProductRow';
import { getCachedSearch, getHistory, saveSearchCache, upsertProducts } from '../../src/db';
import { c, shadow } from '../../src/theme';
import type { Product } from '../../src/types';

export default function Search() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  useFocusEffect(useCallback(() => { getHistory(db).then(setRecent); }, [db]));

  // Debounce de 500 ms + AbortController: cancela requisições obsoletas
  useEffect(() => {
    const query = q.trim();
    if (query.length < 3) { setItems([]); setError(''); setPage(1); setHasMore(false); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const cached = await getCachedSearch(db, query);
        if (cached) {
          setItems(cached); setPage(1); setHasMore(cached.length === 20); return;
        }
        const res = await searchProducts(query, 1, ctrl.signal);
        setItems(res);
        setPage(1); setHasMore(res.length === 20);
        await saveSearchCache(db, query, res);
        await upsertProducts(db, res); // cache local: a tela de detalhe abre sem nova requisição
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message === 'Tempo limite excedido.' ? 'Tempo limite excedido.' : 'Falha na busca. Verifique sua conexão.');
      } finally { if (!ctrl.signal.aborted) setLoading(false); }
    }, 500);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, db]);

  const open = useCallback((code: string) => router.push(`/product/${code}`), [router]);
  const loadMore = useCallback(async () => {
    const query = q.trim();
    if (query.length < 3 || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await searchProducts(query, page + 1);
      setItems((current) => [...current, ...next]);
      setPage((current) => current + 1);
      setHasMore(next.length === 20);
      await upsertProducts(db, next);
    } catch (error) {
      setError((error as Error).message === 'Tempo limite excedido.' ? 'Tempo limite excedido.' : 'Falha ao carregar mais resultados.');
    }
    finally { setLoadingMore(false); }
  }, [db, hasMore, loading, loadingMore, page, q]);

  return (
    <View style={s.wrap}>
      <View style={s.inputWrap}>
        <Ionicons name="search" size={20} color={c.primary} />
        <TextInput style={s.input} placeholder="Buscar alimento (ex.: aveia, iogurte)" placeholderTextColor={c.muted} value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" />
        {q.length > 0 && <Pressable onPress={() => setQ('')} hitSlop={10}><Ionicons name="close-circle" size={20} color={c.muted} /></Pressable>}
      </View>
      {loading && <ActivityIndicator color={c.primary} style={{ margin: 12 }} />}
      {!!error && <Text style={s.err}>{error}</Text>}
      <FlatList data={q.trim().length < 3 ? recent : items} keyExtractor={(p) => p.code} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <ProductRow item={item} onPress={open} />}
        onEndReached={loadMore} onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={c.primary} style={{ margin: 12 }} /> : undefined}
        initialNumToRender={8} windowSize={5} removeClippedSubviews
        ListHeaderComponent={q.trim().length < 3 && recent.length > 0 ? <Text style={s.recent}>Consultados recentemente</Text> : undefined}
        ListEmptyComponent={!loading && q.trim().length >= 3 && !error ? <Text style={s.empty}>Nenhum resultado.</Text> : q.trim().length < 3 && recent.length === 0 ? <Text style={s.empty}>Pesquise por nome ou código do produto.</Text> : undefined} />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: c.bg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card, borderRadius: 999, paddingHorizontal: 16, height: 48, marginBottom: 12, ...shadow },
  input: { flex: 1, fontSize: 15, color: c.ink },
  err: { color: c.fat, textAlign: 'center', margin: 8 }, empty: { textAlign: 'center', color: c.muted, marginTop: 16 },
  recent: { color: c.ink, fontWeight: '700', marginBottom: 10 },
});
