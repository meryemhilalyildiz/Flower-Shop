import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Truck, Save, Check, AlertTriangle, X } from 'lucide-react';
import { fetchAllOrders, normalizeOrderStatus, updateOrderStatus } from '../services/adminApi';
import { supabase } from '../supabaseClient';
import StatusBadge from '../components/admin/StatusBadge';
import { sendCancellationStatusEmail } from '../services/emailService';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 📦 Takip Numarası State'leri
  const [trackingInputs, setTrackingInputs] = useState<{ [key: string]: string }>({});
  const [savedTracking, setSavedTracking] = useState<{ [key: string]: boolean }>({});

  // 🌸 MODAL STATE'LERİ
  const [selectedOrderForCargo, setSelectedOrderForCargo] = useState<any | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<any | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      const normalizedOrders = (data || []).map((order: any) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      }));

      // Kullanıcı e-postalarını çek
      const userIds = [...new Set(normalizedOrders.map((o: any) => o.user_id).filter(Boolean))];
      const userEmails: { [key: string]: string } = {};
      
      if (userIds.length > 0) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        if (!error && profiles) {
          profiles.forEach((profile: any) => {
            userEmails[profile.id] = profile.email;
          });
        }
      }

      // E-postaları siparişlere ekle
      const ordersWithEmails = normalizedOrders.map((order: any) => ({
        ...order,
        user_email: userEmails[order.user_id] || order.user_email || order.email,
      }));

      // Takip numarası verilerini state'e aktar
      const initialTracking: { [key: string]: string } = {};
      ordersWithEmails.forEach((o: any) => {
        if (o.tracking_number) {
          initialTracking[o.id] = o.tracking_number;
        }
      });
      setTrackingInputs(initialTracking);

      setOrders(ordersWithEmails);
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err);
      alert('Siparişler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Durum ve Takip No Güncelleme Fonksiyonu
  const handleStatusChange = async (orderId: string, newStatus: string, trackingNum?: string) => {
    const order = orders.find((o) => o.id === orderId);
    
    // Eğer Kargoda seçildiyse modalı aç
    if (newStatus === 'shipped' || newStatus === 'Kargoda') {
      setSelectedOrderForCargo(order);
      setTrackingInput(trackingInputs[orderId] || order?.tracking_number || '');
      return;
    }

    // Eğer İptal Edildi seçildiyse modalı aç
    if (newStatus === 'cancelled' || newStatus === 'İptal Edildi') {
      setSelectedOrderForCancel(order);
      setCancelReasonInput('');
      return;
    }

    // Diğer durumlar için doğrudan güncelle
    await executeStatusUpdate(orderId, newStatus, trackingNum);
  };

  // Veritabanı ve State Güncellemesini Çalıştıran Yardımcı Fonksiyon
  const executeStatusUpdate = async (orderId: string, newStatus: string, trackingNum?: string, cancelReason?: string) => {
    setUpdatingId(orderId);
    try {
      const normalizedStatus = normalizeOrderStatus(newStatus);
      await updateOrderStatus(orderId, normalizedStatus, trackingNum, cancelReason);

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId
            ? { 
                ...o, 
                status: normalizedStatus, 
                tracking_number: trackingNum ?? o.tracking_number,
                cancel_reason: cancelReason ?? o.cancel_reason 
              }
            : o
        )
      );
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      alert(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 🌸 Kargo Modal Onayı
  const confirmCargoStatus = async () => {
    if (!trackingInput.trim()) {
      alert("Lütfen kargo takip kodunu giriniz.");
      return;
    }

    await executeStatusUpdate(selectedOrderForCargo.id, 'shipped', trackingInput);

    setSelectedOrderForCargo(null);
    setTrackingInput('');
  };

  // 🌸 İptal Modal Onayı (Admin Doğrudan İptal Ettiğinde)
  const confirmCancelStatus = async () => {
    if (!cancelReasonInput.trim()) {
      alert("Lütfen bir iptal gerekçesi belirtiniz.");
      return;
    }

    try {
      // Admin doğrudan iptal ettiği için previous_status NULL set edilir
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          previous_status: null, // 🌸 Müşteri talep etmediği için NULL kalıyor
          cancel_reason: cancelReasonInput
        })
        .eq('id', selectedOrderForCancel.id);

      // 2. Durumu local state ve adminApi üzerinde güncelliyoruz
      await executeStatusUpdate(selectedOrderForCancel.id, 'cancelled', undefined, cancelReasonInput);

      const clientEmail = selectedOrderForCancel.user_email || selectedOrderForCancel.email;
      if (clientEmail) {
        try {
          await sendCancellationStatusEmail({
            toEmail: clientEmail,
            recipientName: selectedOrderForCancel.recipient_name || selectedOrderForCancel.recipientName || 'Değerli Müşterimiz',
            orderId: String(selectedOrderForCancel.id),
            cancelReason: cancelReasonInput,
            totalAmount: Number(selectedOrderForCancel.total_amount || selectedOrderForCancel.total || 0),
            type: 'ADMIN_APPROVED'
          });
        } catch (e) {
          console.error('Mail atılamadı:', e);
        }
      }
    } catch (err: any) {
      alert('İptal işlemi esnasında hata: ' + (err.message || ''));
    } finally {
      setSelectedOrderForCancel(null);
      setCancelReasonInput('');
    }
  };

  // 🌸 İptal Talebi Onay/Reddediş Handler
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (newStatus === 'reject_cancellation') {
      // 🌸 1. İPTAL TALEBİNİ REDDETME SENARYOSU
      setUpdatingId(orderId);
      try {
        const fallbackStatus = order.previous_status && order.previous_status !== 'cancellation_requested' 
          ? order.previous_status 
          : 'processing';

        // DB güncellemesi: status eski haline dönüyor, previous_status temizleniyor
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: fallbackStatus,
            previous_status: null 
          })
          .eq('id', orderId);

        if (error) throw error;

        // State güncellemesi
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: fallbackStatus, previous_status: null } : o));

        // Müşteriye İptal Reddedildi Maili Gönderimi
        const clientEmail = order.user_email || order.email;
        if (clientEmail) {
          await fetch('https://ftsmqcgzpzjcebrdhysw.supabase.co/functions/v1/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: clientEmail,
              subject: `Sipariş İptal Talebiniz Hakkında (#${order.id.slice(0, 8)})`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                  <h2 style="color: #be185d; margin-top: 0;">Sipariş İptal Talebi Güncellemesi 🌸</h2>
                  <p>Sayın <strong>${order.recipient_name || 'Değerli Müşterimiz'}</strong>,</p>
                  <p><strong>#${order.id.slice(0, 8)}</strong> numaralı siparişiniz için oluşturduğunuz iptal talebi yetkili ekibimiz tarafından incelenmiş olup, siparişiniz hazırlanma/teslimat aşamasına geçtiği için iptal edilememiştir.</p>
                  <p>Siparişiniz mevcut durumu (<strong>${fallbackStatus}</strong>) ile özenle hazırlanıp teslim edilmek üzere işlenmeye devam etmektedir.</p>
                  <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">Çiçekçi © 2026 — Taze Çiçekler & Buketler</p>
                </div>
              `,
            }),
          });
        }

        alert('İptal talebi reddedildi ve müşteriye bilgilendirme maili gönderildi.');
      } catch (err: any) {
        alert('İptal talebi reddedilirken hata: ' + (err.message || ''));
      } finally {
        setUpdatingId(null);
      }
    } else if (newStatus === 'cancelled') {
      // 🌸 2. MÜŞTERİNİN İPTAL TALEBİNİ ONAYLAMA SENARYOSU
      try {
        // DB DÜZELTMESİ: previous_status alanına 'cancellation_requested' yazarak 
        // OrdersPage.tsx'in bunun Müşteri Talebi Onayı olduğunu anlamasını sağlıyoruz.
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            previous_status: 'cancellation_requested',
            cancel_reason: order.cancel_reason || 'Müşteri talebi onaylandı'
          })
          .eq('id', orderId);

          if (error) throw error;

          await executeStatusUpdate(orderId, 'cancelled', undefined, order.cancel_reason || 'Müşteri talebi onaylandı');
  
          // Müşteriye Onay Maili Gönderimi
          const clientEmail = order.user_email || order.email;
          if (clientEmail) {
            await sendCancellationStatusEmail({
              toEmail: clientEmail,
              recipientName: order.recipient_name || 'Değerli Müşterimiz',
              orderId: String(order.id),
              cancelReason: order.cancel_reason || 'Müşteri talebi doğrultusunda iptal edildi',
              totalAmount: Number(order.total_amount || order.total || 0),
              type: 'ADMIN_APPROVED'
            });
          }
        } catch (emailErr: any) {
          console.error('Onay maili/güncelleme hatası:', emailErr);
        }
      } else {
        await handleStatusChange(orderId, newStatus);
      }
    };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancellation_requested: orders.filter((o) => o.status === 'cancellation_requested').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Siparişler yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Sipariş Yönetimi</h1>
          <p className="text-sm text-sand-600">Gelen tüm siparişleri görüntüleyin ve durumlarını güncelleyin.</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 border border-sand-200 rounded-xl hover:bg-sand-50 text-sm font-semibold text-sand-700 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
            <input
              type="text"
              placeholder="Sipariş ara (isim, adres, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {Object.entries({
              all: 'Tümü',
              pending: 'Beklemede',
              processing: 'İşleniyor',
              shipped: 'Kargoda',
              delivered: 'Teslim Edildi',
              cancellation_requested: 'İptal Talepleri',
              cancelled: 'İptal',
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  statusFilter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                }`}
              >
                {label} ({statusCounts[key as keyof typeof statusCounts] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sand-600 shadow-sm border border-sand-200">
          {searchTerm || statusFilter !== 'all'
            ? 'Arama kriterlerine uygun sipariş bulunmuyor.'
            : 'Henüz hiç sipariş bulunmuyor.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-sand-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                      #{order.id.slice(0, 8)}
                    </span>

                    {order.status === 'cancelled' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        ❌ İptal Edildi
                      </span>
                    ) : order.status === 'cancellation_requested' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                        ⚠️ İptal Talebi Alındı
                      </span>
                    ) : (
                      <StatusBadge status={order.status || 'pending'} />
                    )}
                    <span className="text-xs text-sand-500">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="text-sm text-sand-800 space-y-1">
                    <p className="font-semibold text-sand-900">
                      Alıcı: <span className="font-normal">{order.recipient_name || 'Belirtilmemiş'}</span>
                    </p>
                    <p className="text-sand-600">
                      E-posta: {order.user_email || 'Belirtilmemiş'}
                    </p>
                    <p className="text-sand-600">
                      Telefon: {order.recipient_phone || 'Belirtilmemiş'}
                    </p>
                    <p className="text-sand-600">
                      Adres: {order.shipping_address || 'Belirtilmemiş'}
                    </p>
                    {order.city && (
                      <p className="text-sand-600">
                        Şehir: {order.city}
                      </p>
                    )}
                    {order.delivery_date && (
                      <p className="text-sand-600">
                        Teslimat Tarihi: {new Date(order.delivery_date).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                    {order.note && (
                      <p className="text-sand-600 italic">
                        Not: {order.note}
                      </p>
                    )}
                  </div>

                  {/* İptal Talebi Uyarısı */}
                  {order.status === 'cancellation_requested' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <strong>Müşteri İptal Nedeni:</strong> {order.cancel_reason || 'Belirtilmedi'}
                      </p>
                    </div>
                  )}

                  {/* İptal Edilmiş Siparişte İptal Nedeni Gösterimi */}
                  {order.status === 'cancelled' && order.cancel_reason && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-900 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-red-700">
                        ❌ İptal Nedeni / Gerekçesi:
                      </p>
                      <p className="text-red-800 font-medium">
                        {order.cancel_reason}
                      </p>
                    </div>
                  )}

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-sand-100">
                      <p className="text-xs font-semibold text-sand-700 mb-2">Sipariş Detayları:</p>
                      <div className="space-y-1">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="text-xs text-sand-600 flex justify-between">
                            <span>Ürün ID: {item.product_id} x {item.quantity}</span>
                            <span>₺{Number(item.unit_price * item.quantity).toLocaleString('tr-TR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm font-bold text-brand-700 pt-1">
                    Toplam Tutar: ₺{Number(order.total_amount).toLocaleString('tr-TR')}
                  </p>
                </div>

                {/* Durum Değiştirme & Kargo Takip Kutusu */}
                <div className="lg:min-w-[240px] space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-sand-600 block mb-1">
                      Durum Değiştir:
                    </label>
                    <select
                      value={order.status || 'pending'}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm font-semibold text-sand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <option value="pending">⏳ Beklemede</option>
                      <option value="processing">⚙️ İşleniyor</option>
                      <option value="shipped">🚚 Kargoda</option>
                      <option value="delivered">✅ Teslim Edildi</option>
                      <option value="cancellation_requested">⚠️ İptal Talebi Var</option>
                      <option value="cancelled">❌ İptal Edildi</option>
                    </select>
                  </div>

                  {/* İptal Talebi Onay/Red Butonları */}
                  {order.status === 'cancellation_requested' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        İptali Onayla
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'reject_cancellation')}
                        disabled={updatingId === order.id}
                        className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                      >
                        Talebi Reddet
                      </button>
                    </div>
                  )}

                  {/* Kargo Takip No Alanı */}
                  {(order.status === 'shipped' || order.status === 'Kargoda') && (
                    <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                      <label className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-600" /> Kargo Takip No:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Takip no giriniz..."
                          value={trackingInputs[order.id] !== undefined ? trackingInputs[order.id] : (order.tracking_number || '')}
                          onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          onClick={() => executeStatusUpdate(order.id, order.status, trackingInputs[order.id])}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {savedTracking[order.id] ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />} Kaydet
                        </button>
                      </div>
                      {order.tracking_number && (
                        <p className="text-[11px] text-blue-700 font-mono">
                          Mevcut Kod: <strong>{order.tracking_number}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚚 KARGO TAKİP KODU MODALI */}
      {selectedOrderForCargo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 relative">
            <button 
              onClick={() => setSelectedOrderForCargo(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🚚 Kargo Bilgisi Girin
            </h3>
            <p className="text-sm text-gray-500">
              #{selectedOrderForCargo.id.slice(0, 8)} numaralı siparişi kargoya vermek üzeresiniz. Müşteriye gönderilecek takip numarasını giriniz:
            </p>
            
            <input
              type="text"
              placeholder="Örn: 1234567890"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForCargo(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmCargoStatus}
                className="px-5 py-2 text-sm text-white bg-brand-600 hover:bg-brand-700 rounded-xl font-medium shadow-sm transition-colors"
              >
                Kargoya Ver & Bildir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ İPTAL GEREKÇESİ MODALI */}
      {selectedOrderForCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 relative">
            <button 
              onClick={() => setSelectedOrderForCancel(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              ❌ Sipariş İptal Gerekçesi
            </h3>
            <p className="text-sm text-gray-500">
              Siparişi iptal etme nedeninizi yazınız. Bu gerekçe müşteriye bilgilendirme e-postasında iletilecektir:
            </p>
            
            <textarea
              rows={3}
              placeholder="Örn: Stok yetersizliği nedeniyle siparişiniz iptal edilmiştir."
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
            />

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForCancel(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmCancelStatus}
                className="px-5 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium shadow-sm transition-colors"
              >
                İptal Et & Bildir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}