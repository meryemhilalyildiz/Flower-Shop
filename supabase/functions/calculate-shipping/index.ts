/**
 * =====================================================================
 * 🌸 Supabase Edge Function: calculate-shipping
 * =====================================================================
 *
 * Bu fonksiyon, verilen teslimat şehri ve ilçeye göre:
 * 1. Mağaza ayarlarını (konum) çeker
 * 2. Kargo kurallarını çeker
 * 3. Haversine formülü ile mesafeyi hesaplar
 * 4. Mesafeye göre kargo kuralını eşleştirir
 * 5. Kargo ücreti, teslimat süresi ve ilk teslimat tarihini döner
 *
 * HTTP POST /calculate-shipping
 * Body: { "city": "İstanbul", "district": "Kadıköy" }
 *
 * =====================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================================
// 🌍 Türkiye 81 İl Koordinatları (Merkez koordinatları)
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
// 🌍 Varsayılan Mağaza Ayarları
// =====================================================================
const DEFAULT_STORE = {
  city: 'Ankara',
  district: 'Çankaya',
  address: 'Kızılay Sakarya Cad.',
  latitude: 39.9334,
  longitude: 32.8597,
};

// =====================================================================
// 🌍 Varsayılan Kargo Kuralları
// =====================================================================
const DEFAULT_RULES = [
  { min_km: 0, max_km: 100, price: 150, delivery_days: 1 },
  { min_km: 101, max_km: 300, price: 300, delivery_days: 3 },
  { min_km: 301, max_km: 600, price: 500, delivery_days: 5 },
];

// =====================================================================
// 🌍 Haversine Formülü
// =====================================================================
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

// =====================================================================
// 📅 İlk teslimat tarihini hesapla
// =====================================================================
function calculateEarliestDeliveryDate(deliveryDays: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);
  return deliveryDate.toISOString().split('T')[0];
}

// =====================================================================
// 🎯 Kargo kuralını eşleştir
// =====================================================================
function matchRule(distance: number, rules: any[]): any | null {
  const sorted = [...rules].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  for (const rule of sorted) {
    if (distance >= rule.min_km && distance <= rule.max_km) {
      return rule;
    }
  }
  const last = sorted[sorted.length - 1];
  if (last && distance > last.max_km) return last;
  return null;
}

// =====================================================================
// 🚀 Edge Function Ana Giriş Noktası
// =====================================================================
serve(async (req: Request) => {
  // CORS header'ları
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS isteği için (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers });
  }

  try {
    // Request body'yi parse et
    const { city, district } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'city parametresi gerekli' }),
        { status: 400, headers },
      );
    }

    // Supabase client oluştur (service_role ile)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Mağaza ayarlarını çek
    const { data: storeData, error: storeError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    const store = storeError ? DEFAULT_STORE : storeData;

    // 2. Kargo kurallarını çek
    const { data: rulesData, error: rulesError } = await supabase
      .from('shipping_rules')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const rules = rulesError || !rulesData || rulesData.length === 0
      ? DEFAULT_RULES
      : rulesData;

    // 3. Koordinatları al
    const storeCoords = TURKEY_CITY_COORDINATES[store.city];
    const customerCoords = TURKEY_CITY_COORDINATES[city];

    if (!storeCoords) {
      return new Response(
        JSON.stringify({ error: `Mağaza şehri "${store.city}" için koordinat bulunamadı` }),
        { status: 400, headers },
      );
    }

    if (!customerCoords) {
      return new Response(
        JSON.stringify({ error: `Müşteri şehri "${city}" için koordinat bulunamadı` }),
        { status: 400, headers },
      );
    }

    // 4. Mesafeyi hesapla
    const distance = haversineDistance(
      storeCoords.lat,
      storeCoords.lng,
      customerCoords.lat,
      customerCoords.lng,
    );

    // 5. Kargo kuralını eşleştir
    const rule = matchRule(distance, rules);

    // 6. Sonuçları hazırla
    const shippingFee = rule ? Number(rule.price) : 0;
    const deliveryDays = rule ? Number(rule.delivery_days) : 1;
    const earliestDeliveryDate = calculateEarliestDeliveryDate(deliveryDays);

    return new Response(
      JSON.stringify({
        success: true,
        distance,
        shippingFee,
        deliveryDays,
        earliestDeliveryDate,
        storeCity: store.city,
        storeDistrict: store.district,
        storeAddress: store.address,
        customerCity: city,
        customerDistrict: district || '',
        rule: rule
          ? {
              min_km: Number(rule.min_km),
              max_km: Number(rule.max_km),
              price: Number(rule.price),
              delivery_days: Number(rule.delivery_days),
            }
          : null,
      }),
      { status: 200, headers },
    );
  } catch (error: any) {
    console.error('calculate-shipping hatası:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Bilinmeyen hata',
        success: false,
      }),
      { status: 500, headers },
    );
  }
});
