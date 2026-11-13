import { VISION_API_URL, VISION_CACHE_LIMIT, VISION_REQUEST_TIMEOUT_MS } from './config';

export interface IdentifiedFood {
  id: string;
  name: string;
  confidence: number | null;
}

const resultCache = new Map<string, IdentifiedFood[]>();

const imageKey = (image: string) => {
  let hash = 2166136261;
  for (let i = 0; i < image.length; i += 97) {
    hash ^= image.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${image.length}:${hash >>> 0}`;
};

export async function identifyFoods(imageBase64: string, signal?: AbortSignal): Promise<IdentifiedFood[]> {
  const key = imageKey(imageBase64);
  const cached = resultCache.get(key);
  if (cached) return cached;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, VISION_REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(`${VISION_API_URL}/api/identify-foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error : 'Não foi possível analisar a fotografia.';
      throw new Error(message);
    }
    if (!data || typeof data !== 'object' || !Array.isArray((data as { foods?: unknown }).foods)) {
      throw new Error('Resposta inválida do serviço de reconhecimento.');
    }
    const foods = (data as { foods: unknown[] }).foods
      .filter((food): food is IdentifiedFood => {
        if (!food || typeof food !== 'object') return false;
        const item = food as Partial<IdentifiedFood>;
        return typeof item.id === 'string' && typeof item.name === 'string' &&
        item.name.trim().length > 0 && (item.confidence === null ||
          (typeof item.confidence === 'number' && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1));
      });
    if (resultCache.size >= VISION_CACHE_LIMIT) resultCache.delete(resultCache.keys().next().value as string);
    resultCache.set(key, foods);
    return foods;
  } catch (error) {
    if (timedOut) throw new Error('A análise demorou demais. Verifique sua conexão e tente novamente.');
    if ((error as Error).name === 'AbortError') throw error;
    if ((error as Error).name === 'TypeError' || (error as Error).message?.includes('Network request failed')) {
      throw new Error('A identificação por IA requer conexão com a internet. Os recursos locais continuam disponíveis.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
