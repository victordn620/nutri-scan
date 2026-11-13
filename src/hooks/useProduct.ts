import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { fetchProduct } from '../api';
import { getProduct, isFavorite, upsertProducts } from '../db';
import type { Product } from '../types';

export type ProductState =
  | { status: 'loading' }
  | { status: 'ok'; product: Product; favorite: boolean }
  | { status: 'notfound' }
  | { status: 'error' };

export function useProduct(code: string, retryKey: number): ProductState {
  const db = useSQLiteContext();
  const [state, setState] = useState<ProductState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    (async () => {
      try {
        let product = await getProduct(db, code);
        if (!product) product = await fetchProduct(code, controller.signal);
        if (!product) {
          setState({ status: 'notfound' });
          return;
        }
        await upsertProducts(db, [product], true);
        setState({ status: 'ok', product, favorite: Boolean(await isFavorite(db, product.code)) });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState({ status: 'error' });
      }
    })();
    return () => controller.abort();
  }, [code, db, retryKey]);

  return state;
}
