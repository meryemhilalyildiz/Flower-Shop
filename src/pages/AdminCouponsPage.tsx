import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Percent, DollarSign, Check, X } from 'lucide-react';
import type { Route } from '../types';
import { supabase } from '../supabaseClient';
import type { Coupon } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  navigate: (r: Route) => void;
};

export default function AdminCouponsPage({ navigate }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Kuponlar yüklenirken hata:', error);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        description: formData.description || null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert([couponData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Kupon kaydedilirken hata:', error);
      alert('Kupon kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      console.error('Kupon silinirken hata:', error);
      alert('Kupon silinirken bir hata oluştu');
    } else {
      loadCoupons();
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until?.split('T')[0] || '',
      description: coupon.description || '',
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      description: '',
      is_active: true,
    });
  };

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Admin', route: { name: 'admin-dashboard' } as Route },
    { label: 'Kuponlar' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">İndirim Kuponları</h1>
          <p className="text-sand-500 mt-2">Kupon kodlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Kupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">Kupon Kodu</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">İndirim Tipi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">Değer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">Min. Tutar</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">Kullanım</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">Durum</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-sand-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-sand-100 hover:bg-sand-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-brand-600" />
                      <span className="font-mono font-semibold text-sand-900">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      coupon.discount_type === 'percentage' 
                        ? 'bg-brand-100 text-brand-700' 
                        : 'bg-leaf-100 text-leaf-700'
                    }`}>
                      {coupon.discount_type === 'percentage' ? (
                        <><Percent className="w-3 h-3" /> Yüzde</>
                      ) : (
                        <><DollarSign className="w-3 h-3" /> Sabit</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-sand-900">
                    {coupon.discount_type === 'percentage' 
                      ? `%${coupon.discount_value}` 
                      : `${coupon.discount_value} TL`}
                  </td>
                  <td className="px-6 py-4 text-sand-600">{coupon.min_order_amount} TL</td>
                  <td className="px-6 py-4 text-sand-600">
                    {coupon.used_count} / {coupon.usage_limit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    {coupon.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sand-400">
                        <X className="w-4 h-4" />
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 hover:text-brand-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-sand-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100">
              <h2 className="font-display text-xl font-bold text-sand-900">
                {editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Kupon Kodu *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="WELCOME10"
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <label className="label">İndirim Tipi *</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="input"
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit (TL)</option>
                </select>
              </div>
              <div>
                <label className="label">İndirim Değeri *</label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="input"
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                />
              </div>
              <div>
                <label className="label">Minimum Sipariş Tutarı (TL)</label>
                <input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Maksimum İndirim Tutarı (TL)</label>
                <input
                  type="number"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  className="input"
                  placeholder="Opsiyonel"
                />
              </div>
              <div>
                <label className="label">Kullanım Limiti</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="input"
                  placeholder="Boş = sınırsız"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Kupon açıklaması"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <label className="text-sm text-sand-700">Aktif</label>
              </div>
            </div>
            <div className="p-6 border-t border-sand-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                İptal
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editingCoupon ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
