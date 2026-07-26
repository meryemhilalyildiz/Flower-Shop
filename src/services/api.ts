import { supabase } from '../supabaseClient';
import type { Coupon, SalesAnalytics, ProductSalesAnalytics, CategorySalesAnalytics, CouponAnalytics } from '../types';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5177/api';

// Types
export interface ApiProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  freshnessScore: number;
  imageUrl: string;
  categoryId: number;
  defaultVaseLifeDays: number;
  category?: ApiCategory;
}

export interface ApiCategory {
  id: number;
  name: string;
  description: string;
  products?: ApiProduct[];
}

export interface ApiDistrict {
  id: number;
  name: string;
  baseDeliveryFee: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  address: string;
  districtId: number;
  items: CreateOrderItem[];
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface OrderResponse {
  message: string;
  orderId: number;
  customerName: string;
  districtName: string;
  subTotal: number;
  deliveryFee: number;
  grandTotal: number;
  orderStatus: string;
  orderDate: string;
}

export interface WikiNote {
  id: number;
  productId: number;
  category: string;
  title: string;
  content: string;
  createdAt: string;
}

// 🌸 Admin: Tüm kullanıcıların siparişlerini çekme fonksiyonu
export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Siparişler çekilirken hata oluştu:', error);
    throw error;
  }

  return data;
}

// 🌸 Admin: Sipariş durumunu güncelleme fonksiyonu
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select();

  if (error) {
    console.error('Sipariş durumu güncellenirken hata oluştu:', error);
    throw error;
  }

  return data;
}

// 🌸 Admin: Yeni Ürün Ekle
export async function addProduct(productData: any) {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select();

  if (error) {
    console.error('Ürün eklenirken hata oluştu:', error);
    throw error;
  }
  return data;
}

// 🌸 Admin: Ürün Güncelle (Fiyat, Stok vb.)
export async function updateProduct(productId: string, updates: any) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select();

  if (error) {
    console.error('Ürün güncellenirken hata oluştu:', error);
    throw error;
  }
  return data;
}

// 🌸 Admin: Ürün Sil
export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Ürün silinirken hata oluştu:', error);
    throw error;
  }
}

// 🌸 Kupon Servisi
export async function validateCoupon(code: string, orderTotal: number): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Kupon doğrulanırken hata:', error);
    return null;
  }

  // Kupon geçerlilik kontrolleri
  const now = new Date();
  const validFrom = new Date(data.valid_from);
  const validUntil = data.valid_until ? new Date(data.valid_until) : null;

  if (validFrom > now) {
    console.error('Kupon henüz geçerli değil');
    return null;
  }

  if (validUntil && validUntil < now) {
    console.error('Kupon süresi dolmuş');
    return null;
  }

  if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
    console.error('Kupon kullanım limiti dolmuş');
    return null;
  }

  if (orderTotal < data.min_order_amount) {
    console.error('Minimum sipariş tutarı karşılanmıyor');
    return null;
  }

  return data;
}

export async function applyCoupon(couponId: string): Promise<void> {
  // First get current count
  const { data: coupon } = await supabase
    .from('coupons')
    .select('used_count')
    .eq('id', couponId)
    .single();

  if (!coupon) {
    console.error('Kupon bulunamadı');
    throw new Error('Kupon bulunamadı');
  }

  // Then increment
  const { error } = await supabase
    .from('coupons')
    .update({ used_count: coupon.used_count + 1 })
    .eq('id', couponId);

  if (error) {
    console.error('Kupon kullanılırken hata:', error);
    throw error;
  }
}

export function calculateDiscount(coupon: Coupon, orderTotal: number): number {
  let discount = 0;

  if (coupon.discount_type === 'percentage') {
    discount = (orderTotal * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  // Maksimum indirim tutarı kontrolü
  if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
    discount = coupon.max_discount_amount;
  }

  return Math.round(discount * 100) / 100; // 2 ondalık basamağa yuvarla
}

// 🌸 Satış Analitik Servisi (Mevcut siparişlerden hesaplanır)
export async function getSalesAnalytics(startDate: string, endDate: string): Promise<SalesAnalytics[]> {
  // Önce mevcut siparişleri çek
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: true });

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  // Siparişleri günlere göre grupla
  const dailyData: Record<string, SalesAnalytics> = {};

  orders?.forEach(order => {
    const date = order.created_at.split('T')[0];
    
    if (!dailyData[date]) {
      dailyData[date] = {
        id: date,
        date,
        total_orders: 0,
        total_revenue: 0,
        average_order_value: 0,
        unique_customers: 0,
        coupon_usage: 0,
        coupon_discount_total: 0,
        created_at: order.created_at,
        updated_at: order.created_at,
      };
    }

    dailyData[date].total_orders += 1;
    dailyData[date].total_revenue += order.total || 0;
    
    if (order.coupon_code) {
      dailyData[date].coupon_usage += 1;
      dailyData[date].coupon_discount_total += order.discount_amount || 0;
    }
  });

  // Ortalama sipariş değeri ve benzersiz müşteri sayısını hesapla
  Object.values(dailyData).forEach(data => {
    data.average_order_value = data.total_orders > 0 ? data.total_revenue / data.total_orders : 0;
    // Benzersiz müşteri sayısı için customer_email kullanabiliriz
    const uniqueCustomers = new Set(
      orders?.filter(o => o.created_at.startsWith(data.date)).map(o => o.customer_email)
    );
    data.unique_customers = uniqueCustomers.size;
  });

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getProductSalesAnalytics(startDate: string, endDate: string): Promise<ProductSalesAnalytics[]> {
  // Mevcut siparişlerden ürün satışlarını hesapla
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59');

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  const productData: Record<string, ProductSalesAnalytics> = {};

  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const key = `${item.product_id}_${order.created_at.split('T')[0]}`;
      
      if (!productData[key]) {
        productData[key] = {
          id: key,
          product_id: item.product_id,
          product_name: item.product_name || 'Bilinmeyen Ürün',
          date: order.created_at.split('T')[0],
          quantity_sold: 0,
          revenue: 0,
          created_at: order.created_at,
          updated_at: order.created_at,
        };
      }

      productData[key].quantity_sold += item.quantity;
      productData[key].revenue += item.price * item.quantity;
    });
  });

  return Object.values(productData).sort((a, b) => b.revenue - a.revenue);
}

export async function getCategorySalesAnalytics(startDate: string, endDate: string): Promise<CategorySalesAnalytics[]> {
  // Mevcut siparişlerden kategori satışlarını hesapla
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59');

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  const categoryData: Record<string, CategorySalesAnalytics> = {};

  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const categoryId = item.products?.category_id || 'uncategorized';
      const categoryName = item.products?.category_name || 'Diğer';
      const key = `${categoryId}_${order.created_at.split('T')[0]}`;
      
      if (!categoryData[key]) {
        categoryData[key] = {
          id: key,
          category_id: categoryId,
          category_name: categoryName,
          date: order.created_at.split('T')[0],
          total_orders: 0,
          total_revenue: 0,
          created_at: order.created_at,
          updated_at: order.created_at,
        };
      }

      categoryData[key].total_orders += 1;
      categoryData[key].total_revenue += item.price * item.quantity;
    });
  });

  return Object.values(categoryData).sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function getCouponAnalytics(startDate: string, endDate: string): Promise<CouponAnalytics[]> {
  // Mevcut siparişlerden kupon kullanımını hesapla
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .not('coupon_code', 'is', null);

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  const couponData: Record<string, CouponAnalytics> = {};

  orders?.forEach(order => {
    if (!order.coupon_code) return;
    
    const key = `${order.coupon_code}_${order.created_at.split('T')[0]}`;
    
    if (!couponData[key]) {
      couponData[key] = {
        id: key,
        coupon_id: order.coupon_code, // Using coupon_code as coupon_id for now
        coupon_code: order.coupon_code,
        date: order.created_at.split('T')[0],
        usage_count: 0,
        discount_total: 0,
        revenue_generated: 0,
        created_at: order.created_at,
        updated_at: order.created_at,
      };
    }

    couponData[key].usage_count += 1;
    couponData[key].discount_total += order.discount_amount || 0;
    couponData[key].revenue_generated += order.total || 0;
  });

  return Object.values(couponData).sort((a, b) => b.usage_count - a.usage_count);
}

export async function getTopSellingProducts(limit: number = 10): Promise<ProductSalesAnalytics[]> {
  // Mevcut siparişlerden en çok satan ürünleri hesapla
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};

  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (!productSales[item.product_id]) {
        productSales[item.product_id] = {
          quantity: 0,
          revenue: 0,
          name: item.product_name || 'Bilinmeyen Ürün',
        };
      }
      productSales[item.product_id].quantity += item.quantity;
      productSales[item.product_id].revenue += item.price * item.quantity;
    });
  });

  const result = Object.entries(productSales)
    .map(([product_id, data]) => ({
      id: product_id,
      product_id,
      product_name: data.name,
      date: new Date().toISOString().split('T')[0],
      quantity_sold: data.quantity,
      revenue: data.revenue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, limit);

  return result;
}

export async function getTopSellingCategories(limit: number = 10): Promise<CategorySalesAnalytics[]> {
  // Mevcut siparişlerden en çok satan kategorileri hesapla
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .order('created_at', { ascending: false })
    .limit(100);

  if (ordersError) {
    console.error('Siparişler çekilirken hata:', ordersError);
    throw ordersError;
  }

  const categorySales: Record<string, { orders: number; revenue: number; name: string }> = {};

  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      const categoryId = item.products?.category_id || 'uncategorized';
      const categoryName = item.products?.category_name || 'Diğer';
      
      if (!categorySales[categoryId]) {
        categorySales[categoryId] = {
          orders: 0,
          revenue: 0,
          name: categoryName,
        };
      }
      categorySales[categoryId].orders += 1;
      categorySales[categoryId].revenue += item.price * item.quantity;
    });
  });

  const result = Object.entries(categorySales)
    .map(([category_id, data]) => ({
      id: category_id,
      category_id,
      category_name: data.name,
      date: new Date().toISOString().split('T')[0],
      total_orders: data.orders,
      total_revenue: data.revenue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);

  return result;
}

// API Service
class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Products
  async getProducts(): Promise<ApiProduct[]> {
    return this.request<ApiProduct[]>('/products');
  }

  async getProduct(id: number): Promise<ApiProduct> {
    return this.request<ApiProduct>(`/products/${id}`);
  }

  // Categories
  async getCategories(): Promise<ApiCategory[]> {
    return this.request<ApiCategory[]>('/categories');
  }

  async getCategory(id: number): Promise<ApiCategory> {
    return this.request<ApiCategory>(`/categories/${id}`);
  }

  // Districts
  async getDistricts(): Promise<ApiDistrict[]> {
    return this.request<ApiDistrict[]>('/districts');
  }

  // Orders
  async createOrder(order: CreateOrderRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrders(): Promise<any[]> {
    return this.request<any[]>('/orders');
  }

  // Wiki
  async getWikiNotesByProduct(productId: number): Promise<WikiNote[]> {
    return this.request<WikiNote[]>(`/wiki/products/${productId}`);
  }

  async getWikiNotesGroupedByCategory(productId: number): Promise<Record<string, WikiNote[]>> {
    return this.request<Record<string, WikiNote[]>>(`/wiki/products/${productId}/grouped`);
  }

  async getWikiNotesByCategory(category: string): Promise<WikiNote[]> {
    return this.request<WikiNote[]>(`/wiki/category/${encodeURIComponent(category)}`);
  }

  async getAllWikiNotes(): Promise<WikiNote[]> {
    return this.request<WikiNote[]>('/wiki');
  }
}

export const apiService = new ApiService();
