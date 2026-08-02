import { useState, useEffect } from 'react';
import { Truck, MapPin, RefreshCw, Car, Bike, Package, ArrowLeft, Clock, CheckCircle, UserPlus, Shield, Trash2, Users, User, Calendar, CheckSquare, Square, ChevronDown, ChevronUp, Map, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';

type Courier = {
  id: string;
  name: string;
  vehicle_type: 'motor' | 'araba';
  phone: string;
  email: string;
  plate: string;
  password_hash?: string;
  is_active: boolean;
};

type Order = {
  id: string;
  recipientName?: string;
  recipient_name?: string;
  address: string;
  city: string;
  status: string;
  created_at?: string;
  delivery_date?: string;
  tracking_code?: string;
  courier_id?: string;
  delivery_order?: number;
  items?: any[];
};

export default function AdminCourierRoutePage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'delivering' | 'couriers' | 'delivered' | 'portal'>('pending');
  const [selectedPortalCourierId, setSelectedPortalCourierId] = useState<string>('');

  // 🏙️ Seçilen İl/Bölge Filtresi (Boşsa tüm iller gösterilir)
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('TÜMÜ');

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkCourierId, setBulkCourierId] = useState<string>('');
  const [expandedArchiveCourierId, setExpandedArchiveCourierId] = useState<string | null>(null);

  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierEmail, setNewCourierEmail] = useState('');
  const [newCourierPassword, setNewCourierPassword] = useState('');
  const [newCourierPlate, setNewCourierPlate] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState<'motor' | 'araba'>('motor');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: courierData } = await supabase.from('couriers').select('*');
      if (courierData) setCouriers(courierData);

      // En yakın teslim tarihi üstte olacak şekilde genel veritabanı sıralaması
      const { data: orderData } = await supabase.from('orders').select('*').order('delivery_date', { ascending: true, nullsFirst: false });
      if (orderData) setOrders(orderData);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName || !newCourierPhone || !newCourierEmail || !newCourierPassword) {
      alert('Lütfen kurye adı, telefon, e-posta ve şifre alanlarını doldurunuz.');
      return;
    }

    try {
      // Simple password hashing (in production, do this on backend)
      const encoder = new TextEncoder();
      const data = encoder.encode(newCourierPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('couriers').insert([
        {
          name: newCourierName,
          phone: newCourierPhone,
          email: newCourierEmail,
          password_hash: passwordHash,
          plate: newCourierPlate,
          vehicle_type: newCourierVehicle,
          is_active: true
        }
      ]);

      if (error) throw error;
      alert('✅ Kurye başarıyla eklendi!');
      setNewCourierName('');
      setNewCourierPhone('');
      setNewCourierEmail('');
      setNewCourierPassword('');
      setNewCourierPlate('');
      setNewCourierPhone('');
      setNewCourierPlate('');
      loadData();
    } catch (err: any) {
      alert('Kurye eklenemedi: ' + err.message);
    }
  };

  const handleDeleteCourier = async (courierId: string) => {
    if (!confirm('Bu kuryeyi silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('couriers').delete().eq('id', courierId);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert('Silme hatası: ' + err.message);
    }
  };

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    try {
      if (courierId) {
        const currentAssignedCount = orders.filter(o => o.courier_id === courierId && o.status !== 'delivered' && o.id !== orderId).length;
        if (currentAssignedCount >= 20) {
          alert('⚠️ Bu kurye maksimum paket sınırına (20 paket) ulaştı! Daha fazla atanamaz.');
          return;
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ courier_id: courierId ? courierId : null })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, courier_id: courierId } : o));
      alert('✅ Kurye başarıyla atandı!');
    } catch (err: any) {
      alert('Atama hatası: ' + err.message);
    }
  };

  const handleBulkAssignCourier = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Lütfen en az bir sipariş seçiniz.');
      return;
    }
    if (!bulkCourierId) {
      alert('Lütfen bir kurye seçiniz.');
      return;
    }

    const currentAssignedCount = orders.filter(o => o.courier_id === bulkCourierId && o.status !== 'delivered').length;
    if (currentAssignedCount + selectedOrderIds.length > 20) {
      alert(`⚠️ Bu kuryenin şu an ${currentAssignedCount} paketi var. Seçilen ${selectedOrderIds.length} paket eklenirse 20 sınırını aşar!`);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ courier_id: bulkCourierId })
        .in('id', selectedOrderIds);

      if (error) throw error;

      alert(`✅ Seçilen ${selectedOrderIds.length} sipariş kuryeye başarıyla atandı!`);
      setSelectedOrderIds([]);
      setBulkCourierId('');
      loadData();
    } catch (err: any) {
      alert('Toplu atama hatası: ' + err.message);
    }
  };

  const handleToggleSelectAll = (list: Order[]) => {
    if (selectedOrderIds.length === list.length) {
      setSelectedOrderIds([]);
    } else {
      const availableCount = 20;
      const idsToSelect = list.slice(0, availableCount).map(o => o.id);
      setSelectedOrderIds(idsToSelect);
      if (list.length > 20) {
        alert('⚠️ Tek seferde en fazla 20 paket seçilebilir (Kurye max sınır kuralı).');
      }
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 20) {
          alert('⚠️ Bir kurye en fazla 20 paket alabilir!');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
      alert('🎉 Sipariş başarıyla teslim edildi olarak işaretlendi!');
    } catch (err: any) {
      alert('Güncelleme hatası: ' + err.message);
    }
  };

  const pendingOrders = orders.filter(o => !o.courier_id && o.status !== 'delivered' && o.status !== 'cancelled');
  const deliveringOrders = orders.filter(o => o.courier_id && o.status !== 'delivered' && o.status !== 'cancelled');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const portalCourier = couriers.find(c => c.id === selectedPortalCourierId);
  const portalAssignedOrders = orders.filter(o => o.courier_id === selectedPortalCourierId);

  const activePortalOrders = portalAssignedOrders.filter(o => o.status !== 'delivered');

  // 🏙️ İllere Göre Gruplama ve Sayı Hesaplama (Bekleyenler için)
  const cityCounts: { [cityName: string]: number } = {};
  pendingOrders.forEach(o => {
    const cityName = (o.city || 'Bilinmeyen İl').trim();
    cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
  });

  // Seçilen ile göre filtrelenmiş ve teslim tarihine göre sıralanmış bekleyenler
  const filteredPendingOrders = pendingOrders
    .filter(o => selectedCityFilter === 'TÜMÜ' || (o.city || '').trim() === selectedCityFilter)
    .sort((a, b) => {
      const dateA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
      const dateB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
      return dateA - dateB; // En yakın tarih en üstte
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center text-sand-600">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p>Kurye & Dağıtım Paneli yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50/60 pb-16">
      {/* 🌸 ÜST NAVBAR */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-wide">Flower Shop — Kurye & Dağıtım Paneli</h1>
            <p className="text-xs text-gray-400">Bölge/İl Bazlı Planlama ve Akıllı Rota</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
          
          <button
            onClick={() => { window.location.hash = '#/admin/dashboard'; }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Yönetim Paneline Dön
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* 📊 ÜST SEKME / ÖZET KARTLARI */}
        <div className="grid sm:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between ${activeTab === 'pending' ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'bg-white/80 border-sand-200 hover:bg-white'}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-sand-500 tracking-wider">Bekleyenler</span>
              <h2 className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingOrders.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('delivering')}
            className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between ${activeTab === 'delivering' ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'bg-white/80 border-sand-200 hover:bg-white'}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-sand-500 tracking-wider">Teslimattakiler</span>
              <h2 className="text-xl font-extrabold text-brand-600 mt-0.5">{deliveringOrders.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('couriers')}
            className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between ${activeTab === 'couriers' ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'bg-white/80 border-sand-200 hover:bg-white'}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-sand-500 tracking-wider">Kuryeler</span>
              <h2 className="text-xl font-extrabold text-blue-600 mt-0.5">{couriers.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('delivered')}
            className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between ${activeTab === 'delivered' ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'bg-white/80 border-sand-200 hover:bg-white'}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-sand-500 tracking-wider">Arşiv</span>
              <h2 className="text-xl font-extrabold text-emerald-600 mt-0.5">{deliveredOrders.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('portal')}
            className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex items-center justify-between ${activeTab === 'portal' ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20' : 'bg-purple-50/50 border-purple-200 hover:bg-purple-50'}`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">Kurye Saha Görünümü</span>
              <h2 className="text-sm font-extrabold text-purple-700 mt-1">Mobil Portal 📱</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* 🔲 İÇERİK ALANI */}
        <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
          
          {/* 1. BEKLEYENLER SEKMESİ (Bölge/İl Kartları ile) */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-sand-100 pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Bölge Bazlı Bekleyen Siparişler ({pendingOrders.length})
                  </h2>
                  <p className="text-xs text-sand-500 mt-0.5">İl kartlarına tıklayarak bölge filtrelemesi yapabilir, en yakın teslim tarihlere göre atama yapabilirsiniz.</p>
                </div>

                {filteredPendingOrders.length > 0 && (
                  <div className="flex items-center gap-2 bg-sand-50 p-2.5 rounded-2xl border border-sand-200 w-full sm:w-auto">
                    <button
                      onClick={() => handleToggleSelectAll(filteredPendingOrders)}
                      className="text-xs font-bold text-brand-700 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all cursor-pointer"
                    >
                      {selectedOrderIds.length === filteredPendingOrders.length ? 'Seçimi Kaldır' : 'İlk 20\'yi Seç'}
                    </button>
                    <select
                      value={bulkCourierId}
                      onChange={(e) => setBulkCourierId(e.target.value)}
                      className="input text-xs py-1.5 w-[150px] cursor-pointer font-bold bg-white"
                    >
                      <option value="">-- Kurye Seç --</option>
                      {couriers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.vehicle_type})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleBulkAssignCourier}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex-shrink-0"
                    >
                      Seçilenleri Ata ({selectedOrderIds.length})
                    </button>
                  </div>
                )}
              </div>

              {/* 🏙️ İL / BÖLGE SEÇİM MENÜSÜ (Kompakt ve Şık) */}
              <div className="flex items-center gap-3 bg-sand-50 p-4 rounded-2xl border border-sand-200">
                <span className="text-xs font-bold text-sand-700 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                  <Map className="w-4 h-4 text-brand-600" /> Bölge / İl Filtrele:
                </span>
                <select
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  className="input text-xs py-2 w-full sm:w-[280px] cursor-pointer font-bold bg-white"
                >
                  <option value="TÜMÜ">Tüm İller ({pendingOrders.length} Sipariş)</option>
                  {Object.entries(cityCounts).map(([cityName, count]) => (
                    <option key={cityName} value={cityName}>
                      📍 {cityName} ({count} Sipariş)
                    </option>
                  ))}
                </select>
              </div>

              {filteredPendingOrders.length === 0 ? (
                <div className="text-center py-16 text-sand-500">
                  <Package className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                  <p>Bu bölgede bekleyen kargo bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPendingOrders.map((order) => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' ' + order.city)}`;
                    const isSelected = selectedOrderIds.includes(order.id);
                    
                    const createdDate = order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Bilinmiyor';
                    const deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Bugün / Esnek';

                    return (
                      <div key={order.id} className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isSelected ? 'bg-brand-50/40 border-brand-300' : 'bg-sand-50/40 border-sand-200'}`}>
                        
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleSelectOrder(order.id)}
                            className="mt-1 text-brand-600 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-sand-400" />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold bg-sand-100 text-sand-800 px-2 py-0.5 rounded">
                                #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-sm font-bold text-sand-900">
                                {order.recipientName || order.recipient_name || 'Alıcı Müşteri'}
                              </span>
                              
                              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Veriliş: {createdDate}
                              </span>
                              <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                🎯 Teslim Hedefi: {deliveryDate}
                              </span>
                            </div>

                            <p className="text-xs text-sand-600 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                              {order.address} ({order.city})
                            </p>
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                              📍 Google Maps Yol Tarifi Aç
                            </a>
                          </div>
                        </div>

                        {/* Tekil Kurye Atama */}
                        <div className="w-full sm:w-auto text-right">
                          <label className="block text-[10px] uppercase font-bold text-sand-500 mb-1">Kurye Ata (Max 20)</label>
                          <select
                            value={order.courier_id || ''}
                            onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                            className="input text-xs py-1.5 w-full sm:w-[160px] cursor-pointer font-bold"
                          >
                            <option value="">-- Kurye Seçilmedi --</option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.vehicle_type})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. TESLİMATTAKİLER SEKMESİ */}
          {activeTab === 'delivering' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-sand-100 pb-4">
                <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-600" />
                  Yolda Olan Teslimatlar ({deliveringOrders.length})
                </h2>
                <span className="text-xs text-sand-500 font-medium">Aktif Kurye Dağıtım Rotası</span>
              </div>

              {deliveringOrders.length === 0 ? (
                <div className="text-center py-16 text-sand-500">
                  <Package className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                  <p>Şu an yolda olan teslimat bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveringOrders.map((order) => {
                    const assignedCourier = couriers.find(c => c.id === order.courier_id);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' ' + order.city)}`;
                    const deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Bugün';

                    return (
                      <div key={order.id} className="p-4 rounded-2xl border border-sand-200 bg-sand-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-sand-100 text-sand-800 px-2 py-0.5 rounded">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className="text-sm font-bold text-sand-900">
                              {order.recipientName || order.recipient_name || 'Alıcı Müşteri'}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-brand-100 text-brand-800">
                              Kargoda ({assignedCourier?.name || 'Kurye'})
                            </span>
                            <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              🎯 Teslim Hedefi: {deliveryDate}
                            </span>
                          </div>
                          <p className="text-xs text-sand-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                            {order.address} ({order.city})
                          </p>
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                            📍 Google Maps Yol Tarifi Aç
                          </a>
                        </div>

                        <div className="w-full sm:w-auto text-right">
                          <label className="block text-[10px] uppercase font-bold text-sand-500 mb-1">Kurye Değiştir</label>
                          <select
                            value={order.courier_id || ''}
                            onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                            className="input text-xs py-1.5 w-full sm:w-[160px] cursor-pointer font-bold"
                          >
                            <option value="">-- Kurye Seçilmedi --</option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.vehicle_type})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. KURYE YÖNETİMİ SEKMESİ */}
          {activeTab === 'couriers' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-sand-50/50 rounded-2xl p-5 border border-sand-200 space-y-4">
                <h3 className="text-md font-bold text-sand-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-600" /> Yeni Kurye Ekle
                </h3>
                <form onSubmit={handleAddCourier} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">Ad Soyad</label>
                    <input type="text" value={newCourierName} onChange={e => setNewCourierName(e.target.value)} placeholder="Ahmet Yılmaz" className="input text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">E-posta</label>
                    <input type="email" value={newCourierEmail} onChange={e => setNewCourierEmail(e.target.value)} placeholder="ahmet@flowershop.com" className="input text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">Telefon</label>
                    <input type="text" value={newCourierPhone} onChange={e => setNewCourierPhone(e.target.value)} placeholder="0555..." className="input text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">Şifre</label>
                    <input type="password" value={newCourierPassword} onChange={e => setNewCourierPassword(e.target.value)} placeholder="••••••••" className="input text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">Plaka</label>
                    <input type="text" value={newCourierPlate} onChange={e => setNewCourierPlate(e.target.value)} placeholder="06 ABC 34" className="input text-xs w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sand-600 mb-1">Araç Türü</label>
                    <select value={newCourierVehicle} onChange={e => setNewCourierVehicle(e.target.value as any)} className="input text-xs w-full cursor-pointer">
                      <option value="motor">🛵 Motor</option>
                      <option value="araba">🚗 Araba</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full text-xs py-2 mt-2 cursor-pointer">Kuryeyi Kaydet</button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-md font-bold text-sand-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-600" /> Aktif Kuryeler Listesi ({couriers.length})
                </h3>
                <div className="space-y-3">
                  {couriers.map(c => {
                    const assigned = orders.filter(o => o.courier_id === c.id && o.status !== 'delivered').length;
                    return (
                      <div key={c.id} className="p-4 rounded-2xl border border-sand-200 bg-sand-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.vehicle_type === 'motor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.vehicle_type === 'motor' ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sand-900 text-sm">{c.name}</h4>
                            <p className="text-[11px] text-sand-500">{c.plate || 'Plakasız'} · {c.phone}</p>
                            {c.email && (
                              <p className="text-[11px] text-sand-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {c.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${assigned > 20 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'}`}>
                            {assigned} / 20 Paket
                          </span>
                          <button onClick={() => handleDeleteCourier(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. ARŞİV SEKMESİ */}
          {activeTab === 'delivered' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-sand-100 pb-4">
                <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Kurye Bazlı Teslimat Arşivi ({deliveredOrders.length} Sipariş)
                </h2>
                <span className="text-xs text-sand-500 font-medium">Kurye adına tıklayarak teslim detaylarını görün</span>
              </div>

              {couriers.length === 0 ? (
                <div className="text-center py-16 text-sand-500">
                  <Package className="w-10 h-10 text-sand-400 mx-auto mb-2" />
                  <p>Kayıtlı kurye bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {couriers.map((courier) => {
                    const courierDeliveredOrders = deliveredOrders.filter(o => o.courier_id === courier.id);
                    const isExpanded = expandedArchiveCourierId === courier.id;

                    return (
                      <div key={courier.id} className="border border-sand-200 rounded-3xl bg-sand-50/40 overflow-hidden transition-all shadow-xs">
                        <button
                          onClick={() => setExpandedArchiveCourierId(isExpanded ? null : courier.id)}
                          className="w-full p-5 flex items-center justify-between bg-white hover:bg-sand-50 cursor-pointer transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              {courier.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sand-900 text-sm">{courier.name}</h4>
                              <p className="text-xs text-sand-500 capitalize">Araç: {courier.vehicle_type} · Tel: {courier.phone} · Plaka: {courier.plate || 'Yok'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                              {courierDeliveredOrders.length} Teslimat Tamamlandı
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-sand-500" /> : <ChevronDown className="w-5 h-5 text-sand-500" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-5 space-y-3 bg-sand-50/80 border-t border-sand-200">
                            {courierDeliveredOrders.length === 0 ? (
                              <p className="text-xs text-sand-500 text-center py-4">Bu kuryenin henüz arşivlenmiş teslimatı bulunmuyor.</p>
                            ) : (
                              courierDeliveredOrders.map(order => (
                                <div key={order.id} className="p-4 rounded-2xl bg-white border border-sand-200 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                      #{order.id.slice(0, 8)}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600">✓ Teslim Edildi</span>
                                  </div>
                                  <p className="text-xs font-bold text-sand-900">Alıcı: {order.recipientName || order.recipient_name || 'Müşteri'}</p>
                                  <p className="text-xs text-sand-600">Adres: {order.address} ({order.city})</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. KURYE SAHA GÖRÜNÜMÜ / MOBİL PORTAL SEKMESİ */}
          {activeTab === 'portal' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="bg-purple-50 border border-purple-200 p-6 rounded-3xl space-y-3">
                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2 font-display">
                  📱 Kurye Saha Portal Simülasyonu
                </h3>
                <p className="text-xs text-purple-700">
                  Kuryeler bu ekrandan kendi isimlerini seçerek üzerlerindeki paketleri, taşıdıkları çiçeklerin detaylarını görebilir ve adrese vardıklarında teslimat onayı verebilirler.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase text-purple-800 mb-1">Kurye Seçimi</label>
                  <select
                    value={selectedPortalCourierId}
                    onChange={(e) => setSelectedPortalCourierId(e.target.value)}
                    className="input text-xs py-2.5 w-full cursor-pointer font-bold bg-white"
                  >
                    <option value="">-- Lütfen Kuryenizi Seçin --</option>
                    {couriers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.vehicle_type === 'motor' ? '🛵 Motor' : '🚗 Araba'} - {c.plate || 'Plakasız'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPortalCourierId && portalCourier && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-sand-200 flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="font-bold text-sand-900 text-base">{portalCourier.name}</h4>
                      <p className="text-xs text-sand-500 capitalize">Araç: {portalCourier.vehicle_type} · Tel: {portalCourier.phone}</p>
                    </div>
                    <span className="px-3.5 py-1.5 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-full">
                      {activePortalOrders.length} / 20 Aktif Paket
                    </span>
                  </div>

                  {portalAssignedOrders.length > 0 && (
                    <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-5 rounded-3xl text-white space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm">🗺️ Toplu Rota Haritası (Tüm Duraklar)</h4>
                          <p className="text-xs text-brand-100">Günlük teslimat rotasını haritada sırayla gösterir.</p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/Merkez+Ankara/` + activePortalOrders.map(o => encodeURIComponent(o.address + ' ' + o.city)).join('/')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white text-brand-800 rounded-xl text-xs font-bold shadow-xs hover:bg-brand-50 transition-all flex-shrink-0"
                        >
                          Tüm Rotayı Haritada Aç ➔
                        </a>
                      </div>

                      <div className="bg-white/10 p-3 rounded-2xl space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Harita Rota Sıralaması:</span>
                        <div className="flex flex-wrap gap-2">
                          {activePortalOrders.map((ord, idx) => (
                            <span key={ord.id} className="px-2.5 py-1 bg-white text-brand-900 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1">
                              📍 {idx + 1}. Durak: {ord.city}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {portalAssignedOrders.length === 0 ? (
                      <div className="text-center py-12 text-sand-500 bg-sand-50/50 rounded-2xl border border-sand-200">
                        <Package className="w-8 h-8 text-sand-400 mx-auto mb-2" />
                        <p className="text-xs">Üzerinizde atanmış aktif paket bulunmuyor.</p>
                      </div>
                    ) : (
                      portalAssignedOrders.map((order, index) => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' ' + order.city)}`;
                        const isDelivered = order.status === 'delivered';
                        const deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Bugün';

                        return (
                          <div key={order.id} className={`p-5 rounded-3xl border space-y-4 shadow-xs ${isDelivered ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-sand-200'}`}>
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold bg-brand-600 text-white px-2.5 py-0.5 rounded-full">
                                    {index + 1}. Durak
                                  </span>
                                  <span className="font-mono text-xs font-bold bg-sand-100 text-sand-800 px-2 py-0.5 rounded">
                                    #{order.id.slice(0, 8)}
                                  </span>
                                  <span className="text-sm font-bold text-sand-900">
                                    {order.recipientName || order.recipient_name || 'Alıcı Müşteri'}
                                  </span>
                                  <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                    🎯 Teslim Hedefi: {deliveryDate}
                                  </span>
                                </div>
                                <p className="text-xs text-sand-600 flex items-center gap-1 pt-1">
                                  <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                                  {order.address} ({order.city})
                                </p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-bold ${isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {isDelivered ? '✓ Teslim Edildi' : 'Taşınıyor'}
                              </span>
                            </div>

                            {/* Taşınan Çiçek Detayı */}
                            <div className="bg-sand-50 p-3 rounded-2xl border border-sand-100 space-y-1.5">
                              <h5 className="text-[11px] font-bold text-sand-700 uppercase">Taşınan Çiçek / Ürün İçeriği:</h5>
                              {order.items && order.items.length > 0 ? (
                                <ul className="space-y-1">
                                  {order.items.map((item: any, idx: number) => (
                                    <li key={idx} className="text-xs text-sand-800 flex justify-between">
                                      <span>🌸 {item.title || item.name || 'Özel Buket'} (Adet: {item.quantity || 1})</span>
                                      <span className="font-semibold">{item.price ? `${item.price} ₺` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-sand-500">Özel Tasarım Çiçek Buketi</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-sand-100">
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                              >
                                📍 Tekil Yol Tarifi Aç
                              </a>

                              {!isDelivered ? (
                                <button
                                  onClick={() => handleDeliverOrder(order.id)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4" /> Teslim Edildi İşaretle ✓
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Teslim Tamamlandı
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}