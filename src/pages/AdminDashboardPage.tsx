import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, ShoppingBag, RefreshCw, X, Upload, Flower2, Layers, Save, Edit2 } from 'lucide-react';
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

  // 🌸 BUKET BİLEŞENLERİ STATE'LERİ
  const [bouquetSubTab, setBouquetSubTab] = useState<'flowers' | 'wrappers' | 'vases'>('flowers');
  const [stemFlowers, setStemFlowers] = useState<any[]>([]);
  const [wrappers, setWrappers] = useState<any[]>([]);
  const [vases, setVases] = useState<any[]>([]);
  const [loadingBouquet, setLoadingBouquet] = useState(false);
  const [editingBouquetItem, setEditingBouquetItem] = useState<any | null>(null);

  // Katalog Ürünü Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    image: '',
    category_id: '',
    description: '',
    freshness_score: 10,
    vase_life_days: 7,
  });

  // Ürünleri Çek
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
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

  // 🌸 Supabase'den Buket Verilerini Yükle
  const loadAllBouquetData = async () => {
    setLoadingBouquet(true);
    try {
      const flowersQuery = await supabase.from('stem_flowers').select('*');
      const wrappersQuery = await supabase.from('bouquet_wrappers').select('*');
      const vasesQuery = await supabase.from('bouquet_vases').select('*');

      if (flowersQuery.data) setStemFlowers(flowersQuery.data);
      if (wrappersQuery.data) setWrappers(wrappersQuery.data);
      if (vasesQuery.data) setVases(vasesQuery.data);
    } catch (err: any) {
      console.error('Buket verileri yüklenirken hata oluştu:', err);
    } finally {
      setLoadingBouquet(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadAllBouquetData();
  }, []);

  // 🌸 Tekli Çiçek Stok Güncelleme
  const handleStemStockChange = async (id: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    const { error } = await supabase.from('stem_flowers').update({ stock: nextStock }).eq('id', id);
    if (!error) {
      setStemFlowers((prev) => prev.map((f) => (f.id === id ? { ...f, stock: nextStock } : f)));
    } else {
      alert('Stok güncellenemedi: ' + error.message);
    }
  };

  // 🌸 Buket Bileşeni Silme İşlemi
  const handleBouquetDelete = async (id: string, table: 'stem_flowers' | 'bouquet_wrappers' | 'bouquet_vases') => {
    if (!confirm('Bu ögeyi silmek istediğinizden emin misiniz?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      loadAllBouquetData();
    } else {
      alert('Silme hatası: ' + error.message);
    }
  };

  // 🌸 Buket Bileşeni Kaydet / Düzenle
  const handleSaveBouquetModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBouquetItem?.name) return;

    let table = 'stem_flowers';
    if (bouquetSubTab === 'wrappers') table = 'bouquet_wrappers';
    if (bouquetSubTab === 'vases') table = 'bouquet_vases';

    const payload: any = {
      name: editingBouquetItem.name,
      price: Number(editingBouquetItem.price || 0),
    };

    if (bouquetSubTab === 'flowers') {
      payload.category = editingBouquetItem.category || (categories[0]?.name || 'Güller');
      payload.stock = Number(editingBouquetItem.stock || 0);
      payload.image_url = editingBouquetItem.image_url || '';
    } else if (bouquetSubTab === 'wrappers') {
      payload.color_hex = editingBouquetItem.color_hex || '#D97706';
      payload.is_active = editingBouquetItem.is_active ?? true;
    } else if (bouquetSubTab === 'vases') {
      payload.image_url = editingBouquetItem.image_url || '';
      payload.is_active = editingBouquetItem.is_active ?? true;
    }

    let error;
    if (editingBouquetItem.id) {
      const { error: err } = await supabase.from(table).update(payload).eq('id', editingBouquetItem.id);
      error = err;
    } else {
      const { error: err } = await supabase.from(table).insert([payload]);
      error = err;
    }

    if (error) {
      alert('Veritabanına kaydedilirken hata oluştu: ' + error.message);
    } else {
      setEditingBouquetItem(null);
      loadAllBouquetData();
    }
  };

  // Resim Yükleme (Hazır Ürünler)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadMessage('');
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      const fileName = `${Date.now()}-${safeFileName}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage.from('product-images').upload(filePath, file);
      if (error) throw error;

      const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        setNewProduct((prev) => ({ ...prev, image: publicData.publicUrl }));
        setUploadMessage('Görsel başarıyla yüklendi.');
      }
    } catch (error: any) {
      console.error('Görsel yükleme hatası:', error);
      setUploadMessage('Görsel yüklenemedi: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const resetProductForm = () => {
    setNewProduct({
      name: '',
      price: '',
      stock: '',
      image: '',
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
      stock: (product.stock ?? product.stock_quantity ?? '').toString(),
      image: product.image || product.image_url || '',
      category_id: product.category_id || '',
      description: product.description || '',
      freshness_score: product.freshness_score ?? 10,
      vase_life_days: product.vase_life_days ?? 7,
    });
    setUploadMessage('');
    setShowAddModal(true);
  };

  // Katalog Ürünü Ekle / Güncelle
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingMode && editingProduct?.id) {
        await updateProduct(editingProduct.id, {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          image: newProduct.image || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800',
          category_id: newProduct.category_id,
          description: newProduct.description,
        });
        alert('Ürün başarıyla güncellendi!');
      } else {
        await addProduct({
          id: crypto.randomUUID(),
          name: newProduct.name,
          slug: null,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          image: newProduct.image || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800',
          category_id: newProduct.category_id,
          description: newProduct.description || 'Taze çiçek aranjmanı',
          rating: 5.0,
          reviews_count: 0,
          is_best_seller: false,
          is_featured: true,
          is_active: true
        });
        alert('Yeni ürün eklendi!');
      }

      setShowAddModal(false);
      resetProductForm();
      loadProducts();
    } catch (err: any) {
      alert(`İşlem sırasında hata: ${err.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Silme başarısız.');
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
      {/* Üst Yönetici Başlığı */}
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
            onClick={openAddModal}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Çiçek Ekle
          </button>
        </div>
      </div>

      {/* 📦 1. MEVCUT HAZIR KATALOG ÜRÜNLERİ TABLOSU */}
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
              {products.map((p) => {
                const stockVal = p.stock ?? p.stock_quantity ?? 0;
                const imgVal = p.image || p.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800';

                return (
                  <tr key={p.id} className="hover:bg-sand-50/50 transition-all">
                    <td className="p-3">
                      <img
                        src={imgVal}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-xl border border-sand-200"
                      />
                    </td>
                    <td className="p-3 font-semibold text-sand-900">{p.name}</td>
                    <td className="p-3 text-sand-600 text-xs">{p.categories?.name || p.category || 'Çiçekler'}</td>
                    <td className="p-3 font-bold text-rose-800">₺{p.price}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockVal > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {stockVal} Adet Stok
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => openEditModal(p)} className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200 cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🌸 2. BUKET OLUŞTURUCU BİLEŞENLERİ & STOK KONTROLÜ               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sand-100 pb-4">
          <div>
            <h2 className="text-xl font-bold font-display text-sand-900 flex items-center gap-2">
              <Flower2 className="w-5 h-5 text-pink-600" />
              Buket Oluşturucu Bileşenleri & Stok Kontrolü
            </h2>
            <p className="text-xs text-sand-600 mt-1">
              Müşterilerin özel buket yaparken seçtiği tekli çiçek, ambalaj ve vazo stoklarını Supabase veritabanından anlık yönetin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllBouquetData}
              className="p-2 border border-sand-200 rounded-lg hover:bg-sand-50 transition-all text-xs font-semibold text-sand-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>

            <button
              onClick={() =>
                setEditingBouquetItem({
                  name: '',
                  price: 0,
                  stock: 50,
                  category: categories[0]?.name || 'Güller',
                  color_hex: '#D97706',
                  image_url: '',
                  is_active: true,
                })
              }
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Yeni Bileşen Ekle
            </button>
          </div>
        </div>

        {/* 🔴 BUKET ALT SEKMELERİ */}
        <div className="flex gap-2">
          <button
            onClick={() => setBouquetSubTab('flowers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              bouquetSubTab === 'flowers'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
            }`}
          >
            <Flower2 className="w-4 h-4" /> Tekli Çiçekler ({stemFlowers.length})
          </button>

          <button
            onClick={() => setBouquetSubTab('wrappers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              bouquetSubTab === 'wrappers'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Ambalaj Kağıtları ({wrappers.length})
          </button>

          <button
            onClick={() => setBouquetSubTab('vases')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              bouquetSubTab === 'vases'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
            }`}
          >
            <Package className="w-4 h-4" /> Vazolar ({vases.length})
          </button>
        </div>

        {/* BUKET TABLOLARI */}
        {loadingBouquet ? (
          <div className="text-center py-12 text-sand-500 text-sm">Veritabanından çekiliyor...</div>
        ) : (
          <div className="border border-sand-200 rounded-2xl overflow-hidden">
            {/* 1. TEKLİ ÇİÇEKLER TABLOSU */}
            {bouquetSubTab === 'flowers' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-sand-200 text-sand-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Görsel & Adı</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Birim Fiyat</th>
                    <th className="p-3.5">Stok Adedi</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100 text-sand-800">
                  {stemFlowers.map((f) => (
                    <tr key={f.id} className="hover:bg-sand-50/50">
                      <td className="p-3.5 flex items-center gap-3 font-semibold">
                        <img src={f.image_url} alt={f.name} className="w-9 h-9 object-cover rounded-lg bg-sand-100" />
                        <span>{f.name}</span>
                      </td>
                      <td className="p-3.5 text-sand-500">{f.category || 'Çiçek'}</td>
                      <td className="p-3.5 font-bold text-pink-600">₺{f.price}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStemStockChange(f.id, f.stock || 0, -10)}
                            className="px-1.5 py-0.5 bg-sand-100 hover:bg-sand-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            -10
                          </button>
                          <span className="font-bold w-6 text-center">{f.stock || 0}</span>
                          <button
                            onClick={() => handleStemStockChange(f.id, f.stock || 0, 10)}
                            className="px-1.5 py-0.5 bg-sand-100 hover:bg-sand-200 rounded text-[10px] font-bold cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setEditingBouquetItem(f)} className="p-1 text-sand-600 hover:text-pink-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleBouquetDelete(f.id, 'stem_flowers')} className="p-1 text-sand-600 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. AMBALAJ KAĞITLARI TABLOSU */}
            {bouquetSubTab === 'wrappers' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-sand-200 text-sand-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Renk & Ambalaj Adı</th>
                    <th className="p-3.5">Renk Kodu</th>
                    <th className="p-3.5">Ek Ücret (₺)</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100 text-sand-800">
                  {wrappers.map((w) => (
                    <tr key={w.id} className="hover:bg-sand-50/50">
                      <td className="p-3.5 flex items-center gap-3 font-semibold">
                        <span className="w-6 h-6 rounded-full border border-sand-300" style={{ backgroundColor: w.color_hex || '#D97706' }} />
                        <span>{w.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-sand-500">{w.color_hex || '—'}</td>
                      <td className="p-3.5 font-bold text-pink-600">{Number(w.price) === 0 ? 'Ücretsiz' : `+₺${w.price}`}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setEditingBouquetItem(w)} className="p-1 text-sand-600 hover:text-pink-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleBouquetDelete(w.id, 'bouquet_wrappers')} className="p-1 text-sand-600 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. VAZOLAR TABLOSU */}
            {bouquetSubTab === 'vases' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-sand-200 text-sand-600 font-semibold">
                  <tr>
                    <th className="p-3.5">Görsel & Vazo Adı</th>
                    <th className="p-3.5">Ek Ücret (₺)</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100 text-sand-800">
                  {vases.map((v) => (
                    <tr key={v.id} className="hover:bg-sand-50/50">
                      <td className="p-3.5 flex items-center gap-3 font-semibold">
                        {v.image_url ? (
                          <img src={v.image_url} alt={v.name} className="w-9 h-9 object-cover rounded-lg bg-sand-100" />
                        ) : (
                          <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center text-[10px] text-sand-400">
                            Görselsiz
                          </div>
                        )}
                        <span>{v.name}</span>
                      </td>
                      <td className="p-3.5 font-bold text-pink-600">{Number(v.price) === 0 ? 'Ücretsiz' : `+₺${v.price}`}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setEditingBouquetItem(v)} className="p-1 text-sand-600 hover:text-pink-600 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleBouquetDelete(v.id, 'bouquet_vases')} className="p-1 text-sand-600 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 🌸 BUKET BİLEŞENİ DÜZENLEME & YENİ EKLEME MODALI */}
      {editingBouquetItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveBouquetModal} className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl border border-sand-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sand-900 text-sm">
                {editingBouquetItem.id ? 'Bileşeni Düzenle' : 'Yeni Bileşen Ekle'} (
                {bouquetSubTab === 'flowers' ? 'Tekli Çiçek' : bouquetSubTab === 'wrappers' ? 'Ambalaj Kağıdı' : 'Vazo'})
              </h3>
              <button type="button" onClick={() => setEditingBouquetItem(null)}>
                <X className="w-5 h-5 text-sand-400 hover:text-sand-600 cursor-pointer" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-700 mb-1">Adı / Tanımı *</label>
              <input
                type="text"
                required
                value={editingBouquetItem.name || ''}
                onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-700 mb-1">Birim Fiyat / Ek Ücret (₺) *</label>
              <input
                type="number"
                required
                value={editingBouquetItem.price || 0}
                onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Sadece Çiçek için Ek Alanlar */}
            {bouquetSubTab === 'flowers' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-sand-700 mb-1">Kategori *</label>
                    <select
                      required
                      value={editingBouquetItem.category || ''}
                      onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, category: e.target.value })}
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer"
                    >
                      <option value="">Kategori Seçin</option>
                      {/* 🌸 Sadece Veritabanından (categories tablosu) Gelen Kategoriler */}
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-700 mb-1">Stok Miktarı</label>
                    <input
                      type="number"
                      value={editingBouquetItem.stock || 0}
                      onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sand-700 mb-1">Görsel URL</label>
                  <input
                    type="text"
                    value={editingBouquetItem.image_url || ''}
                    onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs"
                  />
                </div>
              </>
            )}

            {/* Sadece Ambalaj için Ek Alanlar */}
            {bouquetSubTab === 'wrappers' && (
              <div>
                <label className="block text-xs font-semibold text-sand-700 mb-1">Renk HEX Kodu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingBouquetItem.color_hex || '#D97706'}
                    onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, color_hex: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingBouquetItem.color_hex || ''}
                    onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, color_hex: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Sadece Vazo için Ek Alanlar */}
            {bouquetSubTab === 'vases' && (
              <div>
                <label className="block text-xs font-semibold text-sand-700 mb-1">Görsel URL (Opsiyonel)</label>
                <input
                  type="text"
                  value={editingBouquetItem.image_url || ''}
                  onChange={(e) => setEditingBouquetItem({ ...editingBouquetItem, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingBouquetItem(null)}
                className="px-4 py-2 border border-sand-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 inline mr-1" /> Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Katalog Ürünü Ekle Modalı */}
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
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-sand-700">Stok Adedi *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Kategori *</label>
                <select
                  required
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-xl text-sm mt-1 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-sand-700">Görsel URL / Yükle</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
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