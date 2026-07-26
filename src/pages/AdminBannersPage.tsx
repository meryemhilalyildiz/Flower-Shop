import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Calendar, Link as LinkIcon, Check, X } from 'lucide-react';
import type { Route } from '../types';
import { supabase } from '../supabaseClient';
import type { Banner } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  navigate: (r: Route) => void;
};

export default function AdminBannersPage({ navigate }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    link_url: '',
    link_text: 'Şimdi Keşfet',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    sort_order: '0',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Bannerlar yüklenirken hata:', error);
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        background_color: formData.background_color,
        text_color: formData.text_color,
        link_url: formData.link_url || null,
        link_text: formData.link_text,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert([bannerData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingBanner(null);
      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Banner kaydedilirken hata:', error);
      alert('Banner kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bannerı silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) {
      console.error('Banner silinirken hata:', error);
      alert('Banner silinirken bir hata oluştu');
    } else {
      loadBanners();
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      background_color: banner.background_color,
      text_color: banner.text_color,
      link_url: banner.link_url || '',
      link_text: banner.link_text,
      start_date: banner.start_date.split('T')[0],
      end_date: banner.end_date?.split('T')[0] || '',
      is_active: banner.is_active,
      sort_order: banner.sort_order.toString(),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      background_color: '#ffffff',
      text_color: '#000000',
      link_url: '',
      link_text: 'Şimdi Keşfet',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
      sort_order: '0',
    });
  };

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Admin', route: { name: 'admin-dashboard' } as Route },
    { label: 'Bannerlar' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Kampanya Bannerları</h1>
          <p className="text-sand-500 mt-2">Bannerları yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBanner(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Banner
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="card overflow-hidden">
              <div className="relative aspect-[3/1] overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="text-white font-bold text-lg">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-white/80 text-sm">{banner.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    banner.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-sand-100 text-sand-600'
                  }`}>
                    {banner.is_active ? (
                      <><Check className="w-3 h-3" /> Aktif</>
                    ) : (
                      <><X className="w-3 h-3" /> Pasif</>
                    )}
                  </span>
                  <span className="text-xs text-sand-500">Sıra: {banner.sort_order}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 p-2 rounded-lg hover:bg-sand-100 text-sand-600 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-sand-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100">
              <h2 className="font-display text-xl font-bold text-sand-900">
                {editingBanner ? 'Banner Düzenle' : 'Yeni Banner'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Flash Sale!"
                />
              </div>
              <div>
                <label className="label">Alt Başlık</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="input"
                  placeholder="Sadece bugün geçerli"
                />
              </div>
              <div>
                <label className="label">Görsel URL *</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Arka Plan Rengi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="input flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Metin Rengi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="input flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Link URL</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="input"
                  placeholder="/shop veya https://example.com"
                />
              </div>
              <div>
                <label className="label">Link Metni</label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  className="input"
                  placeholder="Şimdi Keşfet"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Sıralama</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <label className="text-sm text-sand-700">Aktif</label>
              </div>
            </div>
            <div className="p-6 border-t border-sand-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                İptal
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editingBanner ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
