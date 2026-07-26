import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Package, Tag, Calendar, ArrowRight, RefreshCw } from 'lucide-react';
import type { Route, SalesAnalytics, ProductSalesAnalytics, CategorySalesAnalytics, CouponAnalytics } from '../types';
import {
  getSalesAnalytics,
  getProductSalesAnalytics,
  getCategorySalesAnalytics,
  getCouponAnalytics,
  getTopSellingProducts,
  getTopSellingCategories,
} from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  navigate: (r: Route) => void;
};

export default function AdminAnalyticsPage({ navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesAnalytics[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesAnalytics[]>([]);
  const [topCategories, setTopCategories] = useState<CategorySalesAnalytics[]>([]);
  const [couponData, setCouponData] = useState<CouponAnalytics[]>([]);
  const [dateRange, setDateRange] = useState(30); // Last 30 days

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const [sales, products, categories, coupons] = await Promise.all([
        getSalesAnalytics(startDateStr, endDateStr),
        getTopSellingProducts(5),
        getTopSellingCategories(5),
        getCouponAnalytics(startDateStr, endDateStr),
      ]);

      setSalesData(sales);
      setTopProducts(products);
      setTopCategories(categories);
      setCouponData(coupons);
    } catch (error) {
      console.error('Analitik verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalRevenue = salesData.reduce((sum, day) => sum + day.total_revenue, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.total_orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCouponUsage = salesData.reduce((sum, day) => sum + day.coupon_usage, 0);

    return { totalRevenue, totalOrders, avgOrderValue, totalCouponUsage };
  };

  const { totalRevenue, totalOrders, avgOrderValue, totalCouponUsage } = calculateTotals();

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Admin', route: { name: 'admin-dashboard' } as Route },
    { label: 'Analitik' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Satış Analitikleri</h1>
          <p className="text-sand-500 mt-2">İşletme performansınızı takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="input text-sm"
          >
            <option value={7}>Son 7 Gün</option>
            <option value={30}>Son 30 Gün</option>
            <option value={90}>Son 90 Gün</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-lg border border-sand-200 hover:bg-sand-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-sand-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-xs text-sand-500">Toplam Gelir</span>
              </div>
              <p className="text-2xl font-bold text-sand-900">{totalRevenue.toLocaleString('tr-TR')} TL</p>
              <p className="text-xs text-sand-500 mt-1">Son {dateRange} gün</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-leaf-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-leaf-600" />
                </div>
                <span className="text-xs text-sand-500">Toplam Sipariş</span>
              </div>
              <p className="text-2xl font-bold text-sand-900">{totalOrders}</p>
              <p className="text-xs text-sand-500 mt-1">Son {dateRange} gün</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-xs text-sand-500">Ort. Sipariş</span>
              </div>
              <p className="text-2xl font-bold text-sand-900">{avgOrderValue.toFixed(2)} TL</p>
              <p className="text-xs text-sand-500 mt-1">Sipariş başına</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs text-sand-500">Kupon Kullanımı</span>
              </div>
              <p className="text-2xl font-bold text-sand-900">{totalCouponUsage}</p>
              <p className="text-xs text-sand-500 mt-1">Son {dateRange} gün</p>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-sand-900">Günlük Satış Grafiği</h2>
              <div className="flex items-center gap-2 text-sm text-sand-500">
                <Calendar className="w-4 h-4" />
                <span>Son {dateRange} gün</span>
              </div>
            </div>
            
            {salesData.length > 0 ? (
              <div className="h-64 flex items-end gap-2">
                {salesData.map((day, index) => {
                  const maxRevenue = Math.max(...salesData.map(d => d.total_revenue));
                  const height = maxRevenue > 0 ? (day.total_revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={day.id} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-brand-100 rounded-t-lg relative group" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-sand-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.total_revenue.toLocaleString('tr-TR')} TL
                        </div>
                      </div>
                      <span className="text-xs text-sand-500">
                        {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sand-500">
                Veri bulunmuyor
              </div>
            )}
          </div>

          {/* Top Products & Categories */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-sand-900 mb-4">En Çok Satan Ürünler</h2>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sand-800 truncate">{product.product_name}</p>
                        <p className="text-xs text-sand-500">{product.quantity_sold} adet satıldı</p>
                      </div>
                      <span className="font-semibold text-sand-900">{product.revenue.toLocaleString('tr-TR')} TL</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sand-500">Veri bulunmuyor</div>
              )}
            </div>

            {/* Top Categories */}
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-sand-900 mb-4">En Çok Satan Kategoriler</h2>
              {topCategories.length > 0 ? (
                <div className="space-y-3">
                  {topCategories.map((category, index) => (
                    <div key={category.id} className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sand-800 truncate">{category.category_name}</p>
                        <p className="text-xs text-sand-500">{category.total_orders} sipariş</p>
                      </div>
                      <span className="font-semibold text-sand-900">{category.total_revenue.toLocaleString('tr-TR')} TL</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sand-500">Veri bulunmuyor</div>
              )}
            </div>
          </div>

          {/* Coupon Performance */}
          {couponData.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-sand-900 mb-4">Kupon Performansı</h2>
              <div className="space-y-3">
                {couponData.map((coupon) => (
                  <div key={coupon.id} className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sand-800">{coupon.coupon_code}</p>
                      <p className="text-xs text-sand-500">{coupon.usage_count} kullanım</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sand-900">{coupon.discount_total.toLocaleString('tr-TR')} TL</p>
                      <p className="text-xs text-sand-500">indirim</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
