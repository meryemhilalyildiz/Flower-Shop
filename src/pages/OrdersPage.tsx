import React, { useState, useEffect } from 'react';
import { OrderInfo, Route, Product } from '../types';
import { Star, Download, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from "../supabaseClient";
import { generateInvoicePDF } from "../services/pdfService";
import { openWhatsApp } from "../services/whatsappService";
import ReviewModal from '../components/ReviewModal';

interface OrdersPageProps {
  orders?: Record<string, OrderInfo>;
  navigate: (r: Route) => void;
  onNavigateToShop?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders: initialOrders, navigate, onNavigateToShop }) => {
  const [dbOrders, setDbOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [reviewProductSelection, setReviewProductSelection] = useState<{ order: OrderInfo; products: Product[] } | null>(null);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

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

      if (data) {
        const mappedOrders: OrderInfo[] = data.map((o: any) => {
          const rawItems = o.order_items || o.items || o.products || [];

          const mappedItems = rawItems.map((item: any) => {
            const effectivePrice = Number(
              item.unit_price ??
              item.price ??
              item.products?.price ??
              item.product_price ??
              0
            );

            const productName =
              item.product_name ||
              item.products?.name ||
              item.name ||
              item.title ||
              'Çiçek Ürünü';

            const productImage = item.products?.image || item.products?.image_url || item.image || item.image_url;
            const productImages = productImage ? [productImage] : [];

            return {
              id: item.id || item.product_id,
              quantity: Number(item.quantity || 1),
              price: effectivePrice,
              unit_price: effectivePrice,
              product_name: productName,
              product: item.products || {
                name: productName,
                price: effectivePrice,
                images: productImages,
                image: productImage,
              },
              images: productImages,
              image: productImage,
            };
          });
          const phoneNum = o.recipient_phone || o.recipientPhone || o.phone || 'Belirtilmedi';

          return {
            id: String(o.id),
            createdAt: o.created_at,
            recipientName: o.recipient_name || o.recipientName || 'Belirtilmedi',
            recipientPhone: phoneNum,
            recipient_phone: phoneNum,
            city: o.city || o.province || 'Belirtilmedi',
            shipping_address: o.shipping_address || o.address || 'Belirtilmedi',
            address: o.shipping_address || o.address || 'Belirtilmedi',
            total: Number(o.total_amount || o.total || 0),
            subtotal: Number(o.subtotal_amount || o.subtotal || 0),
            deliveryFee: Number(o.delivery_fee ?? o.deliveryFee ?? 0),
            discountAmount: Number(o.discount_amount || o.discountAmount || 0),
            coupon_discount: Number(o.coupon_discount || 0),
            campaign_discount: Number(o.campaign_discount || 0),
            applied_coupon_code: o.applied_coupon_code || o.coupon_code || o.couponCode || null,
            status: o.status || 'pending',
            note: o.note,
            tracking_number: o.tracking_number,
            items: mappedItems,
            order_items: mappedItems
          } as any;
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

  const orderList = dbOrders.length > 0
    ? dbOrders
    : Object.values(initialOrders || {}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCancelOrder = async (orderId: string, reason: string) => {
    console.log('🔍 İptal talebi başlatılıyor:', orderId, reason);

    try {
      // Önce siparişin mevcut durumunu al
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      console.log('🔍 Sipariş durumu alındı:', orderData, fetchError);

      if (fetchError) {
        console.error('🔍 Sipariş bilgisi alınamadı:', fetchError);
        alert('Sipariş bilgisi alınamadı: ' + fetchError.message);
        return;
      }

      // İptal talebi oluştur - önceki durumu sakla (previous_status kolonu varsa)
      const updateData: any = {
        status: 'cancellation_requested',
        cancel_reason: reason,
      };

      // previous_status kolonu varsa ekle
      try {
        updateData.previous_status = orderData.status;
      } catch (e) {
        // previous_status kolonu yoksa hata yoksay
      }

      console.log('🔍 Update data:', updateData);

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      console.log('🔍 Update sonucu:', data, error);

      if (error) {
        console.error('🔍 İptal talebi veritabanına işlenemedi:', error);
        alert('İptal talebi veritabanına işlenemedi: ' + error.message);
        return;
      }

      setDbOrders((prevOrders) =>
        prevOrders.map((o) =>
          String(o.id) === String(orderId)
            ? { ...o, status: 'cancellation_requested', cancel_reason: reason, previous_status: orderData.status }
            : o
        )
      );

      alert('İptal talebiniz alındı, admin onayından sonra gerçekleştirilecektir.');
    } catch (err: any) {
      console.error('🔍 Hata oluştu:', err);
      alert('Hata oluştu: ' + (err.message || ''));
    }
  };

  const handleReviewOrder = (order: OrderInfo) => {
    const deliveredProducts = order.items
      .map((item: any) => {
        const productId = item.product?.id || item.product_id;
        if (!productId) return null;

        const baseProduct = item.product || {};
        return {
          id: productId,
          name: baseProduct.name || item.product_name || 'Çiçek Ürünü',
          price: baseProduct.price ?? item.price ?? item.unit_price ?? 0,
          images: baseProduct.images
            ?? (baseProduct.image ? [baseProduct.image] : []),
        } as Product;
      })
      .filter((product): product is Product => product !== null);

    if (deliveredProducts.length === 0) {
      alert('Bu siparişteki ürün bilgisi bulunamadı. Lütfen destek ile iletişime geçin.');
      return;
    }

    if (deliveredProducts.length === 1) {
      setReviewProduct(deliveredProducts[0]);
    } else {
      setReviewProductSelection({ order, products: deliveredProducts });
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
          <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🌸</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz Siparişiniz Bulunmuyor</h2>
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
        {orderList.map((order: any) => {
          const isDelivered = order.status === 'Teslim Edildi' || order.status === 'delivered';
          const isCancelled = order.status === 'İptal Edildi' || order.status === 'cancelled' || order.status === 'İptal Talebi Alındı' || order.status === 'cancellation_requested';
          const isCancellationRequested = order.status === 'cancellation_requested' || order.status === 'İptal Talebi Alındı';
          const canCancel = !isDelivered && !isCancelled && !isCancellationRequested;

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">SİPARİŞ TARİHİ</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">ALICI & ŞEHİR / İLÇE</p>
                  <p className="text-sm font-semibold text-gray-700">{order.recipientName} ({order.city})</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">TOPLAM TUTAR</p>
                  <p className="text-sm font-bold text-pink-600">₺{order.total.toFixed(2)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                      isDelivered || order.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancellationRequested
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : isCancelled || order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCancellationRequested
                      ? '⏳ İptal Talebi Alındı'
                      : isCancelled || order.status === 'cancelled'
                      ? '❌ İptal Edildi'
                      : isDelivered || order.status === 'delivered'
                      ? '✅ Teslim Edildi'
                      : (order.status || 'pending')}
                  </span>

                  <button
                    onClick={() => openWhatsApp(order)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp Destek
                  </button>

                  <button
                    onClick={() => generateInvoicePDF(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Fatura
                  </button>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔍 İptal butonuna tıklandı, order.id:', order.id);
                        const reason = window.prompt('Lütfen siparişinizi iptal etme nedeninizi yazınız:');
                        console.log('🔍 İptal nedeni:', reason);
                        if (reason && reason.trim() !== '') {
                          handleCancelOrder(order.id, reason.trim());
                        } else if (reason !== null) {
                          alert('İptal işlemi için bir neden belirtmelisiniz.');
                        }
                      }}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🚫 İptal Et
                    </button>
                  )}

                  {isDelivered && (
                    <button
                      onClick={() => handleReviewOrder(order)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      Yorum Yap
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  {order.items.map((item: any, index: number) => {
                    const imageUrl = item.product?.images?.[0] || item.image || item.image_url;
                    const fullName = item.product?.name || item.product_name || 'Çiçek Ürünü';
                    const itemUnitPrice = item.product?.price || item.unit_price || item.price || 0;

                    return (
                      <div key={index} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {imageUrl && <img src={imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg border" />}
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{fullName}</h4>
                            <p className="text-xs text-gray-500">Adet: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">₺{(itemUnitPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* 🧾 DÖKÜM TABLOSU */}
                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/80 p-3.5 rounded-xl">
                  {(() => {
                    const tot = Number(order.total || 0);
                    const fee = Number(order.deliveryFee ?? order.delivery_fee ?? 0);
                    const couponDisc = Number(order.coupon_discount || 0);
                    const campaignDisc = Number(order.campaign_discount || 0);
                    const recordedDiscount = Number(order.discountAmount || order.discount_amount || 0);

                    // Doğru Ürünler Toplamı
                    let itemsSubtotal = Number(order.subtotal || order.subtotal_amount || 0);
                    if (itemsSubtotal <= 0) {
                      itemsSubtotal = order.items.reduce((acc: number, i: any) => acc + ((i.price || i.unit_price || 0) * (i.quantity || 1)), 0);
                    }

                    const couponCode = order.applied_coupon_code || order.couponCode;

                    return (
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Ürünler Toplamı:</span>
                          <span className="font-semibold text-gray-800">₺{itemsSubtotal.toFixed(2)}</span>
                        </div>

                        {/* 🎟️ Kupon İndirimi Satırı */}
                        {(couponDisc > 0 || (recordedDiscount > 0 && couponCode && campaignDisc === 0)) && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>🎟️ Kupon İndirimi ({couponCode || 'KUPON'}):</span>
                            <span>-₺{(couponDisc || recordedDiscount).toFixed(2)}</span>
                          </div>
                        )}

                        {/* İki nokta üst üste işaretini parantezin dışına alıyoruz */}
                        {/* 🌸 OrdersPage.tsx Kampanya Satırı */}
{(campaignDisc > 0 || (recordedDiscount > 0 && !couponCode && couponDisc === 0)) && (
  <div className="flex justify-between text-emerald-600 font-semibold text-sm">
    <span className="flex items-center gap-1.5">
      ✨ Kampanya İndirimi{(order?.campaign_title || order?.campaignTitle) ? ` (${order.campaign_title || order.campaignTitle})` : ''}:
    </span>
    <span>-₺{(campaignDisc || recordedDiscount).toFixed(2)}</span>
  </div>
)}

                        {/* 🚚 Kargo Satırı */}
                        <div className="flex justify-between text-gray-600">
                          <span>🚚 Kargo / Teslimat Ücreti:</span>
                          <span className="font-semibold text-gray-800">
                            {fee > 0 ? `₺${fee.toFixed(2)}` : 'Ücretsiz'}
                          </span>
                        </div>

                        <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold text-pink-600">
                          <span>Genel Toplam:</span>
                          <span>₺{tot.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          isOpen={!!reviewProduct}
          onClose={() => setReviewProduct(null)}
          onReviewSubmitted={() => {
            setReviewProduct(null);
            fetchUserOrders();
          }}
        />
      )}

      {reviewProductSelection && (
        <ReviewModal
          product={reviewProductSelection.products[0]}
          isOpen={!!reviewProductSelection}
          onClose={() => setReviewProductSelection(null)}
          onReviewSubmitted={() => {
            setReviewProductSelection(null);
            fetchUserOrders();
          }}
        />
      )}
    </div>
  );
};