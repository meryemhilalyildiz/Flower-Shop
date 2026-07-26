import { ShoppingCart, Package, Clock, Tag } from 'lucide-react';
import type { Bundle } from '../types';

type Props = {
  bundle: Bundle;
  onAddToCart: (bundle: Bundle) => void;
};

export default function BundleCard({ bundle, onAddToCart }: Props) {
  const discountPercent = bundle.discount_percentage 
    ? Math.round(bundle.discount_percentage) 
    : Math.round(((bundle.original_price - bundle.bundle_price) / bundle.original_price) * 100);

  return (
    <div className="card group hover:shadow-soft transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={bundle.image_url}
          alt={bundle.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            %{discountPercent} indirim
          </div>
        )}

        {/* Limited Stock Badge */}
        {bundle.is_limited && bundle.stock_quantity !== null && bundle.stock_quantity <= 10 && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Son {bundle.stock_quantity} adet
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sand-900 text-lg mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {bundle.name}
        </h3>
        
        {bundle.description && (
          <p className="text-sm text-sand-500 mb-3 line-clamp-2">{bundle.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-brand-700">{bundle.bundle_price} TL</span>
          {bundle.original_price > bundle.bundle_price && (
            <span className="text-sm text-sand-400 line-through">{bundle.original_price} TL</span>
          )}
        </div>

        {/* Bundle Info */}
        <div className="flex items-center gap-2 text-xs text-sand-500 mb-4">
          <Package className="w-4 h-4" />
          <span>Kampanyalı paket</span>
          {bundle.is_limited && (
            <>
              <span>·</span>
              <span className="text-amber-600">Sınırlı stok</span>
            </>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(bundle)}
          disabled={bundle.is_limited && bundle.stock_quantity === 0}
          className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {bundle.is_limited && bundle.stock_quantity === 0 ? 'Tükendi' : 'Sepete Ekle'}
        </button>
      </div>
    </div>
  );
}
