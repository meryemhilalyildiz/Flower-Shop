import { useState } from 'react';
import { Star, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RefreshCw, ChevronLeft, Check } from 'lucide-react';
import type { Product, Route, Category, ProductVariant } from '../types';
import { getCategoryById, products as allProducts } from '../data';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';

type Props = {
  product: Product;
  categories: Category[];
  navigate: (r: Route) => void;
  onAddToCart: (p: Product, qty: number) => void;
};

export default function ProductPage({ product, categories, navigate, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  // 🌸 Supabase'den gelen üründe varyant verisi yoksa bile varsayılan esnek seçenekler sunuyoruz
  const availableSizes: ProductVariant[] = (product.sizes && product.sizes.length > 0)
    ? product.sizes
    : [
        { id: 's1', name: 'Standart Boy', priceDifference: 0 },
        { id: 's2', name: 'Orta Boy', priceDifference: 150 },
        { id: 's3', name: 'Büyük Boy (Deluxe)', priceDifference: 300 },
      ];

  const availableVases: ProductVariant[] = (product.vases && product.vases.length > 0)
    ? product.vases
    : [
        { id: 'v1', name: 'Vazosuz (Buket)', priceDifference: 0 },
        { id: 'v2', name: 'Cam Vazo İle', priceDifference: 100 },
      ];

  // 🌸 State'ler varsayılan ilk seçenekle başlar
  const [selectedSize, setSelectedSize] = useState<ProductVariant | null>(availableSizes[0] || null);
  const [selectedVase, setSelectedVase] = useState<ProductVariant | null>(availableVases[0] || null);

  const category = getCategoryById(product.categoryId, categories);
  const related = allProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  // 💰 Dinamik Hesaplanan Birim Fiyat (Ana Fiyat + Boyut Farkı + Vazo Farkı)
  const currentUnitPrice =
    (product.price || 0) +
    (selectedSize?.priceDifference || 0) +
    (selectedVase?.priceDifference || 0);

    const handleAdd = () => {
      // 1. Seçilen varyant metinlerini topluyoruz
      const variantParts = [];
      if (selectedSize && selectedSize.name) {
        variantParts.push(`Boyut: ${selectedSize.name}`);
      }
      if (selectedVase && selectedVase.name) {
        variantParts.push(`Vazo: ${selectedVase.name}`);
      }
  
      const variantText = variantParts.join(' | ');
  
      // 2. Benzersiz ID ve tam ürün adını oluşturuyoruz
      const uniqueId = variantText 
        ? `${product.id}-${selectedSize?.id || 's'}-${selectedVase?.id || 'v'}` 
        : product.id;
  
      // Ürün adını garantiye alıyoruz (product.name yoksa varsayılan isim)
      const rawName = product.name || 'Çiçek Ürünü';
      const finalName = variantText ? `${rawName} (${variantText})` : rawName;
  
      const customizedProduct: Product = {
        ...product,
        id: uniqueId,
        name: finalName,
        price: currentUnitPrice, // Varyant farkı dahil 1050 TL
      };
  
      onAddToCart(customizedProduct, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    };
    
    const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Mağaza', route: { name: 'shop' } as Route },
    ...(category ? [{ label: category.name, route: { name: 'shop', categorySlug: category.slug } as Route }] : []),
    { label: product.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <button
        onClick={() => navigate(category ? { name: 'shop', categorySlug: category.slug } : { name: 'shop' })}
        className="flex items-center gap-1 text-sm text-sand-500 hover:text-brand-600 mt-4 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="animate-scale-in">
          <div className="rounded-3xl overflow-hidden shadow-soft aspect-square bg-sand-100">
            <img
              src={product.images && product.images.length > 0 ? product.images[activeImage] : ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === i ? 'border-brand-500 ring-2 ring-brand-200' : 'border-sand-200 hover:border-brand-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            {product.badge && (
              <span className="chip bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="chip bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                %{discount} indirim
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">{product.name}</h1>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i <= Math.round(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-sand-200'}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-sand-700">{product.rating || 5.0}</span>
            <span className="text-sm text-sand-400">· {product.reviewCount || 0} değerlendirme</span>
          </div>

          <p className="text-sand-600 mt-4 leading-relaxed">{product.description}</p>

          {/* DİNANİK FİYAT ALANI */}
          <div className="flex items-end gap-3 mt-6">
            <span className="text-3xl font-bold text-brand-700">{currentUnitPrice} TL</span>
            {product.oldPrice && (
              <span className="text-lg text-sand-400 line-through mb-1">{product.oldPrice} TL</span>
            )}
            {(selectedSize?.priceDifference || selectedVase?.priceDifference) ? (
              <span className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-medium mb-1">
                Varyant farkı dahil
              </span>
            ) : null}
          </div>

          {/* 📏 1. BOYUT VARYANTI SEÇİMİ */}
          {availableSizes.length > 0 && (
            <div className="mt-6 space-y-2">
              <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider">
                📏 Boyut Seçimi
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-xs'
                          : 'border-sand-200 hover:border-brand-300 text-sand-700 bg-white'
                      }`}
                    >
                      {size.name} {size.priceDifference > 0 && `(+${size.priceDifference} TL)`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🏺 2. VAZO VARYANTI SEÇİMİ */}
          {availableVases.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider">
                🏺 Vazo Tercihi
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVases.map((vase) => {
                  const isSelected = selectedVase?.id === vase.id;
                  return (
                    <button
                      key={vase.id}
                      type="button"
                      onClick={() => setSelectedVase(vase)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-xs'
                          : 'border-sand-200 hover:border-brand-300 text-sand-700 bg-white'
                      }`}
                    >
                      {vase.name} {vase.priceDifference > 0 && `(+${vase.priceDifference} TL)`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-1 bg-sand-100 rounded-full p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors cursor-pointer"
                aria-label="Azalt"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-sand-800">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-sand-200 transition-colors cursor-pointer"
                aria-label="Artır"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className={`btn-primary flex-1 cursor-pointer py-3.5 rounded-full font-semibold transition-all shadow-md flex items-center justify-center gap-2 ${
                added ? 'bg-leaf-600 hover:bg-leaf-600' : ''
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Sepete Eklendi
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Sepete Ekle ({currentUnitPrice * quantity} TL)
                </>
              )}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: Truck, title: 'Hızlı Teslimat', desc: product.deliveryInfo || 'Aynı gün teslimat' },
              { icon: ShieldCheck, title: 'Tazelik', desc: '7 gün garanti' },
              { icon: RefreshCw, title: 'Kolay İade', desc: '14 gün iade' },
            ].map((item) => (
              <div key={item.title} className="bg-sand-50 rounded-xl p-3 text-center">
                <item.icon className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-sand-800">{item.title}</p>
                <p className="text-xs text-sand-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long description & ingredients */}
      <div className="grid lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2">
          <h2 className="font-display text-2xl font-bold text-sand-900 mb-4">Ürün Detayları</h2>
          <p className="text-sand-600 leading-relaxed">{product.longDescription || product.description}</p>
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-sand-900 mb-4">İçindekiler</h3>
          <ul className="space-y-2">
            {(product.ingredients || ['Taze Çiçekler', 'Özel Ambalaj']).map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sand-700">
                <span className="w-2 h-2 rounded-full bg-brand-400" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-sand-900 mb-6">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={(prod) => onAddToCart(prod, 1)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}