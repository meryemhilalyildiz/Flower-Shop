import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, ShoppingBag, Building2, RefreshCw, Save, X, Truck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { addProduct, updateProduct, deleteProduct } from '../services/api';

export function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Yeni Ürün Form State'i
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    image_url: '',
    category: 'Cicekler',
    description: ''
  });

  // Ürünleri Çek
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      alert('Ürünler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Yeni Ürün Ekle
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProduct({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800',
        category: newProduct.category,
        description: newProduct.description
      });
      alert('Yeni çiçek başarıyla eklendi!');
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', image_url: '', category: 'Cicekler', description: '' });
      loadProducts();
    } catch (err) {
      alert('Ekleme sırasında hata oluştu.');
    }
  };

  // Fiyat/Stok Hızlı Güncelleme
  const handleUpdateProduct = async (id: string, updates: any) => {
    try {
      await updateProduct(id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      setEditingProduct(null);
      alert('Ürün güncellendi!');
    } catch (err) {
      alert('Güncelleme başarısız.');
    }
  };

  // Ürün Sil
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bu çiçeği silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert('Ürün silindi.');
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-700" />
        Admin Paneli Yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Üst Yönetici Başlığı ve Hızlı Yönlendirmeler */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-full border border-rose-500/30">
            ⚙️ Yönetici Paneli
          </span>
          <h1 className="text-3xl font-bold font-display mt-2">Mağaza ve Stok Yönetimi</h1>
          <p className="text-gray-300 text-sm mt-1">Ürün ekleyin, fiyatları ve stok durumlarını anlık yönetin.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => (window.location.hash = '#/admin/siparisler')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Siparişleri Kontrol Et
          </button>
          <button
            onClick={() => (window.location.hash = '#/admin/sirketler')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4" /> B2B Onayları
          </button>
          <button
            onClick={() => (window.location.hash = '#/admin/kargo')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4" /> Kargo Yönetimi
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Çiçek Ekle
          </button>
        </div>
      </div>

      {/* Ürün Listesi ve Stok/Fiyat Yönetim Tablosu */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-700" />
            Mevcut Çiçekler ve Stok/Fiyat Kontrolü ({products.length})
          </h2>
          <button onClick={loadProducts} className="p-2 border border-sand-200 rounded-lg hover:bg-sand-50 transition-all text-xs font-semibold text-sand-700 flex items-center gap-1 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand-200 text-xs font-semibold text-sand-500 uppercase tracking-wider bg-sand-50/50">
                <th className="p-3">Görsel</th>
                <th className="p-3">Çiçek Adı</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Fiyat (₺)</th>
                <th className="p-3">Stok Adedi</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 text-sm">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-sand-50/50 transition-all">
                  <td className="p-3">
                    <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-sand-200" />
                  </td>
                  <td className="p-3 font-semibold text-sand-900">{p.name}</td>
                  <td className="p-3 text-sand-600 text-xs">{p.category || 'Çiçekler'}</td>
                  
                  {/* Fiyat Alanı */}
                  <td className="p-3 font-bold text-rose-800">
                    {editingProduct?.id === p.id ? (
                      <input
                        type="number"
                        defaultValue={p.price}
                        id={`price-${p.id}`}
                        className="w-20 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                      />
                    ) : (
                      `₺${p.price}`
                    )}
                  </td>

                  {/* Stok Alanı */}
                  <td className="p-3">
                    {editingProduct?.id === p.id ? (
                      <input
                        type="number"
                        defaultValue={p.stock || 0}
                        id={`stock-${p.id}`}
                        className="w-20 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                      />
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {p.stock || 0} Adet Stok
                      </span>
                    )}
                  </td>

                  {/* Aksiyon Butonları */}
                  <td className="p-3 text-right space-x-2">
                    {editingProduct?.id === p.id ? (
                      <button
                        onClick={() => {
                          const newPrice = (document.getElementById(`price-${p.id}`) as HTMLInputElement).value;
                          const newStock = (document.getElementById(`stock-${p.id}`) as HTMLInputElement).value;
                          handleUpdateProduct(p.id, { price: parseFloat(newPrice), stock: parseInt(newStock) });
                        }}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                        title="Kaydet"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200 transition-all cursor-pointer"
                        title="Fiyat/Stok Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
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

      {/* Yeni Çiçek Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-sand-400 hover:text-sand-700">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">Yeni Çiçek / Ürün Ekle</h3>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-sand-700">Çiçek Adı</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="ör. Kırmızı Gül Buketi"
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-sand-700">Fiyat (₺)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="350"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-sand-700">Stok Adedi</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Görsel URL</label>
                <input
                  type="url"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Açıklama</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Çiçek detayları ve bakımı..."
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none h-20"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer">
                Çiçeği Kaydet ve Yayınla
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}