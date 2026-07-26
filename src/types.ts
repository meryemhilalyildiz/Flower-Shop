export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  images: string[];
  description: string;
  longDescription: string;
  ingredients: string[];
  rating: number;
  reviewCount: number;
  badge?: 'Yeni' | 'Çok Satan' | 'İndirim' | 'Mevsimlik';
  inStock: boolean;
  deliveryInfo: string;stock?: number;          
  stock_quantity?: number; 
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type OrderInfo = {
  id: string;
  createdAt: string;
  recipientName: string;
  recipientPhone?: string;
  address: string;
  shipping_address?: string; // Supabase sütun uyumluluğu için
  city: string;
  deliveryDate?: string;
  note?: string;
  total: number;
  status?: 'Hazırlanıyor' | 'Yola Çıktı' | 'Teslim Edildi' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  tracking_number?: string; // Kargo takip numarası
  items: Array<{
    product: Product;
    quantity: number;
  }> | CartItem[];
};

export type Route =
  | { name: 'home' }
  | { name: 'shop'; categorySlug?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'about' }
  | { name: 'contact' }
  | { name: 'faq' }
  | { name: 'orders' }
  | { name: 'favorites' }
  | { name: 'admin-login' }
  | { name: 'admin-dashboard' }
  | { name: 'admin-products' }
  | { name: 'admin-categories' }
  | { name: 'admin-orders' }
  | { name: 'admin-districts' }
  | { name: 'admin-wiki' }
  | { name: 'admin-companies' }
  | { name: 'company-dashboard' }
  | { name: 'admin-shipping' }
  | { name: 'admin-reviews' }; // 🌸 Tek Route tanımı burada bitti.

// =====================================================================
// 🌸 Kargo Ücretlendirme ve Teslimat Tarihi Hesaplama Modülü Tipleri
// =====================================================================

/**
 * Mağaza Ayarları (Admin panelinden güncellenebilir)
 * Tek kayıt tutulur (id = 1)
 */
export type StoreSettings = {
  id: number;
  city: string;            // İl (örn: "Ankara")
  district: string;        // İlçe (örn: "Çankaya")
  address: string;         // Açık adres (örn: "Kızılay Sakarya Cad.")
  latitude?: number | null;   // Koordinat (opsiyonel)
  longitude?: number | null;  // Koordinat (opsiyonel)
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Kargo Kuralı (Km aralığı, fiyat, teslimat süresi)
 * Admin panelinden eklenip düzenlenebilir
 */
export type ShippingRule = {
  id: string;
  min_km: number;          // Minimum km (örn: 0)
  max_km: number;          // Maksimum km (örn: 100)
  price: number;           // Kargo ücreti (TL)
  delivery_days: number;   // Hazırlık/Teslimat süresi (gün)
  is_active: boolean;
  sort_order: number;      // Sıralama
  created_at: string;
  updated_at: string;
};

/**
 * Kargo Hesaplama Sonucu
 * Mesafe hesaplama ve kural eşleştirme sonrası dönen değer
 */
export type ShippingCalculation = {
  distance: number;        // Hesaplanan mesafe (km)
  rule: ShippingRule | null;  // Eşleşen kargo kuralı
  shippingFee: number;     // Kargo ücreti (TL)
  deliveryDays: number;    // Teslimat süresi (gün)
  earliestDeliveryDate: string; // İlk uygun teslimat tarihi (ISO string)
  storeCity: string;       // Mağaza şehri
  storeDistrict: string;   // Mağaza ilçesi
  customerCity: string;    // Müşteri şehiri
  customerDistrict: string; // Müşteri ilçesi
};

/**
 * İl ve İlçe bilgisi (Türkiye şehir/ilçe verileri)
 */
export type City = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  name: string;
};

// =====================================================================
// 🌸 İndirim Kuponları Modülü Tipleri
// =====================================================================

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// =====================================================================
// 🌸 Kampanya Bannerları Modülü Tipleri
// =====================================================================

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  background_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string;
  bundle_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// =====================================================================
// 🌸 Kampanyalı Paketler (Bundle) Modülü Tipleri
// =====================================================================

export type Bundle = {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  original_price: number;
  bundle_price: number;
  discount_percentage: number | null;
  is_active: boolean;
  is_limited: boolean;
  stock_quantity: number | null;
  valid_from: string;
  valid_until: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BundleItem = {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product; // Ürün bilgisi (join ile gelir)
};

// =====================================================================
// 🌸 Satış Analitik & Raporlar Modülü Tipleri
// =====================================================================

export type SalesAnalytics = {
  id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
  coupon_usage: number;
  coupon_discount_total: number;
  created_at: string;
  updated_at: string;
};

export type ProductSalesAnalytics = {
  id: string;
  product_id: string;
  product_name: string;
  date: string;
  quantity_sold: number;
  revenue: number;
  created_at: string;
  updated_at: string;
};

export type CategorySalesAnalytics = {
  id: string;
  category_id: string;
  category_name: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
};

export type CouponAnalytics = {
  id: string;
  coupon_id: string;
  coupon_code: string;
  date: string;
  usage_count: number;
  discount_total: number;
  revenue_generated: number;
  created_at: string;
  updated_at: string;
};

// =====================================================================
// 🌸 ÜRÜN YORUMLARI TİPLERİ
// =====================================================================

/**
 * Ürün yorumu
 */
export type Review = {
  id: string;
  product_id: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  comment: string;
  photo_url?: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Ürün için yorum istatistikleri
 */
export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // {1: 5, 2: 3, 3: 10, 4: 20, 5: 30}
};
