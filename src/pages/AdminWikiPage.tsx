import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, RefreshCw, BookOpen, Leaf, Droplets, Sun, Thermometer, X, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fetchProductIdsForWikiEntry, setWikiEntryProducts } from '../services/supabaseData';

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface SimpleProduct {
  id: string;
  name: string;
  image: string;
}

export default function AdminWikiPage() {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'bakim',
    tags: '',
  });

  const categories = [
    { id: 'bakim', label: 'Çiçek Bakımı', icon: Droplets },
    { id: 'turler', label: 'Çiçek Türleri', icon: Leaf },
    { id: 'aranjman', label: 'Aranjmanlar', icon: BookOpen },
    { id: 'sulama', label: 'Sulama Rehberi', icon: Droplets },
    { id: 'isik', label: 'Işık Gereksinimi', icon: Sun },
    { id: 'sicaklik', label: 'Sıcaklık', icon: Thermometer },
  ];

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205') {
          setEntries([]);
          return;
        }
        throw error;
      }
      setEntries(data || []);
    } catch (err) {
      console.error('Wiki yüklenirken hata:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image')
      .order('name');

    if (!error) setProducts(data || []);
  };

  useEffect(() => {
    loadEntries();
    loadProducts();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('wiki_entries').insert({
        title: newEntry.title,
        content: newEntry.content,
        category: newEntry.category,
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(t => t),
      }).select('id').single();
      
      if (error) {
        if (error.code === 'PGRST205') {
          alert('Wiki tablosu henüz oluşturulmadı. Supabase\'de wiki_entries tablosunu oluşturun.');
          return;
        }
        throw error;
      }

      if (data && selectedProductIds.length > 0) {
        await setWikiEntryProducts(data.id, selectedProductIds);
      }
      
      alert('Wiki girişi başarıyla eklendi!');
      setShowAddModal(false);
      setNewEntry({ title: '', content: '', category: 'bakim', tags: '' });
      setSelectedProductIds([]);
      loadEntries();
    } catch (err) {
      alert('Ekleme sırasında hata oluştu.');
    }
  };

  const handleUpdateEntry = async (id: string, updates: Partial<WikiEntry>) => {
    try {
      const { error } = await supabase.from('wiki_entries').update(updates).eq('id', id);
      if (error) throw error;

      await setWikiEntryProducts(id, selectedProductIds);
      
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      setEditingEntry(null);
      setSelectedProductIds([]);
      alert('Wiki girişi güncellendi!');
    } catch (err) {
      alert('Güncelleme başarısız.');
    }
  };

  const openEditModal = async (entry: WikiEntry) => {
    setEditingEntry(entry);
    setProductSearch('');
    const assignedIds = await fetchProductIdsForWikiEntry(entry.id);
    setSelectedProductIds(assignedIds);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Bu wiki girişini silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('wiki_entries').delete().eq('id', id);
      if (error) throw error;
      
      setEntries((prev) => prev.filter((e) => e.id !== id));
      alert('Wiki girişi silindi.');
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  const getCategoryIcon = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.icon || BookOpen;
  };

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.label || catId;
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Wiki yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Botanik Wiki</h1>
          <p className="text-sm text-sand-600">Çiçek bakımı ve bilgileri için Zettelkasten sistemi.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Yeni Giriş
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => {
          const Icon = getCategoryIcon(entry.category);
          return (
            <div key={entry.id} className="bg-white rounded-2xl p-5 border border-sand-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
                    {getCategoryLabel(entry.category)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="p-1.5 text-sand-400 hover:text-sand-700 hover:bg-sand-100 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 text-sand-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-sand-900 mb-2">{entry.title}</h3>
              <p className="text-sm text-sand-600 line-clamp-3 mb-3">{entry.content}</p>
              
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-sand-100 text-sand-600 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-sand-600 shadow-sm border border-sand-200">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-sand-400" />
          <p>Henüz wiki girişi yok. İlk girişi ekleyin!</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowAddModal(false); setSelectedProductIds([]); setProductSearch(''); }} className="absolute top-4 right-4 text-sand-400 hover:text-sand-700">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">Yeni Wiki Girişi</h3>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-sand-700">Başlık</label>
                <input
                  type="text"
                  required
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="ör. Güllerin Sulama Rehberi"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori</label>
                <select
                  required
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">İçerik</label>
                <textarea
                  required
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="Çiçek bakım detayları..."
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none h-32"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Etiketler (virgülle ayırın)</label>
                <input
                  type="text"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                  placeholder="gül, sulama, bakım"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700 block mb-2">
                  Hangi ürünlere atansın? ({selectedProductIds.length} seçili)
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-sand-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ürün ara..."
                    className="w-full pl-9 pr-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="border border-sand-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-sand-100">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-sand-50">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 accent-brand-600"
                        />
                        {p.image && (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        <span className="text-sand-800">{p.name}</span>
                      </label>
                    ))}
                  {products.length === 0 && (
                    <p className="px-3 py-4 text-sm text-sand-400 text-center">Ürün bulunamadı.</p>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl">
                Wiki Girişini Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setEditingEntry(null); setSelectedProductIds([]); setProductSearch(''); }}
              className="absolute top-4 right-4 text-sand-400 hover:text-sand-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">Wiki Girişini Düzenle</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingEntry) return;
                handleUpdateEntry(editingEntry.id, {
                  title: editingEntry.title,
                  content: editingEntry.content,
                  category: editingEntry.category,
                  tags: editingEntry.tags,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-sand-700">Başlık</label>
                <input
                  type="text"
                  required
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori</label>
                <select
                  required
                  value={editingEntry.category}
                  onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">İçerik</label>
                <textarea
                  required
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none h-32"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Etiketler (virgülle ayırın)</label>
                <input
                  type="text"
                  value={editingEntry.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter((t) => t),
                    })
                  }
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700 block mb-2">
                  Hangi ürünlere atansın? ({selectedProductIds.length} seçili)
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-sand-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ürün ara..."
                    className="w-full pl-9 pr-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="border border-sand-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-sand-100">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-sand-50">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 accent-brand-600"
                        />
                        {p.image && (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        <span className="text-sand-800">{p.name}</span>
                      </label>
                    ))}
                  {products.length === 0 && (
                    <p className="px-3 py-4 text-sm text-sand-400 text-center">Ürün bulunamadı.</p>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Değişiklikleri Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
