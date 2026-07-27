import type { Category, Product, OrderInfo } from '../types';
import type { ApiProduct, ApiCategory, ApiDistrict } from './api';

// Transform API Product to Frontend Product
export function transformApiProduct(apiProduct: any): Product {
  // 🌸 Supabase'deki 'stock_quantity' kolonunu okuyoruz
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
    rating: 0,
    reviewCount: 0,
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

// 🌸 Transform API Order to Frontend OrderInfo (Kargo Takip No Eklendi!)
export function transformApiOrder(apiOrder: any): OrderInfo {
  return {
    id: apiOrder.id,
    createdAt: apiOrder.created_at || apiOrder.createdAt || new Date().toISOString(),
    recipientName: apiOrder.recipient_name || apiOrder.recipientName || 'Belirtilmemiş',
    recipientPhone: apiOrder.recipient_phone || apiOrder.recipientPhone || '',
    address: apiOrder.shipping_address || apiOrder.address || 'Belirtilmemiş',
    shipping_address: apiOrder.shipping_address || apiOrder.address || 'Belirtilmemiş',
    city: apiOrder.city || '',
    deliveryDate: apiOrder.delivery_date || apiOrder.deliveryDate || '',
    note: apiOrder.note || '',
    total: Number(apiOrder.total_amount || apiOrder.total || 0),
    status: apiOrder.status,
    // 🚚 Kargo Takip Numarası Eşleştirmesi:
    tracking_number: apiOrder.tracking_number || apiOrder.trackingNumber || undefined,
    items: (apiOrder.order_items || apiOrder.items || []).map((item: any) => ({
      product: item.product ? transformApiProduct(item.product) : {
        id: item.product_id || item.productId || '1',
        name: item.product_name || item.name || 'Çiçek Ürünü',
        price: item.unit_price || item.price || 0,
        images: item.image_url ? [item.image_url] : ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600'],
      } as Product,
      quantity: item.quantity || 1,
    })),
  };
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Transform array helpers
export function transformApiProducts(apiProducts: ApiProduct[]): Product[] {
  return apiProducts.map(transformApiProduct);
}

export function transformApiCategories(apiCategories: ApiCategory[]): Category[] {
  return apiCategories.map(transformApiCategory);
}

export function transformApiDistricts(apiDistricts: ApiDistrict[]) {
  return apiDistricts.map(transformApiDistrict);
}

export function transformApiOrders(apiOrders: any[]): OrderInfo[] {
  return apiOrders.map(transformApiOrder);
}