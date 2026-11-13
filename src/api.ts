import type { Product } from './types';
import { API_CONFIG } from './config';

const HEADERS = { 'User-Agent': API_CONFIG.userAgent };
const n = (v: unknown): number | null => {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
  return null;
};

interface OpenFoodFactsProduct {
  code?: string | number;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  quantity?: string;
  nutriments?: Record<string, unknown>;
}

function parse(raw: OpenFoodFactsProduct | undefined): Product | null {
  if (!raw || (typeof raw.code !== 'string' && typeof raw.code !== 'number') || typeof raw.product_name !== 'string' || raw.product_name.trim() === '') return null;
  const m = raw.nutriments ?? {};
  return {
    code: String(raw.code).trim(), name: raw.product_name.trim(), brand: typeof raw.brands === 'string' ? raw.brands : '',
    image: typeof raw.image_small_url === 'string' ? raw.image_small_url : null,
    quantity: typeof raw.quantity === 'string' ? raw.quantity : null,
    kcal: n(m['energy-kcal_100g']), protein: n(m.proteins_100g), carbs: n(m.carbohydrates_100g),
    fat: n(m.fat_100g), fiber: n(m.fiber_100g), sodium: n(m.sodium_100g),
    saturatedFat: n(m['saturated-fat_100g']), sugars: n(m.sugars_100g),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, API_CONFIG.requestTimeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); },
  };
}

export async function fetchProduct(code: string, signal?: AbortSignal): Promise<Product | null> {
  const normalizedCode = code.trim();
  if (!normalizedCode || normalizedCode.length > 32) throw new Error('Código de barras inválido.');
  const request = withTimeout(signal);
  try {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v2/product/${encodeURIComponent(normalizedCode)}.json?fields=${API_CONFIG.fields}`, { headers: HEADERS, signal: request.signal });
    if (!r.ok) throw new Error(`Erro ${r.status} ao consultar a API`);
    const j: unknown = await r.json();
    return isRecord(j) && j.status === 1 && isRecord(j.product) ? parse(j.product as OpenFoodFactsProduct) : null;
  } catch (error) {
    if (request.didTimeout()) throw new Error('Tempo limite excedido.');
    throw error;
  } finally { request.cleanup(); }
}

export async function searchProducts(q: string, page = 1, signal?: AbortSignal): Promise<Product[]> {
  const query = q.trim();
  if (query.length < 3 || query.length > 120 || !Number.isInteger(page) || page < 1) throw new Error('Busca inválida.');
  const url = `${API_CONFIG.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${API_CONFIG.searchPageSize}&lc=pt&fields=${API_CONFIG.fields}`;
  const request = withTimeout(signal);
  try {
    const r = await fetch(url, { headers: HEADERS, signal: request.signal });
    if (!r.ok) throw new Error(`Erro ${r.status} ao consultar a API`);
    const j: unknown = await r.json();
    if (!isRecord(j) || !Array.isArray(j.products)) throw new Error('Resposta inválida da API.');
    return j.products.map((product) => parse(isRecord(product) ? product as OpenFoodFactsProduct : undefined)).filter(Boolean) as Product[];
  } catch (error) {
    if (request.didTimeout()) throw new Error('Tempo limite excedido.');
    throw error;
  } finally { request.cleanup(); }
}
