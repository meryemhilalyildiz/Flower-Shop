import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Tag, Plus, Trash2, RefreshCw, Upload, Image as ImageIcon, Users, Calendar } from 'lucide-react';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    discount_percentage: 20,
    min_order_amount: 500,
    end_date: '',
    is_active: true,
  });

  // 🌸 Kampanyaları Ve Doğrudan Bu Kampanya İle Verilen Sipariş Sayısını Çek
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [{ data: campaignData, error }, { data: orders }] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, applied_coupon_code'),
      ]);

      if (error) throw error;

      // Gerçek kullanım kontrolü: Siparişin kampanya ismi veya id'si ile eşleşmesi
      const enriched = (campaignData || []).map((c) => {
        const matchingOrders = (orders || []).filter(o => 
          o.applied_coupon_code && 
          (o.applied_coupon_code.toLowerCase() === c.title.toLowerCase() || o.applied_coupon_code === c.id)
        );
        return {
          ...c,
          usageCount: matchingOrders.length, // Kampanya özelinde kullanılan gerçek sipariş sayısı (varsayılan 0)
        };
      });

      setCampaigns(enriched);
    } catch (err) {
      console.error('Kampanyalar çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 🌸 PC'den Resim Seçme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🌸 Yeni Kampanya Kaydet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl = 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800';

    if (selectedFile) {
      setUploadingImage(true);
      const ext = selectedFile.name.split('.').pop();
      const path = `campaign-banners/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('campaigns').upload(path, selectedFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('campaigns').getPublicUrl(path);
        if (data?.publicUrl) imageUrl = data.publicUrl;
      }
      setUploadingImage(false);
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      image_url: imageUrl,
      discount_percentage: Number(form.discount_percentage),
      min_order_amount: Number(form.min_order_amount),
      start_date: new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: form.is_active,
    };

    const { error } = await supabase.from('campaigns').insert([payload]);

    if (!error) {
      setSelectedFile(null);
      setPreviewUrl('');
      setForm({
        title: '',
        subtitle: '',
        discount_percentage: 20,
        min_order_amount: 500,
        end_date: '',
        is_active: true,
      });
      fetchCampaigns();
    } else {
      alert('Hata: ' + error.message);
    }
    setSaving(false);
  };

  // 🌸 Aktif / Pasif Değiştirme
  const toggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: nextStatus } : c));

    const { error } = await supabase
      .from('campaigns')
      .update({ is_active: nextStatus })
      .eq('id', id);

    if (error) {
      alert('Güncellenirken hata oluştu: ' + error.message);
      fetchCampaigns();
    }
  };

  // 🌸 Silme
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    
    setCampaigns(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      alert('Silinirken hata oluştu: ' + error.message);
      fetchCampaigns();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* 🟢 Üst Başlık */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold text-sand-900">Kampanya Yönetimi</h1>
          <p className="text-sm text-sand-500 mt-1">
            Anasayfa için özel indirim kampanyaları oluşturun, geçerlilik sürelerini ve limitlerini belirleyin.
          </p>
        </div>
        <button
          onClick={fetchCampaigns}
          className="px-4 py-2 bg-white border border-sand-200 text-sand-700 hover:bg-sand-50 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      {/* 🌸 YENİ KAMPANYA EKLE KARTI */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sand-900 font-bold text-lg border-b border-sand-100 pb-3">
          <Tag className="w-5 h-5 text-brand-600" />
          <span>Yeni Kampanya Ekle</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Kampanya Adı (Başlık) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ÖRN: YAZ2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Alt Açıklama *</label>
              <input
                type="text"
                required
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Örn: ₺500 Üzerine %20 İndirim!"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">İndirim Oranı (%)</label>
              <input
                type="number"
                value={form.discount_percentage}
                onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Min. Sepet Tutarı (TL)</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Ne Zamana Kadar?</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Banner Görseli (PC'den Seç)</label>
              <div className="border border-dashed border-sand-300 rounded-2xl p-2 text-center bg-sand-50/50 flex items-center justify-center gap-2">
                {previewUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={previewUrl} alt="Önizleme" className="w-10 h-10 rounded-xl object-cover" />
                    <label htmlFor="camp-file" className="text-xs text-brand-600 font-bold cursor-pointer hover:underline">Değiştir</label>
                  </div>
                ) : (
                  <label htmlFor="camp-file" className="cursor-pointer flex items-center gap-2 text-xs font-bold text-brand-600 py-1">
                    <ImageIcon className="w-4 h-4" /> Görsel Seç
                  </label>
                )}
                <input id="camp-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="page_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="page_is_active" className="text-sm font-medium text-sand-800 cursor-pointer">
                Hemen Yayınla (Aktif)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {uploadingImage ? 'Görsel Yükleniyor...' : saving ? 'Kaydediliyor...' : 'Kampanyayı Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* 🌸 SİSTEMDEKİ KAMPANYALAR KARTI */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-sand-100 pb-3">
          <h2 className="font-bold text-sand-900 text-lg">Sistemdeki Kampanyalar ve Durumları</h2>
          <span className="text-xs text-sand-500">Aktif kampanyalar anasayfada otomatik yayınlanır.</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sand-500">Yükleniyor...</div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-sand-500 py-6 text-center">Henüz oluşturulmuş kampanya bulunmuyor.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {campaigns.map((c) => (
              <div key={c.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={c.image_url} alt={c.title} className="w-16 h-16 rounded-2xl object-cover bg-sand-100 border border-sand-200" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sand-900 text-base">{c.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-xs text-sand-500 mt-0.5">{c.subtitle}</p>

                    {/* Bilgi Rozetleri & Gerçek Kullanım Sayısı */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-sand-600 font-medium mt-1.5">
                      <span className="text-brand-700 font-bold">%{c.discount_percentage} İndirim</span>
                      <span>•</span>
                      <span>Min. Sepet: ₺{c.min_order_amount}</span>
                      <span>•</span>
                      {/* 🌸 Gerçek Kullanım Sayısı */}
                      <span className="flex items-center gap-1 font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                        <Users className="w-3.5 h-3.5" /> Kullanım: {c.usageCount} Kişi
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-sand-400">
                        <Calendar className="w-3 h-3" /> Son Tarih: {new Date(c.end_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleActive(c.id, c.is_active)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      c.is_active
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    }`}
                  >
                    {c.is_active ? 'Pasife Al' : 'Yayınla'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-sand-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}