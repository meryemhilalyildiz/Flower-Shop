import { supabase } from '../supabaseClient';

// Admin erişim kontrolü
export async function checkAdminAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  
  if (error || !data) return false;
  return data.role === 'admin';
}

// B2B özelliklerini kaldırmak için SQL komutları
// Supabase SQL Editor'da sırayla çalıştırın:
/*
-- 1. Önce company rolündeki kullanıcıları customer rolüne güncelle
UPDATE public.profiles 
SET role = 'customer' 
WHERE role = 'company';

-- 2. Company rolünü constraint'ten kaldır
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check,
ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'customer'::text]));

-- 3. B2B alanlarını kaldır
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS company_name,
DROP COLUMN IF EXISTS is_approved;
*/

// Dashboard istatistikleri
export async function fetchDashboardStats() {
  const [orders, pending, products, lowStock] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 5),
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
export async function addCategory(name: string, slug: string) {
  const { error } = await supabase.from('categories').insert({ name, slug });
  if (error) throw error;
}

// Kategori güncelle
export async function updateCategory(id: string, name: string, slug: string) {
  const { error } = await supabase.from('categories').update({ name, slug }).eq('id', id);
  if (error) throw error;
}

// Kategori sil
export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
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

// Sipariş durumu güncelle
export async function updateOrderStatus(id: string, status: string) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
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
