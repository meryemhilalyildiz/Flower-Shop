import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, ShoppingBag, RefreshCw, Save, X, Upload } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { addProduct, updateProduct, deleteProduct, fetchAllProducts, fetchAllCategories } from '../services/adminApi';

export function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Yeni Ürün Form State'i
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    category_id: '',
    description: '',
    freshness_score: 10,
    vase_life_days: 7
  });

  // Ürünleri Çek
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProducts();
      setProducts(data || []);
    } catch (err) {
      alert('Ürünler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Kategorileri Çek
  const loadCategories = async () => {
    try {
      const data = await fetchAllCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Resim Yükleme
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadMessage('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('Önce admin olarak giriş yapmanız gerekiyor.');
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      const fileName = `${Date.now()}-${safeFileName}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (error) {
        throw new Error(error.message || 'Storage upload başarısız oldu.');
      }

      const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      const uploadedUrl = publicData?.publicUrl || '';

      if (!uploadedUrl) {
        throw new Error('Yüklenen görselin public URLsi alınamadı.');
      }

      setNewProduct((prev) => ({ ...prev, image_url: uploadedUrl }));
      setUploadMessage('Görsel yüklendi.');
    } catch (error) {
      console.error('Resim yüklenirken hata oluştu:', error);
      const fallbackImage = 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800';
      setNewProduct((prev) => ({ ...prev, image_url: fallbackImage }));
      setUploadMessage(error instanceof Error ? error.message : 'Görsel yüklenemedi.');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetProductForm = () => {
    setNewProduct({
      name: '',
      price: '',
      stock_quantity: '',
      image_url: '',
      category_id: '',
      description: '',
      freshness_score: 10,
      vase_life_days: 7,
    });
    setUploadMessage('');
    setIsEditingMode(false);
  };

  const openAddModal = () => {
    resetProductForm();
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setIsEditingMode(true);
    setNewProduct({
      name: product.name || '',
      price: product.price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      description: product.description || '',
      freshness_score: product.freshness_score ?? 10,
      vase_life_days: product.vase_life_days ?? 7,
    });
    setUploadMessage('');
    setShowAddModal(true);
  };

  // Yeni Ürün Ekle / Güncelle
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingMode && editingProduct?.id) {
        await updateProduct(editingProduct.id, {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity),
          image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800',
          category_id: newProduct.category_id,
          description: newProduct.description,
          freshness_score: newProduct.freshness_score,
          vase_life_days: newProduct.vase_life_days,
        });
        alert('Ürün başarıyla güncellendi!');
      } else {
        if (!newProduct.category_id) {
          alert('Lütfen bir kategori seçin.');
          return;
        }
        if (!newProduct.price || parseFloat(newProduct.price) < 0.01) {
          alert('Lütfen geçerli bir fiyat girin.');
          return;
        }
        if (!newProduct.stock_quantity || parseInt(newProduct.stock_quantity) < 0) {
          alert('Lütfen geçerli bir stok miktarı girin.');
          return;
        }

        await addProduct({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity),
          image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800',
          category_id: newProduct.category_id,
          description: newProduct.description,
          freshness_score: newProduct.freshness_score,
          vase_life_days: newProduct.vase_life_days,
          is_active: true,
        });
        alert('Yeni çiçek başarıyla eklendi!');
      }

      setShowAddModal(false);
      resetProductForm();
      loadProducts();
    } catch (err) {
      console.error('Ürün ekleme/güncelleme hatası:', err);
      alert(
        isEditingMode
          ? `Güncelleme hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`
          : `Ekleme hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`
      );
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
          <h1 className="text-3xl font-bold font-display mt-2">Ürün ve Stok Yönetimi</h1>
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
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800'}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800';
                      }}
                      className="w-12 h-12 object-cover rounded-xl border border-sand-200"
                    />
                  </td>
                  <td className="p-3 font-semibold text-sand-900">{p.name}</td>
                  <td className="p-3 text-sand-600 text-xs">{p.category || 'Çiçekler'}</td>
                  
                  <td className="p-3 font-bold text-rose-800">₺{p.price}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock_quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {p.stock_quantity || 0} Adet Stok
                    </span>
                  </td>

                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200 transition-all cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

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
            <button onClick={() => {
              setShowAddModal(false);
              resetProductForm();
            }} className="absolute top-4 right-4 text-sand-400 hover:text-sand-700">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4">
              {isEditingMode ? 'Ürünü Düzenle' : 'Yeni Çiçek / Ürün Ekle'}
            </h3>

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
                  <label className="text-xs font-semibold text-sand-700">Fiyat (₺) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="350"
                    className={`w-full px-3 py-2 border rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none ${
                      newProduct.price && parseFloat(newProduct.price) >= 0.01
                        ? 'border-sand-300'
                        : 'border-red-500 bg-red-50'
                    }`}
                  />
                  {newProduct.price && parseFloat(newProduct.price) < 0.01 && (
                    <p className="text-xs text-red-600 mt-1">Fiyat 0'dan büyük olmalı</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-sand-700">Stok Adedi *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                    placeholder="25"
                    className={`w-full px-3 py-2 border rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none ${
                      newProduct.stock_quantity && parseInt(newProduct.stock_quantity) >= 0
                        ? 'border-sand-300'
                        : 'border-red-500 bg-red-50'
                    }`}
                  />
                  {newProduct.stock_quantity && parseInt(newProduct.stock_quantity) < 0 && (
                    <p className="text-xs text-red-600 mt-1">Stok negatif olamaz</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori *</label>
                <select
                  required
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none ${
                    newProduct.category_id ? 'border-sand-300' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {!newProduct.category_id && (
                  <p className="text-xs text-red-600 mt-1">Kategori seçimi zorunludur</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Görsel</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl cursor-pointer hover:bg-brand-100 transition-all">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-semibold">Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <p className="text-xs text-sand-500 mt-1">Resim yükleniyor...</p>
                )}
                {uploadMessage && (
                  <p className={`text-xs mt-1 ${uploadMessage.includes('Görsel yüklendi') ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {uploadMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-sand-700">Tazelik Skoru (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newProduct.freshness_score}
                    onChange={(e) => setNewProduct({ ...newProduct, freshness_score: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-sand-700">Vazo Ömrü (Gün)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduct.vase_life_days}
                    onChange={(e) => setNewProduct({ ...newProduct, vase_life_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
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
                {isEditingMode ? 'Ürünü Güncelle' : 'Çiçeği Kaydet ve Yayınla'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
