import { useState } from 'react';
import { Building2, PackageCheck, FileText, TrendingUp, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

export function CompanyDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Upper Banner / Header Card */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-700 rounded-3xl p-8 text-white mb-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Building2 className="w-8 h-8 text-rose-200" />
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Onaylı Kurumsal B2B Hesabı
              </span>
            </div>
            <h1 className="text-3xl font-bold font-display">Kurumsal B2B Portalı</h1>
            <p className="text-rose-100 text-sm max-w-xl">
              Şirketinize özel tanımlanmış toptan çiçek aranjman indirimleri, faturalandırma kolaylıkları ve öncelikli teslimat avantajlarından yararlanabilirsiniz.
            </p>
          </div>

          <button
            onClick={() => window.location.hash = '#/magaza'}
            className="px-6 py-3.5 bg-white text-rose-900 hover:bg-rose-50 font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 w-fit cursor-pointer text-sm whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" /> Toplu Sipariş Ver
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sand-500 font-medium">B2B Toptan İndiriminiz</p>
            <p className="text-xl font-bold text-sand-900">%20 Kurumsal İndirim</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sand-500 font-medium">Teslimat Önceliği</p>
            <p className="text-xl font-bold text-sand-900">Aynı Gün VIP Gönderim</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sand-500 font-medium">Faturalandırma Tipi</p>
            <p className="text-xl font-bold text-sand-900">Otomatik E-Fatura</p>
          </div>
        </div>
      </div>

      {/* Corporate Advantages Box */}
      <div className="bg-white rounded-3xl border border-sand-200 p-8 shadow-sm space-y-6">
        <div className="border-b border-sand-100 pb-4">
          <h2 className="text-xl font-bold text-sand-900 font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-700" />
            Kurumsal Üye Ayrıcalıklarınız
          </h2>
          <p className="text-sm text-sand-600 mt-1">
            Şirketiniz adına vereceğiniz tüm siparişlerde geçerli olan ayrıcalıklar hesabınıza otomatik tanımlanmıştır.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-sand-50 rounded-2xl border border-sand-200/60 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-600 mt-2"></div>
            <div>
              <h4 className="font-semibold text-sand-900 text-sm">Cari Hesap ve Toplu Fatura</h4>
              <p className="text-xs text-sand-600 mt-0.5">Tüm siparişleriniz ay sonunda tek bir kurumsal fatura altında toplanabilir.</p>
            </div>
          </div>

          <div className="p-4 bg-sand-50 rounded-2xl border border-sand-200/60 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-600 mt-2"></div>
            <div>
              <h4 className="font-semibold text-sand-900 text-sm">Özel Etkinlik & Ofis Aranjmanları</h4>
              <p className="text-xs text-sand-600 mt-0.5">Tebrik, açılış ve iç mekan bitkilerinde kurumsal tasarım desteği.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => window.location.hash = '#/magaza'}
            className="btn-primary bg-rose-800 hover:bg-rose-900 text-white flex items-center gap-2 text-sm font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
          >
            Kataloğa Git ve Sipariş Ver <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}