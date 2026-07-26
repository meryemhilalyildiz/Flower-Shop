import { supabase } from '../supabaseClient';
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
