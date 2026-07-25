import { supabase } from '../supabaseClient';
import type { Product, Category } from '../types';

// Supabase tablo tipleri
type SupabaseCategory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type SupabaseProduct = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
};

// Supabase Category → App Category mapping
const mapCategory = (cat: SupabaseCategory): Category => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  description: cat.name, // Supabase'de description yok, name kullanıyoruz
  image: 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600', // Varsayılan görsel
  icon: 'Flower2', // Varsayılan icon
});

// Supabase Product → App Product mapping
const mapProduct = (prod: SupabaseProduct): Product => ({
  id: prod.id,
  name: prod.name,
  slug: prod.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), // name'den slug oluştur
  categoryId: prod.category_id,
  price: prod.price,
  oldPrice: undefined, // Supabase'de yok
  images: prod.image_url ? [prod.image_url] : ['https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=800'],
  description: prod.description || '',
  longDescription: prod.description || '',
  ingredients: [], // Supabase'de yok
  rating: 4.5, // Varsayılan
  reviewCount: 0, // Varsayılan
  badge: undefined,
  inStock: prod.stock_quantity > 0,
  deliveryInfo: prod.stock_quantity > 0 ? 'Aynı gün teslimat' : 'Stokta yok',
});

// Supabase'den kategorileri çek
export async function fetchCategoriesFromSupabase(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return data ? data.map(mapCategory) : [];
  } catch (error) {
    console.error('Kategoriler çekilirken hata:', error);
    return [];
  }
}

// Supabase'den ürünleri çek
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }); // Show newest first

    if (error) throw error;

    return data ? data.map(mapProduct) : [];
  } catch (error) {
    console.error('Ürünler çekilirken hata:', error);
    return [];
  }
}

// Kategoriye göre ürünleri çek
export async function fetchProductsByCategoryFromSupabase(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;

    return data ? data.map(mapProduct) : [];
  } catch (error) {
    console.error('Kategori ürünleri çekilirken hata:', error);
    return [];
  }
}
