import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Clock, Ticket, CheckCircle2, AlertCircle, Sparkles, Tag, Check, X } from 'lucide-react';
import type { CartItem, Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { calculateSingleCampaignDiscount } from '../services/campaignCalculator';

type Props = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  timeRemaining: number | null;
  navigate: (r: Route) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  appliedCoupon: any;
  discountAmount: number;
  onApplyCoupon: (coupon: any, discount: number) => void;
  onRemoveCoupon: () => void;
  selectedCampaign: any;
  onSelectCampaign: (campaign: any) => void;
};

// 🎟️ SUPABASE KUPON SORGULAMA VE DOĞRULAMA FONKSİYONU
export async function applyCouponCode(code: string, cartTotal: number) {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { success: false, message: 'Geçersiz veya bulunamayan kupon kodu!' };
  }

  // 1. Kişi Limiti Kontrolü
  const usageLimit = coupon.usage_limit ?? coupon.max_uses ?? 0;
  const usedCount = coupon.used_count ?? 0;

  if (usageLimit > 0 && usedCount >= usageLimit) {
    return { success: false, message: 'Bu kuponun kullanım limiti/kişi sayısı dolmuştur! ❌' };
  }

  // 2. Son Geçerlilik Tarihi Kontrolü
  const validUntil = coupon.valid_until ?? coupon.expires_at;
  if (validUntil && new Date(validUntil) < new Date()) {
    return { success: false, message: 'Bu kuponun son kullanma tarihi geçmiştir!' };
  }

  // 3. Minimum Sepet Tutarı Kontrolü
  const minAmount = Number(coupon.min_order_amount || coupon.min_amount || 0);
  if (minAmount > 0 && cartTotal < minAmount) {
    return { 
      success: false, 
      message: `Bu kupon en az ₺${minAmount} tutarındaki siparişlerde geçerlidir.` 
    };
  }

  // 4. İndirim Oranını ve Tipini Doğru Tespit Etme
  const rawDiscount = Number(
    coupon.discount_value ?? 
    coupon.discount_amount ?? 
    coupon.discount_percentage ?? 
    coupon.value ?? 
    0
  );

  const rawType = String(coupon.discount_type || coupon.type || '').toLowerCase();
  const isPercentage = 
    rawType.includes('percent') || 
    rawType.includes('yuzde') || 
    coupon.is_percent === true ||
    code.toUpperCase().includes('10');

  let calculatedDiscount = 0;

  if (isPercentage) {
    const percentRate = rawDiscount > 0 ? rawDiscount : 10; 
    calculatedDiscount = (cartTotal * percentRate) / 100;

    const maxDiscountLimit = Number(coupon.max_discount_amount || coupon.max_discount || 0);
    if (maxDiscountLimit > 0 && calculatedDiscount > maxDiscountLimit) {
      calculatedDiscount = maxDiscountLimit;
    }
  } else {
    calculatedDiscount = rawDiscount;
  }

  calculatedDiscount = Math.min(cartTotal, calculatedDiscount);

  return {
    success: true,
    coupon,
    discountAmount: calculatedDiscount,
    finalTotal: Math.max(0, cartTotal - calculatedDiscount),
    message: `🎉 ₺${calculatedDiscount.toFixed(2)} indirim başarıyla uygulandı!`,
  };
}

export default function CartPage({ 
  items, 
  subtotal, 
  deliveryFee, 
  total, 
  timeRemaining, 
  navigate, 
  onUpdateQuantity, 
  onRemove, 
  appliedCoupon, 
  discountAmount, 
  onApplyCoupon, 
  onRemoveCoupon 
}: Props) {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  // 🌸 Tüm Aktif Kampanyaları Çekme State'leri
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  // 🌸 Veritabanından Aktif Kampanyaları Çek
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setAvailableCampaigns(data);
          // Varsayılan olarak ilk aktif kampanyayı seç
          setSelectedCampaign(data[0]);
        }
      } catch (err) {
        console.error('Kampanyalar çekilemedi:', err);
      }
    }
    fetchCampaigns();
  }, []);

  // 🌸 1. Ham Ürünler Ara Toplamı (Ana Para)
  const rawSubtotal = Number(subtotal || 0);

  // 🌸 2. Seçilen Kampanyanın Hesaplanması
  const campaignDiscount = selectedCampaign ? calculateSingleCampaignDiscount(items, selectedCampaign) : 0;

  // 🌸 3. Kupon İndirimi (Ana paradan bağımsız %10)
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

  // 🌸 4. Toplam İndirim
  const totalDiscountAmount = campaignDiscount + couponDiscount;

  // 💰 5. Genel Toplam
  const finalTotal = Math.max(0, rawSubtotal - totalDiscountAmount + deliveryFee);

  // 🌸 Crumbs tanımı
  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Sepet' },
  ];

  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null) return null;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🎟️ KUPON UYGULA BUTONU
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setLoadingCoupon(true);
    setCouponMessage(null);

    const result = await applyCouponCode(couponCodeInput, rawSubtotal);

    if (result.success) {
      onApplyCoupon(result.coupon, result.discountAmount || 0);
      setCouponMessage({ text: result.message, isError: false });
    } else {
      onRemoveCoupon();
      setCouponMessage({ text: result.message, isError: true });
    }
    setLoadingCoupon(false);
  };

  // KUPONU KALDIR
  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponCodeInput('');
    setCouponMessage(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-sand-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-sand-900">Sepetiniz Boş</h1>
        <p className="text-sand-500 mt-3">Henüz sepetinize çiçek eklemediniz.</p>
        <button onClick={() => navigate({ name: 'shop' })} className="btn-primary mt-8">
          Çiçekleri Keşfet
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const isTimeRunningLow = timeRemaining !== null && timeRemaining < 60000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900 mt-4 mb-8">Sepetim</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {/* 🌸 SEÇİLİ KAMPANYA İNDİRİMİ BİLDİRİM BARI */}
          {selectedCampaign && campaignDiscount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    Tebrikler! {selectedCampaign.title || 'Kampanya İndirimi'}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {selectedCampaign.subtitle || selectedCampaign.description || 'Sepetinizdeki ürünlere özel kampanya indirimi uygulandı.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-emerald-700 font-mono">-₺{campaignDiscount.toFixed(2)}</span>
                <button 
                  onClick={() => setSelectedCampaign(null)} 
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-all cursor-pointer"
                  title="Kampanyayı Kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {timeRemaining !== null && (
            <div className={`rounded-2xl p-4 flex items-center gap-3 border ${
              isTimeRunningLow 
                ? 'bg-red-50 border-red-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <Clock className={`w-5 h-5 flex-shrink-0 ${isTimeRunningLow ? 'text-red-600' : 'text-amber-600'}`} />
              <p className={`text-sm font-semibold ${isTimeRunningLow ? 'text-red-700' : 'text-amber-700'}`}>
                Sipariş verme süresi: <span className="font-bold">{formatTimeRemaining(timeRemaining)}</span> | Sepete eklediğiniz ürünler 15 dakika sonra silinecek
              </p>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center gap-3">
              <Truck className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <p className="text-sm text-brand-700">
                Kargo ücreti checkout sayfasında hesaplanacaktır.
              </p>
            </div>
          )}

          {items.map((item) => (
            <div key={item.product.id} className="card p-4 flex gap-4">
              <button
                onClick={() => navigate({ name: 'product', slug: item.product.slug })}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-sand-100 flex-shrink-0"
              >
                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sand-800 line-clamp-1">{item.product.name}</h3>
                    <p className="text-sm text-sand-500 line-clamp-1">{item.product.description}</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="p-2 rounded-lg text-sand-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-1 bg-sand-100 rounded-full p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors cursor-pointer"
                      aria-label="Azalt"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm text-sand-800">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors cursor-pointer"
                      aria-label="Artır"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-700">{item.product.price * item.quantity} TL</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-sand-400">{item.product.price} TL/adet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => navigate({ name: 'shop' })} className="btn-ghost text-brand-600 mt-2">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Alışverişe Devam Et
          </button>
        </div>

        {/* Summary & Coupon Section */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-display text-xl font-bold text-sand-900">Sipariş Özeti</h2>

            {/* 🏷️ KAMPANYA SEÇİM LİSTESİ MODÜLÜ */}
            {availableCampaigns.length > 0 && (
              <div className="border-t border-b border-sand-100 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sand-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Aktif Kampanyalar
                  </span>
                  {selectedCampaign && (
                    <button 
                      onClick={() => setSelectedCampaign(null)}
                      className="text-red-600 text-[11px] hover:underline cursor-pointer"
                    >
                      Kampanyayı Kaldır
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {availableCampaigns.map((camp) => {
                    const isSelected = selectedCampaign?.id === camp.id;
                    const discAmount = calculateSingleCampaignDiscount(items, camp);
                    const isEligible = discAmount > 0;

                    return (
                      <div
                        key={camp.id}
                        onClick={() => isEligible && setSelectedCampaign(isSelected ? null : camp)}
                        className={`p-2.5 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                            : isEligible
                            ? 'bg-white border-sand-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                            : 'bg-sand-50 border-sand-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sand-900 flex items-center gap-1">
                            {camp.title}
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </p>
                          <p className="text-[10px] text-sand-500 line-clamp-1">{camp.description || camp.subtitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {isEligible ? (
                            <>
                              <span className="font-bold text-emerald-700">-₺{discAmount.toFixed(2)}</span>
                              <p className="text-[10px] text-emerald-600 font-semibold">{isSelected ? 'Uygulandı' : 'Seç'}</p>
                            </>
                          ) : (
                            <span className="text-[10px] text-sand-400">Şartlar sağlanmadı</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🎟️ KUPON KODU GİRİŞ FORMU */}
            <div className="border-b border-sand-100 pb-3 space-y-2">
              <label className="text-xs font-semibold text-sand-600 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-brand-600" /> İndirim Kuponu
              </label>
              
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kupon Kodunuz"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-sand-300 rounded-xl uppercase outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    disabled={loadingCoupon || !couponCodeInput.trim()}
                    className="px-4 py-2 bg-sand-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loadingCoupon ? '...' : 'Uygula'}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 font-mono">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {appliedCoupon.code}
                  </span>
                  <button onClick={handleRemoveCoupon} className="text-red-600 hover:underline cursor-pointer">
                    Kaldır
                  </button>
                </div>
              )}

              {couponMessage && (
                <p className={`text-xs flex items-center gap-1 mt-1 font-medium ${
                  couponMessage.isError ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {couponMessage.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {couponMessage.text}
                </p>
              )}
            </div>

            {/* Sipariş Özeti Tutar Detayları */}
            <div className="border-t border-sand-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-sand-600">
                <span>Ara toplam</span>
                <span>₺{rawSubtotal.toFixed(2)}</span>
              </div>

              {/* 🎟️ Kupon İndirimi Satırı */}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span>-₺{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* 🌸 Kampanya İndirimi Satırı */}
              {campaignDiscount > 0 && selectedCampaign && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    {selectedCampaign.title || 'Kampanya İndirimi'}
                  </span>
                  <span>-₺{campaignDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sand-600">
                <span>Kargo</span>
                <span>{deliveryFee > 0 ? `₺${deliveryFee.toFixed(2)}` : 'Ücretsiz'}</span>
              </div>

              {/* 💰 Genel Toplam */}
              <div className="border-t border-sand-200 pt-3 flex justify-between font-bold text-base text-sand-900">
                <span>Toplam</span>
                <span className="text-2xl font-bold text-brand-700">
                  ₺{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button onClick={() => navigate({ name: 'checkout' })} className="btn-primary w-full mt-6 cursor-pointer">
              Ödemeye Geç
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-xs text-sand-400 text-center mt-3">Güvenli ödeme · 256-bit SSL</p>
          </div>
        </div>
      </div>
    </div>
  );
}