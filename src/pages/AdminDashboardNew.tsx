import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Package, AlertTriangle, Plus, ArrowRight, RefreshCw, Tag, X, Upload, Image as ImageIcon } from 'lucide-react';
import { fetchDashboardStats, fetchRecentOrders, fetchRecentProducts } from '../services/adminApi';
import StatCard from '../components/admin/StatCard';
import StatusBadge from '../components/admin/StatusBadge';
import AdminReviewsPage from './AdminReviewsPage';
import { supabase } from '../supabaseClient';

interface Props {
  navigate: (route: any) => void;
}

export default function AdminDashboardNew({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌸 MODAL, RESİM YÜKLEME & FORM STATE
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subtitle: '',
    discount_percentage: 20,
    min_order_amount: 500,
    start_date: '',
    end_date: '',
    is_active: true,
  });

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

  // 🌸 PC'DEN RESİM SEÇME VE ÖNİZLEME
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🌸 HIZLI KAMPANYA KAYDETME & SUPABASE STORAGE'A YÜKLEME
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCampaign(true);

    let finalImageUrl = 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800'; // Varsayılan

    // Eğer PC'den resim seçildiyse Supabase Storage'a Yükle
    if (selectedImageFile) {
      setUploadingImage(true);
      const fileExt = selectedImageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `campaign-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('campaigns')
        .upload(filePath, selectedImageFile);

      if (uploadError) {
        console.error('Resim yükleme hatası:', uploadError);
        alert('Görsel yüklenirken bir sorun oluştu: ' + uploadError.message);
        setSavingCampaign(false);
        setUploadingImage(false);
        return;
      }

      // Yüklenen Resmin Public URL'sini al
      const { data: publicUrlData } = supabase.storage
        .from('campaigns')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        finalImageUrl = publicUrlData.publicUrl;
      }
      setUploadingImage(false);
    }

    // Veritabanına kaydet
    const payload = {
      title: campaignForm.title,
      subtitle: campaignForm.subtitle,
      image_url: finalImageUrl,
      discount_percentage: Number(campaignForm.discount_percentage),
      min_order_amount: Number(campaignForm.min_order_amount),
      start_date: campaignForm.start_date ? new Date(campaignForm.start_date).toISOString() : new Date().toISOString(),
      end_date: campaignForm.end_date ? new Date(campaignForm.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: campaignForm.is_active,
    };

    const { error } = await supabase.from('campaigns').insert([payload]);

    if (error) {
      alert('Kampanya eklenirken hata oluştu: ' + error.message);
    } else {
      alert('🎉 Kampanya ve görsel başarıyla oluşturuldu!');
      setIsCampaignModalOpen(false);
      // Formu & Resimleri sıfırla
      setSelectedImageFile(null);
      setImagePreviewUrl('');
      setCampaignForm({
        title: '',
        subtitle: '',
        discount_percentage: 20,
        min_order_amount: 500,
        start_date: '',
        end_date: '',
        is_active: true,
      });
    }
    setSavingCampaign(false);
  };

  const s = stats;

  return (
    <div className="space-y-6">
      {/* 🟢 ÜST SEKMELER (HIZLI GEÇİŞ PANELİ) */}
      <div className="flex gap-2 border-b border-sand-200 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white text-sand-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          📊 Genel Bakış & İstatistikler
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white text-sand-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          💬 Yorum Yönetimi
        </button>
      </div>

      {/* 🔴 İÇERİK SEÇİMİ */}
      {activeTab === 'reviews' ? (
        <AdminReviewsPage />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard icon={ShoppingBag} tone="brand" label="Toplam Sipariş" value={s?.totalOrders ?? '—'} />
            <StatCard icon={Clock} tone="amber" label="Bekleyen Sipariş" value={s?.pendingOrders ?? '—'} />
            <StatCard icon={Package} tone="leaf" label="Toplam Ürün" value={s?.activeProducts ?? '—'} />
            <StatCard icon={AlertTriangle} tone="rose" label="Düşük Stok" value={s?.lowStock ?? '—'} />
          </div>

          {/* Quick actions (4'lü Hızlı İşlem Butonları) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              className="bg-brand-50 border border-brand-200 p-4 rounded-2xl flex items-center justify-between hover:shadow-lg hover:bg-brand-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-brand-700" />
                <span className="font-semibold text-brand-900">Kampanya Oluştur</span>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate({ name: 'admin-products' })}
              className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-brand-600" />
                <span className="font-medium">Yeni Ürün Ekle</span>
              </div>
              <ArrowRight className="h-4 w-4 text-sand-400" />
            </button>

            <button
              onClick={() => navigate({ name: 'admin-orders' })}
              className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                <span className="font-medium">Siparişleri Gör</span>
              </div>
              <ArrowRight className="h-4 w-4 text-sand-400" />
            </button>

            <button
              onClick={() => navigate({ name: 'admin-categories' })}
              className="bg-white p-4 rounded-2xl border border-sand-200 flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
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
                  className="text-sm text-brand-700 hover:underline cursor-pointer"
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
                        {o.status === 'cancelled' && (o.cancel_reason || o.cancelReason) && (
                          <p className="text-xs text-red-600 bg-red-50 p-1 rounded mt-1 border border-red-100">
                            ❌ <strong>İptal Nedeni:</strong> {o.cancel_reason || o.cancelReason}
                          </p>
                        )}
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
                  className="text-sm text-brand-700 hover:underline cursor-pointer"
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
                      {p.image ? (
                        <img
                          src={p.image}
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
                          Stok: {p.stock ?? p.stock_quantity ?? 0}
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
        </>
      )}

      {/* 🌸 AÇILIR PENCERE (MODAL) - PC'DEN RESİM YÜKLEMELİ KAMPANYA OLUŞTURMA */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-sand-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-600" />
                <h2 className="text-xl font-bold text-sand-900">Yeni Kampanya Oluştur</h2>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-sand-700 mb-1">Kampanya Başlığı *</label>
                <input
                  type="text"
                  required
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Örn: Yaz Fırsatları"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-700 mb-1">Alt Açıklama</label>
                <input
                  type="text"
                  value={campaignForm.subtitle}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Örn: ₺500 Üzerine %20 Otomatik İndirim!"
                />
              </div>

              {/* 🖼️ BILGISAYARDAN GÖRSEL SEÇME ALANI */}
              <div>
                <label className="block text-xs font-bold text-sand-700 mb-1">Banner Görseli (Bilgisayardan Seç)</label>
                <div className="mt-1 border-2 border-dashed border-sand-300 rounded-2xl p-4 text-center hover:border-brand-500 transition-colors bg-sand-50/50">
                  {imagePreviewUrl ? (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden group">
                      <img src={imagePreviewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                      <label htmlFor="file-upload" className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-semibold text-xs">
                        <Upload className="w-4 h-4" /> Değiştir
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center py-3">
                      <ImageIcon className="w-8 h-8 text-sand-400 mb-1" />
                      <span className="text-xs font-bold text-brand-600 hover:underline">Bilgisayarından Görsel Seç</span>
                      <span className="text-[10px] text-sand-400 mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                    </label>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">İndirim Oranı (%)</label>
                  <input
                    type="number"
                    value={campaignForm.discount_percentage}
                    onChange={(e) => setCampaignForm({ ...campaignForm, discount_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">Min. Sepet Tutarı (₺)</label>
                  <input
                    type="number"
                    value={campaignForm.min_order_amount}
                    onChange={(e) => setCampaignForm({ ...campaignForm, min_order_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dash_is_active_file"
                  checked={campaignForm.is_active}
                  onChange={(e) => setCampaignForm({ ...campaignForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="dash_is_active_file" className="text-sm font-medium text-sand-800 cursor-pointer">
                  Kampanya Yayınlansın (Aktif)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 border border-sand-300 text-sand-700 font-semibold text-sm rounded-xl hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign || uploadingImage}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {uploadingImage ? 'Görsel Yükleniyor...' : savingCampaign ? 'Kaydediliyor...' : 'Kampanyayı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}