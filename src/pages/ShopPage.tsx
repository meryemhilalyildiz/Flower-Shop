import { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, X, RefreshCw } from 'lucide-react';
import type { Product, Route, Category } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';
import { supabase } from '../supabaseClient';
import { fetchProductReviewStats } from '../services/adminApi';

type Props = {
  products?: Product[]; // Opsiyonel hale getirdik, DB'den de dolacak
  categories: Category[];
  activeCategorySlug?: string;
  navigate: (r: Route) => void;
  onAddToCart: (p: Product) => void;
  isFavorite: (productId: string) => boolean;
  onToggleFavorite: (p: Product) => void;
};

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export default function ShopPage({ 
  products: initialProducts = [], 
  categories, 
  activeCategorySlug, 
  navigate, 
  onAddToCart, 
  isFavorite, 
  onToggleFavorite 
}: Props) {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sort, setSort] = useState<SortKey>('featured');
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [priceRangeOpen, setPriceRangeOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 🌸 Supabase'den Canlı Ürünleri Çekiyoruz
  const loadShopProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Supabase veri yapısını Product arayüzüne eksiksiz eşliyoruz
        const mappedProducts: Product[] = await Promise.all(data.map(async (p: any) => {
          const imgUrl = p.image || p.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800';
          
          // ⭐ Gerçek yorum istatistiklerini çek
          const reviewStats = await fetchProductReviewStats(p.id);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            description: p.description || '',
            longDescription: p.description || 'Taze ve özenle hazırlanmış çiçek aranjmanı.',
            price: Number(p.price || 0),
            oldPrice: p.original_price ? Number(p.original_price) : undefined,
            image: imgUrl,
            images: [imgUrl],
            categoryId: p.category_id || p.category || 'all',
            category: p.category_id || p.category || 'all',
            rating: reviewStats.averageRating,
            reviewCount: reviewStats.totalReviews,
            reviewsCount: reviewStats.totalReviews,
            stock: Number(p.stock ?? p.stock_quantity ?? 0),
            inStock: Number(p.stock ?? p.stock_quantity ?? 0) > 0,
            badge: p.is_best_seller ? 'Çok Satan' : (p.is_featured ? 'Öne Çıkan' : undefined),
            ingredients: [],
            deliveryInfo: 'Aynı gün teslimat'
          } as Product;
        }));

        setDbProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Mağaza ürünleri çekilirken hata:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadShopProducts();
    // Check for search query from sessionStorage
    const savedSearchQuery = sessionStorage.getItem('searchQuery');
    if (savedSearchQuery) {
      setSearchQuery(savedSearchQuery);
      sessionStorage.removeItem('searchQuery');
    }
  }, []);

  // Prop'tan gelen veya DB'den canlı çekilen ürünleri birleştir
  const allProducts = dbProducts.length > 0 ? dbProducts : initialProducts;

  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)
    : undefined;

  // 🎯 Filtreleme ve Sıralama Mantığı (Orijinal Kod Korundu)
  const filtered = useMemo(() => {
    let list = activeCategory
      ? allProducts.filter((p) => p.categoryId === activeCategory.id || (p as any).category_id === activeCategory.id || (p as any).category === activeCategory.slug)
      : [...allProducts];

    // 🌸 Arama Filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p as any).category?.toLowerCase().includes(query) ||
        p.ingredients.some((ing) => ing.toLowerCase().includes(query))
      );
    }

    if (showInStock) list = list.filter((p) => (p.stock !== undefined ? p.stock > 0 : p.inStock));
    if (showDiscounted) list = list.filter((p) => p.oldPrice !== undefined);
    if (priceRange[0] !== null && priceRange[1] !== null) {
      list = list.filter((p) => p.price >= priceRange[0]! && p.price <= priceRange[1]!);
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        list.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
    }

    return list;
  }, [allProducts, activeCategory, sort, priceRange, showInStock, showDiscounted, searchQuery]);

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Mağaza', route: { name: 'shop' } as Route },
    ...(activeCategory ? [{ label: activeCategory.name }] : []),
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'featured', label: 'Öne Çıkanlar' },
    { key: 'price-asc', label: 'Fiyat: Artan' },
    { key: 'price-desc', label: 'Fiyat: Azalan' },
    { key: 'rating', label: 'En Yüksek Puan' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">
          {searchQuery ? `"${searchQuery}" için sonuçlar` : (activeCategory ? activeCategory.name : 'Tüm Çiçekler')}
        </h1>
        <p className="text-sand-500 mt-2">
          {searchQuery ? `${filtered.length} ürün bulundu` : (activeCategory ? activeCategory.description : 'Taze çiçekler, buketler ve aranjmanlar')}
        </p>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
          >
            Aramayı temizle
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        <button
          onClick={() => navigate({ name: 'shop' })}
          className={`chip whitespace-nowrap cursor-pointer ${
            !activeCategorySlug ? 'bg-brand-600 text-white' : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300'
          }`}
        >
          Tümü ({allProducts.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate({ name: 'shop', categorySlug: cat.slug })}
            className={`chip whitespace-nowrap cursor-pointer ${
              activeCategorySlug === cat.slug ? 'bg-brand-600 text-white' : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${filtersOpen ? 'fixed inset-0 z-50 bg-black/40 lg:bg-transparent lg:relative lg:inset-auto' : 'hidden lg:block'} lg:w-64 flex-shrink-0`}>
          <div className={`${filtersOpen ? 'absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-6 overflow-y-auto lg:relative lg:w-full lg:bg-transparent lg:p-0' : ''}`}>
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-semibold text-sand-800">Filtreler</h3>
              <button onClick={() => setFiltersOpen(false)} className="p-1 rounded-lg hover:bg-sand-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-sand-100 p-5 space-y-6">
              <div>
                <h3 className="font-semibold text-sand-800 text-sm mb-3">Fiyat Aralığı</h3>
                {!priceRangeOpen ? (
                  <button
                    onClick={() => setPriceRangeOpen(true)}
                    className="w-full px-4 py-2 border border-sand-200 rounded-xl text-sand-400 text-sm hover:border-brand-300 transition-colors cursor-pointer"
                  >
                    min - max
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange[0] ?? ''}
                      onChange={(e) => setPriceRange([e.target.value ? Number(e.target.value) : null, priceRange[1]])}
                      className="input text-sm py-2"
                      placeholder="min."
                    />
                    <span className="text-sand-400">—</span>
                    <input
                      type="number"
                      value={priceRange[1] ?? ''}
                      onChange={(e) => setPriceRange([priceRange[0], e.target.value ? Number(e.target.value) : null])}
                      className="input text-sm py-2"
                      placeholder="max."
                    />
                    <button
                      onClick={() => {
                        setPriceRangeOpen(false);
                        setPriceRange([null, null]);
                      }}
                      className="p-2 text-sand-400 hover:text-sand-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInStock}
                    onChange={(e) => setShowInStock(e.target.checked)}
                    className="w-4 h-4 rounded border-sand-300 text-brand-600 focus:ring-brand-400"
                  />
                  <span className="text-sm text-sand-700">Stokta olanlar</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDiscounted}
                    onChange={(e) => setShowDiscounted(e.target.checked)}
                    className="w-4 h-4 rounded border-sand-300 text-brand-600 focus:ring-brand-400"
                  />
                  <span className="text-sm text-sand-700">İndirimli olanlar</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              onClick={() => setFiltersOpen(true)}
              className="btn-secondary lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrele
            </button>
            <p className="text-sm text-sand-500 hidden sm:block">{filtered.length} ürün</p>
            <div className="relative ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="input text-sm py-2.5 pr-10 appearance-none cursor-pointer w-auto"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-sand-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
              <span>Çiçekler yükleniyor...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sand-500 text-lg">Bu kriterlere uygun çiçek bulunamadı.</p>
              <button
                onClick={() => {
                  setPriceRange([null, null]);
                  setShowInStock(false);
                  setShowDiscounted(false);
                }}
                className="btn-secondary mt-4 cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  isFavorite={isFavorite(p.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}