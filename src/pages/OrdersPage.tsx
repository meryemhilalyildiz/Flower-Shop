import React from 'react';
import { Package, Calendar, MapPin, FileText, ChevronLeft } from 'lucide-react';
import type { OrderInfo, Route } from '../types';
import { generateInvoicePDF } from '../services/pdfService';

interface OrdersPageProps {
  orders: OrderInfo[];
  navigate: (route: Route) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders, navigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Anasayfa
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-pink-600" />
          Sipariş Geçmişim ({orders.length})
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <p className="text-gray-500">Henüz hiç siparişiniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // 1. Ürünler Toplamı (Ara Toplam)
            const subtotal = order.subtotal || order.items.reduce((sum, item: any) => {
              const price = item.product?.price || item.unit_price || item.price || 0;
              const qty = item.quantity || 1;
              return sum + price * qty;
            }, 0);

            // 2. Kargo Ücreti Hesabı
            const deliveryFee = order.deliveryFee || order.delivery_fee || (order.total > subtotal ? order.total - subtotal : 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* SİPARİŞ ÜST BİLGİ ALANI */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <div>
                      <span className="block font-medium text-gray-400">SİPARİŞ TARİHİ</span>
                      <span className="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-pink-500" />
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="block font-medium text-gray-400">ALICI & ŞEHİR</span>
                      <span className="font-semibold text-gray-700 mt-0.5 block">
                        {order.recipientName} ({order.city})
                      </span>
                    </div>

                    <div>
                      <span className="block font-medium text-gray-400">TOPLAM TUTAR</span>
                      <span className="font-bold text-pink-600 text-sm mt-0.5 block">
                        ₺{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                      {order.status || 'pending'}
                    </span>

                    <button
                      onClick={() => generateInvoicePDF(order)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Fatura İndir
                    </button>
                  </div>
                </div>

                {/* ÜRÜNLER LİSTESİ */}
                <div className="divide-y divide-gray-50">
                  {order.items.map((item: any, index) => {
                    // 🎯 Kilit Düzeltme: Olası tüm veri kaynaklarından ismi tarıyoruz
                    let fullName = 
                      item.product?.name || 
                      item.product_name || 
                      item.name || 
                      item.title || 
                      'Çiçek Ürünü';

                    let baseName = fullName;
                    let variantSubtext = '';

                    if (fullName.includes('(') && fullName.includes(')')) {
                      const parts = fullName.split('(');
                      baseName = parts[0].trim();
                      variantSubtext = parts[1].replace(')', '').trim();
                    }

                    const imageUrl = Array.isArray(item.product?.images)
                      ? item.product.images[0]
                      : (item.product?.images as unknown as string) || item.image || item.image_url;

                    const itemUnitPrice = item.product?.price || item.unit_price || item.price || 0;

                    return (
                      <div key={index} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={baseName}
                              className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-400 text-lg">
                              🌸
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{baseName}</h4>
                            {variantSubtext ? (
                              <p className="text-xs text-pink-600 font-medium mt-0.5">
                                ✨ {variantSubtext}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5">Standart Boyut</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              Adet: <span className="font-semibold text-gray-600">{item.quantity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">
                            ₺{(itemUnitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADRES VE DETAYLI TUTAR DÖKÜM KUTUSU */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>
                      <strong>Teslimat Adresi:</strong> {order.shipping_address || order.address}
                    </span>
                  </div>

                  <div className="bg-sand-50 p-3 rounded-xl space-y-1 min-w-[220px] text-right ml-auto border border-sand-100">
                    <div className="flex justify-between gap-4 text-gray-600">
                      <span>Ürünler Toplamı:</span>
                      <span className="font-semibold text-gray-800">₺{subtotal.toFixed(2)}</span>
                    </div>

                    {deliveryFee > 0 && (
                      <div className="flex justify-between gap-4 text-gray-600">
                        <span>🚚 Kargo / Teslimat:</span>
                        <span className="font-semibold text-gray-800">₺{deliveryFee.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4 pt-1.5 border-t border-gray-200 text-sm font-bold text-pink-600">
                      <span>Genel Toplam:</span>
                      <span>₺{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};