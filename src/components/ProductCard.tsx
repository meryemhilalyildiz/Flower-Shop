import { Star, Plus, Heart } from 'lucide-react';
import type { Product } from '../types';
import { routeToHash } from '../router';

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

const badgeStyles: Record<string, string> = {
  'Yeni': 'bg-leaf-100 text-leaf-700',
  'Çok Satan': 'bg-brand-100 text-brand-700',
  'İndirim': 'bg-amber-100 text-amber-700',
  'Mevsimlik': 'bg-sky-100 text-sky-700',
};

export default function ProductCard({ product, onAddToCart }: Props) {
  // 🌸 STOK KONTROLÜ
  const isOutOfStock = !product.inStock;

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className={`card group hover:shadow-soft hover:-translate-y-1 transition-all duration-300 ${isOutOfStock ? 'opacity-85' : ''}`}>
      <a href={routeToHash({ name: 'product', slug: product.slug })} className="block relative overflow-hidden">
        <div className="aspect-[4/5] overflow-hidden bg-sand-100 relative">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isOutOfStock ? 'grayscale opacity-60' : 'group-hover:scale-105'
            }`}
          />

          {/* 🔴 STOK BİTTİ (OUT OF STOCK) OVERLAY & ROZETİ */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-sand-900/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                Tükendi
              </span>
            </div>
          )}
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          {product.badge && !isOutOfStock && (
            <span className={`chip text-xs ${badgeStyles[product.badge]}`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && !isOutOfStock && (
            <span className="chip text-xs bg-red-500 text-white">%{discount} indirim</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-brand-50 hover:scale-110 transition-all z-20"
          aria-label="Favorilere ekle"
        >
          <Heart className="w-4 h-4 text-brand-500" />
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
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-sand-700">{product.rating}</span>
          <span className="text-xs text-sand-400">({product.reviewCount})</span>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-sand-400 line-through">{product.oldPrice} TL</span>
            )}
            <span className="text-lg font-bold text-brand-700">{product.price} TL</span>
          </div>

          {/* 🛒 SEPETE EKLE VEYA STOK YOK BUTONU */}
          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`h-10 px-3 rounded-full flex items-center justify-center transition-all shadow-glow ${
              isOutOfStock
                ? 'bg-sand-200 text-sand-400 cursor-not-allowed text-xs font-semibold'
                : 'w-10 bg-brand-600 text-white hover:bg-brand-700 hover:scale-110 active:scale-95'
            }`}
            aria-label="Sepete ekle"
          >
            {isOutOfStock ? (
              <span>Stok Yok</span>
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}