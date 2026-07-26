import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Check, X, Copy, CopyCheck } from 'lucide-react';
import type { Route, Coupon } from '../types';
import { fetchAllCoupons, addCoupon, updateCoupon, deleteCoupon } from '../services/adminApi';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  navigate: (r: Route) => void;
};

type FormState = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  usage_limit: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  description: string;
};

const emptyForm: FormState = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  is_active: true,
  description: '',
};

export default function AdminCouponsPage({ navigate }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Kuponlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData(emptyForm);

  const openNewModal = () => {
    setEditingCoupon(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
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
      is_active: coupon.is_active,
      description: coupon.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      alert('Lütfen bir kupon kodu girin');
      return;
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      alert('Lütfen geçerli bir indirim değeri girin');
      return;
    }

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_active: formData.is_active,
        description: formData.description.trim() || null,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
      } else {
        await addCoupon(payload);
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('Kupon kaydedilirken hata:', error);
      alert(error?.message || 'Kupon kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteCoupon(id);
      loadCoupons();
    } catch (error) {
      console.error('Kupon silinirken hata:', error);
      alert('Kupon silinirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      loadCoupons();
    } catch (error) {
      console.error('Kupon durumu güncellenirken hata:', error);
    }
  };

  const handleCopyCode = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Admin', route: { name: 'admin-dashboard' } as Route },
    { label: 'Kuponlar' },
  ];

  const formatDiscount = (coupon: Coupon) =>
    coupon.discount_type === 'percentage' ? `%${coupon.discount_value}` : `${coupon.discount_value} TL`;

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('tr-TR');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Kupon Yönetimi</h1>
          <p className="text-sand-500 mt-2">İndirim kuponlarını oluşturun ve yönetin</p>
        </div>
        <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Yeni Kupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="card p-12 text-center text-sand-500">
          <Tag className="w-10 h-10 mx-auto mb-3 text-sand-300" />
          Henüz kupon eklenmemiş.
        </div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-sand-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Kod</th>
                <th className="text-left px-4 py-3 font-semibold">İndirim</th>
                <th className="text-left px-4 py-3 font-semibold">Min. Sipariş</th>
                <th className="text-left px-4 py-3 font-semibold">Kullanım</th>
                <th className="text-left px-4 py-3 font-semibold">Geçerlilik</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-4 py-3 font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-sand-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sand-900">{coupon.code}</span>
                      <button
                        onClick={() => handleCopyCode(coupon)}
                        className="p-1 rounded hover:bg-sand-200 text-sand-500"
                        title="Kodu kopyala"
                      >
                        {copiedId === coupon.id ? (
                          <CopyCheck className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-sand-400 mt-0.5 line-clamp-1">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-700">{formatDiscount(coupon)}</td>
                  <td className="px-4 py-3 text-sand-600">
                    {coupon.min_order_amount > 0 ? `${coupon.min_order_amount} TL` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sand-600">
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sand-600 whitespace-nowrap">
                    {formatDate(coupon.valid_from)} – {formatDate(coupon.valid_until)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        coupon.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                      }`}
                    >
                      {coupon.is_active ? (
                        <>
                          <Check className="w-3 h-3" /> Aktif
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" /> Pasif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 hover:text-brand-600 transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-sand-600 hover:text-red-600 transition-colors"
                        title="Sil"
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
                  className="input font-mono"
                  placeholder="YAZKAMPANYA25"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">İndirim Tipi *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="input"
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit Tutar (TL)</option>
                  </select>
                </div>
                <div>
                  <label className="label">İndirim Değeri *</label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="input"
                    placeholder={formData.discount_type === 'percentage' ? '25' : '50'}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min. Sipariş Tutarı</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Maks. İndirim Tutarı</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    className="input"
                    placeholder="Sınırsız"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="label">Kullanım Limiti</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="input"
                  placeholder="Sınırsız"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Başlangıç Tarihi</label>
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
                  placeholder="Kupon açıklaması (opsiyonel)"
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
