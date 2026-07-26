import { supabase } from '../supabaseClient';

// Admin erişim kontrolü
export async function checkAdminAccess(userId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authRole =
    session?.user?.user_metadata?.role ??
    session?.user?.app_metadata?.role ??
    session?.user?.user_metadata?.is_admin ??
    session?.user?.app_metadata?.is_admin;

  if (authRole === 'admin' || authRole === 'super_admin' || authRole === true) {
    return true;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Admin erişim kontrolü hatası:', error);
    return false;
  }

  return data?.role === 'admin';
}

// Dashboard istatistikleri
export async function fetchDashboardStats() {
  const [orders, pending, products, lowStock] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0),
    supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock', 5),
  ]);
  
  return {
    totalOrders: orders.count ?? 0,
    pendingOrders: pending.count ?? 0,
    activeProducts: products.count ?? 0,
    lowStock: lowStock.count ?? 0,
  };
}

// Son siparişler
export async function fetchRecentOrders(limit = 5) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data ?? [];
}

// Son ürünler
export async function fetchRecentProducts(limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data ?? [];
}

// Tüm ürünler
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data ?? [];
}

// Tüm kategoriler
export async function fetchAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  const cats = data ?? [];
  
  // Her kategori için ürün sayısını hesapla
  const categoriesWithCount = await Promise.all(
    cats.map(async (cat) => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id);
      return { ...cat, product_count: count ?? 0 };
    })
  );
  
  return categoriesWithCount;
}

// Kategori ekle
export async function addCategory(name: string, slug: string, image?: string) {
  const insertData: Record<string, any> = { name, slug };
  if (image) insertData.image = image;
  const { error } = await supabase.from('categories').insert(insertData);
  if (error) throw error;
}

// Kategori güncelle
export async function updateCategory(id: string, name: string, slug: string, image?: string) {
  const updateData: Record<string, any> = { name, slug };
  if (image) updateData.image = image;
  const { error } = await supabase.from('categories').update(updateData).eq('id', id);
  if (error) throw error;
}

// Kategori sil
export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// Kategori görseli yükle (Supabase Storage - 'categories' bucket)
export async function uploadCategoryImage(file: File): Promise<string> {
  const fileName = `category-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('categories')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('categories')
    .getPublicUrl(data.path);
  
  return publicUrl;
}

// =====================================================================
// 🌸 KULLANICI YORUM YAPMA YETKİSİ KONTROLÜ
// =====================================================================
// Siparişi teslim edilmiş (delivered) ürünler için yorum yapma hakkı
// =====================================================================

export async function checkUserCanReview(productId: string, userId: string): Promise<boolean> {
  try {
    // Kullanıcının bu ürünü içeren teslim edilmiş siparişlerini kontrol et
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        order_items!inner (
          product_id
        )
      `)
      .eq('user_id', userId)
      .eq('order_items.product_id', productId)
      .eq('status', 'delivered');

    if (error) {
      console.error('Yorum yetki kontrolü hatası:', error);
      return false;
    }

    // Eğer teslim edilmiş bir sipariş varsa yorum yapabilir
    return data && data.length > 0;
  } catch (error) {
    console.error('Yorum yetki kontrolü sırasında hata:', error);
    return false;
  }
}

// Ürün ekle
export async function addProduct(productData: any) {
  const { error } = await supabase.from('products').insert(productData);
  if (error) throw error;
}

// Ürün güncelle
export async function updateProduct(id: string, updates: any) {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  if (error) throw error;
}

// Ürün sil
export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Tüm siparişler
export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .order('created_at', { ascending: false });
  
  console.log('fetchAllOrders - data:', data);
  console.log('fetchAllOrders - error:', error);
  
  if (error) {
    if (error.code === 'PGRST205') {
      console.log('Orders tablosu henüz oluşturulmadı');
      return [];
    }
    throw error;
  }
  return data ?? [];
}

// Sipariş durumu ve opsiyonel kargo takip numarası güncelle
export async function updateOrderStatus(id: string, status: string, trackingNumber?: string) {
  const normalizedStatus = normalizeOrderStatus(status);
  
  // Güncellenecek veriyi hazırlıyoruz
  const updatePayload: { status: string; tracking_number?: string } = {
    status: normalizedStatus,
  };

  // Eğer kargo takip numarası parametre olarak geldiyse payload'a ekliyoruz
  if (trackingNumber !== undefined) {
    updatePayload.tracking_number = trackingNumber;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select('id, status, tracking_number')
    .limit(1);

  if (error) {
    const message = error.message || 'Sipariş durumu güncellenemedi.';
    if (error.code === '42501' || /permission|policy/i.test(message)) {
      throw new Error(`Sipariş durumu güncellenemedi. Supabase RLS politikalarını kontrol edin. ${message}`);
    }
    throw new Error(message);
  }

  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

export function normalizeOrderStatus(status: string): string {
  const value = (status || '').toLowerCase();

  if (['pending', 'beklemede', 'bekliyor'].includes(value)) return 'pending';
  if (['processing', 'işleniyor', 'hazırlanıyor'].includes(value)) return 'processing';
  if (['shipped', 'kargoda', 'yolda'].includes(value)) return 'shipped';
  if (['delivered', 'teslim', 'teslim edildi'].includes(value)) return 'delivered';
  if (['cancelled', 'iptal', 'iptal edildi'].includes(value)) return 'cancelled';

  return 'pending';
}

/**
 * Supabase'de İngilizce olarak saklanan sipariş durumunu
 * Türkçe'ye çevirir. (pending → Hazırlanıyor, delivered → Teslim Edildi, vb.)
 */
export function normalizeOrderStatusToTurkish(status: string): 'Hazırlanıyor' | 'Yola Çıktı' | 'Teslim Edildi' | 'İptal Edildi' {
  const value = (status || '').toLowerCase();

  if (['pending', 'beklemede', 'bekliyor', 'hazırlanıyor', 'preparing', 'processing', 'işleniyor'].includes(value)) return 'Hazırlanıyor';
  if (['shipped', 'kargoda', 'yolda', 'yola çıktı'].includes(value)) return 'Yola Çıktı';
  if (['delivered', 'teslim', 'teslim edildi'].includes(value)) return 'Teslim Edildi';
  if (['cancelled', 'iptal', 'iptal edildi'].includes(value)) return 'İptal Edildi';

  return 'Hazırlanıyor';
}

// Slugify fonksiyonu
export function slugify(input: string): string {
  const map: Record<string, string> = { 
    ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', 
    Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' 
  };
  return input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// =====================================================================
// 🌸 ÜRÜN YORUMLARI
// =====================================================================

import type { Review, ReviewStats } from '../types';

// Ürün yorumlarını getir (sadece onaylanmış)
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      console.log('Reviews tablosu henüz oluşturulmadı');
      return [];
    }
    console.error('Yorumlar çekilirken hata:', error);
    return [];
  }

  return data ?? [];
}

export type ProductReviewSummary = {
  rating: number;
  reviewCount: number;
};

// Tüm ürünler için onaylı yorum istatistiklerini tek sorguda getir
export async function fetchAllProductReviewStats(): Promise<Map<string, ProductReviewSummary>> {
  const { data, error } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .eq('is_approved', true);

  if (error) {
    if (error.code === 'PGRST205') {
      console.log('Reviews tablosu henüz oluşturulmadı');
      return new Map();
    }
    console.error('Yorum istatistikleri çekilirken hata:', error);
    return new Map();
  }

  const aggregates = new Map<string, { sum: number; count: number }>();

  for (const row of data ?? []) {
    const current = aggregates.get(row.product_id) ?? { sum: 0, count: 0 };
    current.sum += row.rating;
    current.count += 1;
    aggregates.set(row.product_id, current);
  }

  const result = new Map<string, ProductReviewSummary>();
  for (const [productId, { sum, count }] of aggregates) {
    result.set(productId, {
      rating: Math.round((sum / count) * 10) / 10,
      reviewCount: count,
    });
  }

  return result;
}

// Ürün için yorum istatistiklerini hesapla
export async function fetchProductReviewStats(productId: string): Promise<ReviewStats> {
  const reviews = await fetchProductReviews(productId);

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    averageRating: Math.round((sum / total) * 10) / 10,
    totalReviews: total,
    ratingDistribution: distribution,
  };
}

// Tüm yorumları getir (admin - onay bekleyenler dahil)
export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      console.log('Reviews tablosu henüz oluşturulmadı');
      return [];
    }
    throw error;
  }

  return data ?? [];
}

// Yeni yorum ekle
export async function addReview(review: {
  product_id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  photo_url?: string | null;
}): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: review.product_id,
      user_id: review.user_id || null,
      user_name: review.user_name,
      rating: review.rating,
      comment: review.comment,
      photo_url: review.photo_url || null,
      is_approved: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Yorum onayla / onayı kaldır
export async function updateReviewApproval(id: string, isApproved: boolean): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Yorum sil
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

// Yorum fotoğrafı yükle (reviews storage bucket)
export async function uploadReviewPhoto(file: File): Promise<string> {
  const fileName = `review-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('reviews')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('reviews')
    .getPublicUrl(data.path);

  return publicUrl;
}

