import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_GOALS, type Entry, type Goals, type Product } from './types';
import { API_CONFIG } from './config';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products(code TEXT PRIMARY KEY, name TEXT, brand TEXT, image TEXT, quantity TEXT,
      kcal REAL, protein REAL, carbs REAL, fat REAL, fiber REAL, sodium REAL, saturatedFat REAL, sugars REAL, viewed_at INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS entries(id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT, grams REAL,
      meal TEXT, day TEXT, kcal REAL, protein REAL, carbs REAL, fat REAL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS favorites(code TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS search_cache(query TEXT PRIMARY KEY, fetched_at INTEGER NOT NULL, products_json TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_entries_day ON entries(day);
    CREATE INDEX IF NOT EXISTS idx_products_viewed ON products(viewed_at DESC);
  `);
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
  const names = new Set(columns.map((c) => c.name));
  for (const [name, sql] of [['quantity', 'TEXT'], ['saturatedFat', 'REAL'], ['sugars', 'REAL']] as const) {
    if (!names.has(name)) await db.execAsync(`ALTER TABLE products ADD COLUMN ${name} ${sql}`);
  }
  const existing = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['goals']);
  if (!existing) await db.runAsync('INSERT INTO settings(key,value) VALUES(?,?)', ['goals', JSON.stringify(DEFAULT_GOALS)]);
}

/** Upsert em transação única (cache local + histórico). viewed = true marca como visualizado agora. */
export async function upsertProducts(db: SQLiteDatabase, list: Product[], viewed = false) {
  const ts = viewed ? Date.now() : 0;
  await db.withTransactionAsync(async () => {
    for (const p of list) {
      await db.runAsync(
        `        INSERT INTO products(code,name,brand,image,quantity,kcal,protein,carbs,fat,fiber,sodium,saturatedFat,sugars,viewed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(code) DO UPDATE SET name=excluded.name, brand=excluded.brand, image=excluded.image, quantity=excluded.quantity, kcal=excluded.kcal,
         protein=excluded.protein, carbs=excluded.carbs, fat=excluded.fat, fiber=excluded.fiber, sodium=excluded.sodium,
        saturatedFat=excluded.saturatedFat, sugars=excluded.sugars,
        viewed_at=MAX(viewed_at, excluded.viewed_at)`,
        [p.code, p.name, p.brand, p.image, p.quantity, p.kcal, p.protein, p.carbs, p.fat, p.fiber, p.sodium, p.saturatedFat, p.sugars, ts]);
    }
  });
}
export const getProduct = (db: SQLiteDatabase, code: string) =>
  db.getFirstAsync<Product>('SELECT * FROM products WHERE code = ?', [code]);
export const getHistory = (db: SQLiteDatabase) =>
  db.getAllAsync<Product>('SELECT * FROM products WHERE viewed_at > 0 ORDER BY viewed_at DESC LIMIT 50');
export const clearHistory = (db: SQLiteDatabase) => db.runAsync('UPDATE products SET viewed_at = 0');
export const getCachedSearch = async (db: SQLiteDatabase, query: string, maxAge = API_CONFIG.searchCacheMaxAgeMs) => {
  const row = await db.getFirstAsync<{ fetched_at: number; products_json: string }>(
    'SELECT fetched_at, products_json FROM search_cache WHERE query = ?', [query]);
  if (!row || Date.now() - row.fetched_at > maxAge) return null;
  try {
    const products: unknown = JSON.parse(row.products_json);
    return Array.isArray(products) ? products as Product[] : null;
  } catch {
    return null;
  }
};
export const saveSearchCache = (db: SQLiteDatabase, query: string, products: Product[]) =>
  db.runAsync('INSERT INTO search_cache(query,fetched_at,products_json) VALUES(?,?,?) ON CONFLICT(query) DO UPDATE SET fetched_at=excluded.fetched_at, products_json=excluded.products_json',
    [query, Date.now(), JSON.stringify(products)]);

export async function addEntry(db: SQLiteDatabase, p: Product, grams: number, meal: string) {
  const f = grams / 100;
  await db.runAsync(
    'INSERT INTO entries(code,name,grams,meal,day,kcal,protein,carbs,fat) VALUES(?,?,?,?,?,?,?,?,?)',
    [p.code, p.name, grams, meal, today(), (p.kcal ?? 0) * f, (p.protein ?? 0) * f, (p.carbs ?? 0) * f, (p.fat ?? 0) * f]);
}
export const getEntries = (db: SQLiteDatabase, day = today()) =>
  db.getAllAsync<Entry>('SELECT * FROM entries WHERE day = ? ORDER BY id DESC', [day]);
export const deleteEntry = (db: SQLiteDatabase, id: number) => db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
export async function updateEntry(db: SQLiteDatabase, id: number, grams: number) {
  const old = await db.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', [id]);
  if (!old) return;
  const f = grams / old.grams;
  await db.runAsync('UPDATE entries SET grams=?, kcal=?, protein=?, carbs=?, fat=? WHERE id=?',
    [grams, old.kcal * f, old.protein * f, old.carbs * f, old.fat * f, id]);
}
export const getGoals = async (db: SQLiteDatabase): Promise<Goals> => {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['goals']);
  if (!row) return DEFAULT_GOALS;
  try {
    const parsed: unknown = JSON.parse(row.value);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_GOALS;
    const value = parsed as Partial<Goals>;
    return {
      kcal: typeof value.kcal === 'number' && isFinite(value.kcal) && value.kcal >= 0 ? value.kcal : DEFAULT_GOALS.kcal,
      protein: typeof value.protein === 'number' && isFinite(value.protein) && value.protein >= 0 ? value.protein : DEFAULT_GOALS.protein,
      carbs: typeof value.carbs === 'number' && isFinite(value.carbs) && value.carbs >= 0 ? value.carbs : DEFAULT_GOALS.carbs,
      fat: typeof value.fat === 'number' && isFinite(value.fat) && value.fat >= 0 ? value.fat : DEFAULT_GOALS.fat,
    };
  } catch {
    return DEFAULT_GOALS;
  }
};
export const saveGoals = (db: SQLiteDatabase, goals: Goals) =>
  db.runAsync('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', ['goals', JSON.stringify(goals)]);
export const getProfileName = async (db: SQLiteDatabase) =>
  (await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['name']))?.value ?? '';
export const saveProfileName = (db: SQLiteDatabase, name: string) =>
  db.runAsync('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', ['name', name.trim()]);
export const setFavorite = (db: SQLiteDatabase, code: string, value: boolean) =>
  value ? db.runAsync('INSERT OR IGNORE INTO favorites(code) VALUES(?)', [code]) : db.runAsync('DELETE FROM favorites WHERE code=?', [code]);
export const isFavorite = (db: SQLiteDatabase, code: string) => db.getFirstAsync<{ code: string }>('SELECT code FROM favorites WHERE code=?', [code]);

export interface DayTotal { day: string; label: string; kcal: number; protein: number; carbs: number; fat: number }
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Calorias dos últimos 7 dias (dias sem registro = 0), numa única consulta agregada. */
export async function getWeek(db: SQLiteDatabase): Promise<DayTotal[]> {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const rows = await db.getAllAsync<{ day: string; kcal: number; protein: number; carbs: number; fat: number }>(
    'SELECT day, SUM(kcal) AS kcal, SUM(protein) AS protein, SUM(carbs) AS carbs, SUM(fat) AS fat FROM entries WHERE day >= ? GROUP BY day', [fmt(days[0])]);
  const map = new Map(rows.map((r) => [r.day, r]));
  return days.map((d) => ({ day: fmt(d), ...(map.get(fmt(d)) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3) }));
}
