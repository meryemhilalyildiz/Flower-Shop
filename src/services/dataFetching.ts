import { apiService } from './api';
import { transformApiProducts, transformApiCategories, transformApiDistricts } from './dataAdapter';
import type { Category, Product } from '../types';

// Cache for data
let productsCache: Product[] | null = null;
let categoriesCache: Category[] | null = null;
let districtsCache: any[] | null = null;

// Fetch products from API
export async function fetchProducts(): Promise<Product[]> {
  if (productsCache) {
    return productsCache;
  }

  try {
    const apiProducts = await apiService.getProducts();
    productsCache = transformApiProducts(apiProducts);
    return productsCache;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Fetch categories from API
export async function fetchCategories(): Promise<Category[]> {
  if (categoriesCache) {
    return categoriesCache;
  }

  try {
    const apiCategories = await apiService.getCategories();
    categoriesCache = transformApiCategories(apiCategories);
    return categoriesCache;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Fetch districts from API
export async function fetchDistricts() {
  if (districtsCache) {
    return districtsCache;
  }

  try {
    const apiDistricts = await apiService.getDistricts();
    districtsCache = transformApiDistricts(apiDistricts);
    return districtsCache;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
}

// Clear cache (useful for testing or refresh)
export function clearDataCache() {
  productsCache = null;
  categoriesCache = null;
  districtsCache = null;
}

// Helper functions that work with API data
export function getCategoryBySlug(slug: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getProductBySlug(slug: string, products: Product[]): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categoryId: string, products: Product[]): Product[] {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getFeaturedProducts(products: Product[]): Product[] {
  // For now, return first 4 products as featured
  // This could be enhanced with backend logic
  return products.slice(0, 4);
}

export function getDiscountedProducts(products: Product[]): Product[] {
  // For now, return products with lower stock as "discounted"
  // This could be enhanced with backend logic
  return products.filter((p) => p.inStock).slice(0, 4);
}
