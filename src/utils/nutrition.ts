import type { Product } from '../types';

export const scaledValue = (value: number | null, grams: number) =>
  value == null ? null : value * grams / 100;

export const productMacros = (product: Product, grams: number) => [
  { label: 'Proteínas', value: scaledValue(product.protein, grams) ?? 0 },
  { label: 'Carboidratos', value: scaledValue(product.carbs, grams) ?? 0 },
  { label: 'Gorduras', value: scaledValue(product.fat, grams) ?? 0 },
];

export const parseGrams = (value: string) => Math.max(0, Number(value.replace(',', '.')) || 0);
