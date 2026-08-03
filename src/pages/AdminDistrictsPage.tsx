import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit3, Trash2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface District {
  id: string;
  name: string;
  delivery_fee: number;
  distance_coefficient: number;
  is_active: boolean;
}

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  const [newDistrict, setNewDistrict] = useState({
    name: '',
    delivery_fee: 25,
    distance_coefficient: 1,
    is_active: true
  });

  const loadDistricts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name');
      
      if (error) {
        if (error.code === 'PGRST205') {
          setDistricts([]);
          return;
        }
        throw error;
      }
      setDistricts(data || []);
    } catch (err) {
      console.error('İlçeler yüklenirken hata:', err);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistricts();
  }, []);

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('districts').insert(newDistrict);
      if (error) {
        if (error.code === 'PGRST205') {
          alert('Districts tablosu henüz oluşturulmadı. Supabase\'de districts tablosunu oluşturun.');
          return;
        }
        throw error;
      }
      
      alert('İlçe başarıyla eklendi!');
      setShowAddModal(false);
      setNewDistrict({ name: '', delivery_fee: 25, distance_coefficient: 1, is_active: true });
      loadDistricts();
    } catch (err) {
      alert('Ekleme sırasında hata oluştu.');
    }
  };

  const handleUpdateDistrict = async (id: string, updates: Partial<District>) => {
    try {
      const { error } = await supabase.from('districts').update(updates).eq('id', id);
      if (error) throw error;
      
      setDistricts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      setEditingDistrict(null);
      alert('İlçe güncellendi!');
    } catch (err) {
      alert('Güncelleme başarısız.');
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!confirm('Bu ilçeyi silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('districts').delete().eq('id', id);
      if (error) throw error;
      
      setDistricts((prev) => prev.filter((d) => d.id !== id));
      alert('İlçe silindi.');
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        İlçeler yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">İlçe Yönetimi</h1>
          <p className="text-sm text-sand-600">Teslimat ücretleri ve mesafe katsayılarını yönetin.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Yeni İlçe
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sand-200 text-xs font-semibold text-sand-500 uppercase">
                <th className="p-3">İlçe Adı</th>
                <th className="p-3">Teslimat Ücreti (₺)</th>
                <th className="p-3">Mesafe Katsayısı</th>
                <th className="p-3">Durum</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 text-sm">
              {districts.map((district) => (
                <tr key={district.id} className="hover:bg-sand-50">
                  <td className="p-3 font-semibold text-sand-900">
                    {editingDistrict?.id === district.id ? (
                      <input
                        type="text"
                        defaultValue={district.name}
                        id={`name-${district.id}`}
                        className="w-full px-2 py-1 border border-sand-300 rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-600" />
                        {district.name}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sand-600">
                    {editingDistrict?.id === district.id ? (
                      <input
                        type="number"
                        defaultValue={district.delivery_fee}
                        id={`fee-${district.id}`}
                        className="w-24 px-2 py-1 border border-sand-300 rounded-lg"
                      />
                    ) : (
                      `₺${district.delivery_fee}`
                    )}
                  </td>
                  <td className="p-3 text-sand-600">
                    {editingDistrict?.id === district.id ? (
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={district.distance_coefficient}
                        id={`coeff-${district.id}`}
                        className="w-24 px-2 py-1 border border-sand-300 rounded-lg"
                      />
                    ) : (
                      district.distance_coefficient.toFixed(1)
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      district.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {district.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {editingDistrict?.id === district.id ? (
                      <button
                        onClick={() => {
                          const name = (document.getElementById(`name-${district.id}`) as HTMLInputElement).value;
                          const fee = parseFloat((document.getElementById(`fee-${district.id}`) as HTMLInputElement).value);
                          const coeff = parseFloat((document.getElementById(`coeff-${district.id}`) as HTMLInputElement).value);
                          handleUpdateDistrict(district.id, { name, delivery_fee: fee, distance_coefficient: coeff });
                        }}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        title="Kaydet"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingDistrict(district)}
                        className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDistrict(district.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-sand-400 hover:text-sand-700">
              <Trash2 className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">Yeni İlçe Ekle</h3>

            <form onSubmit={handleAddDistrict} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-sand-700">İlçe Adı</label>
                <input
                  type="text"
                  required
                  value={newDistrict.name}
                  onChange={(e) => setNewDistrict({ ...newDistrict, name: e.target.value })}
                  placeholder="ör. Çankaya"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-sand-700">Teslimat Ücreti (₺)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newDistrict.delivery_fee}
                    onChange={(e) => setNewDistrict({ ...newDistrict, delivery_fee: parseFloat(e.target.value) })}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-sand-700">Mesafe Katsayısı</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={newDistrict.distance_coefficient}
                    onChange={(e) => setNewDistrict({ ...newDistrict, distance_coefficient: parseFloat(e.target.value) })}
                    placeholder="1.0"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newDistrict.is_active}
                  onChange={(e) => setNewDistrict({ ...newDistrict, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-sand-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm text-sand-700">Aktif</label>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl">
                İlçeyi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
