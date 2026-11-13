export type Meal = 'Café da manhã' | 'Almoço' | 'Jantar' | 'Lanche';
export const MEALS: Meal[] = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'];

/** Valores nutricionais sempre por 100 g */
export interface Product {
  code: string; name: string; brand: string; image: string | null;
  quantity: string | null; saturatedFat: number | null; sugars: number | null;
  kcal: number | null; protein: number | null; carbs: number | null; fat: number | null;
  fiber: number | null; sodium: number | null;
}
export interface Entry {
  id: number; code: string; name: string; grams: number; meal: Meal; day: string;
  kcal: number; protein: number; carbs: number; fat: number;
}
export type Goals = { kcal: number; protein: number; carbs: number; fat: number };
export const DEFAULT_GOALS: Goals = { kcal: 2000, protein: 75, carbs: 250, fat: 65 };
export const GOALS = DEFAULT_GOALS;
