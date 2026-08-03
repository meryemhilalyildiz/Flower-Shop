import React, { useState, useEffect } from 'react';
import { OrderInfo, Route, Product } from '../types';
import { Star, Download, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from "../supabaseClient";
import { generateInvoicePDF } from "../services/pdfService";
import { openWhatsApp } from "../services/whatsappService";
import ReviewModal from '../components/ReviewModal';
import { sendCancellationStatusEmail } from '../services/emailService';

interface OrdersPageProps {
  orders?: Record<string, OrderInfo>;
  navigate?: (r: Route) => void;
  onNavigateToShop?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders: initialOrders, navigate }) => {
  const [dbOrders, setDbOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [reviewProductSelection, setReviewProductSelection] = useState<{ order: OrderInfo; products: Product[] } | null>(null);
  const [productsCache, setProductsCache] = useState<Record<string, any>>({});

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
            products (id, name, slug, price, original_price, image)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedOrders: OrderInfo[] = data.map((o: any) => {
          const rawItems = (Array.isArray(o.items) && o.items.length > 0)
            ? o.items
            : (o.order_items || o.products || []);

          const mappedItems = rawItems.map((item: any) => {
            const rawPrice = Number(
              item.price ??
              item.unit_price ??
              item.products?.price ??
              item.product_price ??
              0
            );

            // Fiyat doğrulama - çok büyük değerleri düzelt
            const effectivePrice = rawPrice > 10000 ? rawPrice / 100 : rawPrice;

            // Orjinal fiyat (indirimli değil) - products.original_price orjinal fiyatı içeriyor
            let rawOriginalPrice = Number(
              item.products?.original_price ||
              item.products?.price ||
              0
            );
            
            // Eğer products bilgisi yoksa, cache'den veya unit_price'dan al
            if (rawOriginalPrice === 0 && item.product_id) {
              const cachedProduct = productsCache[item.product_id];
              if (cachedProduct) {
                rawOriginalPrice = Number(cachedProduct.original_price || cachedProduct.price || 0);
              } else {
                rawOriginalPrice = Number(item.unit_price || 0);
              }
            }
            
            const originalPrice = rawOriginalPrice > 10000 ? rawOriginalPrice / 100 : rawOriginalPrice;

            const productName =
              item.title ||
              item.product_name ||
              item.name ||
              item.products?.name ||
              item.product?.name ||
              'Çiçek Ürünü';

            const productImage =
              item.image ||
              item.image_url ||
              item.products?.images?.[0] ||
              item.products?.image ||
              item.product?.image;

            const productImages = productImage ? [productImage] : [];

            // 🌸 Buket Tasarım Bilgilerini Yakalama
            const isCustom = item.isCustomBouquet || item.is_custom_bouquet || item.product?.isCustomBouquet;
            const customDetails = item.customBouquetDetails || item.custom_bouquet_details || item.product?.customBouquetDetails;

            // 🌸 Ürün slug - ürün sayfasına gitmek için
            const productSlug = item.products?.slug || item.slug || item.product?.slug;

            return {
              id: item.id || item.product_id,
              product_id: item.product_id || item.products?.id,
              quantity: Number(item.quantity || item.count || 1),
              price: effectivePrice,
              unit_price: originalPrice, // Orjinal fiyat
              original_price: originalPrice,
              product_name: productName,
              name: productName,
              title: productName,
              isCustomBouquet: isCustom,
              customBouquetDetails: customDetails,
              slug: productSlug,
              product: item.products || {
                name: productName,
                price: effectivePrice,
                oldPrice: originalPrice,
                images: productImages,
                image: productImage,
                isCustomBouquet: isCustom,
                customBouquetDetails: customDetails,
                slug: productSlug
              },
              images: productImages,
              image: productImage,
            };
          });

          const phoneNum = o.recipient_phone || o.recipientPhone || o.phone || 'Belirtilmedi';

          return {
            id: String(o.id),
            createdAt: o.created_at || o.createdAt,
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
            previous_status: o.previous_status || o.previousStatus || null, // 🌸 İŞTE BURASI EKSİKTİ!
            cancel_reason: o.cancel_reason || o.cancelReason || null,
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

  // Products cache için - eski siparişlerde products ilişkisi yoksa product_id ile ürün bilgilerini çek
  useEffect(() => {
    const fetchProductDetails = async () => {
      const productIds = new Set<string>();
      
      // Tüm siparişlerdeki product_id'leri topla
      dbOrders.forEach(order => {
        (order.items || []).forEach((item: any) => {
          if (item.product_id && !item.products) {
            productIds.add(item.product_id);
          }
        });
      });

      if (productIds.size === 0) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, price, original_price')
          .in('id', Array.from(productIds));

        if (error) throw error;

        if (data) {
          const cache: Record<string, any> = {};
          data.forEach(product => {
            cache[product.id] = product;
          });
          setProductsCache(cache);
        }
      } catch (err) {
        console.error('Ürün bilgileri çekilirken hata:', err);
      }
    };

    if (dbOrders.length > 0) {
      fetchProductDetails();
    }
  }, [dbOrders]);

  const orderList = dbOrders.length > 0
    ? dbOrders
    : Object.values(initialOrders || {}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 🌸 İPTAL TALEBİ VE E-POSTA BİLDİRİMİ
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        alert('Sipariş bilgisi alınamadı: ' + fetchError.message);
        return;
      }

      const updateData: any = {
        status: 'cancellation_requested',
        cancel_reason: reason,
        previous_status: orderData.status || 'pending', // 🌸 Önemli: Önceki durumu kaydediyoruz!
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        alert('İptal talebi işlenemedi: ' + error.message);
        return;
      }

      // 🌸 İptal E-Postası Gönderimi
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        try {
          await sendCancellationStatusEmail({
            toEmail: user.email,
            recipientName: orderData.recipient_name || orderData.recipientName || 'Değerli Müşterimiz',
            orderId: String(orderId),
            cancelReason: reason,
            totalAmount: Number(orderData.total_amount || orderData.total || 0),
            type: 'USER_REQUESTED'
          });
        } catch (emailErr) {
          console.error('İptal e-postası gönderilirken hata oluştu:', emailErr);
        }
      }

      setDbOrders((prevOrders) =>
        prevOrders.map((o) =>
          String(o.id) === String(orderId)
            ? { ...o, status: 'cancellation_requested', cancel_reason: reason }
            : o
        )
      );

      alert('İptal talebiniz alındı ve bilgilendirme e-postası gönderildi.');
    } catch (err: any) {
      alert('Hata oluştu: ' + (err.message || ''));
    }
  };

  const handleReviewOrder = (order: OrderInfo) => {
    const itemsToReview = order.items || (order as any).order_items || [];
    const deliveredProducts = itemsToReview
      .map((item: any) => {
        const productId = item.product?.id || item.product_id || item.id;
        if (!productId) return null;

        const baseProduct = item.product || {};
        return {
          id: productId,
          name: item.title || baseProduct.name || item.product_name || item.name || 'Çiçek Ürünü',
          price: baseProduct.price ?? item.price ?? item.unit_price ?? 0,
          images: baseProduct.images
            ?? (baseProduct.image ? [baseProduct.image] : (item.image ? [item.image] : [])),
        } as Product;
      })
      .filter((product): product is Product => product !== null);

    if (deliveredProducts.length === 0) {
      alert('Bu siparişteki ürün bilgisi bulunamadı.');
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
          const statusLower = String(order.status || '').toLowerCase();
          
          const isDelivered = statusLower === 'teslim edildi' || statusLower === 'delivered';
          const isCancelled = statusLower === 'iptal edildi' || statusLower === 'cancelled' || statusLower === 'iptal';
          const isCancellationRequested = statusLower === 'cancellation_requested' || statusLower === 'iptal talebi alındı' || Boolean(order.cancel_requested);

          const canCancel = !isDelivered && !isCancelled && !isCancellationRequested;
          const shouldHideInvoice = isCancelled || isCancellationRequested;

          const rawItems = 
            (Array.isArray(order.items) && order.items.length > 0) ? order.items :
            (Array.isArray(order.order_items) && order.order_items.length > 0) ? order.order_items :
            (Array.isArray(order.products) && order.products.length > 0) ? order.products : [];

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">SİPARİŞ TARİHİ</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">ALICI & ŞEHİR / İLÇE</p>
                  <p className="text-sm font-semibold text-gray-700">{order.recipientName || order.recipient_name} ({order.city})</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">TOPLAM TUTAR</p>
                  <p className="text-sm font-bold text-pink-600">₺{Number(order.total || order.total_amount || 0).toFixed(2)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. İPTAL EDİLDİ DURUMU */}
{isCancelled ? (
  <div className="flex flex-col gap-0.5">
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 w-fit">
      ❌ İptal Edildi
    </span>
    <span className="text-[11px] text-red-600 font-medium italic pl-1">
      {order.previous_status || order.previousStatus ? (
        /* previous_status DOLU ise -> Müşteri talep etmiş, Admin onaylamış */
        `(İptal talebiniz admin tarafından onaylandı${order.cancel_reason ? `: ${order.cancel_reason}` : ''})`
      ) : (
        /* previous_status NULL ise -> Admin doğrudan kendisi iptal etmiş */
        `(Admin tarafından iptal edildi${order.cancel_reason ? `: ${order.cancel_reason}` : ''})`
      )}
    </span>
  </div>
)
                  
                  /* 2. İPTAL TALEBİ ALINDI DURUMU */
                  : isCancellationRequested ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 w-fit">
                        ⏳ İptal Talebi Alındı
                      </span>
                      {order.cancel_reason && (
                        <span className="text-[11px] text-orange-700 font-medium italic pl-1">
                          (İptal nedeni: {order.cancel_reason})
                        </span>
                      )}
                    </div>
                  ) 
                  /* 3. DİĞER DURUMLAR */
                  : (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                        isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isDelivered ? '✅ Teslim Edildi' : (order.status || 'pending')}
                    </span>
                  )}

                  {/* WhatsApp Destek Butonu */}
                  <button
                    onClick={() => openWhatsApp(order)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp Destek
                  </button>

                  {/* 📄 Fatura Butonu */}
                  {!shouldHideInvoice && (
                    <button
                      onClick={() => generateInvoicePDF(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Fatura
                    </button>
                  )}

                  {/* 🚫 İptal Et Butonu */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Lütfen siparişinizi iptal etme nedeninizi yazınız:');
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

                  {/* Yorum Yap Butonu */}
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

              {/* 🌸 Sipariş İçerisindeki Çiçeklerin Listesi */}
              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  {rawItems.length > 0 ? (
                    rawItems.map((item: any, index: number) => {
                      const imageUrl =
                        item.image ||
                        item.image_url ||
                        item.product?.images?.[0] ||
                        item.product?.image ||
                        item.images?.[0];

                      const fullName =
                        item.title ||
                        item.product_name ||
                        item.name ||
                        item.product?.name ||
                        'Çiçek Ürünü';

                      // Orjinal fiyat (indirimsiz fiyat) - products.original_price orjinal fiyatı içeriyor
                      let rawOriginalPrice = Number(
                        item.products?.original_price ||
                        item.products?.price ||
                        0
                      );
                      
                      // Eğer products bilgisi yoksa, cache'den veya unit_price'dan al
                      if (rawOriginalPrice === 0 && item.product_id) {
                        const cachedProduct = productsCache[item.product_id];
                        if (cachedProduct) {
                          rawOriginalPrice = Number(cachedProduct.original_price || cachedProduct.price || 0);
                        } else {
                          rawOriginalPrice = Number(item.unit_price || 0);
                        }
                      }
                      
                      const originalPrice = rawOriginalPrice > 10000 ? rawOriginalPrice / 100 : rawOriginalPrice;

                      const itemUnitPrice = Number(
                        item.price || item.unit_price || item.product?.price || item.product_price || 0
                      );

                      // Fiyat doğrulama - çok büyük değerleri düzelt
                      const normalizedPrice = itemUnitPrice > 10000 ? itemUnitPrice / 100 : itemUnitPrice;

                      const quantity = Number(item.quantity || item.count || 1);

                      // 🌸 Buket Detay Kontrolü
                      const isCustom = item.isCustomBouquet || item.is_custom_bouquet || item.product?.isCustomBouquet;
                      const details = item.customBouquetDetails || item.custom_bouquet_details || item.product?.customBouquetDetails;

                      // 🌸 Ürün slug ve ürün sayfasına gitme fonksiyonu
                      const productSlug = item.product?.slug || item.slug || item.product_id;
                      const handleProductClick = () => {
                        if (productSlug && !isCustom) {
                          // Normal ürün ise ürün sayfasına git
                          if (navigate) {
                            navigate({ name: 'product', slug: productSlug });
                          } else {
                            window.location.href = `/product/${productSlug}`;
                          }
                        }
                      };

                      return (
                        <div key={index} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {imageUrl ? (
                              <img src={imageUrl} alt={fullName} className="w-14 h-14 object-cover rounded-lg border" />
                            ) : (
                              <div className="w-14 h-14 bg-pink-50 rounded-lg border flex items-center justify-center text-xl">🌸</div>
                            )}

                            {/* 🟢 DÜZELTİLEN / BUKET DETAYLARININ EKLENDİĞİ ALAN */}
                            <div
                              className={productSlug && !isCustom ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                              onClick={handleProductClick}
                            >
                              <h4 className="font-semibold text-gray-800 text-sm">{fullName}</h4>
                              <p className="text-xs text-gray-500">Adet: {quantity} | Birim Fiyat: ₺{originalPrice.toFixed(2)}</p>
                              {productSlug && !isCustom && (
                                <p className="text-xs text-pink-600 mt-1 hover:underline">Ürün sayfasına git →</p>
                              )}

                              {/* 🌸 ÖZEL BUKET İÇERİK DETAYLARI */}
                              {isCustom && details && (
                                <div className="mt-2 p-3 bg-pink-50/70 rounded-xl border border-pink-100 text-xs text-gray-700 space-y-1.5 max-w-md">
                                  {/* Çiçekler */}
                                  {details.items && details.items.length > 0 && (
                                    <div>
                                      <span className="font-bold text-pink-700 text-[11px] uppercase tracking-wider block mb-0.5">İçerik:</span>
                                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                                        {details.items.map((flower: any, idx: number) => (
                                          <li key={idx} className="text-gray-800">
                                            <span className="font-medium">{flower.name}</span>{' '}
                                            <strong className="text-pink-600 font-bold">x{flower.quantity}</strong>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Ambalaj & Vazo */}
                                  {(details.wrapper || details.vase) && (
                                    <div className="pt-1.5 border-t border-pink-200/60 text-[11px] text-gray-600 space-y-0.5">
                                      {details.wrapper && <p>🎁 <span className="font-medium text-gray-800">Ambalaj:</span> {details.wrapper.name}</p>}
                                      {details.vase && <p>🏺 <span className="font-medium text-gray-800">Vazo:</span> {details.vase.name}</p>}
                                    </div>
                                  )}

                                  {/* Kart Notu */}
                                  {details.cardNote && (
                                    <div className="pt-1.5 border-t border-pink-200/60 text-[11px]">
                                      <span className="font-bold text-pink-700">✉️ Kart Notu:</span>
                                      <p className="italic text-gray-600 pl-2 border-l-2 border-pink-300 mt-0.5">
                                        "{details.cardNote}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                          <p className="text-sm font-semibold text-gray-800">
                            ₺{(originalPrice * quantity).toFixed(2)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-pink-50 rounded-lg border flex items-center justify-center text-xl">🌸</div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">Sipariş Edilen Çiçek Aranjmanı</h4>
                          <p className="text-xs text-gray-500">Adet: 1</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        ₺{Number(order.subtotal || order.subtotal_amount || order.total || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 🧾 DÖKÜM TABLOSU */}
                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/80 p-3.5 rounded-xl">
                  {(() => {
                    const tot = Number(order.total || order.total_amount || 0);
                    const fee = Number(order.deliveryFee ?? order.delivery_fee ?? 0);
                    const couponDisc = Number(order.coupon_discount || 0);
                    const campaignDisc = Number(order.campaign_discount || 0);
                    const recordedDiscount = Number(order.discountAmount || order.discount_amount || 0);

                    let itemsSubtotal = Number(order.subtotal || order.subtotal_amount || 0);
                    if (itemsSubtotal <= 0 && rawItems.length > 0) {
                      itemsSubtotal = rawItems.reduce((acc: number, i: any) => acc + ((i.price || i.unit_price || 0) * (i.quantity || 1)), 0);
                    }
                    if (itemsSubtotal <= 0) itemsSubtotal = tot - fee + (couponDisc || campaignDisc || recordedDiscount);

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

                        {/* 🌸 Kampanya İndirimi Satırı */}
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

export default OrdersPage;