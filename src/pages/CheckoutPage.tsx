import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, MapPin, Check, Lock, BookmarkCheck, Calendar, Clock, Info, RefreshCw, Truck, Sparkles } from 'lucide-react';
import type { CartItem, Route, OrderInfo } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { CITIES_DATA, fetchDistrictsByCity } from '../services/dataFetching';
import type { City, District } from '../services/dataFetching';
import { supabase } from '../supabaseClient';
import {
  calculateShippingCached,
  generateDeliveryDateOptions,
} from '../services/shipping';
import type { ShippingCalculation } from '../types';
import { calculateCampaignDiscount } from '../services/campaignCalculator';

type Props = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  navigate: (r: Route) => void;
  onPlaceOrder: (order: Omit<OrderInfo, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  appliedCoupon: any;
  discountAmount: number;
  onApplyCoupon: (coupon: any, discount: number) => void;
  onRemoveCoupon: () => void;
  selectedCampaign?: any;
};

type FormState = {
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  deliveryDate: string;
  note: string;
  senderName: string;
};

type SavedAddress = {
  id: string;
  title: string;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  city_id?: number;
  district: string;
};

export default function CheckoutPage({ 
  items, 
  subtotal, 
  deliveryFee, 
  total, 
  navigate, 
  onPlaceOrder, 
  appliedCoupon, 
  discountAmount, 
  onApplyCoupon, 
  onRemoveCoupon,
  selectedCampaign // 🌸 PROPLARA EKLENDİ
}: Props) {
  const [form, setForm] = useState<FormState>({
    recipientName: '',
    recipientPhone: '',
    address: '',
    city: '',
    deliveryDate: '',
    note: '',
    senderName: '',
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  const [addressTitle, setAddressTitle] = useState('');

  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingCalculation | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [deliveryDateOptions, setDeliveryDateOptions] = useState<string[]>([]);

  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');

  // 🌸 Aktif Kampanyayı Supabase'den Yükle
  useEffect(() => {
    async function fetchActiveCampaign() {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) setActiveCampaign(data);
      } catch (err) {
        console.error('Aktif kampanya çekilemedi:', err);
      }
    }
    fetchActiveCampaign();
  }, []);

  useEffect(() => {
    setCities(CITIES_DATA);

    async function loadAddresses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('user_id', user.id);
        if (data) setSavedAddresses(data);
      }
    }
    loadAddresses();
  }, []);

  const update = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  // 🌸 Ana Para (Ham Ürünler Toplamı)
  const rawSubtotal = Number(subtotal || 0);

  // Kampanya İndirimi
  const campaignDiscount = Number(calculateCampaignDiscount(items, activeCampaign) || 0);

  // Kupon İndirimi (Ana paranın %'si olarak bağımsız hesaplama)
  let couponDiscount = 0;
  if (appliedCoupon) {
    const rawRate = Number(
      appliedCoupon.discount_value ?? 
      appliedCoupon.discount_percentage ?? 
      appliedCoupon.discount_amount ?? 
      10
    );
    const isPercent = 
      appliedCoupon.discount_type === 'percentage' || 
      appliedCoupon.is_percent === true || 
      appliedCoupon.code?.toUpperCase().includes('10');

    if (isPercent) {
      couponDiscount = (rawSubtotal * (rawRate > 0 ? rawRate : 10)) / 100;
    } else {
      couponDiscount = rawRate;
    }
  }

  // Toplam İndirim
  const totalDiscount = campaignDiscount + couponDiscount;
  const dynamicDeliveryFee = shippingInfo ? Number(shippingInfo.shippingFee || 0) : 0;

  // Genel Toplam = (Ana Para + Kargo) - Kampanya - Kupon
  const finalTotal = Math.max(0, rawSubtotal + dynamicDeliveryFee - totalDiscount);


  // 🌸 Kupon Uygulama (Tam Güvenlikli ve Esnek Yüzde/Tutar Mantığı)
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponInput.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        alert('Geçersiz veya aktif olmayan kupon kodu.');
        return;
      }

      const currentSubtotal = Number(subtotal || 0);

      // 1. Kullanım Limiti Kontrolü (usage_limit / max_uses)
      const usageLimit = data.usage_limit ?? data.max_uses ?? 0;
      const usedCount = data.used_count ?? 0;
      if (usageLimit > 0 && usedCount >= usageLimit) {
        alert('Bu kuponun kullanım limiti dolmuştur.');
        return;
      }

      // 2. Son Geçerlilik Tarihi Kontrolü (valid_until / expires_at)
      const validUntil = data.valid_until ?? data.expires_at;
      if (validUntil && new Date(validUntil) < new Date()) {
        alert('Bu kuponun son kullanma tarihi geçmiştir.');
        return;
      }

      // 3. Minimum Sepet Tutarı Kontrolü
      const minOrderAmount = Number(data.min_order_amount || data.min_amount || 0);
      if (minOrderAmount > 0 && currentSubtotal < minOrderAmount) {
        alert(`Bu kupon en az ₺${minOrderAmount} tutarındaki sepetlerde geçerlidir.`);
        return;
      }

      // 4. İndirim Değeri ve Tipini Esnek Okuma
      const rawDiscount = Number(
        data.discount_value ?? 
        data.discount_amount ?? 
        data.discount_percentage ?? 
        data.value ?? 
        0
      );

      const rawType = String(data.discount_type || data.type || '').toLowerCase();
      const isPercentage = 
        rawType.includes('percent') || 
        rawType.includes('yuzde') || 
        data.is_percent === true || 
        couponInput.toUpperCase().includes('10'); // '10' veya 'WELCOME10' gibi kuponlarda %10 koruması

      let calculatedDiscount = 0;

      if (isPercentage) {
        // Veritabanında oran varsa onu alır, yoksa ve isimde 10 geçiyorsa %10 varsayar
        const percentRate = rawDiscount > 0 ? rawDiscount : 10;
        calculatedDiscount = (currentSubtotal * percentRate) / 100;

        // Maksimum İndirim Sınırı Var Mı? (Örn: En fazla 200 TL indirim)
        const maxDiscountLimit = Number(data.max_discount_amount || data.max_discount || 0);
        if (maxDiscountLimit > 0 && calculatedDiscount > maxDiscountLimit) {
          calculatedDiscount = maxDiscountLimit;
        }
      } else {
        calculatedDiscount = rawDiscount;
      }

      // İndirim tutarı sepet tutarını geçemez
      calculatedDiscount = Math.min(currentSubtotal, calculatedDiscount);

      onApplyCoupon(data, calculatedDiscount);

      alert(`🎉 Kupon başarıyla uygulandı! İndirim: ₺${calculatedDiscount.toFixed(2)}`);
    } catch (err: any) {
      alert('Kupon uygulanırken hata oluştu: ' + (err.message || err));
    }
  };

  const handleCityChange = async (cityIdStr: string) => {
    const cityId = Number(cityIdStr);
    setSelectedCityId(cityId);
    update('city', '');
    setForm((f) => ({ ...f, deliveryDate: '' }));
    setShippingInfo(null);
    setDeliveryDateOptions([]);

    if (cityId) {
      const cityObj = CITIES_DATA.find((c) => c.id === cityId);
      const cityName = cityObj ? cityObj.name : '';

      const districtList = await fetchDistrictsByCity(cityId);
      setDistricts(districtList);

      await calculateShippingForCity(cityName);
    } else {
      setDistricts([]);
    }
  };

  const calculateShippingForCity = async (cityName: string) => {
    if (!cityName) return;

    setShippingLoading(true);
    try {
      const result = await calculateShippingCached(cityName, '');
      setShippingInfo(result);

      const options = generateDeliveryDateOptions(result.earliestDeliveryDate, 7);
      setDeliveryDateOptions(options);

      if (options.length > 0) {
        update('deliveryDate', options[0]);
      }
    } catch (err) {
      console.error('Kargo hesaplama hatası:', err);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!saveForNextTime || !addressTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const selectedCityObj = CITIES_DATA.find((c) => c.id === selectedCityId);
    const cityName = selectedCityObj ? selectedCityObj.name : '';
    const districtName = form.city;
    const fullDistrictStr = cityName ? `${cityName} / ${districtName}` : districtName;

    try {
      const payload = {
        user_id: user.id,
        title: addressTitle.trim(),
        recipient_name: form.recipientName,
        recipient_phone: form.recipientPhone,
        address: form.address,
        city_id: selectedCityId,
        district: fullDistrictStr,
      };

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert([payload])
        .select();

      if (!error && data) {
        setSavedAddresses((prev) => [...prev, data[0]]);
        setAddressTitle('');
        setSaveForNextTime(false);
      }
    } catch (err) {
      console.error('Adres kaydetme hatası:', err);
    }
  };

  const handleSelectSavedAddress = async (addressId: string) => {
    if (!addressId) return;
    const selected = savedAddresses.find((a) => a.id === addressId);
    if (!selected) return;

    setForm((f) => ({
      ...f,
      recipientName: selected.recipient_name || '',
      recipientPhone: selected.recipient_phone || '',
      address: selected.address || '',
    }));

    let cityIdToUse = selected.city_id;
    let districtName = selected.district || '';

    if (districtName.includes('/')) {
      const parts = districtName.split('/');
      const cityNameFromStr = parts[0]?.trim();
      districtName = parts[1]?.trim() || districtName;

      if (!cityIdToUse && cityNameFromStr) {
        const cityObj = CITIES_DATA.find((c) => c.name.toLowerCase() === cityNameFromStr.toLowerCase());
        if (cityObj) cityIdToUse = cityObj.id;
      }
    }

    if (cityIdToUse) {
      setSelectedCityId(cityIdToUse);
      const cityObj = CITIES_DATA.find((c) => c.id === cityIdToUse);
      const cityName = cityObj ? cityObj.name : '';

      const districtList = await fetchDistrictsByCity(cityIdToUse);
      setDistricts(districtList);

      setForm((f) => ({ ...f, city: districtName }));

      if (cityName) {
        await calculateShippingForCity(cityName);
      }
    } else {
      setForm((f) => ({ ...f, city: districtName }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Form Doğrulama
    if (
      !form.recipientName.trim() || 
      !form.recipientPhone.trim() || 
      !form.address.trim() || 
      !form.city.trim() || 
      !form.deliveryDate
    ) {
      alert('Lütfen teslimat bilgilerini doldurun.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 2. Tutar ve Konum Hesaplamaları
      const subtotalAmount = rawSubtotal;
      const calculatedDeliveryFee = dynamicDeliveryFee;
      const finalTotalKurus = Math.round(finalTotal * 100);

      const selectedCityObj = CITIES_DATA.find((c: any) => c.id === selectedCityId);
      const cityName = selectedCityObj ? selectedCityObj.name : '';
      const districtName = form.city;
      const fullLocation = cityName ? `${cityName} / ${districtName}` : districtName;

      // 3. Kullanıcı ve Alıcı Bilgileri
      const { data: { user } } = await supabase.auth.getUser();
      
      
      const buyer = {
        id: user?.id || 'guest_' + crypto.randomUUID(),
        name: form.recipientName,
        surname: form.recipientName.split(' ').slice(-1).join(' ') || 'Customer',
        email: user?.email || 'customer@example.com',
        phone: form.recipientPhone,
        address: form.address,
        city: cityName,
        district: districtName
      };

      // 4. Sepet ve Sipariş Ürün Nesneleri
      // 🌸 İndirimleri ürün fiyatlarına yansıtarak hesapla
      const totalDiscount = campaignDiscount + couponDiscount;
      const itemsTotal = rawSubtotal;
      
      // İndirim oranını hesapla
      const discountRatio = itemsTotal > 0 ? totalDiscount / itemsTotal : 0;
      
      const basketItems = items.map((item) => {
        const originalPrice = item.product?.price || 0;
        const discountedPrice = originalPrice * (1 - discountRatio);
        return {
          id: item.product?.id || (item as any).id || crypto.randomUUID(),
          name: item.product?.name || 'Çiçek Ürünü',
          price: Math.round(discountedPrice * 100),
          quantity: item.quantity || 1
        };
      });

      // 🌸 Kargo ücretini de basketItems'a ekle
      if (dynamicDeliveryFee > 0) {
        basketItems.push({
          id: 'shipping_' + crypto.randomUUID(),
          name: 'Kargo Ücreti',
          price: Math.round(dynamicDeliveryFee * 100),
          quantity: 1
        });
      }

      const orderItems = items.map((item) => {
        const fullProductName = item.product?.name || 'Çiçek Ürünü';
        const itemPrice = Number(item.product?.price || 0);

        return {
          ...item,
          product_id: item.product?.id || (item as any).productId || (item as any).id,
          product: {
            ...item.product,
            name: fullProductName,
            price: itemPrice,
          },
          product_name: fullProductName,
          title: fullProductName,
          quantity: item.quantity || 1,
          price: itemPrice,
          unit_price: itemPrice,
          // 🌸 App.tsx için gerekli alanlar
          id: item.product?.id || (item as any).id,
        };
      });
  
      // 🌸 SUPABASE'E VERİLERİ AÇIK VE TAM NET KAYDEDİYORUZ
      // CheckoutPage.tsx -> handleSubmit içi
      const currentCampaignTitle = 
        activeCampaign?.title || 
        activeCampaign?.name || 
        activeCampaign?.campaign_name || 
        'Özel Kampanya İndirimi';
        const campaignTitleToSend = selectedCampaign?.title || selectedCampaign?.name || activeCampaign?.title || activeCampaign?.name || '';
        
      // 🌸 Sipariş verilerini session storage'a kaydet (ödeme başarılı olursa OrderSuccessPage'te oluşturulacak)
      const orderData = {
        items: orderItems,
        subtotal: rawSubtotal,
        subtotal_amount: rawSubtotal,
        deliveryFee: dynamicDeliveryFee,
        delivery_fee: dynamicDeliveryFee,
        total: finalTotal,
        total_amount: finalTotal,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        address: form.address,
        city: fullLocation,
        deliveryDate: form.deliveryDate,
        note: form.note,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        applied_coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        coupon_discount: couponDiscount,
        campaign_discount: campaignDiscount,
        campaign_title: campaignDiscount > 0 ? campaignTitleToSend : undefined,
        campaignTitle: campaignDiscount > 0 ? campaignTitleToSend : undefined,
        discountAmount: totalDiscount,
        discount_amount: totalDiscount,
        status: 'pending'
      };
      
      // 🌸 Geçici order ID oluştur
      const tempOrderId = 'temp_' + crypto.randomUUID();
      sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
      sessionStorage.setItem('tempOrderId', tempOrderId);
      
      await handleSaveAddress();

      const sessionData = await supabase.auth.getSession();
      const authToken = sessionData.data.session?.access_token || '';
      const response = await fetch(
        'https://ftsmqcgzpzjcebrdhysw.supabase.co/functions/v1/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            buyer: buyer,
            basketItems: basketItems,
            orderId: tempOrderId // Geçici sipariş kimliği
          })
        }
      );

      const checkoutData = await response.json();

      if (!response.ok || checkoutData.error) {
        throw new Error(checkoutData.error || 'Ödeme başlatılamadı');
      }

      // 8. Ödeme Sayfasına Yönlendirme
      window.location.href = checkoutData.paymentPageUrl;
    } catch (error) {
      console.error('Sipariş verilirken hata oluştu:', error);
      alert('Ödeme başlatılırken bir hata oluştu: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Sepet', route: { name: 'cart' } as Route },
    { label: 'Ödeme' },
  ];

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-sand-900">Sepetiniz boş</h1>
        <button onClick={() => navigate({ name: 'shop' })} className="btn-primary mt-6 cursor-pointer">Alışverişe Başla</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <button onClick={() => navigate({ name: 'cart' })} className="flex items-center gap-1 text-sm text-sand-500 hover:text-brand-600 mt-4 mb-6 cursor-pointer">
        <ChevronLeft className="w-4 h-4" />
        Sepete Dön
      </button>

      <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900 mb-8">Teslimat & Ödeme</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-sand-900">Teslimat Bilgileri</h2>
            </div>

            {savedAddresses.length > 0 && (
              <div className="mb-6 p-4 bg-brand-50/60 rounded-2xl border border-brand-200">
                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  <BookmarkCheck className="w-4 h-4 text-brand-600" />
                  Hızlı Seçim: Kayıtlı Alıcılarınız
                </label>
                <select
                  onChange={(e) => handleSelectSavedAddress(e.target.value)}
                  className="input bg-white text-sm cursor-pointer"
                >
                  <option value="">-- Kayıtlı Adres Seçin (Örn: Ev) --</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.title} - {addr.recipient_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Alıcı Adı Soyadı *</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => update('recipientName', e.target.value)}
                  className="input"
                  placeholder="Alıcının adı"
                />
              </div>
              <div>
                <label className="label">Alıcı Telefonu *</label>
                <input
                  type="tel"
                  value={form.recipientPhone}
                  onChange={(e) => update('recipientPhone', e.target.value)}
                  className="input"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Teslimat Adresi *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Mahalle, sokak, bina, daire..."
                />
              </div>

              <div>
                <label className="label">Teslimat İli *</label>
                <select
                  value={selectedCityId || ''}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="input cursor-pointer"
                >
                  <option value="">İl seçin (81 İl)</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Teslimat İlçesi *</label>
                <select
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="input cursor-pointer"
                  disabled={!selectedCityId}
                >
                  <option value="">
                    {selectedCityId ? 'İlçe seçin' : 'Önce il seçiniz'}
                  </option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {shippingInfo && (
                <div className="sm:col-span-2 bg-brand-50/60 border border-brand-200 rounded-2xl p-4 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sand-900 mb-1">Kargo Bilgileri</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-sand-500">Mesafe</span>
                          <p className="font-bold text-brand-700">{shippingInfo.distance} km</p>
                        </div>
                        <div>
                          <span className="text-xs text-sand-500">Kargo Ücreti</span>
                          <p className="font-bold text-rose-700">₺{shippingInfo.shippingFee.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-sand-500">Teslimat Süresi</span>
                          <p className="font-bold text-sand-800">{shippingInfo.deliveryDays} gün</p>
                        </div>
                        <div>
                          <span className="text-xs text-sand-500">Mağaza</span>
                          <p className="font-bold text-sand-800 text-xs">{shippingInfo.storeCity} / {shippingInfo.storeDistrict}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Teslimat Tarihi *
                </label>

                {shippingLoading && (
                  <div className="flex items-center gap-2 text-sm text-sand-600 mb-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Kargo bilgileri hesaplanıyor...
                  </div>
                )}

                {deliveryDateOptions.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {deliveryDateOptions.map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => update('deliveryDate', date)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          form.deliveryDate === date
                            ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                            : 'border-sand-200 hover:border-brand-300 hover:bg-brand-50/30'
                        }`}
                      >
                        <div className="text-xs text-sand-500 mb-1">
                          {new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">{new Date(date).getDate()}</div>
                        <div className="text-xs text-sand-500">
                          {new Date(date).toLocaleDateString('tr-TR', { month: 'short' })}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={form.deliveryDate}
                    onChange={(e) => update('deliveryDate', e.target.value)}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="label">Not (opsiyonel)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => update('note', e.target.value)}
                  className="input min-h-[60px]"
                  placeholder="Çiçek kartına yazılacak mesaj veya teslimat notu..."
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-sand-50 rounded-2xl border border-sand-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-sand-700">
                <input
                  type="checkbox"
                  checked={saveForNextTime}
                  onChange={(e) => setSaveForNextTime(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                />
                Bu teslimat bilgilerini alıcı defterime kaydet
              </label>

              {saveForNextTime && (
                <input
                  type="text"
                  placeholder="Kayıt Adı (Örn: Ev, İş Yeri)"
                  value={addressTitle}
                  onChange={(e) => setAddressTitle(e.target.value)}
                  className="input bg-white text-sm"
                />
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-sand-900">Ödeme Bilgileri</h2>
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-brand-700 mb-2">
                <Lock className="w-4 h-4" />
                <span className="font-semibold">Güvenli Ödeme</span>
              </div>
              <p className="text-sm text-sand-600">
                Ödeme işleminiz Stripe güvenli altyapısı ile yapılacaktır. Siparişi tamamladığınızda ödeme sayfasına yönlendirileceksiniz.
              </p>
            </div>
          </section>
        </div>

        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display text-xl font-bold text-sand-900 mb-4">Sipariş Özeti</h2>

            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand-100 flex-shrink-0">
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sand-800 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-sand-500">{item.quantity} adet · ₺{item.product.price.toFixed(2)}</p>
                  </div>
                  <span className="font-semibold text-sand-800 text-sm">₺{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* 🎟️ Kupon Kodu Girişi */}
            <div className="bg-sand-50 p-3.5 rounded-xl border border-sand-200 mb-4">
              <label className="text-xs font-semibold text-sand-700 block mb-1.5">Kupon Kodu</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Örn: WELCOME10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-sand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none uppercase font-semibold text-sand-800"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Uygula
                </button>
              </div>

              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    🎉 '{appliedCoupon.code}' kuponu uygulandı (-₺{couponDiscount.toFixed(2)})
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveCoupon}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            {/* 🧾 DÜZELTİLMİŞ TAM DOĞRU DÖKÜM TABLOSU */}
            <div className="border-t border-sand-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-sand-600">
                <span>Ara toplam</span>
                <span>₺{subtotal.toFixed(2)}</span>
              </div>

              {/* Kupon Satırı */}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span>-₺{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Kampanya Satırı */}
              {campaignDiscount > 0 && (
  <div className="flex justify-between text-emerald-600 font-semibold">
    <span className="flex items-center gap-1">
      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
      {activeCampaign?.title 
        ? `${activeCampaign.title}` 
        : 'Kampanya İndirimi'}
    </span>
    <span>-₺{campaignDiscount.toFixed(2)}</span>
  </div>
)}

              <div className="flex justify-between text-sand-600">
                <span>Kargo</span>
                <span>
                  {shippingInfo ? (
                    <span className="font-medium text-sand-800">₺{shippingInfo.shippingFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-sand-400 font-medium">İl seçiniz</span>
                  )}
                </span>
              </div>

              {/* 💰 Tam Doğru Matematiksel Toplam: 750 - 150 - 150 + 100 = 550.00 TL */}
              <div className="border-t border-sand-100 pt-2 flex justify-between items-baseline">
                <span className="font-semibold text-sand-800">Toplam</span>
                <span className="text-2xl font-bold text-brand-700">
                  ₺{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full mt-6 cursor-pointer">
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Siparişi Tamamla
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}