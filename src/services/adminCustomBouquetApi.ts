import { supabase } from '../supabaseClient';
import type { StemFlowerDB, BouquetWrapperDB, BouquetVaseDB } from './customBouquetService';

// 🌸 ALL STEM FLOWERS (Admin için pasifler dahil)
export async function fetchAllAdminStemFlowers(): Promise<StemFlowerDB[]> {
  const { data, error } = await supabase
    .from('stem_flowers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Çiçekler çekilirken hata:', error);
    return [];
  }
  return data || [];
}

// 🌸 Yeni Çiçek Ekle veya Güncelle
export async function saveStemFlower(flower: Partial<StemFlowerDB>) {
  if (flower.id) {
    const { data, error } = await supabase
      .from('stem_flowers')
      .update({
        name: flower.name,
        category: flower.category,
        price: flower.price,
        stock: flower.stock,
        image_url: flower.image_url,
        is_active: flower.is_active,
      })
      .eq('id', flower.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('stem_flowers')
      .insert({
        name: flower.name,
        category: flower.category || 'Genel',
        price: flower.price || 0,
        stock: flower.stock || 0,
        image_url: flower.image_url || '',
        is_active: flower.is_active ?? true,
      })
      .select();
    if (error) throw error;
    return data;
  }
}

// 🌸 Çiçek Sil
export async function deleteStemFlower(id: string) {
  const { error } = await supabase.from('stem_flowers').delete().eq('id', id);
  if (error) throw error;
}

// 🌸 Stok Hızlı Güncelleme
export async function updateFlowerStock(id: string, newStock: number) {
  const { error } = await supabase
    .from('stem_flowers')
    .update({ stock: newStock })
    .eq('id', id);
  if (error) throw error;
}