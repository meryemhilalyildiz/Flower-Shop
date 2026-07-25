import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Package, AlertTriangle, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchDashboardStats, fetchRecentOrders, fetchRecentProducts } from '../services/adminApi';
import StatCard from '../components/admin/StatCard';
import StatusBadge from '../components/admin/StatusBadge';

interface Props {
  navigate: (route: any) => void;
}

export default function AdminDashboard({ navigate }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ordersData, productsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentOrders(5),
          fetchRecentProducts(5),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
        setRecentProducts(productsData);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const s = stats;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} tone="brand" label="Toplam Sipariş" value={s?.totalOrders ?? '—'} />
        <StatCard icon={Clock} tone="amber" label="Bekleyen Sipariş" value={s?.pendingOrders ?? '—'} />
        <StatCard icon={Package} tone="leaf" label="Toplam Ürün" value={s?.activeProducts ?? '—'} />
        <StatCard icon={AlertTriangle} tone="rose" label="Düşük Stok" value={s?.lowStock ?? '—'} />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-3">
        <button
          onClick={() => navigate({ name: 'admin-products' })}
          className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-brand-600" />
            <span className="font-medium">Yeni Ürün Ekle</span>
          </div>
          <ArrowRight className="h-4 w-4 text-sand-400" />
        </button>
        <button
          onClick={() => navigate({ name: 'admin-orders' })}
          className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <span className="font-medium">Siparişleri Gör</span>
          </div>
          <ArrowRight className="h-4 w-4 text-sand-400" />
        </button>
        <button
          onClick={() => navigate({ name: 'admin-categories' })}
          className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-brand-600" />
            <span className="font-medium">Kategoriler</span>
          </div>
          <ArrowRight className="h-4 w-4 text-sand-400" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <section className="bg-white rounded-2xl p-5 border border-sand-200">
          <header className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-sand-900">Son Siparişler</h2>
            <button
              onClick={() => navigate({ name: 'admin-orders' })}
              className="text-sm text-brand-700 hover:underline"
            >
              Tümü →
            </button>
          </header>
          {loading ? (
            <div className="py-8 flex justify-center text-sand-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
          ) : recentOrders?.length ? (
            <ul className="divide-y divide-sand-100">
              {recentOrders.map((o: any) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-sand-500">#{o.id.slice(0, 8)}</p>
                    <p className="text-sm text-sand-800 truncate">
                      {o.recipient_name || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ₺{Number(o.total_amount).toLocaleString('tr-TR')}
                    </p>
                    <StatusBadge status={o.status || 'pending'} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-sand-500 py-6 text-center">Henüz sipariş yok.</p>
          )}
        </section>

        {/* Recent products */}
        <section className="bg-white rounded-2xl p-5 border border-sand-200">
          <header className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-sand-900">Son Eklenen Ürünler</h2>
            <button
              onClick={() => navigate({ name: 'admin-products' })}
              className="text-sm text-brand-700 hover:underline"
            >
              Tümü →
            </button>
          </header>
          {loading ? (
            <div className="py-8 flex justify-center text-sand-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
          ) : recentProducts?.length ? (
            <ul className="divide-y divide-sand-100">
              {recentProducts.map((p: any) => (
                <li key={p.id} className="py-3 flex items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover bg-sand-100"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-brand-50 grid place-items-center text-brand-500">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sand-900 truncate">{p.name}</p>
                    <p className="text-xs text-sand-500">
                      Stok: {p.stock_quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-700">
                    ₺{Number(p.price).toLocaleString('tr-TR')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-sand-500 py-6 text-center">Henüz ürün yok.</p>
          )}
        </section>
      </div>
    </div>
  );
}
