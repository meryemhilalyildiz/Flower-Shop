import { Star, Plus, Heart, Tag } from 'lucide-react';
import type { Product, Bundle } from '../types';
import { routeToHash } from '../router';

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
  bundleDiscount?: { bundlePrice: number; originalPrice: number; discountPercent: number };
};

const badgeStyles: Record<string, string> = {
  'Yeni': 'bg-leaf-100 text-leaf-700',
  'Çok Satan': 'bg-brand-100 text-brand-700',
  'İndirim': 'bg-amber-100 text-amber-700',
  'Mevsimlik': 'bg-sky-100 text-sky-700',
};

export default function ProductCard({ product, onAddToCart, bundleDiscount }: Props) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const displayPrice = bundleDiscount ? bundleDiscount.bundlePrice : product.price;
  const displayOldPrice = bundleDiscount ? bundleDiscount.originalPrice : product.oldPrice;
  const displayDiscountPercent = bundleDiscount ? bundleDiscount.discountPercent : discount;

  return (
    <div className="card group hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
      <a href={routeToHash({ name: 'product', slug: product.slug })} className="block relative overflow-hidden">
        <div className="aspect-[4/5] overflow-hidden bg-sand-100">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className={`chip text-xs ${badgeStyles[product.badge]}`}>
              {product.badge}
            </span>
          )}
          {displayDiscountPercent > 0 && (
            <span className="chip text-xs bg-red-500 text-white flex items-center gap-1">
              <Tag className="w-3 h-3" />
              %{displayDiscountPercent} indirim
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-brand-50 hover:scale-110 transition-all"
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
            {displayOldPrice && displayOldPrice > displayPrice && (
              <span className="text-xs text-sand-400 line-through">{displayOldPrice} TL</span>
            )}
            <span className="text-lg font-bold text-brand-700">{displayPrice} TL</span>
            {bundleDiscount && (
              <span className="text-xs text-rose-600 font-medium">Paket Fiyatı</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all shadow-glow"
            aria-label="Sepete ekle"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
