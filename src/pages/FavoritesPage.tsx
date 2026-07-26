import { Heart, ShoppingBag, Star, Trash2 } from 'lucide-react';
import type { Product, Route } from '../types';
import { routeToHash } from '../router';
import Breadcrumbs from '../components/Breadcrumbs';

type Props = {
  products: Product[];
  favoriteIds: Set<string>;
  navigate: (r: Route) => void;
  onAddToCart: (p: Product) => void;
  onToggleFavorite: (p: Product) => void;
};

export default function FavoritesPage({ products, favoriteIds, navigate, onAddToCart, onToggleFavorite }: Props) {
  const favoriteProducts = products.filter((p) => favoriteIds.has(p.id));

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'Favorilerim' },
  ];

  if (favoriteProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
        <Breadcrumbs items={crumbs} />

        <div className="mt-8 text-center">
          <div className="w-20 h-20 bg-pink-50 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-sand-800 mb-2">Favorileriniz Boş</h2>
          <p className="text-sand-500 mb-6 max-w-md mx-auto">
            Henüz favorilere ürün eklemediniz. Beğendiğiniz çiçekleri kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
          </p>
          <button
            onClick={() => navigate({ name: 'shop' })}
            className="btn-primary group"
          >
            <span>Çiçekleri Keşfet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-sand-900">
          Favorilerim
        </h1>
        <p className="text-sand-500 mt-2">
          {favoriteProducts.length} ürün favorinizde
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteProducts.map((product) => (
          <div
            key={product.id}
            className="card group hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
          >
            <a href={routeToHash({ name: 'product', slug: product.slug })} className="block relative overflow-hidden">
              <div className="aspect-[4/5] overflow-hidden bg-sand-100">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite(product);
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all"
                aria-label="Favorilerden çıkar"
                title="Favorilerden çıkar"
              >
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              </button>
            </a>

            <div className="p-4">
              <a href={routeToHash({ name: 'product', slug: product.slug })}>
                <h3 className="font-semibold text-sand-800 group-hover:text-brand-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-sand-500 mt-1 line-clamp-1">{product.description}</p>
              </a>

              <div className="flex items-center gap-1 mt-2">
                {product.reviewCount > 0 ? (
                  <>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-sand-700">{product.rating}</span>
                    <span className="text-xs text-sand-400">({product.reviewCount})</span>
                  </>
                ) : (
                  <span className="text-xs text-sand-400">Henüz yorum yok</span>
                )}
              </div>

              <div className="flex items-end justify-between mt-3">
                <div className="flex flex-col">
                  {product.oldPrice && (
                    <span className="text-xs text-sand-400 line-through">{product.oldPrice} TL</span>
                  )}
                  <span className="text-lg font-bold text-brand-700">{product.price} TL</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all shadow-glow"
                    aria-label="Sepete ekle"
                    title="Sepete ekle"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite(product)}
                    className="w-9 h-9 rounded-full bg-sand-100 text-red-500 flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all"
                    aria-label="Favorilerden çıkar"
                    title="Favorilerden çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
