import { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Phone, CheckCircle, Clock, RefreshCw, AlertCircle, Map, CheckSquare, Square, Navigation, Send } from 'lucide-react';
import { getCurrentCourier, getCourierOrders, updateOrderStatus, updateOrderStatusWithEmail, subscribeToCourierOrders, type RealtimeSubscription } from '../services/courierApi';
import type { CourierOrder } from '../types';
import CourierMap from '../components/courier/CourierMap';

interface Props {
  navigate: (route: any) => void;
}

export default function CourierDashboardPage({ navigate }: Props) {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<'pending' | 'in_transit' | 'delivered' | 'all'>('pending');

  const loadOrders = async () => {
    const courier = getCurrentCourier();
    if (!courier) {
      navigate({ name: 'home' });
      return;
    }

    const courierOrders = await getCourierOrders(courier.id);
    console.log('Yüklenen siparişler:', courierOrders.map(o => ({ id: o.id, status: o.status })));
    setOrders(courierOrders);
    setLoading(false);
  };

  useEffect(() => {
    const courier = getCurrentCourier();
    if (!courier) {
      navigate({ name: 'home' });
      return;
    }

    // Load initial orders
    loadOrders();

    // 🌸 Realtime subscription temporarily disabled to fix status update issues
    // try {
    //   const sub = subscribeToCourierOrders(courier.id, (updatedOrders) => {
    //     setOrders(updatedOrders);
    //   });
    //   setSubscription(sub);
    //
    //   // 🌸 Cleanup subscription on unmount
    //   return () => {
    //     sub.unsubscribe();
    //   };
    // } catch (error) {
    //   console.error('Failed to setup realtime subscription:', error);
    //   // Continue without realtime if it fails
    //   return () => {};
    // }
  }, [navigate]);

  const handleTabChange = (newTab: 'pending' | 'in_transit' | 'delivered' | 'all') => {
    setCurrentTab(newTab);
    setSelectedOrderIds([]); // Clear selection when tab changes
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setUpdatingOrderId(null);
      return;
    }

    console.log('Status güncelleniyor:', orderId, 'yeni status:', newStatus, 'mevcut status:', order.status);

    // 🌸 For in_transit status, send email notification
    if (newStatus === 'in_transit') {
      const customerEmail = order.user_email || order.email || order.recipient_email;
      console.log('Customer email bilgisi:', {
        user_email: order.user_email,
        email: order.email,
        recipient_email: order.recipient_email,
        final: customerEmail
      });

      const result = await updateOrderStatusWithEmail(
        orderId,
        newStatus,
        {
          customerName: order.recipient_name || order.recipientName || 'Değerli Müşterimiz',
          customerEmail: customerEmail || '',
          trackingNumber: order.tracking_number || order.tracking_code,
          totalAmount: Number(order.total_amount || 0)
        }
      );

      console.log('updateOrderStatusWithEmail sonucu:', result);

      if (result.success) {
        console.log('Status güncelleme başarılı, local state güncelleniyor');
        // 🌸 Manually update local state immediately
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === orderId ? { ...o, status: newStatus as CourierOrder['status'] } : o
          )
        );
        handleTabChange('in_transit');
      } else {
        alert('Durum güncellenemedi: ' + result.error);
      }
    } else {
      // For other statuses, use simple update
      const result = await updateOrderStatus(orderId, newStatus);

      console.log('updateOrderStatus sonucu:', result);

      if (result.success) {
        console.log('Status güncelleme başarılı, local state güncelleniyor');
        // 🌸 Manually update local state immediately
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === orderId ? { ...o, status: newStatus as CourierOrder['status'] } : o
          )
        );

        // 🌸 Auto-move to appropriate tab based on new status
        if (newStatus === 'delivered') {
          handleTabChange('delivered');
        }
      } else {
        alert('Durum güncellenemedi: ' + result.error);
      }
    }

    setUpdatingOrderId(null);
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleToggleSelectAll = (filteredOrders: CourierOrder[]) => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  // 🌸 Google Maps multi-stop route optimization
  const handleOptimizeRoute = () => {
    if (selectedOrderIds.length === 0) {
      alert('Lütfen en az bir sipariş seçin.');
      return;
    }

    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    
    // 🌸 Create Google Maps URL with multiple waypoints
    const storeLocation = '39.9334,32.8597'; // Ankara (default store location)
    const destinations = selectedOrders.map(order => {
      const address = encodeURIComponent(`${order.shipping_address}, ${order.city}, ${order.district}, Türkiye`);
      return address;
    });

    // Google Maps directions URL with waypoints
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const waypoints = destinations.slice(0, -1).join('|');
    const destination = destinations[destinations.length - 1];
    
    const mapsUrl = `${baseUrl}&origin=${storeLocation}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    
    window.open(mapsUrl, '_blank');
  };

  // 🌸 Tab filtering
  const getFilteredOrders = () => {
    switch (currentTab) {
      case 'pending':
        return orders.filter(o => o.status === 'shipped');
      case 'in_transit':
        return orders.filter(o => o.status === 'in_transit');
      case 'delivered':
        return orders.filter(o => o.status === 'delivered');
      case 'all':
        return orders;
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const activeOrders = orders.filter(o => o.status === 'shipped' || o.status === 'in_transit');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Beklemede', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Hazırlanıyor', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Kargoda', icon: Package },
      in_transit: { color: 'bg-cyan-100 text-cyan-800', label: 'Yolda', icon: Navigation },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Teslim Edildi', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'İptal', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-sand-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sand-900">{activeOrders.length}</p>
                <p className="text-sm text-sand-600">Aktif Sipariş</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-sand-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sand-900">{deliveredOrders.length}</p>
                <p className="text-sm text-sand-600">Teslim Edilen</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-sand-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sand-900">{orders.length}</p>
                <p className="text-sm text-sand-600">Toplam Sipariş</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🌸 Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 border border-sand-200 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('pending')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'pending'
                  ? 'bg-brand-600 text-white'
                  : 'text-sand-600 hover:bg-sand-50'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Kargoda ({orders.filter(o => o.status === 'shipped').length})
            </button>
            <button
              onClick={() => handleTabChange('in_transit')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'in_transit'
                  ? 'bg-brand-600 text-white'
                  : 'text-sand-600 hover:bg-sand-50'
              }`}
            >
              <Navigation className="h-4 w-4 inline mr-2" />
              Yolda ({orders.filter(o => o.status === 'in_transit').length})
            </button>
            <button
              onClick={() => handleTabChange('delivered')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'delivered'
                  ? 'bg-brand-600 text-white'
                  : 'text-sand-600 hover:bg-sand-50'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Teslim Edilen ({deliveredOrders.length})
            </button>
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentTab === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'text-sand-600 hover:bg-sand-50'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Toplam ({orders.length})
            </button>
          </div>
        </div>

        {/* 🌸 Multi-select and Route Optimization */}
        {(currentTab === 'pending' || currentTab === 'in_transit') && filteredOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-sand-200 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggleSelectAll(filteredOrders)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-sand-50"
              >
                {selectedOrderIds.length === filteredOrders.length ? (
                  <CheckSquare className="h-4 w-4 text-brand-600" />
                ) : (
                  <Square className="h-4 w-4 text-sand-400" />
                )}
                {selectedOrderIds.length === filteredOrders.length ? 'Tümünü Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
              <span className="text-sm text-sand-600">
                {selectedOrderIds.length} sipariş seçildi
              </span>
            </div>
            <button
              onClick={handleOptimizeRoute}
              disabled={selectedOrderIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Navigation className="h-4 w-4" />
              Rota Optimize Et
            </button>
          </div>
        )}

        {/* Orders List */}
        <div>
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-sand-200 text-center">
              <Package className="h-12 w-12 text-sand-300 mx-auto mb-3" />
              <p className="text-sand-600">Bu sekmede siparişiniz bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  updatingOrderId={updatingOrderId}
                  isSelected={selectedOrderIds.includes(order.id)}
                  onToggleSelect={() => handleToggleSelectOrder(order.id)}
                  showSelect={currentTab !== 'delivered' && currentTab !== 'all'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
}

function OrderCard({ order, onStatusUpdate, updatingOrderId, isSelected, onToggleSelect, showSelect }: { 
  order: CourierOrder; 
  onStatusUpdate: (id: string, status: string) => void;
  updatingOrderId: string | null;
  isSelected: boolean;
  onToggleSelect: () => void;
  showSelect: boolean;
}) {
  // 🌸 Kurye yetkileri: Sadece "processing" -> "shipped" ve "shipped" -> "delivered" yapabilir
  const getNextStatus = (currentStatus: string) => {
    if (currentStatus === 'shipped') return 'in_transit';
    if (currentStatus === 'in_transit') return 'delivered';
    return currentStatus;
  };

  const canUpdate = order.status === 'shipped' || order.status === 'in_transit';
  const nextStatus = getNextStatus(order.status);
  
  const getNextStatusLabel = (currentStatus: string) => {
    if (currentStatus === 'shipped') return 'Yola Çıktı';
    if (currentStatus === 'in_transit') return 'Teslim Edildi';
    return '';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-sand-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* 🌸 Select Checkbox */}
            {showSelect && (
              <button
                onClick={onToggleSelect}
                className="p-1 rounded hover:bg-sand-100 transition-colors cursor-pointer"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-brand-600" />
                ) : (
                  <Square className="h-5 w-5 text-sand-400" />
                )}
              </button>
            )}
            {getStatusBadge(order.status)}
            <span className="text-xs text-sand-500">#{order.id.slice(0, 8)}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-sand-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-sand-900">{order.recipient_name}</p>
                <p className="text-sm text-sand-600">{order.shipping_address}</p>
                <p className="text-xs text-sand-500">{order.city}, {order.district}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-sand-400 flex-shrink-0" />
              <a 
                href={`tel:${order.recipient_phone}`}
                className="text-sm text-brand-600 hover:underline"
              >
                {order.recipient_phone}
              </a>
            </div>

            {order.tracking_code && (
              <div className="text-xs text-sand-500">
                Takip Kodu: <span className="font-mono">{order.tracking_code}</span>
              </div>
            )}

            <div className="text-sm font-semibold text-sand-900">
              Tutar: ₺{order.total_amount.toFixed(2)}
            </div>
          </div>
        </div>

        {canUpdate && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              disabled={updatingOrderId === order.id}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updatingOrderId === order.id ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                getNextStatusLabel(order.status)
              )}
            </button>
          </div>
        )}
      </div>

      {/* 🌸 Harita Gösterimi */}
      <div className="mt-4">
        <CourierMap
          destinationAddress={order.shipping_address}
          destinationCity={order.city}
          destinationDistrict={order.district}
        />
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Beklemede', icon: Clock },
    processing: { color: 'bg-blue-100 text-blue-800', label: 'Hazırlanıyor', icon: Package },
    shipped: { color: 'bg-purple-100 text-purple-800', label: 'Yolda', icon: Truck },
    delivered: { color: 'bg-green-100 text-green-800', label: 'Teslim Edildi', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'İptal', icon: AlertCircle },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
