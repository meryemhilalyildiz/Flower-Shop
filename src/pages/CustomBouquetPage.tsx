import { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Edit2,
  Trash2,
  X,
  Settings,
  Flower2,
} from 'lucide-react';
import {
  fetchStemFlowers,
  fetchBouquetWrappers,
  fetchBouquetVases,
  type StemFlowerDB,
  type BouquetWrapperDB,
  type BouquetVaseDB,
} from '../services/customBouquetService';
import {
  fetchAllAdminStemFlowers,
  saveStemFlower,
  deleteStemFlower,
  updateFlowerStock,
} from '../services/adminCustomBouquetApi';
import { supabase } from '../supabaseClient';

interface CustomBouquetPageProps {
  onAddToCart?: (product: any, qty?: number) => void;
}

export default function CustomBouquetPage({ onAddToCart }: CustomBouquetPageProps) {

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userRole = user.user_metadata?.role;
          // Eğer admin e-postan farklıysa buradaki adresi kendi e-postanla değiştirebilirsin
          const isAdminUser = userRole === 'admin' || user.email === 'admin@cicekci.com'; 
          setIsAdmin(Boolean(isAdminUser));
        }
      } catch (err) {
        console.error('Kullanıcı yetkisi sorgulanırken hata:', err);
      }
    };

    checkUserRole();
  }, []);

  // Ana Sekme Kontrolü: Müşteri Tasarımı mı yoksa Admin Yönetimi mi?
  const [mainTab, setMainTab] = useState<'designer' | 'admin'>('designer');

  // Tasarım İç Sekmeleri
  const [activeTab, setActiveTab] = useState<'flowers' | 'wrapper' | 'summary'>('flowers');

  // Supabase Verileri
  const [stemFlowers, setStemFlowers] = useState<StemFlowerDB[]>([]);
  const [wrappers, setWrappers] = useState<BouquetWrapperDB[]>([]);
  const [vases, setVases] = useState<BouquetVaseDB[]>([]);
  const [loading, setLoading] = useState(true);

  // Kullanıcı Seçimleri (Tasarım Ekranı)
  const [selectedFlowers, setSelectedFlowers] = useState<Record<string, number>>({});
  const [selectedWrapper, setSelectedWrapper] = useState<BouquetWrapperDB | null>(null);
  const [selectedVase, setSelectedVase] = useState<BouquetVaseDB | null>(null);
  const [bouquetName, setBouquetName] = useState('Özel Buketim');
  const [cardNote, setCardNote] = useState('');

  // Admin Tarafı State'leri
  const [adminFlowers, setAdminFlowers] = useState<StemFlowerDB[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [editingFlower, setEditingFlower] = useState<Partial<StemFlowerDB> | null>(null);

  // 🌸 Tüm Verileri Yükle
  const loadData = async () => {
    try {
      setLoading(true);
      const [flowersData, wrappersData, vasesData] = await Promise.all([
        fetchStemFlowers(),
        fetchBouquetWrappers(),
        fetchBouquetVases(),
      ]);

      setStemFlowers(flowersData);
      setWrappers(wrappersData);
      setVases(vasesData);

      if (wrappersData.length > 0) setSelectedWrapper(wrappersData[0]);
      if (vasesData.length > 0) setSelectedVase(vasesData[0]);
    } catch (err) {
      console.error('Tasarlama verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminFlowers = async () => {
    try {
      setAdminLoading(true);
      const data = await fetchAllAdminStemFlowers();
      setAdminFlowers(data);
    } catch (err) {
      console.error('Admin çiçekler yüklenirken hata:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin sekmesine geçildiğinde tüm çiçek verilerini (pasifler dahil) çek
  useEffect(() => {
    if (mainTab === 'admin') {
      loadAdminFlowers();
    }
  }, [mainTab]);

  // Adet Artır / Azalt (Müşteri Ekranı)
  const handleQuantityChange = (flowerId: string, delta: number, maxStock: number) => {
    setSelectedFlowers((prev) => {
      const current = prev[flowerId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[flowerId];
        return copy;
      }

      if (next > maxStock) {
        alert(`Bu çiçekten stokta en fazla ${maxStock} adet bulunmaktadır.`);
        return prev;
      }

      return { ...prev, [flowerId]: next };
    });
  };

  // Hesaplamalar
  const totalFlowerCount = Object.values(selectedFlowers).reduce((a, b) => a + b, 0);
  const isMinFlowerReached = totalFlowerCount >= 3;

  const flowersTotal = Object.entries(selectedFlowers).reduce((sum, [id, qty]) => {
    const flower = stemFlowers.find((f) => f.id === id);
    return sum + (flower ? flower.price * qty : 0);
  }, 0);

  const wrapperTotal = selectedWrapper ? Number(selectedWrapper.price) : 0;
  const vaseTotal = selectedVase ? Number(selectedVase.price) : 0;
  const grandTotal = flowersTotal + wrapperTotal + vaseTotal;

  // 🌸 Sepete Ekleme İşlemi
  // 🌸 Sepete Ekleme İşlemi
  const handleAddToCart = () => {
    if (!isMinFlowerReached) return;

    const flowerDetails = Object.entries(selectedFlowers).map(([id, qty]) => {
      const flower = stemFlowers.find((f) => f.id === id);
      return {
        id,
        name: flower?.name || 'Çiçek',
        quantity: qty,
        unitPrice: flower?.price || 0,
      };
    });

    const firstFlower = stemFlowers.find((f) => selectedFlowers[f.id] > 0);
    const bouquetImage =
      firstFlower?.image_url ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500';

    const customProduct = {
      id: `custom-${Date.now()}`,
      name: bouquetName || 'Özel Tasarım Buket',
      slug: `custom-bouquet-${Date.now()}`,
      categoryId: 'custom',
      price: grandTotal,
      image: bouquetImage,
      images: [bouquetImage],
      description: `${totalFlowerCount} Parça Özel Hazırlanmış Aranjman`,
      longDescription: `${bouquetName} - Kişiselleştirilmiş Özel Tasarım Çiçek Demeti`,
      ingredients: flowerDetails.map((f) => `${f.name} (${f.quantity} Adet)`),
      rating: 5,
      reviewCount: 1,
      inStock: true,
      deliveryInfo: 'Aynı gün teslimat',
      stock: 999,
      isCustomBouquet: true,
      customBouquetDetails: {
        bouquetName: bouquetName || 'Özel Tasarım Buket',
        items: flowerDetails,
        wrapper: selectedWrapper ? { name: selectedWrapper.name, price: selectedWrapper.price } : null,
        vase: selectedVase && Number(selectedVase.price) > 0 ? { name: selectedVase.name, price: selectedVase.price } : null,
        cardNote: cardNote.trim() || undefined,
      },
    };

    // 1. Ürünü Sepete Ekle
    if (onAddToCart) {
      onAddToCart(customProduct, 1);
    }

    // 2. Kullanıcıyı Doğrudan Sepet Sayfasına Yönlendir 🚀
    window.location.hash = '#/sepet';
  };

  // ⚙️ Admin İşlemleri
  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlower?.name || !editingFlower?.price) {
      alert('Lütfen ad ve fiyat alanlarını doldurun.');
      return;
    }

    try {
      await saveStemFlower(editingFlower);
      setEditingFlower(null);
      loadAdminFlowers();
      loadData(); // Müşteri kataloğunu da yenile
    } catch (err: any) {
      alert(`Hata oluştu: ${err.message}`);
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!confirm('Bu çiçeği silmek istediğinize emin misiniz?')) return;
    try {
      await deleteStemFlower(id);
      loadAdminFlowers();
      loadData();
    } catch (err: any) {
      alert(`Silme hatası: ${err.message}`);
    }
  };

  const handleAdminStockChange = async (id: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      await updateFlowerStock(id, nextStock);
      setAdminFlowers((prev) =>
        prev.map((f) => (f.id === id ? { ...f, stock: nextStock } : f))
      );
      setStemFlowers((prev) =>
        prev.map((f) => (f.id === id ? { ...f, stock: nextStock } : f))
      );
    } catch (err: any) {
      alert(`Stok güncelleme hatası: ${err.message}`);
    }
  };

  if (loading && mainTab === 'designer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-sm text-sand-600 font-medium">Çiçek kataloğu veritabanından yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- ÜST BİLGİ VE MOD DEĞİŞTİRİCİ (MÜŞTERİ / ADMİN) --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-sand-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            <span className="font-serif text-lg text-sand-900">
              {mainTab === 'admin' ? 'Tekli Çiçek & Stok Yönetimi' : 'Buket Modülü'}
            </span>
          </div>

          {/* 🔒 SADECE ADMİN İSE MOD DEĞİŞTİRME BUTONLARINI GÖSTER */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-sand-100 p-1 rounded-xl">
              <button
                onClick={() => setMainTab('designer')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  mainTab === 'designer'
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-sand-600 hover:text-sand-900'
                }`}
              >
                <Flower2 className="w-4 h-4" /> Buket Tasarla
              </button>
              <button
                onClick={() => setMainTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  mainTab === 'admin'
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-sand-600 hover:text-sand-900'
                }`}
              >
                <Settings className="w-4 h-4" /> Stok & Yönetim (Admin)
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 🌸 MOD 1: MÜŞTERİ BUKET TASARIM EKRANI                       */}
        {/* ============================================================== */}
        {mainTab === 'designer' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-serif text-sand-900 tracking-tight">
                Çiçeklerini Seç, Buketini Yarat 🌸
              </h1>
              <p className="text-sm text-sand-600 max-w-xl mx-auto">
                Sevdiğin çiçekleri tane tane seç, ambalajını ve notunu ekle; sana özel eşsiz bir buket hazırlayalım!
              </p>
            </div>

            {/* Adım Butonları */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setActiveTab('flowers')}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  activeTab === 'flowers'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white text-sand-700 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                1. Çiçek Seçimi
              </button>
              <button
                onClick={() => setActiveTab('wrapper')}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  activeTab === 'wrapper'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white text-sand-700 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                2. Ambalaj & Vazo
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white text-sand-700 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                3. Önizleme & Sepet
              </button>
            </div>

            {/* TAB 1: Çiçek Seçimi */}
            {activeTab === 'flowers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-serif text-sand-900">Tekli Çiçek Kataloğu</h2>
                  <span className="text-xs text-sand-500 font-medium">*Minimum 3 çiçek seçilmelidir</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stemFlowers.map((flower) => {
                    const count = selectedFlowers[flower.id] || 0;
                    return (
                      <div
                        key={flower.id}
                        className={`p-4 rounded-2xl bg-white border transition-all flex items-center gap-4 ${
                          count > 0 ? 'border-pink-500 shadow-sm ring-1 ring-pink-500' : 'border-sand-200'
                        }`}
                      >
                        <img
                          src={flower.image_url}
                          alt={flower.name}
                          className="w-20 h-20 object-cover rounded-xl bg-sand-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sand-900 text-sm truncate">{flower.name}</h3>
                          <p className="text-xs text-sand-500">{flower.category}</p>
                          <p className="text-sm font-bold text-pink-600 mt-1">₺{flower.price} / adet</p>
                          <p className="text-[10px] text-sand-400 mt-0.5">Stok: {flower.stock} adet</p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-sand-50 p-1 rounded-xl border border-sand-200">
                          <button
                            onClick={() => handleQuantityChange(flower.id, -1, flower.stock)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-sand-600 transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-sand-800">{count}</span>
                          <button
                            onClick={() => handleQuantityChange(flower.id, 1, flower.stock)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Ambalaj & Vazo */}
            {activeTab === 'wrapper' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-serif text-sand-900">1. Ambalaj Kağıdı Seçimi</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {wrappers.map((w) => {
                      const isSelected = selectedWrapper?.id === w.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWrapper(w)}
                          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected ? 'border-pink-500 ring-2 ring-pink-500' : 'border-sand-200 hover:border-sand-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-6 h-6 rounded-full border border-sand-300" style={{ backgroundColor: w.color_hex }} />
                            {isSelected && <Check className="w-4 h-4 text-pink-600 font-bold" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sand-900 text-sm">{w.name}</h3>
                            <p className="text-xs text-pink-600 font-bold mt-1">
                              {Number(w.price) === 0 ? 'Ücretsiz' : `+₺${w.price}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-serif text-sand-900">2. Vazo Ekle (Opsiyonel)</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {vases.map((v) => {
                      const isSelected = selectedVase?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVase(v)}
                          className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all text-center ${
                            isSelected ? 'border-pink-500 ring-2 ring-pink-500' : 'border-sand-200 hover:border-sand-300'
                          }`}
                        >
                          {v.image_url ? (
                            <img src={v.image_url} alt={v.name} className="w-16 h-16 object-cover mx-auto rounded-xl mb-2" />
                          ) : (
                            <div className="w-16 h-16 bg-sand-100 rounded-xl mx-auto mb-2 flex items-center justify-center text-xs text-sand-400">
                              Vazosuz
                            </div>
                          )}
                          <h3 className="font-semibold text-sand-900 text-sm">{v.name}</h3>
                          <p className="text-xs text-pink-600 font-bold mt-1">
                            {Number(v.price) === 0 ? 'Ücretsiz' : `+₺${v.price}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Önizleme & Kart Notu */}
            {activeTab === 'summary' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-sand-200 space-y-4">
                  <h2 className="text-lg font-serif text-sand-900">Buket İsmi & Özel Kart Notu</h2>
                  
                  <div>
                    <label className="block text-xs font-medium text-sand-700 mb-1">Demetinize Bir İsim Verin:</label>
                    <input
                      type="text"
                      value={bouquetName}
                      onChange={(e) => setBouquetName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Örn: Doğum Günü Buketi"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-sand-700 mb-1">Demet Kart Notu (Opsiyonel):</label>
                    <textarea
                      rows={3}
                      value={cardNote}
                      onChange={(e) => setCardNote(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Buketle birlikte gidecek tatlı bir not yazın..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Demet Özeti Sabit Paneli */}
            <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between border-b border-sand-100 pb-3">
                <h3 className="font-serif text-base text-sand-900">Demet Özeti</h3>
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">
                  {totalFlowerCount} Çiçek Seçildi
                </span>
              </div>

              <div className="space-y-2 text-xs text-sand-700">
                {Object.entries(selectedFlowers).map(([id, qty]) => {
                  const flower = stemFlowers.find((f) => f.id === id);
                  if (!flower) return null;
                  return (
                    <div key={id} className="flex justify-between">
                      <span>{flower.name} <strong className="text-pink-600">x{qty}</strong></span>
                      <span>₺{flower.price * qty}</span>
                    </div>
                  );
                })}

                {selectedWrapper && (
                  <div className="flex justify-between text-sand-500 pt-1 border-t border-sand-100">
                    <span>Ambalaj: {selectedWrapper.name}</span>
                    <span>+₺{selectedWrapper.price}</span>
                  </div>
                )}

                {selectedVase && Number(selectedVase.price) > 0 && (
                  <div className="flex justify-between text-sand-500">
                    <span>Vazo: {selectedVase.name}</span>
                    <span>+₺{selectedVase.price}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-sand-200">
                <div>
                  <p className="text-xs text-sand-500">Toplam Tutar:</p>
                  <p className="text-2xl font-serif text-pink-600 font-bold">₺{grandTotal}</p>
                </div>

                {/* 🌸 ADIMA GÖRE DEĞİŞEN DİNAMİK BUTONLAR */}
                {activeTab === 'flowers' && (
                  <button
                    onClick={() => isMinFlowerReached && setActiveTab('wrapper')}
                    disabled={!isMinFlowerReached}
                    className={`px-8 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                      isMinFlowerReached
                        ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-md cursor-pointer'
                        : 'bg-sand-200 text-sand-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{isMinFlowerReached ? 'Sonraki Adım: Ambalaj & Vazo ➔' : 'En az 3 çiçek seçin'}</span>
                  </button>
                )}

                {activeTab === 'wrapper' && (
                  <button
                    onClick={() => setActiveTab('summary')}
                    className="px-8 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white shadow-md cursor-pointer transition-all"
                  >
                    <span>Sonraki Adım: Önizleme & Not ➔</span>
                  </button>
                )}

                {activeTab === 'summary' && (
                  <button
                    onClick={handleAddToCart}
                    disabled={!isMinFlowerReached}
                    className={`px-8 py-3.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                      isMinFlowerReached
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer'
                        : 'bg-sand-200 text-sand-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isMinFlowerReached ? `Sepete Ekle (₺${grandTotal})` : 'En az 3 çiçek seçin'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ⚙️ MOD 2: ADMİN ÇİÇEK & STOK YÖNETİM EKRANI                     */}
        {/* ============================================================== */}
        {mainTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif text-sand-900">Tekli Çiçek & Stok Yönetimi</h1>
                <p className="text-sm text-sand-600">
                  Veritabanındaki çiçeklerin fiyat ve stok durumlarını yönetin.
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingFlower({
                    name: '',
                    category: 'Gül',
                    price: 45,
                    stock: 50,
                    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
                    is_active: true,
                  })
                }
                className="px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-pink-700 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Yeni Çiçek Ekle
              </button>
            </div>

            {/* Düzenleme & Ekleme Modalı */}
            {editingFlower && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <form
                  onSubmit={handleAdminSave}
                  className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl"
                >
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-sand-900">
                      {editingFlower.id ? 'Çiçek Düzenle' : 'Yeni Çiçek Ekle'}
                    </h3>
                    <button type="button" onClick={() => setEditingFlower(null)}>
                      <X className="w-5 h-5 text-sand-400 hover:text-sand-600 cursor-pointer" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sand-700 mb-1">Çiçek Adı</label>
                    <input
                      type="text"
                      required
                      value={editingFlower.name || ''}
                      onChange={(e) => setEditingFlower({ ...editingFlower, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sand-700 mb-1">Kategori</label>
                      <input
                        type="text"
                        value={editingFlower.category || ''}
                        onChange={(e) => setEditingFlower({ ...editingFlower, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-sand-700 mb-1">Birim Fiyat (₺)</label>
                      <input
                        type="number"
                        required
                        value={editingFlower.price || 0}
                        onChange={(e) => setEditingFlower({ ...editingFlower, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-sand-700 mb-1">Mevcut Stok</label>
                      <input
                        type="number"
                        required
                        value={editingFlower.stock || 0}
                        onChange={(e) => setEditingFlower({ ...editingFlower, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-sand-700 mb-1">Durum</label>
                      <select
                        value={editingFlower.is_active ? 'true' : 'false'}
                        onChange={(e) => setEditingFlower({ ...editingFlower, is_active: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      >
                        <option value="true">Aktif (Katalogda Göster)</option>
                        <option value="false">Pasif (Gizle)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sand-700 mb-1">Görsel URL</label>
                    <input
                      type="text"
                      value={editingFlower.image_url || ''}
                      onChange={(e) => setEditingFlower({ ...editingFlower, image_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingFlower(null)}
                      className="px-4 py-2 border rounded-xl text-xs font-medium cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-medium hover:bg-pink-700 cursor-pointer"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Admin Çiçek Tablosu */}
            {adminLoading ? (
              <div className="text-center py-12 text-sand-500">Çiçekler yükleniyor...</div>
            ) : (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand-50 border-b text-sand-600 text-xs font-semibold">
                    <tr>
                      <th className="p-3.5">Görsel & Çiçek</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Birim Fiyat</th>
                      <th className="p-3.5">Stok</th>
                      <th className="p-3.5">Durum</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sand-800">
                    {adminFlowers.map((f) => (
                      <tr key={f.id} className="hover:bg-sand-50/50">
                        <td className="p-3.5 flex items-center gap-3 font-medium">
                          <img src={f.image_url} alt={f.name} className="w-10 h-10 object-cover rounded-lg bg-sand-100" />
                          <span>{f.name}</span>
                        </td>
                        <td className="p-3.5 text-xs text-sand-500">{f.category}</td>
                        <td className="p-3.5 font-bold text-pink-600">₺{f.price}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdminStockChange(f.id, f.stock, -10)}
                              className="px-1.5 py-0.5 bg-sand-100 rounded hover:bg-sand-200 text-xs cursor-pointer"
                            >
                              -10
                            </button>
                            <span className="font-bold w-8 text-center">{f.stock}</span>
                            <button
                              onClick={() => handleAdminStockChange(f.id, f.stock, 10)}
                              className="px-1.5 py-0.5 bg-sand-100 rounded hover:bg-sand-200 text-xs cursor-pointer"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {f.is_active ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-sand-200 text-sand-600 rounded-full text-[10px] font-bold">
                              Pasif
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setEditingFlower(f)}
                            className="p-1.5 text-sand-600 hover:text-pink-600 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAdminDelete(f.id)}
                            className="p-1.5 text-sand-600 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}