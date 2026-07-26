/**
 * =====================================================================
 * 🌸 Kargo Ücretlendirme ve Teslimat Tarihi Hesaplama Servisi
 * =====================================================================
 *
 * Bu servis şunları sağlar:
 * 1. Mağaza ayarlarını (konum) Supabase'den çekme
 * 2. Kargo kurallarını (km aralıkları, fiyat, süre) Supabase'den çekme
 * 3. İki şehir arası mesafeyi Haversine formülü ile hesaplama
 * 4. Mesafeye göre uygun kargo kuralını eşleştirme
 * 5. İlk uygun teslimat tarihini hesaplama
 *
 * Offline geliştirme için varsayılan veriler içerir.
 * =====================================================================
 */

import { supabase } from '../supabaseClient';
import type { StoreSettings, ShippingRule, ShippingCalculation } from '../types';

// =====================================================================
// 🌍 Türkiye 81 İl Koordinatları (Merkez koordinatları)
// Haversine formülü için gerekli
// =====================================================================
const TURKEY_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Adana': { lat: 37.0017, lng: 35.3213 },
  'Adıyaman': { lat: 37.7648, lng: 38.2766 },
  'Afyonkarahisar': { lat: 38.6245, lng: 30.5393 },
  'Ağrı': { lat: 39.7203, lng: 43.0566 },
  'Amasya': { lat: 40.6498, lng: 35.8818 },
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Artvin': { lat: 41.1828, lng: 41.7280 },
  'Aydın': { lat: 37.8444, lng: 27.8458 },
  'Balıkesir': { lat: 39.6484, lng: 29.6689 },
  'Bilecik': { lat: 40.0567, lng: 30.0665 },
  'Bingöl': { lat: 39.0907, lng: 40.4879 },
  'Bitlis': { lat: 38.4072, lng: 41.9428 },
  'Bolu': { lat: 40.7360, lng: 31.6037 },
  'Burdur': { lat: 37.4613, lng: 30.3288 },
  'Bursa': { lat: 40.1885, lng: 29.0610 },
  'Çanakkale': { lat: 39.6484, lng: 26.4015 },
  'Çankırı': { lat: 40.6037, lng: 31.4181 },
  'Çorum': { lat: 40.8039, lng: 34.6253 },
  'Denizli': { lat: 37.9293, lng: 29.0908 },
  'Diyarbakır': { lat: 37.9144, lng: 40.2306 },
  'Edirne': { lat: 41.6824, lng: 26.5626 },
  'Elazığ': { lat: 38.5083, lng: 39.2566 },
  'Erzincan': { lat: 39.7512, lng: 39.4991 },
  'Erzurum': { lat: 39.9043, lng: 41.2769 },
  'Eskişehir': { lat: 39.7702, lng: 30.8156 },
  'Gaziantep': { lat: 37.0662, lng: 37.3833 },
  'Giresun': { lat: 41.1334, lng: 38.9121 },
  'Gümüşhane': { lat: 41.4686, lng: 39.4814 },
  'Hakkari': { lat: 37.5730, lng: 43.7422 },
  'Hatay': { lat: 36.2021, lng: 36.1584 },
  'Isparta': { lat: 37.7681, lng: 30.5158 },
  'Mersin': { lat: 36.8000, lng: 34.6333 },
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'İzmir': { lat: 38.4192, lng: 27.1287 },
  'Kars': { lat: 40.6052, lng: 43.0964 },
  'Kastamonu': { lat: 41.3882, lng: 32.6204 },
  'Kayseri': { lat: 38.7244, lng: 34.9236 },
  'Kırklareli': { lat: 41.6665, lng: 27.2150 },
  'Kırşehir': { lat: 39.1465, lng: 34.1709 },
  'Kocaeli': { lat: 40.7759, lng: 29.8677 },
  'Konya': { lat: 37.8667, lng: 32.4765 },
  'Kütahya': { lat: 39.4262, lng: 29.9715 },
  'Malatya': { lat: 38.3687, lng: 38.3099 },
  'Manisa': { lat: 38.6156, lng: 27.4310 },
  'Kahramanmaraş': { lat: 37.5833, lng: 33.4667 },
  'Mardin': { lat: 37.3212, lng: 40.7241 },
  'Muğla': { lat: 37.2231, lng: 28.3243 },
  'Muş': { lat: 39.0674, lng: 42.7689 },
  'Nevşehir': { lat: 38.6081, lng: 34.7390 },
  'Niğde': { lat: 37.9637, lng: 34.4437 },
  'Ordu': { lat: 40.9834, lng: 37.8995 },
  'Rize': { lat: 41.1251, lng: 37.2922 },
  'Sakarya': { lat: 41.2769, lng: 30.4360 },
  'Samsun': { lat: 41.2986, lng: 36.3300 },
  'Siirt': { lat: 37.9445, lng: 41.9367 },
  'Sinop': { lat: 41.7539, lng: 34.8353 },
  'Sivas': { lat: 39.6484, lng: 37.1130 },
  'Tekirdağ': { lat: 40.9726, lng: 27.5139 },
  'Tokat': { lat: 40.3786, lng: 36.5545 },
  'Trabzon': { lat: 41.0015, lng: 39.7178 },
  'Tunceli': { lat: 39.1079, lng: 39.5371 },
  'Şanlıurfa': { lat: 37.1020, lng: 38.7967 },
  'Uşak': { lat: 38.6812, lng: 29.4058 },
  'Van': { lat: 38.5056, lng: 43.3934 },
  'Yozgat': { lat: 39.8205, lng: 34.8044 },
  'Zonguldak': { lat: 41.4572, lng: 31.7863 },
  'Aksaray': { lat: 38.3764, lng: 34.0269 },
  'Bayburt': { lat: 39.9948, lng: 40.2227 },
  'Karaman': { lat: 37.1791, lng: 33.2122 },
  'Kırıkkale': { lat: 39.8468, lng: 33.5152 },
  'Batman': { lat: 37.8865, lng: 41.1316 },
  'Şırnak': { lat: 37.5164, lng: 42.4611 },
  'Bartın': { lat: 41.5811, lng: 32.4610 },
  'Ardahan': { lat: 39.6174, lng: 42.7017 },
  'Iğdır': { lat: 39.8861, lng: 44.0340 },
  'Yalova': { lat: 40.6500, lng: 29.2665 },
  'Karabük': { lat: 41.2061, lng: 32.6432 },
  'Kilis': { lat: 36.7164, lng: 37.1150 },
  'Osmaniye': { lat: 37.2130, lng: 35.2321 },
  'Düzce': { lat: 41.1621, lng: 31.5266 },
};

// =====================================================================
// 🌍 Varsayılan Mağaza Ayarları (Offline fallback)
// =====================================================================
const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  city: 'Ankara',
  district: 'Çankaya',
  address: 'Kızılay Sakarya Cad.',
  latitude: 39.9334,
  longitude: 32.8597,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// =====================================================================
// 🌍 Varsayılan Kargo Kuralları (Offline fallback)
// =====================================================================
const DEFAULT_SHIPPING_RULES: ShippingRule[] = [
  {
    id: 'default-1',
    min_km: 0,
    max_km: 100,
    price: 150,
    delivery_days: 1,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    min_km: 101,
    max_km: 300,
    price: 300,
    delivery_days: 3,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-3',
    min_km: 301,
    max_km: 600,
    price: 500,
    delivery_days: 5,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// =====================================================================
// 🌍 Haversine Formülü - İki koordinat arası mesafe (km)
// =====================================================================
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10; // 1 ondalık basamak
}

// =====================================================================
// 🌍 Şehir adından koordinat alma
// =====================================================================
function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  return TURKEY_CITY_COORDINATES[cityName] || null;
}

// =====================================================================
// 📦 Mağaza Ayarlarını Supabase'den Çekme
// =====================================================================
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.warn('Store settings çekilemedi, varsayılan kullanılıyor:', error.message);
      return DEFAULT_STORE_SETTINGS;
    }

    if (!data) {
      return DEFAULT_STORE_SETTINGS;
    }

    return {
      id: data.id,
      city: data.city,
      district: data.district,
      address: data.address || '',
      latitude: data.latitude,
      longitude: data.longitude,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.warn('Store settings hatası, varsayılan kullanılıyor:', error);
    return DEFAULT_STORE_SETTINGS;
  }
}

// =====================================================================
// 📦 Kargo Kurallarını Supabase'den Çekme
// =====================================================================
export async function fetchShippingRules(): Promise<ShippingRule[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_rules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Shipping rules çekilemedi, varsayılan kullanılıyor:', error.message);
      return DEFAULT_SHIPPING_RULES;
    }

    if (!data || data.length === 0) {
      return DEFAULT_SHIPPING_RULES;
    }

    return data.map((rule) => ({
      id: rule.id,
      min_km: Number(rule.min_km),
      max_km: Number(rule.max_km),
      price: Number(rule.price),
      delivery_days: Number(rule.delivery_days),
      is_active: rule.is_active,
      sort_order: rule.sort_order,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
    }));
  } catch (error) {
    console.warn('Shipping rules hatası, varsayılan kullanılıyor:', error);
    return DEFAULT_SHIPPING_RULES;
  }
}

// =====================================================================
// 🎯 Mesafeye Göre Kargo Kuralını Eşleştirme
// =====================================================================
export function matchShippingRule(distance: number, rules: ShippingRule[]): ShippingRule | null {
  // Kuralları sort_order'a göre sırala
  const sortedRules = [...rules].sort((a, b) => a.sort_order - b.sort_order);

  for (const rule of sortedRules) {
    if (distance >= rule.min_km && distance <= rule.max_km) {
      return rule;
    }
  }

  // Hiçbir kurala eşleşmezse, en yüksek max_km'ye sahip kuralı döndür
  // (mesafe çok büyükse bile kargo yapılabilsin)
  const lastRule = sortedRules[sortedRules.length - 1];
  if (lastRule && distance > lastRule.max_km) {
    return lastRule;
  }

  return null;
}

// =====================================================================
// 📅 İlk Uygun Teslimat Tarihini Hesaplama
// =====================================================================
export function calculateEarliestDeliveryDate(deliveryDays: number): string {
  const now = new Date();

  // 🌸 Türkiye saat diliminde (Europe/Istanbul, UTC+3) güncel tarih ve saat
  // Mağazanın bulunduğu saat dilimine göre kesici saat kontrolü yapılır
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.format(now).split(' ');
  const dateParts = parts[0].split('.');
  const timeParts = parts[1].split(':');

  const today = new Date(
    parseInt(dateParts[2]),       // year
    parseInt(dateParts[1]) - 1,   // month (0-indexed)
    parseInt(dateParts[0]),       // day
  );
  const currentHour = parseInt(timeParts[0]);

  // 🌸 Aynı gün siparişi için 16:00 kesici saati kontrol et
  // 16:00'dan sonra verilen siparişler ertesi günden itibaren hesaplanır
  const ORDER_CUTOFF_HOUR = 16;
  const isAfterCutoff = currentHour >= ORDER_CUTOFF_HOUR;

  // Teslimat süresi kadar ileri tarih + kesici saat kontrolü
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays + (isAfterCutoff ? 1 : 0));
  return deliveryDate.toISOString().split('T')[0];
}

// =====================================================================
// 📅 Belirli bir tarihten itibaren teslimat tarihi hesaplama
// =====================================================================
export function calculateDeliveryDateFromOrder(orderDate: string, deliveryDays: number): string {
  const baseDate = new Date(orderDate);
  baseDate.setHours(0, 0, 0, 0);
  const deliveryDate = new Date(baseDate);
  deliveryDate.setDate(baseDate.getDate() + deliveryDays);
  return deliveryDate.toISOString().split('T')[0];
}

// =====================================================================
// 📅 Kullanıcı için teslimat tarihi seçenekleri oluşturma
// İlk teslimat tarihinden itibaren 7 günlük seçenekler
// =====================================================================
export function generateDeliveryDateOptions(earliestDate: string, count: number = 7): string[] {
  const options: string[] = [];
  const startDate = new Date(earliestDate);
  startDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    options.push(date.toISOString().split('T')[0]);
  }

  return options;
}

// =====================================================================
// 📅 Tarih formatlama (Türkçe format)
// =====================================================================
export function formatDateTurkish(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dayName = dayNames[date.getDay()];

  return `${day} ${month} ${year} ${dayName}`;
}

// =====================================================================
// 🎯 ANA FONKSİYON: Kargo Hesaplama
// =====================================================================
export async function calculateShipping(
  customerCity: string,
  customerDistrict: string,
): Promise<ShippingCalculation> {
  // 1. Mağaza ayarlarını çek
  const storeSettings = await fetchStoreSettings();

  // 2. Kargo kurallarını çek
  const shippingRules = await fetchShippingRules();

  // 3. Mağaza koordinatlarını al
  const storeCoords = getCityCoordinates(storeSettings.city);
  if (!storeCoords) {
    throw new Error(`Mağaza şehri "${storeSettings.city}" için koordinat bulunamadı.`);
  }

  // 4. Müşteri koordinatlarını al
  const customerCoords = getCityCoordinates(customerCity);
  if (!customerCoords) {
    throw new Error(`Müşteri şehri "${customerCity}" için koordinat bulunamadı.`);
  }

  // 5. Mesafeyi hesapla
  const distance = haversineDistance(
    storeCoords.lat,
    storeCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
  );

  // 6. Kargo kuralını eşleştir
  const rule = matchShippingRule(distance, shippingRules);

  // 7. Kargo ücreti ve teslimat süresini belirle
  const shippingFee = rule ? rule.price : 0;
  const deliveryDays = rule ? rule.delivery_days : 1;

  // 8. İlk teslimat tarihini hesapla
  const earliestDeliveryDate = calculateEarliestDeliveryDate(deliveryDays);

  return {
    distance,
    rule,
    shippingFee,
    deliveryDays,
    earliestDeliveryDate,
    storeCity: storeSettings.city,
    storeDistrict: storeSettings.district,
    customerCity,
    customerDistrict,
  };
}

// =====================================================================
// 🏪 Mağaza Ayarlarını Güncelleme (Admin)
// =====================================================================
export async function updateStoreSettings(
  settings: Partial<Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>>,
): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    throw new Error(`Mağaza ayarları güncellenemedi: ${error.message}`);
  }

  return {
    id: data.id,
    city: data.city,
    district: data.district,
    address: data.address || '',
    latitude: data.latitude,
    longitude: data.longitude,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// =====================================================================
// 📦 Kargo Kuralı Ekleme (Admin)
// =====================================================================
export async function addShippingRule(rule: {
  min_km: number;
  max_km: number;
  price: number;
  delivery_days: number;
  sort_order?: number;
}): Promise<ShippingRule> {
  const { data, error } = await supabase
    .from('shipping_rules')
    .insert({
      min_km: rule.min_km,
      max_km: rule.max_km,
      price: rule.price,
      delivery_days: rule.delivery_days,
      sort_order: rule.sort_order || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Kargo kuralı eklenemedi: ${error.message}`);
  }

  return {
    id: data.id,
    min_km: Number(data.min_km),
    max_km: Number(data.max_km),
    price: Number(data.price),
    delivery_days: Number(data.delivery_days),
    is_active: data.is_active,
    sort_order: data.sort_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// =====================================================================
// 📦 Kargo Kuralı Güncelleme (Admin)
// =====================================================================
export async function updateShippingRule(
  id: string,
  updates: Partial<Pick<ShippingRule, 'min_km' | 'max_km' | 'price' | 'delivery_days' | 'is_active' | 'sort_order'>>,
): Promise<ShippingRule> {
  const { data, error } = await supabase
    .from('shipping_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Kargo kuralı güncellenemedi: ${error.message}`);
  }

  return {
    id: data.id,
    min_km: Number(data.min_km),
    max_km: Number(data.max_km),
    price: Number(data.price),
    delivery_days: Number(data.delivery_days),
    is_active: data.is_active,
    sort_order: data.sort_order,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// =====================================================================
// 📦 Kargo Kuralı Silme (Admin)
// =====================================================================
export async function deleteShippingRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('shipping_rules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Kargo kuralı silinemedi: ${error.message}`);
  }
}

// =====================================================================
// 📦 Tüm Kargo Kurallarını Getirme (Admin - aktif/pasif dahil)
// =====================================================================
export async function fetchAllShippingRules(): Promise<ShippingRule[]> {
  const { data, error } = await supabase
    .from('shipping_rules')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Kargo kuralları çekilemedi: ${error.message}`);
  }

  return data.map((rule) => ({
    id: rule.id,
    min_km: Number(rule.min_km),
    max_km: Number(rule.max_km),
    price: Number(rule.price),
    delivery_days: Number(rule.delivery_days),
    is_active: rule.is_active,
    sort_order: rule.sort_order,
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  }));
}

// =====================================================================
// 🔄 Cache yönetimi
// =====================================================================
let storeSettingsCache: StoreSettings | null = null;
let shippingRulesCache: ShippingRule[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export function clearShippingCache(): void {
  storeSettingsCache = null;
  shippingRulesCache = null;
  cacheTimestamp = 0;
}

// =====================================================================
// 🎯 Cache'li kargo hesaplama (performans için)
// =====================================================================
export async function calculateShippingCached(
  customerCity: string,
  customerDistrict: string,
): Promise<ShippingCalculation> {
  const now = Date.now();

  // Cache süresi dolduysa yenile
  if (now - cacheTimestamp > CACHE_DURATION) {
    storeSettingsCache = null;
    shippingRulesCache = null;
  }

  // Cache'den mağaza ayarlarını al
  if (!storeSettingsCache) {
    storeSettingsCache = await fetchStoreSettings();
  }

  // Cache'den kargo kurallarını al
  if (!shippingRulesCache) {
    shippingRulesCache = await fetchShippingRules();
  }

  cacheTimestamp = now;

  // Mağaza koordinatlarını al
  const storeCoords = getCityCoordinates(storeSettingsCache.city);
  if (!storeCoords) {
    throw new Error(`Mağaza şehri "${storeSettingsCache.city}" için koordinat bulunamadı.`);
  }

  // Müşteri koordinatlarını al
  const customerCoords = getCityCoordinates(customerCity);
  if (!customerCoords) {
    throw new Error(`Müşteri şehri "${customerCity}" için koordinat bulunamadı.`);
  }

  // Mesafeyi hesapla
  const distance = haversineDistance(
    storeCoords.lat,
    storeCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
  );

  // Kargo kuralını eşleştir
  const rule = matchShippingRule(distance, shippingRulesCache);

  // Kargo ücreti ve teslimat süresini belirle
  const shippingFee = rule ? rule.price : 0;
  const deliveryDays = rule ? rule.delivery_days : 1;

  // İlk teslimat tarihini hesapla
  const earliestDeliveryDate = calculateEarliestDeliveryDate(deliveryDays);

  return {
    distance,
    rule,
    shippingFee,
    deliveryDays,
    earliestDeliveryDate,
    storeCity: storeSettingsCache.city,
    storeDistrict: storeSettingsCache.district,
    customerCity,
    customerDistrict,
  };
}
