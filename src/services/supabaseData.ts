import { supabase } from '../supabaseClient';
import { fetchAllProductReviewStats } from './adminApi';
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
  original_price?: number | null;
  rating?: number;
  reviews_count?: number;
  image: string;
  stock: number;
  is_best_seller?: boolean;
  is_featured?: boolean;
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
  oldPrice: prod.original_price ? Number(prod.original_price) : undefined,
  images: prod.image ? [prod.image] : ['https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=800'],
  description: prod.description || '',
  longDescription: prod.description || '',
  ingredients: [],
  rating: prod.rating ?? 0,
  reviewCount: prod.reviews_count ?? 0,
  badge: prod.is_best_seller ? 'Çok Satan' : undefined,
  inStock: prod.stock > 0, // 🌸 Stok 0 ise inStock false olur, ProductCard "TÜKENDİ" basar!
  deliveryInfo: prod.stock > 0 ? 'Aynı gün teslimat' : 'Stokta yok',
  stock: prod.stock,
  stock_quantity: prod.stock,
} as Product);

function applyReviewStats(
  products: Product[],
  reviewStats: Map<string, { rating: number; reviewCount: number }>,
): Product[] {
  return products.map((product) => {
    const stats = reviewStats.get(product.id);
    if (!stats) return product;
    return {
      ...product,
      rating: stats.rating,
      reviewCount: stats.reviewCount,
    };
  });
}

async function fetchActiveProducts(
  fetchRows: () => PromiseLike<{ data: SupabaseProduct[] | null; error: Error | null }>,
): Promise<Product[]> {
  const [{ data, error }, reviewStats] = await Promise.all([
    fetchRows(),
    fetchAllProductReviewStats(),
  ]);

  if (error) throw error;

  const products = data ? data.map(mapProduct) : [];
  return applyReviewStats(products, reviewStats);
}

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
// ⭐ Yıldız puanları gerçek yorumlardan (reviews tablosu) hesaplanır, mock data yok!
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const [{ data, error }, reviewStats] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price, original_price, category_id, stock, image, is_best_seller, is_featured, freshness_score, vase_life_days'),
    fetchAllProductReviewStats(),
  ]);

  if (error) {
    console.error('Supabase ürün çekme hatası:', error);
    return [];
  }

  return (data || []).map((item: any) => {
    const stats = reviewStats.get(item.id);
    const rating = stats ? stats.rating : 0;
    const reviewCount = stats ? stats.reviewCount : 0;
    
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      oldPrice: item.original_price ? Number(item.original_price) : undefined,
      rating: rating,
      reviewCount: reviewCount,
      categoryId: item.category_id,

      // 🌸 STOK ALANLARI (Tükendi sorununu çözen yer)
      stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : 10,
      inStock: item.stock !== undefined && item.stock !== null ? Number(item.stock) > 0 : true,

      // 🎯 TYPESCRIPT EKSİK OLAN ALANLAR (Hatanı çözen yer)
      longDescription: item.description || '',
      ingredients: [],
      deliveryInfo: 'Aynı gün teslimat seçeneği ile kapınızda.',

      images: [item.image || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80'],
      slug: item.id.toString(),
      badge: item.is_best_seller ? 'Çok Satan' : undefined,
    };
  });
}

// 🌸 Kategoriye göre ürünleri çek (is_active filtresi kaldırıldı)
export async function fetchProductsByCategoryFromSupabase(categoryId: string): Promise<Product[]> {
  try {
    return await fetchActiveProducts(() =>
      supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .order('name'),
    );
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
    .select('stock')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    console.error('Stok bilgisi alınamadı:', fetchError);
    return;
  }

  const newStock = Math.max(0, product.stock - quantity);

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);

  if (updateError) {
    console.error('Stok güncellenirken hata oluştu:', updateError);
  }
}

// =====================================================================
// 🌿 Botanik Wiki — bir bakım rehberi kartı birden fazla ürüne,
// bir ürün de birden fazla karta sahip olabilir (çoktan-çoğa).
// =====================================================================

export type WikiEntry = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
};

/** Bir ürüne atanmış tüm bakım rehberi kartlarını getirir (ürün sayfasında gösterim için). */
export async function fetchWikiEntriesForProduct(productId: string): Promise<WikiEntry[]> {
  const { data, error } = await supabase
    .from('product_wiki_entries')
    .select('wiki_entries (id, title, content, category, tags, created_at)')
    .eq('product_id', productId);

  if (error) {
    console.error('Ürüne ait bakım rehberi kartları alınamadı:', error);
    return [];
  }

  const rows = (data || []) as unknown as { wiki_entries: WikiEntry }[];
  return rows.map((row) => row.wiki_entries).filter(Boolean);
}

/** Bir wiki kartına şu an hangi ürünlerin atanmış olduğunu getirir (admin düzenleme formunu doldurmak için). */
export async function fetchProductIdsForWikiEntry(wikiEntryId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_wiki_entries')
    .select('product_id')
    .eq('wiki_entry_id', wikiEntryId);

  if (error) {
    console.error('Karta atanmış ürünler alınamadı:', error);
    return [];
  }

  return (data || []).map((row) => row.product_id);
}

/** Bir wiki kartının ürün atamalarını verilen listeyle değiştirir (eski atamalar silinip yenileri yazılır). */
export async function setWikiEntryProducts(wikiEntryId: string, productIds: string[]) {
  const { error: deleteError } = await supabase
    .from('product_wiki_entries')
    .delete()
    .eq('wiki_entry_id', wikiEntryId);

  if (deleteError) {
    console.error('Eski ürün atamaları silinemedi:', deleteError);
    return;
  }

  if (productIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('product_wiki_entries')
    .insert(productIds.map((product_id) => ({ wiki_entry_id: wikiEntryId, product_id })));

  if (insertError) {
    console.error('Yeni ürün atamaları kaydedilemedi:', insertError);
  }
}
