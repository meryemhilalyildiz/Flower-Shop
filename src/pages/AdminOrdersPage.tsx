import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, XCircle, RefreshCw } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus } from '../services/adminApi';

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Tüm siparişleri yükle
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data || []);
    } catch (err) {
      alert('Siparişler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Durum değiştirme tetikleyicisi
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('Durum güncellenirken hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Veritabanındaki 'status' değerine göre Rozet (Badge) Gösterimi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preparing':
      case 'Hazırlanıyor':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> Hazırlanıyor</span>;
      case 'shipping':
      case 'Yolda':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Truck className="w-3.5 h-3.5" /> Yolda</span>;
      case 'delivered':
      case 'Teslim Edildi':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi</span>;
      case 'cancelled':
      case 'İptal Edildi':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> İptal Edildi</span>;
      case 'pending':
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Package className="w-3.5 h-3.5" /> Beklemede</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Siparişler yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Sipariş Yönetimi</h1>
          <p className="text-sm text-sand-600">Gelen tüm siparişleri görüntüleyin ve durumlarını güncelleyin.</p>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 border border-sand-200 rounded-lg hover:bg-sand-100 transition-all flex items-center gap-2 text-sm font-semibold text-sand-700 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-sand-600 shadow-sm border border-sand-200">
          Henüz hiç sipariş bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-sand-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                    #{order.id.slice(0, 8)}
                  </span>
                  {getStatusBadge(order.status || 'pending')}
                  <span className="text-xs text-sand-500">
                    {new Date(order.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="text-sm text-sand-800">
                  <p className="font-semibold text-sand-900">
                    Teslimat Adresi: <span className="font-normal">{order.shipping_address || 'Adres belirtilmemiş'}</span>
                  </p>
                  <p className="text-xs text-sand-500 mt-1">
                    Toplam Tutar: <strong className="text-brand-700 text-sm">₺{order.total_amount}</strong>
                  </p>
                </div>
              </div>

              {/* Seçim Kutusu: Hem Türkçe Gösterir Hem de DB Verisine Uyum Sağlar */}
              <div className="flex items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-sand-100">
                <label className="text-xs font-semibold text-sand-600 whitespace-nowrap">
                  Durum Değiştir:
                </label>
                <select
                  value={order.status || 'pending'}
                  disabled={updatingId === order.id}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="px-3 py-2 bg-sand-50 border border-sand-300 rounded-xl text-sm font-semibold text-sand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="pending">⏳ Beklemede (pending)</option>
                  <option value="preparing">🌸 Hazırlanıyor (preparing)</option>
                  <option value="shipping">🚚 Yolda (shipping)</option>
                  <option value="delivered">✅ Teslim Edildi (delivered)</option>
                  <option value="cancelled">❌ İptal Edildi (cancelled)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;