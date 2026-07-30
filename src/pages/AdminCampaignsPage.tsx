import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { fetchProductsFromSupabase } from '../services/supabaseData';
import type { Product } from '../types';
import { 
  Tag, Plus, Trash2, RefreshCw, Image as ImageIcon, 
  Users, Calendar, CheckSquare, Square, ShoppingBag, Edit3, X 
} from 'lucide-react';

export type CampaignType = 'percentage' | 'fixed_amount' | 'buy_x_pay_y' | 'second_item_discount';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 🌸 Form State'i
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    discount_type: 'percentage' as CampaignType,
    discount_value: 20,
    buy_x: 2,
    pay_y: 1,
    min_order_amount: 500,
    end_date: '',
    is_active: true,
    target_type: 'all' as 'all' | 'selected_products',
    target_product_ids: [] as string[],
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [{ data: campaignData, error }, { data: orders }, supabaseProducts] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, applied_coupon_code'),
        fetchProductsFromSupabase(),
      ]);

      if (error) throw error;

      setProducts(supabaseProducts || []);

      const enriched = (campaignData || []).map((c) => {
        const matchingOrders = (orders || []).filter(o => 
          o.applied_coupon_code && 
          (o.applied_coupon_code.toLowerCase() === c.title.toLowerCase() || o.applied_coupon_code === c.id)
        );
        return {
          ...c,
          usageCount: matchingOrders.length,
        };
      });

      setCampaigns(enriched);
    } catch (err) {
      console.error('Veriler çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleProductSelection = (productId: string) => {
    setForm(prev => {
      const exists = prev.target_product_ids.includes(productId);
      const updated = exists 
        ? prev.target_product_ids.filter(id => id !== productId)
        : [...prev.target_product_ids, productId];
      return { ...prev, target_product_ids: updated };
    });
  };

  // 🌸 Kampanyayı Düzenleme Moduna Al
  const startEditing = (c: any) => {
    setEditingCampaignId(c.id);
    setPreviewUrl(c.image_url || '');
    setForm({
      title: c.title || '',
      subtitle: c.subtitle || '',
      discount_type: c.discount_type || 'percentage',
      discount_value: c.discount_value || c.discount_percentage || 20,
      buy_x: c.buy_x || 2,
      pay_y: c.pay_y || 1,
      min_order_amount: c.min_order_amount || 0,
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      is_active: c.is_active ?? true,
      target_type: c.target_type || 'all',
      target_product_ids: c.target_product_ids || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingCampaignId(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setForm({
      title: '',
      subtitle: '',
      discount_type: 'percentage',
      discount_value: 20,
      buy_x: 2,
      pay_y: 1,
      min_order_amount: 500,
      end_date: '',
      is_active: true,
      target_type: 'all',
      target_product_ids: [],
    });
  };

  // 🌸 Kampanya Kaydet / Güncelle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl = previewUrl || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800';

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
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      discount_percentage: form.discount_type === 'percentage' ? Number(form.discount_value) : 0,
      buy_x: Number(form.buy_x),
      pay_y: Number(form.pay_y),
      min_order_amount: Number(form.min_order_amount),
      target_type: form.target_type,
      target_product_ids: form.target_type === 'selected_products' ? form.target_product_ids : [],
      start_date: new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: form.is_active,
    };

    let error;
    if (editingCampaignId) {
      // GÜNCELLE
      const res = await supabase.from('campaigns').update(payload).eq('id', editingCampaignId);
      error = res.error;
    } else {
      // YENİ EKLE
      const res = await supabase.from('campaigns').insert([payload]);
      error = res.error;
    }

    if (!error) {
      resetForm();
      fetchInitialData();
      alert(editingCampaignId ? 'Kampanya başarıyla güncellendi!' : 'Yeni kampanya oluşturuldu!');
    } else {
      alert('Hata: ' + error.message);
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: nextStatus } : c));

    const { error } = await supabase.from('campaigns').update({ is_active: nextStatus }).eq('id', id);
    if (error) {
      alert('Güncellenirken hata oluştu: ' + error.message);
      fetchInitialData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      alert('Silinirken hata oluştu: ' + error.message);
      fetchInitialData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* 🟢 Üst Başlık */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold text-sand-900">Kampanya Yönetimi</h1>
          <p className="text-sm text-sand-500 mt-1">
            Gelişmiş kampanya tipleriyle teklifler ve seçili çiçek indirimleri oluşturun veya var olanları düzenleyin.
          </p>
        </div>
        <button
          onClick={fetchInitialData}
          className="px-4 py-2 bg-white border border-sand-200 text-sand-700 hover:bg-sand-50 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      {/* 🌸 YENİ KAMPANYA / DÜZENLEME FORMU */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-sand-100 pb-3">
          <div className="flex items-center gap-2 text-sand-900 font-bold text-lg">
            <Tag className="w-5 h-5 text-brand-600" />
            <span>{editingCampaignId ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Oluştur'}</span>
          </div>
          {editingCampaignId && (
            <button
              onClick={resetForm}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" /> Düzenlemeyi İptal Et
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Kampanya Adı (Kupon Kodu / Başlık) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ÖRN: BAHAR100 veya 2AL1ODE"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Alt Açıklama (Slogan) *</label>
              <input
                type="text"
                required
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Örn: Tüm Buketlerde 100 TL İndirim!"
              />
            </div>
          </div>

          <div className="bg-sand-50/60 p-4 rounded-2xl border border-sand-200 space-y-4">
            <h3 className="text-xs font-extrabold text-sand-800 uppercase tracking-wider">İndirim & Kampanya Tipi</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sand-700 mb-1">Kampanya Tipi Seçin</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as CampaignType })}
                  className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="percentage">Yüzde İndirimi (%)</option>
                  <option value="fixed_amount">Sabit TL İndirimi (₺)</option>
                  <option value="buy_x_pay_y">X Al Y Öde (örn: 2 Al 1 Öde)</option>
                  <option value="second_item_discount">2. Ürüne % İndirim</option>
                </select>
              </div>

              {form.discount_type === 'percentage' && (
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">İndirim Yüzdesi (%)</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {form.discount_type === 'fixed_amount' && (
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">İndirim Tutarı (₺ TL)</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {form.discount_type === 'second_item_discount' && (
                <div>
                  <label className="block text-xs font-bold text-sand-700 mb-1">2. Ürüne Yüzde Kaç İndirim?</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {form.discount_type === 'buy_x_pay_y' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-sand-700 mb-1">Sepete Eklenecek (X)</label>
                    <input
                      type="number"
                      value={form.buy_x}
                      onChange={(e) => setForm({ ...form, buy_x: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sand-700 mb-1">Ödenecek Sayı (Y)</label>
                    <input
                      type="number"
                      value={form.pay_y}
                      onChange={(e) => setForm({ ...form, pay_y: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🌸 Dahil Olan Çiçek Seçimi ve Yönetimi */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-sand-700">Kampanyanın Geçerli Olduğu Çiçekler</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-sand-800 cursor-pointer">
                <input
                  type="radio"
                  name="target_type"
                  checked={form.target_type === 'all'}
                  onChange={() => setForm({ ...form, target_type: 'all' })}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                Tüm Çiçeklerde Geçerli
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-sand-800 cursor-pointer">
                <input
                  type="radio"
                  name="target_type"
                  checked={form.target_type === 'selected_products'}
                  onChange={() => setForm({ ...form, target_type: 'selected_products' })}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                Sadece Seçili Çiçeklerde Geçerli ({form.target_product_ids.length} Seçildi)
              </label>
            </div>

            {form.target_type === 'selected_products' && (
              <div className="border border-sand-200 rounded-2xl p-4 bg-sand-50/40 max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                {products.length === 0 ? (
                  <p className="text-xs text-sand-500 col-span-2">Çiçekler yükleniyor...</p>
                ) : (
                  products.map((p) => {
                    const isSelected = form.target_product_ids.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer border transition-all ${
                          isSelected 
                            ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-xs' 
                            : 'bg-white border-sand-200 hover:bg-sand-100 text-sand-700'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-brand-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-sand-400 flex-shrink-0" />
                        )}
                        <img src={(p as any).image_url || (p as any).image || p.images?.[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div className="min-w-0 text-xs">
                          <p className="font-bold truncate">{p.name}</p>
                          <p className="text-sand-500">₺{p.price}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Min. Sepet Tutarı (₺)</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-sand-300 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-700 mb-1">Banner Görseli</label>
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
              {editingCampaignId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {uploadingImage ? 'Görsel Yükleniyor...' : saving ? 'Kaydediliyor...' : editingCampaignId ? 'Kampanyayı Güncelle' : 'Kampanyayı Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* 🌸 SİSTEMDEKİ KAMPANYALAR LİSTESİ */}
      <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-sand-100 pb-3">
          <h2 className="font-bold text-sand-900 text-lg">Sistemdeki Kampanyalar ve Seçili Çiçekler</h2>
          <span className="text-xs text-sand-500">Aktif kampanyalar anasayfa ve mağazada gösterilir.</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sand-500">Yükleniyor...</div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-sand-500 py-6 text-center">Henüz oluşturulmuş kampanya bulunmuyor.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {campaigns.map((c) => {
              // Kampanyaya dahil olan ürünlerin isimlerini eşleştir
              const selectedProductsList = (products || []).filter(p => c.target_product_ids?.includes(p.id));

              return (
                <div key={c.id} className="py-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

                        <div className="flex flex-wrap items-center gap-2 text-xs text-sand-600 font-medium mt-1.5">
                          <span className="text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                            {c.discount_type === 'fixed_amount' && `₺${c.discount_value} İndirim`}
                            {c.discount_type === 'percentage' && `%${c.discount_value || c.discount_percentage} İndirim`}
                            {c.discount_type === 'buy_x_pay_y' && `${c.buy_x || 2} Al ${c.pay_y || 1} Öde`}
                            {c.discount_type === 'second_item_discount' && `2. Ürüne %${c.discount_value} İndirim`}
                            {!c.discount_type && `%${c.discount_percentage} İndirim`}
                          </span>

                          <span className="flex items-center gap-1 text-sand-700 bg-sand-100 px-2 py-0.5 rounded-lg">
                            <ShoppingBag className="w-3 h-3 text-sand-500" />
                            {c.target_type === 'selected_products' 
                              ? `${selectedProductsList.length} Seçili Çiçek` 
                              : 'Tüm Çiçekler'}
                          </span>

                          <span className="flex items-center gap-1 font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                            <Users className="w-3.5 h-3.5" /> Kullanım: {c.usageCount} Kişi
                          </span>

                          <span className="flex items-center gap-1 text-sand-400">
                            <Calendar className="w-3 h-3" /> Son: {new Date(c.end_date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => startEditing(c)}
                        className="px-3 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Düzenle
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActive(c.id, c.is_active)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

                  {/* 🌸 Seçili Çiçeklerin Küçük Resimli Önizlemesi */}
{c.target_type === 'selected_products' && selectedProductsList.length > 0 && (
  <div className="bg-sand-50/70 p-2.5 rounded-2xl border border-sand-200/60 mt-1 flex items-center gap-2 overflow-x-auto">
    <span className="text-[11px] font-bold text-sand-500 whitespace-nowrap pl-1">Geçerli Çiçekler:</span>
    {selectedProductsList.map((prod) => (
      <div key={prod.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-sand-200 text-xs font-semibold text-sand-800 whitespace-nowrap">
        <img 
          src={(prod as any).image_url || (prod as any).image || prod.images?.[0]} 
          alt={prod.name} 
          className="w-5 h-5 rounded-md object-cover" 
        />
        <span>{prod.name}</span>
      </div>
    ))}
  </div>
)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}