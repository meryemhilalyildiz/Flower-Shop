import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import type { Product } from './types';

const STORAGE_KEY = 'cicekci-favorites';

type FavoriteRecord = {
  product_id: string;
};

function loadFromLocalStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set<string>();
    const arr: FavoriteRecord[] = JSON.parse(stored);
    return new Set(arr.map((f) => f.product_id));
  } catch {
    return new Set<string>();
  }
}

function saveToLocalStorage(ids: Set<string>) {
  const arr: FavoriteRecord[] = Array.from(ids).map((product_id) => ({ product_id }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(loadFromLocalStorage);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const fetchFromSupabase = useCallback(async (uid: string): Promise<Set<string> | null> => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Favoriler çekilirken hata (localStorage kullanılacak):', error.message);
        return null;
      }

      return new Set<string>((data || []).map((f: FavoriteRecord) => f.product_id));
    } catch (err) {
      console.warn('Favoriler çekme hatası:', err);
      return null;
    }
  }, []);

  const syncLocalStorageToSupabase = useCallback(async (uid: string, localIds: Set<string>): Promise<Set<string>> => {
    const supabaseIds = await fetchFromSupabase(uid);

    if (supabaseIds === null) {
      return localIds;
    }

    if (localIds.size > 0) {
      const toAdd = Array.from(localIds).filter((id) => !supabaseIds.has(id));
      if (toAdd.length > 0) {
        const inserts = toAdd.map((product_id) => ({ user_id: uid, product_id }));
        const { error } = await supabase.from('favorites').insert(inserts);
        if (error) {
          console.warn('Favoriler senklenirken hata (localStorage korunuyor):', error.message);
        }
      }
    }

    return new Set<string>([...supabaseIds, ...localIds]);
  }, [fetchFromSupabase]);

  const handleAuthSession = useCallback(async (uid: string | null) => {
    userIdRef.current = uid;
    setUserId(uid);

    if (uid) {
      setLoading(true);
      const localIds = loadFromLocalStorage();
      const merged = await syncLocalStorageToSupabase(uid, localIds);
      setFavorites(merged);
      saveToLocalStorage(merged);
      setLoading(false);
    } else {
      setFavorites(loadFromLocalStorage());
    }
  }, [syncLocalStorageToSupabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      handleAuthSession(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await handleAuthSession(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [handleAuthSession]);

  const addFavorite = useCallback(async (product: Product) => {
    const productId = product.id;

    setFavorites((prev) => {
      const next = new Set(prev);
      next.add(productId);
      saveToLocalStorage(next);
      return next;
    });

    const uid = userIdRef.current;
    if (uid) {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: uid, product_id: productId });

      if (error && error.code !== '23505') {
        console.warn('Supabase favori kaydı başarısız (localStorage korunuyor):', error.message);
      }
    }

    return true;
  }, []);

  const removeFavorite = useCallback(async (productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      saveToLocalStorage(next);
      return next;
    });

    const uid = userIdRef.current;
    if (uid) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', uid)
        .eq('product_id', productId);

      if (error) {
        console.warn('Supabase favori silme başarısız (localStorage korunuyor):', error.message);
      }
    }

    return true;
  }, []);

  const toggleFavorite = useCallback(async (product: Product) => {
    if (favorites.has(product.id)) {
      return removeFavorite(product.id);
    }
    return addFavorite(product);
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

  return {
    favorites: Array.from(favorites),
    favoriteIds: favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    favoriteCount: favorites.size,
    loading,
    userId,
  };
}
