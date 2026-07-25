import { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchStoreSettings,
  fetchAllShippingRules,
  addShippingRule,
  updateShippingRule,
  deleteShippingRule,
  updateStoreSettings,
  clearShippingCache,
  calculateShipping,
  formatDateTurkish,
} from '../services/shipping';
import type { StoreSettings, ShippingRule, ShippingCalculation } from '../types';
import { CITIES_DATA, fetchDistrictsByCity } from '../services/dataFetching';
import type { City, District } from '../services/dataFetching';

export function AdminShippingPage() {
  // =====================================================================
  // 📦 State Yönetimi
  // =====================================================================
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [testingCity, setTestingCity] = useState('');
  const [testResult, setTestResult] = useState<ShippingCalculation | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Yeni kural form state'i
  const [newRule, setNewRule] = useState({
    min_km: '',
    max_km: '',
    price: '',
    delivery_days: '',
    sort_order: '',
  });

  // Mağaza ayarları form state'i
  const [storeForm, setStoreForm] = useState({
    city: '',
    district: '',
    address: '',
  });

  // İlçe state'leri
  const [cities] = useState<City[]>(CITIES_DATA);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  // =====================================================================
  // 📦 Veri Yükleme
  // =====================================================================
  const loadStoreSettings = async () => {
    try {
      const settings = await fetchStoreSettings();
      setStoreSettings(settings);
      setStoreForm({
        city: settings.city,
        district: settings.district,
        address: settings.address,
      });
      // İlçe listesini yükle
      const cityObj = cities.find((c) => c.name === settings.city);
      if (cityObj) {
        setSelectedCityId(cityObj.id);
        const distList = await fetchDistrictsByCity(cityObj.id);
        setDistricts(distList);
      }
    } catch {
      alert('Mağaza ayarları yüklenirken hata oluştu.');
    }
  };

  const loadShippingRules = async () => {
    try {
      const rules = await fetchAllShippingRules();
      setShippingRules(rules);
    } catch {
      alert('Kargo kuralları yüklenirken hata oluştu.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStoreSettings(), loadShippingRules()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================================
  // 📦 İl Değiştiğinde İlçe Listesini Getir
  // =====================================================================
  const handleCityChange = async (cityIdStr: string) => {
    const cityId = Number(cityIdStr);
    setSelectedCityId(cityId);
    setStoreForm((f) => ({ ...f, district: '' }));

    if (cityId) {
      const distList = await fetchDistrictsByCity(cityId);
      setDistricts(distList);
    } else {
      setDistricts([]);
    }
  };

  // =====================================================================
  // 🏪 Mağaza Ayarlarını Güncelleme
  // =====================================================================
  const handleUpdateStore = async () => {
    if (!storeForm.city || !storeForm.district) {
      alert('İl ve ilçe seçimi gerekli.');
      return;
    }

    try {
      const updated = await updateStoreSettings({
        city: storeForm.city,
        district: storeForm.district,
        address: storeForm.address,
      });
      setStoreSettings(updated);
      setShowStoreModal(false);
      clearShippingCache();
      alert('✅ Mağaza ayarları güncellendi!');
    } catch (err: any) {
      alert(`❌ Güncelleme hatası: ${err.message}`);
    }
  };

  // =====================================================================
  // 📦 Kargo Kuralı Ekleme
  // =====================================================================
  const handleAddRule = async () => {
    if (!newRule.min_km || !newRule.max_km || !newRule.price || !newRule.delivery_days) {
      alert('Tüm alanları doldurun.');
      return;
    }

    const minKm = Number(newRule.min_km);
    const maxKm = Number(newRule.max_km);
    const price = Number(newRule.price);
    const deliveryDays = Number(newRule.delivery_days);

    if (minKm > maxKm) {
      alert("Minimum km, maksimum km'den büyük olamaz.");
      return;
    }

    try {
      const created = await addShippingRule({
        min_km: minKm,
        max_km: maxKm,
        price: price,
        delivery_days: deliveryDays,
        sort_order: Number(newRule.sort_order) || 0,
      });
      setShippingRules((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      setShowAddRuleModal(false);
      setNewRule({ min_km: '', max_km: '', price: '', delivery_days: '', sort_order: '' });
      clearShippingCache();
      alert('✅ Kargo kuralı eklendi!');
    } catch (err: any) {
      alert(`❌ Ekleme hatası: ${err.message}`);
    }
  };

  // =====================================================================
  // 📦 Kargo Kuralı Güncelleme
  // =====================================================================
  const handleUpdateRule = async () => {
    if (!editingRule) return;

    try {
      const updated = await updateShippingRule(editingRule.id, {
        min_km: editingRule.min_km,
        max_km: editingRule.max_km,
        price: editingRule.price,
        delivery_days: editingRule.delivery_days,
        sort_order: editingRule.sort_order,
        is_active: editingRule.is_active,
      });
      setShippingRules((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)).sort((a, b) => a.sort_order - b.sort_order),
      );
      setEditingRule(null);
      clearShippingCache();
      alert('✅ Kargo kuralı güncellendi!');
    } catch (err: any) {
      alert(`❌ Güncelleme hatası: ${err.message}`);
    }
  };

  // =====================================================================
  // 📦 Kargo Kuralı Silme
  // =====================================================================
  const handleDeleteRule = async (id: string) => {
    if (!confirm('Bu kargo kuralını silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteShippingRule(id);
      setShippingRules((prev) => prev.filter((r) => r.id !== id));
      clearShippingCache();
      alert('✅ Kargo kuralı silindi!');
    } catch (err: any) {
      alert(`❌ Silme hatası: ${err.message}`);
    }
  };

  // =====================================================================
  // 🧪 Kargo Hesaplama Testi
  // =====================================================================
  const handleTestCalculation = async () => {
    if (!testingCity) {
      alert('Test için bir şehir seçin.');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const result = await calculateShipping(testingCity, '');
      setTestResult(result);
    } catch (err: any) {
      alert(`❌ Hesaplama hatası: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
        Kargo ayarları yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ===================================================================== */}
      {/* 📋 Üst Başlık ve Navigasyon */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-full border border-rose-500/30">
            🚚 Kargo Yönetimi
          </span>
          <h1 className="text-3xl font-bold font-display mt-2">Kargo Ücretlendirme ve Teslimat</h1>
          <p className="text-gray-300 text-sm mt-1">
            Mağaza konumunu, kargo aralıklarını ve teslimat sürelerini yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowStoreModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" /> Mağaza Konumunu Düzenle
          </button>
          <button
            onClick={() => setShowAddRuleModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Kargo Kuralı
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🏪 Mağaza Ayarları Kartı */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-600" />
            Mağaza Konumu
          </h2>
          <button
            onClick={() => setShowStoreModal(true)}
            className="p-2 text-sand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all cursor-pointer"
            title="Düzenle"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {storeSettings && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-sand-500 uppercase">İl</span>
                <p className="text-sand-800 font-medium">{storeSettings.city}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-sand-500 uppercase">İlçe</span>
                <p className="text-sand-800 font-medium">{storeSettings.district}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-sand-500 uppercase">Açık Adres</span>
                <p className="text-sand-800 font-medium">{storeSettings.address || '-'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {storeSettings.latitude && storeSettings.longitude && (
                <>
                  <div>
                    <span className="text-xs font-semibold text-sand-500 uppercase">Enlem</span>
                    <p className="text-sand-800 font-medium">{storeSettings.latitude}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-sand-500 uppercase">Boylam</span>
                    <p className="text-sand-800 font-medium">{storeSettings.longitude}</p>
                  </div>
                </>
              )}
              <div>
                <span className="text-xs font-semibold text-sand-500 uppercase">Durum</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    storeSettings.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {storeSettings.is_active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Pasif
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 📦 Kargo Kuralları Tablosu */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" />
            Kargo Aralıkları ({shippingRules.length})
          </h2>
          <button
            onClick={loadShippingRules}
            className="p-2 border border-sand-200 rounded-lg hover:bg-sand-50 transition-all text-xs font-semibold text-sand-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
        </div>

        {shippingRules.length === 0 ? (
          <div className="text-center py-12 text-sand-500">
            <AlertCircle className="w-8 h-8 text-sand-400 mx-auto mb-3" />
            <p>Henüz kargo kuralı tanımlı değil.</p>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="btn-primary mt-4"
            >
              İlk Kuralı Ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand-200 text-xs font-semibold text-sand-500 uppercase tracking-wider bg-sand-50/50">
                  <th className="p-3">Sıra</th>
                  <th className="p-3">Min. km</th>
                  <th className="p-3">Max. km</th>
                  <th className="p-3">Kargo Ücreti</th>
                  <th className="p-3">Teslimat Süresi</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-sm">
                {shippingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-sand-50/50 transition-all">
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.sort_order}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, sort_order: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="text-sand-600">{rule.sort_order}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.min_km}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, min_km: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="font-medium text-sand-800">{rule.min_km}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.max_km}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, max_km: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="font-medium text-sand-800">{rule.max_km}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.price}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, price: Number(e.target.value) })
                          }
                          className="w-24 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="font-bold text-rose-800">{rule.price} TL</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.delivery_days}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, delivery_days: Number(e.target.value) })
                          }
                          className="w-20 px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="text-sand-700">{rule.delivery_days} gün</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingRule?.id === rule.id ? (
                        <select
                          value={editingRule.is_active ? 'true' : 'false'}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, is_active: e.target.value === 'true' })
                          }
                          className="px-2 py-1 border border-sand-300 rounded-lg text-sm"
                        >
                          <option value="true">Aktif</option>
                          <option value="false">Pasif</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rule.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {editingRule?.id === rule.id ? (
                        <>
                          <button
                            onClick={handleUpdateRule}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                            title="Kaydet"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRule(null)}
                            className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200 transition-all cursor-pointer"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="p-2 bg-sand-100 text-sand-700 rounded-lg hover:bg-sand-200 transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
      </div>

      {/* ===================================================================== */}
      {/* 🧪 Kargo Hesaplama Test Aracı */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-brand-600" />
          Kargo Hesaplama Test Aracı
        </h2>
        <p className="text-sm text-sand-600 mb-4">
          Bir şehir seçerek kargo ücretini ve teslimat tarihini test edin.
        </p>

        <div className="flex gap-3 mb-4">
          <select
            value={testingCity}
            onChange={(e) => setTestingCity(e.target.value)}
            className="input flex-1"
          >
            <option value="">Şehir seçin...</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleTestCalculation}
            disabled={testLoading || !testingCity}
            className="btn-primary"
          >
            {testLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Hesapla
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className="bg-brand-50/60 border border-brand-200 rounded-2xl p-6">
            <h3 className="font-bold text-sand-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-leaf-600" />
              Hesaplama Sonucu
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">Mesafe</span>
                  <p className="text-2xl font-bold text-brand-700">{testResult.distance} km</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">Kargo Ücreti</span>
                  <p className="text-2xl font-bold text-rose-700">{testResult.shippingFee} TL</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">Teslimat Süresi</span>
                  <p className="text-lg font-semibold text-sand-800">{testResult.deliveryDays} gün</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">İlk Teslimat Tarihi</span>
                  <p className="text-lg font-semibold text-sand-800">
                    {formatDateTurkish(testResult.earliestDeliveryDate)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">Mağaza</span>
                  <p className="text-sand-800">
                    {testResult.storeCity} / {testResult.storeDistrict}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-sand-500 uppercase">Müşteri</span>
                  <p className="text-sand-800">
                    {testResult.customerCity} / {testResult.customerDistrict || '-'}
                  </p>
                </div>
                {testResult.rule && (
                  <div>
                    <span className="text-xs font-semibold text-sand-500 uppercase">Eşleşen Kural</span>
                    <p className="text-xs text-sand-600">
                      {testResult.rule.min_km} - {testResult.rule.max_km} km → {testResult.rule.price} TL / {testResult.rule.delivery_days} gün
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 🏪 Mağaza Ayarları Modalı */}
      {/* ===================================================================== */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowStoreModal(false)}
              className="absolute top-4 right-4 text-sand-400 hover:text-sand-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Mağaza Konumunu Düzenle
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Teslimat İli *</label>
                <select
                  value={cities.find((c) => c.name === storeForm.city)?.id || ''}
                  onChange={(e) => {
                    const cityObj = cities.find((c) => c.id === Number(e.target.value));
                    if (cityObj) {
                      setStoreForm((f) => ({ ...f, city: cityObj.name }));
                      handleCityChange(e.target.value);
                    }
                  }}
                  className="input"
                >
                  <option value="">İl seçin (81 İl)</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Teslimat İlçesi *</label>
                <select
                  value={storeForm.district}
                  onChange={(e) => setStoreForm((f) => ({ ...f, district: e.target.value }))}
                  className="input"
                  disabled={!selectedCityId}
                >
                  <option value="">
                    {selectedCityId ? 'İlçe seçin' : 'Önce il seçiniz'}
                  </option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Açık Adres</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm((f) => ({ ...f, address: e.target.value }))}
                  className="input"
                  placeholder="Mahalle, sokak, bina, daire..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStoreModal(false)}
                className="btn-secondary flex-1"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateStore}
                className="btn-primary flex-1"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 📦 Yeni Kargo Kuralı Modalı */}
      {/* ===================================================================== */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddRuleModal(false)}
              className="absolute top-4 right-4 text-sand-400 hover:text-sand-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold font-display text-sand-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-600" />
              Yeni Kargo Kuralı Ekle
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min. km</label>
                  <input
                    type="number"
                    value={newRule.min_km}
                    onChange={(e) => setNewRule({ ...newRule, min_km: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Max. km</label>
                  <input
                    type="number"
                    value={newRule.max_km}
                    onChange={(e) => setNewRule({ ...newRule, max_km: e.target.value })}
                    className="input"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="label">Kargo Ücreti (TL)</label>
                <input
                  type="number"
                  value={newRule.price}
                  onChange={(e) => setNewRule({ ...newRule, price: e.target.value })}
                  className="input"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="label">Teslimat Süresi (gün)</label>
                <input
                  type="number"
                  value={newRule.delivery_days}
                  onChange={(e) => setNewRule({ ...newRule, delivery_days: e.target.value })}
                  className="input"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="label">Sıralama</label>
                <input
                  type="number"
                  value={newRule.sort_order}
                  onChange={(e) => setNewRule({ ...newRule, sort_order: e.target.value })}
                  className="input"
                  placeholder="0 (otomatik)"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="btn-secondary flex-1"
              >
                İptal
              </button>
              <button
                onClick={handleAddRule}
                className="btn-primary flex-1"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShippingPage;
