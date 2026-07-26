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
