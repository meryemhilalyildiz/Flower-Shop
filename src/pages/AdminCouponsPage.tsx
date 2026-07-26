import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Ticket, RefreshCw, Calendar, Users } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State'leri
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxUses, setMaxUses] = useState('10');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !maxUses) {
      alert('Lütfen kupon kodu, indirim miktarı ve kişi limitini girin.');
      return;
    }

    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    const { error } = await supabase.from('coupons').insert([
      {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_amount: Number(discountValue),
        min_order_amount: Number(minOrder) || 0,
        usage_limit: Number(maxUses),
        used_count: 0,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : defaultExpiry.toISOString(),
        is_active: true,
      },
    ]);

    if (error) {
      alert('Kupon eklenirken hata: ' + error.message);
    } else {
      alert('🎉 Kupon başarıyla oluşturuldu!');
      setCode('');
      setDiscountValue('');
      setMaxUses('10');
      setExpiresAt('');
      fetchCoupons();
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sand-900 font-display">Kupon Yönetimi</h1>
          <p className="text-sm text-sand-600">
            Müşteriler için indirim kuponları oluşturun, geçerlilik sürelerini ve kişi limitlerini belirleyin.
          </p>
        </div>
        <button
          onClick={fetchCoupons}
          className="flex items-center gap-2 px-4 py-2 border border-sand-200 rounded-xl hover:bg-sand-50 text-sm font-semibold text-sand-700 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      {/* 🎟️ Yeni Kupon Oluşturma Formu */}
      <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-2xl border border-sand-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-sand-800 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-brand-600" /> Yeni Kupon Ekle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">Kupon Kodu (Adı)</label>
            <input
              type="text"
              placeholder="Örn: BAHAR50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl uppercase outline-none focus:ring-2 focus:ring-brand-500 font-bold text-sand-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">İndirim Tipi</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="fixed">Sabit TL İndirim</option>
              <option value="percentage">Yüzde (%) İndirim</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">İndirim Miktarı</label>
            <input
              type="number"
              placeholder={discountType === 'fixed' ? 'TL (Örn: 50)' : '% (Örn: 15)'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">Kaç Kişilik? (Kullanım Limiti)</label>
            <input
              type="number"
              placeholder="Örn: 50"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">Min. Sepet Tutarı (TL)</label>
            <input
              type="number"
              placeholder="Örn: 150"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-sand-600 block mb-1">Ne Zamana Kadar?</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Kuponu Kaydet
          </button>
        </div>
      </form>

      {/* 📊 Veritabanındaki Aktif Kuponlar */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sand-100 font-bold text-sand-800 flex justify-between items-center">
          <span>Sistemdeki Kuponlar ve Limitler</span>
          <span className="text-xs text-sand-500 font-normal">Kullanıldıkça kalan kişi sayısı otomatik düşer.</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sand-500">Yükleniyor...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-sand-500">Henüz oluşturulmuş kupon bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-sand-100">
            {coupons.map((c) => {
              const usageLimit = c.usage_limit ?? c.max_uses ?? 0;
              const usedCount = c.used_count ?? 0;
              const remainingUses = Math.max(0, usageLimit - usedCount);
              const validUntil = c.valid_until ?? c.expires_at;
              const isExpired = validUntil && new Date(validUntil) < new Date();

              return (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-sand-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                      🎟️
                    </div>
                    <div>
                      <h4 className="font-bold text-sand-900 font-mono text-base">{c.code}</h4>
                      <p className="text-xs text-sand-500">
                        İndirim: <strong className="text-sand-800">{c.discount_type === 'percentage' ? `%${c.discount_amount ?? c.discount_value}` : `₺${c.discount_amount ?? c.discount_value}`}</strong> · 
                        Min. Sepet: ₺{c.min_order_amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-sand-500 flex items-center gap-1 justify-end">
                        <Users className="w-3 h-3" /> Kullanılan / Toplam
                      </p>
                      <p className="text-sm font-bold text-sand-800">
                        {usedCount} / {usageLimit} Kişi
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-sand-500">Kalan Hak</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        remainingUses > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {remainingUses > 0 ? `${remainingUses} Hak Kaldı` : 'Tükendi ❌'}
                      </span>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-sand-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" /> Son Tarih
                      </p>
                      <p className={`text-xs font-semibold ${isExpired ? 'text-red-600' : 'text-sand-700'}`}>
                        {validUntil ? new Date(validUntil).toLocaleDateString('tr-TR') : 'Süresiz'}
                        {isExpired && ' (Süresi Doldu)'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Kuponu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}