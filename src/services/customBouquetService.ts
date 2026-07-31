import { supabase } from '../supabaseClient';

export interface StemFlowerDB {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export interface BouquetWrapperDB {
  id: string;
  name: string;
  price: number;
  color_hex: string;
  is_active: boolean;
}

export interface BouquetVaseDB {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

// 🌸 1. Tüm Aktif Çiçekleri Çek
export async function fetchStemFlowers(): Promise<StemFlowerDB[]> {
  const { data, error } = await supabase
    .from('stem_flowers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Çiçekler çekilirken hata:', error);
    return [];
  }
  return data || [];
}

// 🌸 2. Tüm Aktif Ambalajları Çek
export async function fetchBouquetWrappers(): Promise<BouquetWrapperDB[]> {
  const { data, error } = await supabase
    .from('bouquet_wrappers')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Ambalajlar çekilirken hata:', error);
    return [];
  }
  return data || [];
}

// 🌸 3. Tüm Aktif Vazoları Çek
export async function fetchBouquetVases(): Promise<BouquetVaseDB[]> {
  const { data, error } = await supabase
    .from('bouquet_vases')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Vazolar çekilirken hata:', error);
    return [];
  }
  return data || [];
}