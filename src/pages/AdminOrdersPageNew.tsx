import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, XCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { fetchAllOrders, normalizeOrderStatus, updateOrderStatus } from '../services/adminApi';
import StatusBadge from '../components/admin/StatusBadge';

export default function AdminOrdersPageNew() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      const normalizedOrders = (data || []).map((order: any) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      }));
      console.log('Siparişler:', normalizedOrders);
      setOrders(normalizedOrders);
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const normalizedStatus = normalizeOrderStatus(newStatus);
      await updateOrderStatus(orderId, normalizedStatus);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: normalizedStatus } : o))
      );
      await loadOrders();
    } catch (err) {
      console.error('Durum güncellenirken hata:', err);
      alert(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu.');
    } finally {
      setUpdatingId(null);
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

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
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
          className="flex items-center gap-2 px-4 py-2 border border-sand-200 rounded-xl hover:bg-sand-50 text-sm font-semibold text-sand-700"
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
              cancelled: 'İptal',
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                }`}
              >
                {label} ({statusCounts[key as keyof typeof statusCounts]})
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
                    <StatusBadge status={order.status || 'pending'} />
                    <span className="text-xs text-sand-500">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>

                  <div className="text-sm text-sand-800 space-y-1">
                    <p className="font-semibold text-sand-900">
                      Alıcı: <span className="font-normal">{order.recipient_name || 'Belirtilmemiş'}</span>
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

                  <p className="text-sm font-bold text-brand-700">
                    Toplam Tutar: ₺{Number(order.total_amount).toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="lg:min-w-[200px]">
                  <label className="text-xs font-semibold text-sand-600 block mb-2">
                    Durum Değiştir:
                  </label>
                  <select
                    value={order.status || 'pending'}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm font-semibold text-sand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50"
                  >
                    <option value="pending">⏳ Beklemede</option>
                    <option value="processing">⚙️ İşleniyor</option>
                    <option value="shipped">🚚 Kargoda</option>
                    <option value="delivered">✅ Teslim Edildi</option>
                    <option value="cancelled">❌ İptal Edildi</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
