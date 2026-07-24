import type { Category, Product } from '../types';
import type { ApiProduct, ApiCategory, ApiDistrict } from './api';

// Transform API Product to Frontend Product
export function transformApiProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    slug: generateSlug(apiProduct.name),
    categoryId: apiProduct.categoryId.toString(),
    price: apiProduct.price,
    images: [apiProduct.imageUrl],
    description: apiProduct.name,
    longDescription: `${apiProduct.name} - Tazelik skoru: ${apiProduct.freshnessScore}/10, Vazo ömrü: ${apiProduct.defaultVaseLifeDays} gün`,
    ingredients: [],
    rating: apiProduct.freshnessScore / 2, // Convert 10-point scale to 5-point
    reviewCount: 0,
    inStock: apiProduct.stock > 0,
    deliveryInfo: apiProduct.stock > 0 ? 'Stokta' : 'Stokta yok',
  };
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
