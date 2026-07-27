import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Clock, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CartItem, Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';

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
    return { success: false, message: 'Geçersiz veya bulunamayan kupon kargo!' };
  }

  // Kişi Limiti Kontrolü (Hak doldu mu?)
  const usageLimit = coupon.usage_limit ?? coupon.max_uses ?? 0;
  const usedCount = coupon.used_count ?? 0;

  if (usageLimit > 0 && usedCount >= usageLimit) {
    return { success: false, message: 'Bu kuponun kullanım limiti/kişi sayısı dolmuştur! ❌' };
  }

  // Son Geçerlilik Tarihi Kontrolü
  const validUntil = coupon.valid_until ?? coupon.expires_at;
  if (validUntil && new Date(validUntil) < new Date()) {
    return { success: false, message: 'Bu kuponun son kullanma tarihi geçmiştir!' };
  }

  // Minimum Sepet Tutarı Kontrolü
  if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
    return { 
      success: false, 
      message: `Bu kupon en az ₺${coupon.min_order_amount} tutarındaki siparişlerde geçerlidir.` 
    };
  }

  // İndirim Tutarını Hesapla
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (cartTotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  return {
    success: true,
    coupon,
    discountAmount,
    finalTotal: Math.max(0, cartTotal - discountAmount),
    message: `🎉 ₺${discountAmount.toFixed(2)} indirim başarıyla uygulandı!`,
  };
}

export default function CartPage({ items, subtotal, deliveryFee, total, timeRemaining, navigate, onUpdateQuantity, onRemove, appliedCoupon, discountAmount, onApplyCoupon, onRemoveCoupon }: Props) {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

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

  // 🎟️ KUPON UYGULA BUTONU TETİKLEYİCİSİ
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setLoadingCoupon(true);
    setCouponMessage(null);

    const result = await applyCouponCode(couponCodeInput, subtotal);

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
  const finalTotalWithDiscount = Math.max(0, total - discountAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900 mt-4 mb-8">Sepetim</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {timeRemaining !== null && (
            <div className={`rounded-2xl p-4 flex items-center gap-3 border ${
              isTimeRunningLow 
                ? 'bg-red-50 border-red-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <Clock className={`w-5 h-5 flex-shrink-0 ${isTimeRunningLow ? 'text-red-600' : 'text-amber-600'}`} />
              <p className={`text-sm font-semibold ${isTimeRunningLow ? 'text-red-700' : 'text-amber-700'}`}>
                Sipariş verme süresi: <span className="font-bold">{formatTimeRemaining(timeRemaining)}</span> | Sepete eklediğiniz ürünler 5 dakika sonra silinecek
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
                    className="p-2 rounded-lg text-sand-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-1 bg-sand-100 rounded-full p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors"
                      aria-label="Azalt"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm text-sand-800">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors"
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

            {/* 🎟️ KUPON KODU GİRİŞ FORMU */}
            <div className="border-t border-b border-sand-100 py-3 space-y-2">
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

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-sand-600">
                <span>Ara toplam</span>
                <span className="font-medium text-sand-800">{subtotal} TL</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Kupon İndirimi</span>
                  <span>- {discountAmount.toFixed(2)} TL</span>
                </div>
              )}

              <div className="flex justify-between text-sand-600">
                <span>Kargo</span>
                <span className="font-medium text-sand-800">
                  {deliveryFee === 0 ? <span className="text-leaf-600">Ücretsiz</span> : `${deliveryFee} TL`}
                </span>
              </div>

              <div className="border-t border-sand-100 pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-sand-800">Toplam</span>
                <span className="text-2xl font-bold text-brand-700">{finalTotalWithDiscount} TL</span>
              </div>
            </div>

            <button onClick={() => navigate({ name: 'checkout' })} className="btn-primary w-full mt-6">
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