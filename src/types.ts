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
  deliveryInfo: string;
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
  items: CartItem[];
  total: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  deliveryDate: string;
  note: string;
  createdAt: string;
  status: 'Hazırlanıyor' | 'Yola Çıktı' | 'Teslim Edildi' | 'İptal Edildi';
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
  | { name: 'admin-dashboard' }
  | { name: 'admin-products' }
  | { name: 'admin-categories' }
  | { name: 'admin-orders' }
  | { name: 'admin-shipping' }
  | { name: 'admin-wiki' }
  | { name: 'admin-reviews' }
  | { name: 'admin-login' }; // 🌸 Tek Route tanımı burada bitti.

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
  customerCity: string;    // Müşteri şehri
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
