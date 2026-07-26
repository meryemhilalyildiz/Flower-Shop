import React from 'react';
import { OrderInfo, Route } from '../types';
import { Star } from 'lucide-react';

interface OrdersPageProps {
  orders: Record<string, OrderInfo>;
  navigate: (r: Route) => void;
  onNavigateToShop?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders, navigate, onNavigateToShop }) => {
  const orderList = Object.values(orders).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
              className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-md shadow-pink-200"
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📦</span> Sipariş Geçmişim ({orderList.length})
      </h1>

      <div className="space-y-6">
        {orderList.map((order) => {
          const isDelivered = order.status === 'Teslim Edildi';
          const isCancelled = order.status === 'İptal Edildi';
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

                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    isDelivered
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCancelled
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status || 'Hazırlanıyor'}
                  </span>
                </div>
              </div>

              {/* Sipariş İçindeki Ürünler */}
              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, index) => {
                    const imageUrl = Array.isArray(item.product.images)
                      ? item.product.images[0]
                      : (item.product.images as unknown as string);

                    return (
                      <div key={index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product.name}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-pink-50 rounded-lg flex items-center justify-center text-pink-400 text-xl border border-pink-100">
                              🌸
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {item.product.name || 'Çiçek Ürünü'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Adet: <span className="font-medium text-gray-700">{item.quantity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            ₺{((item.product.price || 0) * item.quantity).toFixed(2)}
                          </p>
                          {isDelivered && item.product.slug && (
                            <button
                              onClick={() => navigate({ name: 'product', slug: item.product.slug })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all"
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

                {/* Adres ve Not Bilgisi */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 bg-gray-50/50 p-3 rounded-xl">
                  <div>
                    <span className="font-semibold text-gray-700">📍 Teslimat Adresi:</span> {order.address}
                  </div>
                  {order.note && (
                    <div>
                      <span className="font-semibold text-gray-700">📝 Sipariş Notu:</span> {order.note}
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
