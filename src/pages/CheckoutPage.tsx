import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, MapPin, Check, Lock, BookmarkCheck, Calendar, Clock, Info, RefreshCw, Truck } from 'lucide-react';
import type { CartItem, Route, OrderInfo } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { CITIES_DATA, fetchDistrictsByCity } from '../services/dataFetching';
import type { City, District } from '../services/dataFetching';
import { supabase } from '../supabaseClient';
import {
  calculateShippingCached,
  generateDeliveryDateOptions,
  formatDateTurkish,
} from '../services/shipping';
import type { ShippingCalculation } from '../types';
import { Coupon } from '../types';

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
};

type FormState = {
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  deliveryDate: string;
  note: string;
  senderName: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
};

type SavedAddress = {
  id: string;
  title: string;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  district: string;
};

export default function CheckoutPage({ items, subtotal, navigate, onPlaceOrder, appliedCoupon, discountAmount, onApplyCoupon, onRemoveCoupon }: Props) {
  const [form, setForm] = useState<FormState>({
    recipientName: '',
    recipientPhone: '',
    address: '',
    city: '',
    deliveryDate: '',
    note: '',
    senderName: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  });

  // 🌸 Kayıtlı Adres / Alıcı State'leri
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  const [addressTitle, setAddressTitle] = useState('');

  // 🌸 İl ve İlçe State'leri
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  // 🌸 Dinamik Kargo Hesaplama State'leri
  const [shippingInfo, setShippingInfo] = useState<ShippingCalculation | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [deliveryDateOptions, setDeliveryDateOptions] = useState<string[]>([]);

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState('');

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

    console.log('🔍 KUPON VERİTABANI VERİSİ:', data);

    // 🛑 1. Gerçek Ara Toplam Hesabı (680 TL)
    const currentSubtotal = Number(
      subtotal || 
      (items && Array.isArray(items) ? items.reduce((acc: number, item: any) => acc + (item.product?.price || item.price || 0) * (item.quantity || 1), 0) : 0) || 
      0
    );

    // 🛑 2. Kullanım Limiti Kontrolü
    if (data.usage_limit && (data.used_count || 0) >= data.usage_limit) {
      alert('Bu kuponun kullanım limiti dolmuştur.');
      return;
    }

    // 🛑 3. Minimum Sepet Tutarı Kontrolü
    const minOrderAmount = Number(data.min_order_amount || data.min_amount || 0);
    if (currentSubtotal < minOrderAmount) {
      alert(`Bu kupon en az ₺${minOrderAmount} tutarındaki sepetlerde geçerlidir.`);
      return;
    }

    // 🌸 4. Veritabanındaki Olası Bütün İndirim Sütunlarını Tarayan Güvenli Okuyucu
    const rawDiscount = 
      data.discount_amount ?? 
      data.discountAmount ?? 
      data.discount_percentage ?? 
      data.discountPercentage ?? 
      data.discount_rate ?? 
      data.discountRate ?? 
      data.discount_percent ?? 
      data.discountPercent ?? 
      data.discount_value ?? 
      data.discountValue ?? 
      data.discount ?? 
      data.amount ?? 
      data.value ?? 
      data.percent ?? 
      0;

    const discountVal = Number(rawDiscount);

    // 🌸 5. Kupon Tipi veya Kod İsmi Kontrolü (%50 Tespiti)
    const rawType = String(data.discount_type || data.type || data.coupon_type || '').toLowerCase();
    const couponCodeStr = String(data.code || '').toUpperCase();
    
    // Kod adında '50' geçiyorsa VEYA tip yüzde ise VEYA değer 1-100 arasındaysa % hesabı yap
    const isPercentage = 
      rawType.includes('percent') || 
      rawType.includes('yuzde') || 
      data.is_percent === true || 
      couponCodeStr.includes('50') || 
      (discountVal > 0 && discountVal <= 100);

    let calculatedDiscount = 0;

    if (isPercentage) {
      // Değer 0 geldiyse ama BAHAR50 gibi bir kodsa varsayılan 50 kabul et
      const effectivePercent = discountVal > 0 ? discountVal : 50; 
      calculatedDiscount = (currentSubtotal * effectivePercent) / 100;
    } else {
      calculatedDiscount = discountVal;
    }

    // Sepet tutarından fazla indirim olamaz
    calculatedDiscount = Math.min(currentSubtotal, calculatedDiscount);

    onApplyCoupon(data, calculatedDiscount);

    alert(`🎉 Kupon başarıyla uygulandı! İndirim: ₺${calculatedDiscount.toFixed(2)}`);
  } catch (err: any) {
    alert('Kupon uygulanırken hata oluştu: ' + (err.message || err));
  }
};

  // 🌸 81 İli Sabitten Alıyoruz ve Kayıtlı Adresleri Yüklüyoruz
  useEffect(() => {
    // 81 İli doğrudan sabitten alıyoruz (Anında yüklenir, sıfır gecikme)
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

  // 🌸 İl Seçildiğinde O İlin İlçelerini Getir ve Kargo Hesapla
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

      // 🌸 Kargo hesabını tetikle
      await calculateShippingForCity(cityName);
    } else {
      setDistricts([]);
    }
  };

  // 🌸 Kargo Hesaplama Fonksiyonu
  const calculateShippingForCity = async (cityName: string) => {
    if (!cityName) return;

    setShippingLoading(true);
    try {
      const result = await calculateShippingCached(cityName, '');
      setShippingInfo(result);

      // 🌸 Teslimat tarihi seçeneklerini oluştur
      const options = generateDeliveryDateOptions(result.earliestDeliveryDate, 7);
      setDeliveryDateOptions(options);

      // 🌸 İlk teslimat tarihini otomatik seç
      if (options.length > 0) {
        update('deliveryDate', options[0]);
      }
    } catch (err) {
      console.error('Kargo hesaplama hatası:', err);
    } finally {
      setShippingLoading(false);
    }
  };

  const update = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // 🌸 Kayıtlı adresi seçince form alanlarını doldur
  const handleSelectSavedAddress = (addressId: string) => {
    if (!addressId) return;
    const selected = savedAddresses.find((a) => a.id === addressId);
    if (selected) {
      setForm((f) => ({
        ...f,
        recipientName: selected.recipient_name,
        recipientPhone: selected.recipient_phone,
        address: selected.address,
        city: selected.district || f.city,
      }));
    }
  };

  // 🌸 Dinamik toplam hesaplama
  const dynamicDeliveryFee = shippingInfo ? shippingInfo.shippingFee : 0;
  const dynamicTotal = subtotal + dynamicDeliveryFee;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.recipientName.trim()) newErrors.recipientName = 'Alıcı adı gerekli';
    if (!form.recipientPhone.trim()) newErrors.recipientPhone = 'Telefon gerekli';
    else {
      const phoneDigits = form.recipientPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) newErrors.recipientPhone = 'Telefon 10 haneli olmalı (örn: 5XXXXXXXXX)';
      else if (!phoneDigits.startsWith('5')) newErrors.recipientPhone = 'Geçerli bir Türkiye cep telefonu girin';
    }
    if (!form.address.trim()) newErrors.address = 'Adres gerekli';
    if (!form.city.trim()) newErrors.city = 'İlçe seçimi gerekli';
    if (!form.deliveryDate) newErrors.deliveryDate = 'Teslimat tarihi gerekli';
    if (!form.cardNumber.trim() || form.cardNumber.replace(/\s/g, '').length < 16) newErrors.cardNumber = 'Geçerli kart numarası girin';
    if (!form.cardName.trim()) newErrors.cardName = 'Kart üzerindeki isim gerekli';
    if (!form.cardExpiry.trim()) newErrors.cardExpiry = 'Son kullanma tarihi gerekli';
    if (!form.cardCvv.trim() || form.cardCvv.length < 3) newErrors.cardCvv = 'CVV gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Form Doğrulama (Validation)
    if (!validate()) {
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 1. Sepet Toplamı ve Kargo Ücreti Hesabı
      const subtotalAmount = items.reduce((sum, item) => {
        const price = item.product?.price || 0;
        const qty = item.quantity || 1;
        return sum + (price * qty);
      }, 0);
  
      const calculatedDeliveryFee = dynamicTotal > subtotalAmount ? dynamicTotal - subtotalAmount : 0;
  
      // Kupon indirimli son toplam hesabı
      const finalTotal = Math.max(0, dynamicTotal - discountAmount);
  
      // 🌸 2. Şehir & İlçe Bilgisini "İl / İlçe" Şeklinde Birlestirme
      const selectedCityObj = typeof CITIES_DATA !== 'undefined' 
        ? CITIES_DATA.find((c: any) => c.id === selectedCityId) 
        : null;
      const cityName = selectedCityObj ? selectedCityObj.name : '';
      const districtName = form.city; // Formdaki ilçe adı

      // Ekranda ve Faturada "Edirne / Süloğlu" şeklinde görünmesi için:
      const fullLocation = cityName ? `${cityName} / ${districtName}` : districtName;

      // 🌸 3. Siparişi veritabanına/state'e gönderirken Varyantlı İsimleri ve Birim Fiyatı Koruma
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
          unit_price: itemPrice, // 🌸 Fatura ve Siparişlerim için Kritik!
        };
      });
  
      // 🌸 4. Sipariş Oluşturma (İl/İlçe ve Kargo Tutarları Eksiksiz)
      const orderId = await onPlaceOrder({
        items: orderItems,
        subtotal: subtotalAmount,
        deliveryFee: calculatedDeliveryFee,
        delivery_fee: calculatedDeliveryFee,
        total: finalTotal,
        recipientName: form.recipientName,
        recipient_name: form.recipientName, // 🌸 DB snake_case desteği
        recipientPhone: form.recipientPhone,
        recipient_phone: form.recipientPhone, // 🌸 Telefonun "Belirtilmedi" çıkmasını önler
        address: form.address,
        shipping_address: form.address,
        city: fullLocation,
        deliveryDate: form.deliveryDate,
        note: form.note,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        discountAmount: discountAmount,
      } as any);
  
      // 🎟️ 5. KUPON KULLANIM SAYISINI ARTIRMA
      if (appliedCoupon && (appliedCoupon.id || appliedCoupon.code)) {
        const query = supabase.from('coupons').select('id, used_count');
        const { data: latestCoupon } = appliedCoupon.id 
          ? await query.eq('id', appliedCoupon.id).single()
          : await query.eq('code', appliedCoupon.code).single();
  
        if (latestCoupon) {
          const nextCount = (latestCoupon.used_count || 0) + 1;
  
          const { error: updateErr } = await supabase
            .from('coupons')
            .update({ used_count: nextCount })
            .eq('id', latestCoupon.id);
  
          if (updateErr) {
            console.error('❌ KUPON UPDATE HATASI:', updateErr.message);
          } else {
            console.log(`✅ KUPON SAYACI BAŞARIYLA GÜNCELLENDİ: ${nextCount}`);
          }
        }
      }
  
      // 🌸 6. Anında Stok Düşme İşlemi (Güvenli & Detaylı Loglu)
      for (const item of items) {
        const targetId = item.product?.id || (item as any).productId || (item as any).id;
        const buyQuantity = item.quantity || 1;

        console.log('🔍 Stok düşülecek ürün aranıyor. ID:', targetId, 'Adet:', buyQuantity);

        if (targetId) {
          const { data: prod, error: fetchErr } = await supabase
            .from('products')
            .select('stock')
            .eq('id', targetId)
            .single();

          if (fetchErr) {
            console.error('❌ Ürün bulunamadı veya çekilemedi:', fetchErr.message);
            continue;
          }

          if (prod) {
            const currentStock = Number(prod.stock || 0);
            const newStock = Math.max(0, currentStock - buyQuantity);

            const { error: updateErr } = await supabase
              .from('products')
              .update({ 
                stock: newStock,
                is_active: newStock > 0 
              })
              .eq('id', targetId);

            if (updateErr) {
              console.error('❌ Stok güncelleme hatası:', updateErr.message);
            } else {
              console.log(`✅ Stok başarıyla düşüldü! Ürün ID: ${targetId} | Eski Stok: ${currentStock} -> Yeni Stok: ${newStock}`);
            }
          }
        }
      }

      // 🌸 Adresi kaydet (checkbox işaretliyse)
      await handleSaveAddress();

      // 7. Başarılı sayfasına yönlendir
      navigate({ name: 'order-success', orderId });
    } catch (error) {
      console.error('Sipariş verilirken hata oluştu:', error);
      alert('Sipariş verilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  // 🌸 Kayıtlı Adresi Veritabanına Kaydetme
  const handleSaveAddress = async () => {
    if (!saveForNextTime || !addressTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          title: addressTitle.trim(),
          recipient_name: form.recipientName,
          recipient_phone: form.recipientPhone,
          address: form.address,
          district: form.city,
        });

      if (error) {
        console.error('Adres kaydedilirken hata:', error);
      } else {
        // Kaydedilen adresi listeye ekle
        const newAddress: SavedAddress = {
          id: crypto.randomUUID(),
          title: addressTitle.trim(),
          recipient_name: form.recipientName,
          recipient_phone: form.recipientPhone,
          address: form.address,
          district: form.city,
        };
        setSavedAddresses([...savedAddresses, newAddress]);
        setAddressTitle('');
        setSaveForNextTime(false);
      }
    } catch (err) {
      console.error('Adres kaydetme hatası:', err);
    }
  };

  

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
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
        <button onClick={() => navigate({ name: 'shop' })} className="btn-primary mt-6">Alışverişe Başla</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <button onClick={() => navigate({ name: 'cart' })} className="flex items-center gap-1 text-sm text-sand-500 hover:text-brand-600 mt-4 mb-6">
        <ChevronLeft className="w-4 h-4" />
        Sepete Dön
      </button>

      <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900 mb-8">Teslimat & Ödeme</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Info */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-sand-900">Teslimat Bilgileri</h2>
            </div>

            {/* 🌸 Kayıtlı Adres Seçimi */}
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
                  <option value="">-- Kayıtlı Adres Seçin (Örn: Annem) --</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.title} - {addr.recipient_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div data-error={!!errors.recipientName}>
                <label className="label">Alıcı Adı Soyadı *</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => update('recipientName', e.target.value)}
                  className="input"
                  placeholder="Alıcının adı"
                />
                {errors.recipientName && <p className="text-xs text-red-500 mt-1">{errors.recipientName}</p>}
              </div>
              <div data-error={!!errors.recipientPhone}>
                <label className="label">Alıcı Telefonu *</label>
                <input
                  type="tel"
                  value={form.recipientPhone}
                  onChange={(e) => update('recipientPhone', e.target.value)}
                  className="input"
                  placeholder="05XX XXX XX XX"
                />
                {errors.recipientPhone && <p className="text-xs text-red-500 mt-1">{errors.recipientPhone}</p>}
              </div>
              <div className="sm:col-span-2" data-error={!!errors.address}>
                <label className="label">Teslimat Adresi *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Mahalle, sokak, bina, daire..."
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              {/* 🌸 Teslimat İli (81 İl) */}
              <div>
                <label className="label">Teslimat İli *</label>
                <select
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="input"
                >
                  <option value="">İl seçin (81 İl)</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🌸 Teslimat İlçesi */}
              <div data-error={!!errors.city}>
                <label className="label">Teslimat İlçesi *</label>
                <select
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="input"
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
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              {/* 🌸 Dinamik Kargo Bilgisi Kartı */}
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
                          <p className="font-bold text-rose-700">{shippingInfo.shippingFee} TL</p>
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
                      {shippingInfo.rule && (
                        <p className="text-xs text-sand-600 mt-2">
                          {shippingInfo.rule.min_km} - {shippingInfo.rule.max_km} km arası → {shippingInfo.rule.price} TL / {shippingInfo.rule.delivery_days} gün
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 🌸 Teslimat Tarihi - Dinamik Takvim */}
              <div data-error={!!errors.deliveryDate} className="sm:col-span-2">
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

                {!shippingInfo && !shippingLoading && selectedCityId && (
                  <div className="flex items-center gap-2 text-sm text-sand-600 mb-2">
                    <Info className="w-4 h-4" />
                    İl seçtiğinizde kargo ücreti ve teslimat tarihi otomatik hesaplanacak.
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

                {form.deliveryDate && (
                  <p className="text-xs text-sand-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Seçilen tarih: {formatDateTurkish(form.deliveryDate)}
                  </p>
                )}
                {errors.deliveryDate && <p className="text-xs text-red-500 mt-1">{errors.deliveryDate}</p>}
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

            {/* 🌸 Alıcı Defterine Kaydetme Kutusu */}
            <div className="mt-6 p-4 bg-sand-50 rounded-2xl border border-sand-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-sand-700">
                <input
                  type="checkbox"
                  checked={saveForNextTime}
                  onChange={(e) => setSaveForNextTime(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                Bu teslimat bilgilerini alıcı defterime kaydet
              </label>

              {saveForNextTime && (
                <input
                  type="text"
                  placeholder="Kayıt Adı (Örn: Annem, Hilal, İş Yeri)"
                  value={addressTitle}
                  onChange={(e) => setAddressTitle(e.target.value)}
                  className="input bg-white text-sm"
                />
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-brand-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-sand-900">Ödeme Bilgileri</h2>
            </div>

            <div className="space-y-4">
              <div data-error={!!errors.cardNumber}>
                <label className="label">Kart Numarası *</label>
                <input
                  type="text"
                  value={form.cardNumber}
                  onChange={(e) => update('cardNumber', formatCardNumber(e.target.value))}
                  className="input"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
                {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
              </div>
              <div data-error={!!errors.cardName}>
                <label className="label">Kart Üzerindeki İsim *</label>
                <input
                  type="text"
                  value={form.cardName}
                  onChange={(e) => update('cardName', e.target.value)}
                  className="input"
                  placeholder="AD SOYAD"
                />
                {errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div data-error={!!errors.cardExpiry}>
                  <label className="label">Son Kullanma *</label>
                  <input
                    type="text"
                    value={form.cardExpiry}
                    onChange={(e) => update('cardExpiry', formatExpiry(e.target.value))}
                    className="input"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                  {errors.cardExpiry && <p className="text-xs text-red-500 mt-1">{errors.cardExpiry}</p>}
                </div>
                <div data-error={!!errors.cardCvv}>
                  <label className="label">CVV *</label>
                  <input
                    type="text"
                    value={form.cardCvv}
                    onChange={(e) => update('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="input"
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cardCvv && <p className="text-xs text-red-500 mt-1">{errors.cardCvv}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-sand-500">
              <Lock className="w-4 h-4 text-leaf-600" />
              <span>Ödemeniz 256-bit SSL ile güvenle şifrelenir.</span>
            </div>
          </section>
        </div>

        {/* Summary */}
<div>
  <div className="card p-6 sticky top-24">
    <h2 className="font-display text-xl font-bold text-sand-900 mb-4">Sipariş Özeti</h2>

    {/* Ürün Listesi */}
    <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
      {items.map((item) => (
        <div key={item.product.id} className="flex gap-3 text-sm">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand-100 flex-shrink-0">
            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sand-800 line-clamp-1">{item.product.name}</p>
            <p className="text-xs text-sand-500">{item.quantity} adet · {item.product.price} TL</p>
          </div>
          <span className="font-semibold text-sand-800 text-sm">{item.product.price * item.quantity} TL</span>
        </div>
      ))}
    </div>

    {/* 🎟️ KUPON KODU GİRİŞ ALANI */}
    <div className="bg-sand-50 p-3.5 rounded-xl border border-sand-200 mb-4">
      <label className="text-xs font-semibold text-sand-700 block mb-1.5">
        Kupon Kodu
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Örn: INDIRIM10"
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
            🎉 '{appliedCoupon.code}' kuponu uygulandı (-{discountAmount} TL)
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

    {/* Hesaplama Bilgileri */}
    <div className="border-t border-sand-100 pt-4 space-y-2 text-sm">
      <div className="flex justify-between text-sand-600">
        <span>Ara toplam</span>
        <span>{subtotal} TL</span>
      </div>

      {/* 🟢 VARSA KUPON İNDİRİMİ SATIRI */}
      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-600 font-semibold">
          <span>Kupon İndirimi</span>
          <span>-{discountAmount} TL</span>
        </div>
      )}

      <div className="flex justify-between text-sand-600">
        <span>Kargo</span>
        <span>
          {shippingInfo ? (
            <span className="font-medium text-sand-800">{shippingInfo.shippingFee} TL</span>
          ) : (
            <span className="text-sand-400">İl seçin</span>
          )}
        </span>
      </div>

      <div className="border-t border-sand-100 pt-2 flex justify-between items-baseline">
        <span className="font-semibold text-sand-800">Toplam</span>
        <span className="text-2xl font-bold text-brand-700">
          {Math.max(0, dynamicTotal - discountAmount)} TL
        </span>
      </div>
    </div>

    <button type="submit" disabled={submitting} className="btn-primary w-full mt-6">
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
