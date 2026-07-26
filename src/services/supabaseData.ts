import { supabase } from '../supabaseClient';
import type { Product, Category } from '../types';
import { transformApiOrders } from './dataAdapter';
import type { OrderInfo } from '../types';

// Supabase tablo tipleri
type SupabaseCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
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
const DEFAULT_CATEGORY_IMAGE = 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600';

const mapCategory = (cat: SupabaseCategory): Category => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  description: cat.description || cat.name,
  image: cat.image || DEFAULT_CATEGORY_IMAGE,
  icon: 'Flower2',
});

// Supabase Product → App Product mapping
const mapProduct = (prod: SupabaseProduct): Product => ({
  id: prod.id,
  name: prod.name,
  slug: prod.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  categoryId: prod.category_id,
  price: prod.price,
  oldPrice: undefined,
  images: prod.image_url ? [prod.image_url] : ['https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=800'],
  description: prod.description || '',
  longDescription: prod.description || '',
  ingredients: [],
  rating: 4.5,
  reviewCount: 0,
  badge: undefined,
  inStock: prod.stock_quantity > 0, // 🌸 Stok 0 ise inStock false olur, ProductCard "TÜKENDİ" basar!
  deliveryInfo: prod.stock_quantity > 0 ? 'Aynı gün teslimat' : 'Stokta yok',
  stock: prod.stock_quantity,
  stock_quantity: prod.stock_quantity,
} as Product);

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

// 🌸 Supabase'den ürünleri çek (is_active filtresi kaldırıldı, tüm ürünler çekiliyor)
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data ? data.map(mapProduct) : [];
  } catch (error) {
    console.error('Ürünler çekilirken hata:', error);
    return [];
  }
}

// 🌸 Kategoriye göre ürünleri çek (is_active filtresi kaldırıldı)
export async function fetchProductsByCategoryFromSupabase(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;

    return data ? data.map(mapProduct) : [];
  } catch (error) {
    console.error('Kategori ürünleri çekilirken hata:', error);
    return [];
  }
}

export async function fetchOrdersFromSupabase(): Promise<Record<string, OrderInfo>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase sipariş çekme hatası:', error);
      return {};
    }

    if (!data || data.length === 0) return {};

    // Ham veriyi adaptörden geçirip OrderInfo objelerine dönüştürüyoruz
    const formattedOrders = transformApiOrders(data);

    // Record<string, OrderInfo> formatına çeviriyoruz
    const ordersMap: Record<string, OrderInfo> = {};
    formattedOrders.forEach((order) => {
      ordersMap[order.id] = order;
    });

    return ordersMap;
  } catch (err) {
    console.error('Sipariş yüklenirken beklenmeyen hata:', err);
    return {};
  }
}

export async function decreaseProductStock(productId: string, quantity: number) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    console.error('Stok bilgisi alınamadı:', fetchError);
    return;
  }

  const newStock = Math.max(0, product.stock_quantity - quantity);

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', productId);

  if (updateError) {
    console.error('Stok güncellenirken hata oluştu:', updateError);
  }
}