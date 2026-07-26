import { supabase } from '../supabaseClient';
import { fetchAllProductReviewStats } from './adminApi';
import type { Product, Category } from '../types';

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
  rating: 0,
  reviewCount: 0,
  badge: undefined,
  inStock: prod.stock_quantity > 0,
  deliveryInfo: prod.stock_quantity > 0 ? 'Aynı gün teslimat' : 'Stokta yok',
});

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

// Supabase'den ürünleri çek
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    return await fetchActiveProducts(() =>
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    );
  } catch (error) {
    console.error('Ürünler çekilirken hata:', error);
    return [];
  }
}

// Kategoriye göre ürünleri çek
export async function fetchProductsByCategoryFromSupabase(categoryId: string): Promise<Product[]> {
  try {
    return await fetchActiveProducts(() =>
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .order('name'),
    );
  } catch (error) {
    console.error('Kategori ürünleri çekilirken hata:', error);
    return [];
  }
}
