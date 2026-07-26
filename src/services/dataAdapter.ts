import type { Category, Product } from '../types';
import type { ApiProduct, ApiCategory, ApiDistrict } from './api';

// Transform API Product to Frontend Product
export function transformApiProduct(apiProduct: any): Product {
  // 🌸 Supabase'deki 'stock_quantity' kolonunu öncelikle okuyoruz
  const stockCount = apiProduct.stock_quantity ?? apiProduct.stockQuantity ?? apiProduct.stock ?? 0;
  
  // Stok adedi 0'dan büyükse stokta kabul et
  const isAvailable = (apiProduct.is_active !== false) && (Number(stockCount) > 0);

  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    slug: generateSlug(apiProduct.name),
    categoryId: (apiProduct.categoryId ?? apiProduct.category_id ?? '').toString(),
    price: apiProduct.price,
    images: apiProduct.imageUrl ? [apiProduct.imageUrl] : (apiProduct.images ?? ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600']),
    description: apiProduct.description ?? apiProduct.name,
    longDescription: apiProduct.longDescription ?? `${apiProduct.name} - Tazelik skoru: ${apiProduct.freshnessScore ?? 10}/10`,
    ingredients: apiProduct.ingredients ?? [],
    rating: apiProduct.freshnessScore ? apiProduct.freshnessScore / 2 : 4.5,
    reviewCount: apiProduct.reviewCount ?? 0,
    inStock: isAvailable,
    deliveryInfo: isAvailable ? 'Stokta' : 'Stokta yok',
    stock: Number(stockCount),
    stock_quantity: Number(stockCount),
  } as Product;
}

// Transform API Category to Frontend Category
export function transformApiCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory.id.toString(),
    name: apiCategory.name,
    slug: generateSlug(apiCategory.name),
    description: apiCategory.description,
    image: 'https://images.pexels.com/photos/931796/pexels-photo-931796.jpeg?auto=compress&cs=tinysrgb&w=600',
    icon: 'Flower2',
  };
}

// Transform API District to frontend format
export function transformApiDistrict(apiDistrict: ApiDistrict) {
  return {
    id: apiDistrict.id,
    name: apiDistrict.name,
    deliveryFee: apiDistrict.baseDeliveryFee,
  };
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Transform array of API products
export function transformApiProducts(apiProducts: ApiProduct[]): Product[] {
  return apiProducts.map(transformApiProduct);
}

// Transform array of API categories
export function transformApiCategories(apiCategories: ApiCategory[]): Category[] {
  return apiCategories.map(transformApiCategory);
}

// Transform array of API districts
export function transformApiDistricts(apiDistricts: ApiDistrict[]) {
  return apiDistricts.map(transformApiDistrict);
}
