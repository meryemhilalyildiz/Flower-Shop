import { useState, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import type { Product, Route, Category } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  products: Product[];
  categories: Category[];
  activeCategorySlug?: string;
  navigate: (r: Route) => void;
  onAddToCart: (p: Product) => void;
};

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export default function ShopPage({ products, categories, activeCategorySlug, navigate, onAddToCart }: Props) {
  const [sort, setSort] = useState<SortKey>('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)
    : undefined;

  const filtered = useMemo(() => {
    let list = activeCategory
      ? products.filter((p) => p.categoryId === activeCategory.id)
      : [...products];

    if (showInStock) list = list.filter((p) => p.inStock);
    if (showDiscounted) list = list.filter((p) => p.oldPrice !== undefined);
    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

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
  }, [products, activeCategory, sort, priceRange, showInStock, showDiscounted]);

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
          {activeCategory ? activeCategory.name : 'Tüm Çiçekler'}
        </h1>
        <p className="text-sand-500 mt-2">
          {activeCategory ? activeCategory.description : 'Taze çiçekler, buketler ve aranjmanlar'}
        </p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        <button
          onClick={() => navigate({ name: 'shop' })}
          className={`chip whitespace-nowrap ${
            !activeCategorySlug ? 'bg-brand-600 text-white' : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300'
          }`}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate({ name: 'shop', categorySlug: cat.slug })}
            className={`chip whitespace-nowrap ${
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
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="input text-sm py-2"
                    placeholder="Min"
                  />
                  <span className="text-sand-400">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="input text-sm py-2"
                    placeholder="Max"
                  />
                </div>
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

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sand-500 text-lg">Bu kriterlere uygun çiçek bulunamadı.</p>
              <button
                onClick={() => {
                  setPriceRange([0, 1000]);
                  setShowInStock(false);
                  setShowDiscounted(false);
                }}
                className="btn-secondary mt-4"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
