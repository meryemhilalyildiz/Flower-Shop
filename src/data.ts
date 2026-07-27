import type { Category, Product } from './types';
import { fetchProducts, fetchCategories, fetchDistricts } from './services/dataFetching';

// Re-export data fetching functions
export {
  fetchProducts,
  fetchCategories,
  fetchDistricts,
  getCategoryBySlug,
  getCategoryById,
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  getDiscountedProducts,
  clearDataCache,
} from './services/dataFetching';