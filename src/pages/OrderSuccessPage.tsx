import { CheckCircle2, Package, Truck, Home, ArrowRight, MessageCircle } from 'lucide-react';
import type { Route, OrderInfo } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { openWhatsApp } from '../services/whatsappService';

type Props = {
  order: OrderInfo | undefined;
  navigate: (r: Route) => void;
};

export default function OrderSuccessPage({ order, navigate }: Props) {
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-sand-900">Sipariş bulunamadı</h1>
        <button onClick={() => navigate({ name: 'home' })} className="btn-primary mt-6">Anasayfaya Dön</button>
      </div>
    );
  }

  const steps = [
    { icon: CheckCircle2, title: 'Sipariş Alındı', desc: 'Siparişiniz başarıyla oluşturuldu', active: true, done: true },
    { icon: Package, title: 'Hazırlanıyor', desc: 'Çiçekleriniz özenle hazırlanıyor', active: false },
    { icon: Truck, title: 'Yola Çıktı', desc: 'Kuryemiz yola çıktı', active: false },
    { icon: Home, title: 'Teslim Edildi', desc: 'Çiçekler teslim edildi', active: false },
  ];

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Sipariş Tamamlandı' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="text-center mt-8 mb-10">
        <div className="w-20 h-20 rounded-full bg-leaf-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-leaf-600" />
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Siparişiniz Alındı!</h1>
        <p className="text-sand-500 mt-3 text-lg">Teşekkürler! Çiçekleriniz hazırlanıyor.</p>
        <div className="inline-flex items-center gap-2 bg-sand-100 rounded-full px-5 py-2 mt-4">
          <span className="text-sm text-sand-600">Sipariş No:</span>
          <span className="font-bold text-sand-900">#{order.id}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-sand-900 mb-6">Sipariş Durumu</h2>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step.done ? 'bg-leaf-500' : step.active ? 'bg-brand-500' : 'bg-sand-100'
                }`}>
                  <step.icon className={`w-5 h-5 ${step.done ? 'text-white' : step.active ? 'text-white' : 'text-sand-400'}`} />
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${step.done ? 'bg-leaf-300' : 'bg-sand-200'}`} />
                )}
              </div>
              <div className="pt-1.5">
                <p className={`font-semibold ${step.done || step.active ? 'text-sand-900' : 'text-sand-400'}`}>{step.title}</p>
                <p className="text-sm text-sand-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-sand-900 mb-4">Sipariş Detayları</h2>

        <div className="space-y-3 mb-4">
          {order.items.map((item) => (
            <div key={item.product.id} className="flex gap-3 text-sm">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-sand-100 flex-shrink-0">
                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sand-800">{item.product.name}</p>
                <p className="text-xs text-sand-500">{item.quantity} adet × {item.product.price} TL</p>
              </div>
              <span className="font-semibold text-sand-800">{item.product.price * item.quantity} TL</span>
            </div>
          ))}
        </div>

        <div className="border-t border-sand-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-sand-600">
            <span>Alıcı</span>
            <span className="font-medium text-sand-800">{order.recipientName}</span>
          </div>
          <div className="flex justify-between text-sand-600">
            <span>Teslimat Tarihi</span>
            <span className="font-medium text-sand-800">{order.deliveryDate}</span>
          </div>
          <div className="flex justify-between text-sand-600">
            <span>Adres</span>
            <span className="font-medium text-sand-800 text-right max-w-[60%]">{order.address}, {order.city}</span>
          </div>
          <div className="flex justify-between border-t border-sand-100 pt-2">
            <span className="font-semibold text-sand-800">Toplam</span>
            <span className="text-xl font-bold text-brand-700">{order.total} TL</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => openWhatsApp(order)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-emerald-200"
        >
          <MessageCircle className="w-5 h-5" />
          Siparişi WhatsApp ile İlet
        </button>

        <button onClick={() => navigate({ name: 'home' })} className="btn-primary w-full sm:w-auto">
          <Home className="w-5 h-5" />
          Anasayfaya Dön
        </button>
        
        <button onClick={() => navigate({ name: 'shop' })} className="btn-secondary w-full sm:w-auto">
          Alışverişe Devam Et
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}