export const API_CONFIG = {
  baseUrl: 'https://world.openfoodfacts.org',
  fields: 'code,product_name,brands,image_small_url,quantity,nutriments',
  userAgent: 'NutriScan/1.0 (projeto academico)',
  requestTimeoutMs: 10000,
  searchPageSize: 20,
  searchCacheMaxAgeMs: 15 * 60 * 1000,
} as const;

export const VISION_API_URL = process.env.EXPO_PUBLIC_VISION_API_URL ?? 'http://localhost:8787';
export const VISION_REQUEST_TIMEOUT_MS = 90000;
export const VISION_CACHE_LIMIT = 10;
