import { useState, useCallback, useEffect } from 'react';
import { useRouter } from './router';
import { useCart } from './useCart';
import { supabase } from './supabaseClient'; // Yol proje yapına göre './supabaseClient' veya '../supabaseClient' olabilir.
import {
  fetchProducts,
  fetchCategories,
  getFeaturedProducts,
  getDiscountedProducts,
  getProductBySlug,
  mockProducts,
  mockCategories,
} from './data';
import { apiService } from './services/api';
import type { Product, OrderInfo } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import { OrdersPage } from './pages/OrdersPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import { AdminCompaniesPage } from './pages/AdminCompaniesPage';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboardPage'; // 👈 Sadece tek bir tane kalsın!

function App() {
  const { route, navigate } = useRouter();
  const cart = useCart();
  const [toast, setToast] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState(mockCategories);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  // Load data from API or fallback to mock data
  useEffect(() => {
    setProducts(mockProducts);
    setCategories(mockCategories);
    setLoading(false);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(null);
    setTimeout(() => setToast(msg), 50);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product, qty: number = 1) => {
      cart.addItem(product, qty);
      showToast(`${product.name} sepete eklendi`);
    },
    [cart, showToast],
  );

  const handlePlaceOrder = useCallback(
    async (orderData: Omit<OrderInfo, 'id' | 'createdAt' | 'status'>): Promise<string> => {
      // 🌸 1. Oturum açmış kullanıcıyı al
      const { data: { user } } = await supabase.auth.getUser();

      // 🌸 2. Supabase 'orders' tablosuna kayıt
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          recipient_name: orderData.recipientName || 'Alıcı Adı Belirtilmedi',
          recipient_phone: orderData.recipientPhone || '',
          shipping_address: orderData.address || 'Adres Belirtilmedi',
          city: orderData.city || '',
          delivery_date: orderData.deliveryDate || '',
          note: orderData.note || '',
          total_amount: orderData.total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        alert(`❌ ORDERS HATASI:\n${orderError.message}`);
        throw orderError;
      }

      const orderId = insertedOrder.id.toString();

      // 🌸 3. 'order_items' tablosuna ürünleri ekle
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item) => ({
          order_id: orderId,
          product_id: String(item.product.id),
          quantity: item.quantity,
          unit_price: item.product.price || 0, // 🎯 Eklenen alan
        }));

        console.log('order_items tablosuna gönderilen veri:', itemsToInsert);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          alert(`❌ ORDER_ITEMS HATASI:\n${itemsError.message}`);
          console.error('ORDER_ITEMS HATASI:', itemsError);
        } else {
          alert('✅ Sipariş ve Ürün Detayları Başarıyla Veritabanına Yazıldı!');
        }
      }

      const order: OrderInfo = {
        ...orderData,
        id: orderId,
        createdAt: insertedOrder.created_at || new Date().toISOString(),
        status: 'Hazırlanıyor',
      };

      setOrders((prev) => ({ ...prev, [orderId]: order }));
      cart.clearCart();

      return orderId;
    },
    [cart],
  );

  // 🌸 Giriş yapan kullanıcının geçmiş siparişlerini Supabase'den çekme
  const fetchUserOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // 🌸 1. .select() içine delivery_date alanını ekledik
      const { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          delivery_date,
          status,
          total_amount,
          shipping_address,
          city,
          recipient_name,
          recipient_phone,
          note,
          order_items (
            id,
            product_id,
            quantity,
            unit_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Siparişler çekilirken hata oluştu:', error);
        return;
      }

      if (fetchedOrders) {
        const ordersMap: Record<string, OrderInfo> = {};

        fetchedOrders.forEach((ord: any) => { // 🌸 (ord: any) yaparak TypeScript'i rahatlattık
          ordersMap[ord.id] = {
            id: ord.id.toString(),
            createdAt: ord.created_at,
            deliveryDate: ord.delivery_date || '', // 🎯 Artık hata vermeyecek!
            status: ord.status || 'Hazırlanıyor',
            total: ord.total_amount,
            address: ord.shipping_address,
            city: ord.city,
            recipientName: ord.recipient_name,
            recipientPhone: ord.recipient_phone,
            note: ord.note,
            items: ord.order_items ? ord.order_items.map((item: any) => {
              const foundProduct = products.find((p) => String(p.id) === String(item.product_id));
              const fallbackProduct = {
                id: item.product_id,
                name: 'Ürün Detayı',
                price: item.unit_price || 0,
                image: '',
                slug: 'urun',
                categoryId: '',
                description: '',
              };

              return {
                product: (foundProduct || fallbackProduct) as any,
                quantity: item.quantity,
                price: item.unit_price,
              };
            }) : [],
          };
        });

        setOrders(ordersMap);
      }
    } catch (err) {
      console.error('Sipariş çekme hatası:', err);
    }
  }, [products]);
  
  // 🌸 Uygulama yüklendiğinde veya kullanıcı oturumu değiştiğinde siparişleri çek
  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);


  const renderPage = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sand-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      );
    }

    switch (route.name) {
      case 'home':
        return (
          <HomePage
            categories={categories}
            featured={getFeaturedProducts(products)}
            discounted={getDiscountedProducts(products)}
            navigate={navigate}
            onAddToCart={handleAddToCart}
          />
        );
      case 'shop':
        return (
          <ShopPage
            products={products}
            categories={categories}
            activeCategorySlug={route.categorySlug}
            navigate={navigate}
            onAddToCart={handleAddToCart}
          />
        );
      case 'product': {
        const product = getProductBySlug(route.slug, products);
        if (!product) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
              <h1 className="font-display text-2xl font-bold text-sand-900">Ürün bulunamadı</h1>
              <button onClick={() => navigate({ name: 'shop' })} className="btn-primary mt-6">Mağazaya Dön</button>
            </div>
          );
        }
        return <ProductPage product={product} navigate={navigate} onAddToCart={handleAddToCart} />;
      }
      case 'cart':
        return (
          <CartPage
            items={cart.items}
            subtotal={cart.subtotal}
            deliveryFee={cart.deliveryFee}
            total={cart.total}
            navigate={navigate}
            onUpdateQuantity={cart.updateQuantity}
            onRemove={cart.removeItem}
          />
        );
      case 'checkout':
        return (
          <CheckoutPage
            items={cart.items}
            subtotal={cart.subtotal}
            deliveryFee={cart.deliveryFee}
            total={cart.total}
            navigate={navigate}
            onPlaceOrder={handlePlaceOrder}
          />
        );
      case 'order-success': {
        const order = orders[route.orderId];
        return <OrderSuccessPage order={order} navigate={navigate} />;
      }

      case 'orders':
        return (
          <OrdersPage
            orders={orders}
            onNavigateToShop={() => navigate({ name: 'shop' })}
          />
        );

      case 'about':
        return <AboutPage navigate={navigate} />;
      case 'contact':
        return <ContactPage navigate={navigate} />;
      case 'faq':
        return <FaqPage navigate={navigate} />;

      /* ⚙️ ADMİN VE B2B ŞİRKET ROTALARI 🏢 */
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-orders':
        return <AdminOrdersPage />;
      case 'admin-companies':
        return <AdminCompaniesPage />;
      case 'company-dashboard':
        return <CompanyDashboard />;

      default:
        return (
          <HomePage
            categories={categories}
            featured={getFeaturedProducts(products)}
            discounted={getDiscountedProducts(products)}
            navigate={navigate}
            onAddToCart={handleAddToCart}
          />
        );
    }
  
    return (
      <div className="min-h-screen flex flex-col bg-sand-50">
        <Header cartCount={cart.totalItems} navigate={navigate} currentRoute={route} />
        <main className="flex-1">{renderPage()}</main>
        <Footer />
        {toast && <Toast message={String(toast)} onClose={() => setToast(null)} />}
      </div>
    );
};
}

  export default App;
