import React, { useState, useEffect } from 'react';
import { OrderInfo, Route } from '../types';
import { Star, Download, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from "../supabaseClient";
import { generateInvoicePDF } from "../services/pdfService";
import { openWhatsApp } from "../services/whatsappService";

interface OrdersPageProps {
  orders?: Record<string, OrderInfo>;
  navigate: (r: Route) => void;
  onNavigateToShop?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders: initialOrders, navigate, onNavigateToShop }) => {
  const [dbOrders, setDbOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔄 Supabase'den kullanıcının canlı siparişlerini çekme
 // 🔄 Supabase'den kullanıcının canlı siparişlerini çekme
 const fetchUserOrders = async () => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Supabase 'orders' tablosundan siparişleri çek ve 'order_items' ile birleştir
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('🔍 VERİTABANINDAN GELEN SİPARİŞLER:', data);

    if (data) {
      // Supabase veri yapısını OrderInfo tipine güvenli eşleyelim
      const mappedOrders: OrderInfo[] = data.map((o: any) => {
        const rawItems = o.order_items || o.items || [];

        const mappedItems = rawItems.map((item: any) => {
          // 🌸 Fiyatı her olası sütun isminden okuma
          const effectivePrice = Number(
            item.unit_price ?? 
            item.price ?? 
            item.products?.price ?? 
            item.product_price ?? 
            0
          );

          // 🌸 Ürün resmini her olası yerden yakalama
          const itemImages = item.products?.images || (item.image ? [item.image] : []);

          return {
            id: item.id || item.product_id,
            quantity: Number(item.quantity || 1),
            price: effectivePrice,
            unit_price: effectivePrice,
            product_name: item.product_name || item.products?.name || item.name || 'Çiçek Ürünü',
            product: item.products || {
              name: item.product_name || item.name || 'Çiçek Ürünü',
              price: effectivePrice,
              images: itemImages
            }
          };
        });

        return {
          id: String(o.id),
          createdAt: o.created_at,
          recipientName: o.recipient_name || 'Belirtilmemiş',
          city: o.city || '—',
          shipping_address: o.shipping_address,
          address: o.shipping_address,
          total: Number(o.total_amount || o.total || 0),
          subtotal: Number(o.subtotal || 0),
          deliveryFee: Number(o.delivery_fee || 0),
          discountAmount: Number(o.discount_amount || o.discountAmount || 0),
          status: o.status || 'pending',
          note: o.note,
          tracking_number: o.tracking_number,
          items: mappedItems
        };
      });

      setDbOrders(mappedOrders);
    }
  } catch (err) {
    console.error('Siparişler çekilirken hata:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUserOrders();
  }, []);

  // Prop'tan gelen veya DB'den çekilen siparişleri harmanla
  const orderList = dbOrders.length > 0 
    ? dbOrders 
    : Object.values(initialOrders || {}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 🌸 Sipariş İptal Talebi Fonksiyonu
  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Siparişi iptal etme nedeninizi kısaca belirtin:');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'İptal Talebi Alındı',
          cancel_reason: reason || 'Müşteri tarafından iptal talebi oluşturuldu.',
        })
        .eq('id', orderId);

      if (error) throw error;

      alert('İptal talebiniz admin onayına gönderildi.');
      fetchUserOrders();
    } catch (err: any) {
      alert('İptal talebi oluşturulurken hata: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-pink-600" />
        Siparişleriniz yükleniyor...
      </div>
    );
  }

  if (orderList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-pink-100">
          <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🌸
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz Siparişiniz Bulunmuyor</h2>
          <p className="text-gray-600 mb-6">
            Henüz hiç sipariş vermediniz. Çiçek koleksiyonumuza göz atarak hemen sipariş verebilirsiniz.
          </p>
          {onNavigateToShop && (
            <button
              onClick={onNavigateToShop}
              className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-md shadow-pink-200 cursor-pointer"
            >
              Çiçekleri Keşfet
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 font-display">
        <span>📦</span> Sipariş Geçmişim ({orderList.length})
      </h1>

      <div className="space-y-6">
        {orderList.map((order) => {
          const isDelivered = order.status === 'Teslim Edildi' || order.status === 'delivered';
          const isCancelled = order.status === 'İptal Edildi' || order.status === 'cancelled' || order.status === 'İptal Talebi Alındı';
          const canCancel = order.status === 'pending' || order.status === 'Hazırlanıyor' || order.status === 'processing';

          // Sipariş Hesaplama Değerleri
          const currentSubtotal = Number(order?.subtotal || 0);
          const calculatedSubtotal = currentSubtotal > 0 
            ? currentSubtotal 
            : (order.items || []).reduce((sum: number, item: any) => {
                const price = Number(item.price || item.unit_price || item.product?.price || 0);
                const qty = Number(item.quantity || 1);
                return sum + (price * qty);
              }, 0);
          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Üst Bilgi Barı */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">SİPARİŞ TARİHİ</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">ALICI & ŞEHİR</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {order.recipientName} ({order.city})
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">TOPLAM TUTAR</p>
                  <p className="text-sm font-bold text-pink-600">₺{order.total.toFixed(2)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancelled
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status || 'Hazırlanıyor'}
                  </span>

                  {/* 💬 WhatsApp Destek Butonu */}
                  <button
                    onClick={() => openWhatsApp(order)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                    title="WhatsApp Destek"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Destek
                  </button>

                  {/* 📄 Fatura İndir Butonu */}
                  <button
                    onClick={() => generateInvoicePDF(order)}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-full text-xs font-semibold transition-all cursor-pointer border border-pink-200"
                    title="Fatura İndir"
                  >
                    <Download className="w-3 h-3" />
                    Fatura
                  </button>

                  {/* 🚫 Sipariş İptal Et Butonu */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-red-200"
                    >
                      🚫 İptal Et
                    </button>
                  )}
                </div>
              </div>

              {/* Sipariş İçindeki Ürünler */}
              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  {order.items.map((item: any, index) => {
                    const imageUrl = Array.isArray(item.product?.images)
                      ? item.product.images[0]
                      : (item.product?.images as unknown as string) || item.image || item.image_url;

                    const fullName = item.product?.name || item.product_name || item.name || item.title || 'Çiçek Ürünü';
                    let baseName = fullName;
                    let variantSubtext = '';

                    if (fullName.includes('(') && fullName.includes(')')) {
                      const parts = fullName.split('(');
                      baseName = parts[0].trim();
                      variantSubtext = parts[1].replace(')', '').trim();
                    }

                    const itemUnitPrice = item.product?.price || item.unit_price || item.price || 0;

                    return (
                      <div key={index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={baseName}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-pink-50 rounded-lg flex items-center justify-center text-pink-400 text-xl border border-pink-100">
                              🌸
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {baseName}
                            </h4>
                            {variantSubtext ? (
                              <p className="text-xs text-pink-600 font-medium mt-0.5">
                                ✨ {variantSubtext}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5">Standart Boyut</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Adet: <span className="font-medium text-gray-700">{item.quantity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            ₺{(itemUnitPrice * item.quantity).toFixed(2)}
                          </p>
                          {isDelivered && item.product?.slug && (
                            <button
                              onClick={() => navigate({ name: 'product', slug: item.product.slug })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              Yorum Yap
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>


{/* 🧾 Sipariş Tutar Detayları */}
<div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/80 p-3.5 rounded-xl">
  {(() => {
    // 🌸 1. Değişkenleri Çekme
    const tot = Number(order.total ?? (order as any).total_amount ?? 0);
    const recordedDiscount = Number(order.discountAmount ?? (order as any).discount_amount ?? 0);
    let fee = Number(order.deliveryFee ?? (order as any).delivery_fee ?? 0);

    // 🌸 2. Kargo DB'de 0 ise akıllı kargo varsayımı (300 TL)
    if (fee === 0 && tot > 0) {
      fee = 300; // Varsayılan kargo ücreti
    }

    // 🌸 3. Gerçek Net Ürün Tutarı (Subtotal)
    let rawSubtotal = Number(order.subtotal || 0);
    if (rawSubtotal <= 0 || rawSubtotal >= tot) {
      rawSubtotal = tot - fee + recordedDiscount;
    }

    // 🌸 4. Gerçek İndirim Yüzdesi (%10)
    const discountRate = rawSubtotal > 0 && recordedDiscount > 0 
      ? Math.round((recordedDiscount / rawSubtotal) * 100) 
      : 0;

    return (
      <div className="space-y-1.5 text-sm">
        {/* Ürünler Toplamı (290 TL) */}
        <div className="flex justify-between text-gray-600">
          <span>Ürünler Toplamı:</span>
          <span className="font-semibold text-gray-800">₺{rawSubtotal.toFixed(2)}</span>
        </div>

        {/* 🎟️ Kupon İndirimi (%10 -> -29 TL) */}
        {recordedDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>🎟️ Kupon İndirimi {discountRate > 0 ? `(%${discountRate})` : ''}:</span>
            <span>-₺{recordedDiscount.toFixed(2)}</span>
          </div>
        )}

        {/* 🚚 Kargo / Teslimat Ücreti (300 TL) */}
        <div className="flex justify-between text-gray-600">
          <span>🚚 Kargo / Teslimat Ücreti:</span>
          <span className="font-semibold text-gray-800">₺{fee.toFixed(2)}</span>
        </div>

        {/* Genel Toplam (561 TL) */}
        <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold text-pink-600">
          <span>Genel Toplam:</span>
          <span>₺{tot.toFixed(2)}</span>
        </div>
      </div>
    );
  })()}
</div>

{/* Adres, Not ve Kargo Takip Bilgisi */}
<div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-xl">
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
    <div>
      <span className="font-semibold text-gray-700">📍 Teslimat Adresi:</span>{' '}
      {order.shipping_address || order.address || 'Belirtilmemiş'}
    </div>
    {order.note && (
      <div>
        <span className="font-semibold text-gray-700">📝 Sipariş Notu:</span>{' '}
        {order.note}
      </div>
    )}
  </div>

  {/* 🚚 KARGO TAKİP NUMARASI */}
  {order.tracking_number && (
    <div className="flex items-center gap-2 bg-blue-100/90 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200 shrink-0">
      <span className="text-xs font-semibold">🚚 Kargo Takip No:</span>
      <span className="font-mono font-bold text-xs text-blue-800">
        {order.tracking_number}
      </span>
      <button
        type="button"
        onClick={() => {
          if (order.tracking_number) {
            navigator.clipboard.writeText(order.tracking_number);
            alert('Kargo takip numarası kopyalandı! 📋');
          }
        }}
        className="ml-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded cursor-pointer transition-all shadow-xs"
      >
        Kopyala
      </button>
    </div>
  )}
</div>

                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};