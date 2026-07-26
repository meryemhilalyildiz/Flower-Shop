import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Calendar, Tag, Check, X, Image as ImageIcon, PlusCircle, MinusCircle } from 'lucide-react';
import type { Route } from '../types';
import { supabase } from '../supabaseClient';
import type { Bundle, BundleItem, Product } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  navigate: (r: Route) => void;
};

type BundleProductItem = {
  product_id: string;
  quantity: number;
  product?: Product;
};

export default function AdminBundlesPage({ navigate }: Props) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<BundleProductItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    discount_percentage: '',
    is_limited: false,
    stock_quantity: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
    sort_order: '0',
  });

  useEffect(() => {
    loadBundles();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Ürünler yüklenirken hata:', error);
    } else {
      setProducts(data || []);
    }
  };

  const loadBundles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Paketler yüklenirken hata:', error);
    } else {
      setBundles(data || []);
    }
    setLoading(false);
  };

  const calculatePrices = () => {
    const originalPrice = selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const discountPercentage = formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0;
    const bundlePrice = originalPrice * (1 - discountPercentage / 100);
    
    return { originalPrice, bundlePrice, discountPercentage };
  };

  const handleSave = async () => {
    try {
      if (selectedProducts.length === 0) {
        alert('Lütfen en az bir ürün seçin');
        return;
      }

      const { originalPrice, bundlePrice, discountPercentage } = calculatePrices();

      const bundleData = {
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url,
        original_price: originalPrice,
        bundle_price: bundlePrice,
        discount_percentage: discountPercentage,
        is_limited: formData.is_limited,
        stock_quantity: formData.is_limited && formData.stock_quantity 
          ? parseInt(formData.stock_quantity) 
          : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      let bundleId: string;
      if (editingBundle) {
        const { error } = await supabase
          .from('bundles')
          .update(bundleData)
          .eq('id', editingBundle.id);
        if (error) throw error;
        bundleId = editingBundle.id;
        
        // Delete existing bundle items
        await supabase.from('bundle_items').delete().eq('bundle_id', bundleId);
      } else {
        const { data, error } = await supabase.from('bundles').insert([bundleData]).select().single();
        if (error) throw error;
        bundleId = data.id;
      }

      // Insert bundle items
      const bundleItems = selectedProducts.map(item => ({
        bundle_id: bundleId,
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      
      await supabase.from('bundle_items').insert(bundleItems);

      setShowModal(false);
      setEditingBundle(null);
      resetForm();
      loadBundles();
    } catch (error) {
      console.error('Paket kaydedilirken hata:', error);
      alert('Paket kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase.from('bundles').delete().eq('id', id);
    if (error) {
      console.error('Paket silinirken hata:', error);
      alert('Paket silinirken bir hata oluştu');
    } else {
      loadBundles();
    }
  };

  const handleEdit = async (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      image_url: bundle.image_url,
      discount_percentage: bundle.discount_percentage?.toString() || '',
      is_limited: bundle.is_limited,
      stock_quantity: bundle.stock_quantity?.toString() || '',
      valid_from: bundle.valid_from.split('T')[0],
      valid_until: bundle.valid_until?.split('T')[0] || '',
      is_active: bundle.is_active,
      sort_order: bundle.sort_order.toString(),
    });
    
    // Load bundle items
    const { data: bundleItems } = await supabase
      .from('bundle_items')
      .select('*')
      .eq('bundle_id', bundle.id);
    
    if (bundleItems) {
      const itemsWithProducts = bundleItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: products.find(p => p.id === item.product_id),
      }));
      setSelectedProducts(itemsWithProducts);
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      discount_percentage: '',
      is_limited: false,
      stock_quantity: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
      sort_order: '0',
    });
    setSelectedProducts([]);
  };

  const addProductToBundle = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setSelectedProducts([...selectedProducts, { product_id: productId, quantity: 1, product }]);
  };

  const removeProductFromBundle = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.product_id !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(selectedProducts.map(item => 
      item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const { originalPrice, bundlePrice } = calculatePrices();

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Admin', route: { name: 'admin-dashboard' } as Route },
    { label: 'Paketler' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">Kampanyalı Paketler</h1>
          <p className="text-sand-500 mt-2">Paketleri yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBundle(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Paket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={bundle.image_url}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
                {bundle.discount_percentage && (
                  <div className="absolute top-3 left-3 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    %{Math.round(bundle.discount_percentage)} indirim
                  </div>
                )}
                {bundle.is_limited && bundle.stock_quantity !== null && bundle.stock_quantity <= 10 && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Son {bundle.stock_quantity} adet
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sand-900 mb-2 line-clamp-2">{bundle.name}</h3>
                {bundle.description && (
                  <p className="text-sm text-sand-500 mb-3 line-clamp-2">{bundle.description}</p>
                )}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold text-brand-700">{bundle.bundle_price} TL</span>
                  {bundle.original_price > bundle.bundle_price && (
                    <span className="text-sm text-sand-400 line-through">{bundle.original_price} TL</span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    bundle.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-sand-100 text-sand-600'
                  }`}>
                    {bundle.is_active ? (
                      <><Check className="w-3 h-3" /> Aktif</>
                    ) : (
                      <><X className="w-3 h-3" /> Pasif</>
                    )}
                  </span>
                  {bundle.is_limited && (
                    <span className="text-xs text-amber-600">Sınırlı Stok</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(bundle)}
                    className="flex-1 p-2 rounded-lg hover:bg-sand-100 text-sand-600 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(bundle.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-sand-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-sand-100">
              <h2 className="font-display text-xl font-bold text-sand-900">
                {editingBundle ? 'Paket Düzenle' : 'Yeni Paket'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Paket Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Yılbaşı Paketi"
                />
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Paket açıklaması"
                />
              </div>
              <div>
                <label className="label">Görsel URL *</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              {/* Product Selection */}
              <div>
                <label className="label">Ürün Seçimi *</label>
                <select
                  onChange={(e) => e.target.value && addProductToBundle(e.target.value)}
                  className="input"
                  value=""
                >
                  <option value="">Ürün seçin...</option>
                  {products
                    .filter(p => !selectedProducts.find(sp => sp.product_id === p.id))
                    .map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price} TL
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="border border-sand-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sand-900">Seçilen Ürünler</h4>
                  {selectedProducts.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 bg-sand-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sand-900">{item.product?.name}</p>
                        <p className="text-sm text-sand-500">{item.product?.price} TL x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateProductQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 rounded hover:bg-sand-200"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateProductQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 rounded hover:bg-sand-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeProductFromBundle(item.product_id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              {selectedProducts.length > 0 && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sand-600">Orijinal Toplam:</span>
                    <span className="font-semibold text-sand-900">{originalPrice.toFixed(2)} TL</span>
                  </div>
                  <div>
                    <label className="label">İndirim Yüzdesi (%)</label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      className="input"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-brand-700">Paket Fiyatı:</span>
                    <span className="font-bold text-brand-700">{bundlePrice.toFixed(2)} TL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">İndirim:</span>
                    <span className="font-semibold text-green-600">{(originalPrice - bundlePrice).toFixed(2)} TL</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_limited}
                  onChange={(e) => setFormData({ ...formData, is_limited: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <label className="text-sm text-sand-700">Sınırlı Stok</label>
              </div>
              {formData.is_limited && (
                <div>
                  <label className="label">Stok Adedi</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="input"
                    placeholder="50"
                  />
                </div>
              )}
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
                <label className="label">Sıralama</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="input"
                  placeholder="0"
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
                  setEditingBundle(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                İptal
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editingBundle ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
