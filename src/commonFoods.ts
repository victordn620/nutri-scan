import type { Product } from './types';

type CommonFood = {
  names: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  saturatedFat: number;
  sugars: number;
};

export const COMMON_FOODS: CommonFood[] = [
  { names: ['arroz', 'arroz branco', 'arroz cozido'], kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 0.4, sodium: 1, saturatedFat: 0.1, sugars: 0.1 },
  { names: ['arroz integral', 'arroz integral cozido'], kcal: 124, protein: 2.7, carbs: 25.8, fat: 1, fiber: 2.7, sodium: 4, saturatedFat: 0.2, sugars: 0.2 },
  { names: ['feijao', 'feijão', 'feijao cozido', 'feijão cozido'], kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, sodium: 2, saturatedFat: 0.1, sugars: 0.3 },
  { names: ['frango', 'peito de frango', 'frango grelhado', 'frango cozido'], kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74, saturatedFat: 1, sugars: 0 },
  { names: ['carne', 'bife', 'carne bovina', 'carne grelhada'], kcal: 217, protein: 26, carbs: 0, fat: 12, fiber: 0, sodium: 72, saturatedFat: 5, sugars: 0 },
  { names: ['ovo', 'ovo cozido', 'ovo mexido'], kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6, fiber: 0, sodium: 124, saturatedFat: 3.3, sugars: 1.1 },
  { names: ['batata', 'batata cozida'], kcal: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8, sodium: 7, saturatedFat: 0, sugars: 0.9 },
  { names: ['batata frita', 'fritas'], kcal: 312, protein: 3.4, carbs: 41.4, fat: 15, fiber: 3.8, sodium: 210, saturatedFat: 2.3, sugars: 0.3 },
  { names: ['salada', 'alface', 'alface e tomate'], kcal: 18, protein: 1.2, carbs: 3.5, fat: 0.2, fiber: 1.8, sodium: 16, saturatedFat: 0, sugars: 1.7 },
  { names: ['tomate'], kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sodium: 5, saturatedFat: 0, sugars: 2.6 },
  { names: ['cenoura'], kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sodium: 69, saturatedFat: 0, sugars: 4.7 },
  { names: ['brócolis', 'brocolis'], kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, sodium: 41, saturatedFat: 0.1, sugars: 1.4 },
  { names: ['banana'], kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sodium: 1, saturatedFat: 0.1, sugars: 12.2 },
  { names: ['maça', 'maçã'], kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sodium: 1, saturatedFat: 0, sugars: 10.4 },
  { names: ['laranja'], kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sodium: 0, saturatedFat: 0, sugars: 9.4 },
  { names: ['morango', 'morangos'], kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sodium: 1, saturatedFat: 0, sugars: 4.9 },
  { names: ['uva', 'uvas'], kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sodium: 2, saturatedFat: 0.1, sugars: 15.5 },
  { names: ['abacaxi'], kcal: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, sodium: 1, saturatedFat: 0, sugars: 9.9 },
  { names: ['pão', 'pao', 'pão francês', 'pao frances'], kcal: 300, protein: 8.1, carbs: 58.6, fat: 3.1, fiber: 2.3, sodium: 529, saturatedFat: 0.7, sugars: 2.1 },
  { names: ['pão integral', 'pao integral'], kcal: 247, protein: 13, carbs: 41, fat: 4.2, fiber: 7, sodium: 400, saturatedFat: 0.7, sugars: 6 },
  { names: ['macarrao', 'macarrão', 'massa', 'espaguete'], kcal: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8, sodium: 1, saturatedFat: 0.2, sugars: 0.6 },
  { names: ['pizza'], kcal: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.3, sodium: 598, saturatedFat: 4.1, sugars: 3.6 },
  { names: ['hamburguer', 'hambúrguer', 'hamburger', 'carne de hamburguer'], kcal: 295, protein: 17, carbs: 24, fat: 14, fiber: 1.2, sodium: 414, saturatedFat: 5.2, sugars: 3.8 },
  { names: ['queijo'], kcal: 350, protein: 23, carbs: 2.7, fat: 28, fiber: 0, sodium: 621, saturatedFat: 18, sugars: 0.5 },
  { names: ['queijo prato'], kcal: 290, protein: 23, carbs: 2.6, fat: 21, fiber: 0, sodium: 650, saturatedFat: 13, sugars: 0.5 },
  { names: ['bacon'], kcal: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sodium: 1717, saturatedFat: 15, sugars: 0 },
  { names: ['iogurte', 'iogurte natural'], kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sodium: 46, saturatedFat: 2.1, sugars: 4.7 },
  { names: ['leite'], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sodium: 43, saturatedFat: 1.9, sugars: 5.1 },
  { names: ['manteiga'], kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sodium: 11, saturatedFat: 51, sugars: 0.1 },
  { names: ['aveia'], kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sodium: 2, saturatedFat: 1.2, sugars: 0.9 },
  { names: ['abacate'], kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sodium: 7, saturatedFat: 2.1, sugars: 0.7 },
  { names: ['pepino'], kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sodium: 2, saturatedFat: 0, sugars: 1.7 },
  { names: ['milho', 'milho cozido'], kcal: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, sodium: 15, saturatedFat: 0.2, sugars: 4.5 },
  { names: ['ervilha'], kcal: 81, protein: 5.4, carbs: 14.4, fat: 0.4, fiber: 5.7, sodium: 5, saturatedFat: 0.1, sugars: 5.7 },
  { names: ['salmão', 'salmao', 'peixe'], kcal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59, saturatedFat: 3.1, sugars: 0 },
  { names: ['lentilha', 'lentilha cozida'], kcal: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9, sodium: 2, saturatedFat: 0.1, sugars: 1.8 },
  { names: ['grão de bico', 'grao de bico'], kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sodium: 7, saturatedFat: 0.3, sugars: 4.8 },
  { names: ['sanduiche', 'sanduíche'], kcal: 250, protein: 12, carbs: 28, fat: 10, fiber: 2, sodium: 450, saturatedFat: 3.5, sugars: 4 },
];

export const normalizeFoodName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export function findCommonFood(name: string): Product | null {
  const query = normalizeFoodName(name);
  if (!query) return null;
  const queryTerms = query.split(' ').filter((term) => term.length >= 2);
  let best: { food: CommonFood; score: number } | null = null;

  for (const food of COMMON_FOODS) {
    for (const alias of food.names) {
      const normalizedAlias = normalizeFoodName(alias);
      const exact = normalizedAlias === query;
      const aliasContainsQuery = normalizedAlias.includes(query);
      const queryContainsAlias = query.includes(normalizedAlias);
      const termsMatch = queryTerms.every((term) => normalizedAlias.includes(term));
      const score = exact ? 100 : aliasContainsQuery || queryContainsAlias ? 70 : termsMatch ? 50 : 0;
      if (score > (best?.score ?? -1)) best = { food, score };
    }
  }

  if (!best) return null;
  const food = best.food;
  const displayName = food.names.find((item) => normalizeFoodName(item) === normalizeFoodName(name))
    ?? food.names[0];
  return {
    code: `local:${normalizeFoodName(displayName).replaceAll(' ', '-')}`,
    name: displayName,
    brand: 'Estimativa local',
    image: null,
    quantity: '100 g',
    kcal: food.kcal,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    sodium: food.sodium,
    saturatedFat: food.saturatedFat,
    sugars: food.sugars,
  };
}
