export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
};


export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  images: string[];
  description: string;
  longDescription: string;
  ingredients: string[];
  rating: number;
  reviewCount: number;
  badge?: 'Yeni' | 'Çok Satan' | 'İndirim' | 'Mevsimlik';
  inStock: boolean;
  deliveryInfo: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderInfo = {
  id: string;
  items: CartItem[];
  total: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  deliveryDate: string;
  note: string;
  createdAt: string;
  status: 'Hazırlanıyor' | 'Yola Çıktı' | 'Teslim Edildi';
};

export type Route =
  | { name: 'home' }
  | { name: 'shop'; categorySlug?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'about' }
  | { name: 'contact' }
  | { name: 'faq' }
  | { name: 'orders' }
  | { name: 'admin-login' }
  | { name: 'admin-dashboard' }
  | { name: 'admin-products' }
  | { name: 'admin-categories' }
  | { name: 'admin-orders' }
  | { name: 'admin-districts' }
  | { name: 'admin-wiki' }; // 🌸 Tek Route tanımı burada bitti.