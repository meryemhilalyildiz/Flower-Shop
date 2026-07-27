import { useState, useCallback, useEffect } from 'react';
import { useRouter } from './router';
import { useCart } from './useCart';
import { useFavorites } from './useFavorites';
import { supabase } from './supabaseClient';
import {
  getFeaturedProducts,
  getDiscountedProducts,
  getProductBySlug,
} from './data';
import { fetchCategoriesFromSupabase, fetchProductsFromSupabase } from './services/supabaseData';
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
import FavoritesPage from './pages/FavoritesPage';
import AdminOrdersPageNew from './pages/AdminOrdersPageNew';
import { AdminDashboard } from './pages/AdminDashboardPage';
import { AdminShippingPage } from './pages/AdminShippingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardNew from './pages/AdminDashboardNew';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminWikiPage from './pages/AdminWikiPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import { useAdminAuth } from './hooks/useAdminAuth';
import { normalizeOrderStatusToTurkish } from './services/adminApi';
import AdminLayout from './components/admin/AdminLayout';
import AdminCouponsPage from './pages/AdminCouponsPage';
import AdminEditorPage from './pages/AdminEditorPage';

function App() {
  const { route, navigate } = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const [toast, setToast] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [supabaseProducts, supabaseCategories] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchCategoriesFromSupabase(),
        ]);

        setProducts(supabaseProducts || []);
        setCategories(supabaseCategories || []);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const interval = setInterval(() => {
      fetchProductsFromSupabase()
        .then((newProducts) => {
          if (newProducts.length > 0) {
            setProducts(newProducts);
          }
        })
        .catch((error) => console.error('Ürünler yenilenirken hata:', error));
    }, 10000);

    return () => clearInterval(interval);
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
      // 1. Kullanıcı oturumunu al
      const { data: { user } } = await supabase.auth.getUser();
  
      // 2. orders tablosuna kayıt
      const validUserId = user?.id ? user.id : null;
  
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: validUserId,
          recipient_name: orderData.recipientName || 'Alıcı Adı Belirtilmedi',
          recipient_phone: orderData.recipientPhone || '',
          shipping_address: orderData.address || 'Adres Belirtilmedi',
          city: orderData.city || '',
          delivery_date: orderData.deliveryDate || '',
          note: orderData.note || '',
          total_amount: orderData.total,
          discount_amount: orderData.discountAmount || 0,
          applied_coupon_code: orderData.couponCode || null,
          status: 'pending',
        })
        .select()
        .single();
  
      if (orderError) {
        alert(`❌ ORDERS HATASI:\n${orderError.message}`);
        throw orderError;
      }
  
      const orderId = insertedOrder.id.toString();
  
      // 3. order_items tablosuna kayıt
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item) => ({
          order_id: orderId,
          product_id: String(item.product.id),
          quantity: item.quantity,
          unit_price: item.product.price || 0,
        }));
  
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);
  
        if (itemsError) {
          console.error('ORDER_ITEMS HATASI:', itemsError);
        }
  
        // 🌸 4. STOK DÜŞÜRME İŞLEMİ (Sadece ID ile) 🌸
        for (const item of orderData.items) {
          try {
            const productId = String(item.product.id);
            const buyQty = item.quantity || 1;

            // A) ID ile ürünü veritabanından çekiyoruz
            const { data: dbProduct } = await supabase
              .from('products')
              .select('id, stock')
              .eq('id', productId)
              .single();

            if (dbProduct) {
              const currentStock = Number(dbProduct.stock || 0);
              const newStock = Math.max(0, currentStock - buyQty);

              // B) Stoğu güncelliyoruz
              const { error: updateErr } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', dbProduct.id);

              if (updateErr) {
                console.error('❌ Stok güncelleme hatası:', updateErr.message);
              }
            }
          } catch (err) {
            console.error('Stok düşme hatası:', err);
          }
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

  const fetchUserOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          delivery_date,
          status,
          discount_amount,
          total_amount,
          shipping_address,
          city,
          recipient_name,
          recipient_phone,
          note,
          tracking_number,
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

        fetchedOrders.forEach((ord: any) => {
          ordersMap[ord.id] = {
            id: ord.id.toString(),
            createdAt: ord.created_at,
            deliveryDate: ord.delivery_date || '', // 🎯 Artık hata vermeyecek!
            status: normalizeOrderStatusToTurkish(ord.status) || 'Hazırlanıyor',
            subtotal: ord.total_amount != null ? ord.total_amount + (ord.discount_amount || 0) : undefined,
            deliveryFee: undefined,
            total: ord.total_amount,
            address: ord.shipping_address,
            city: ord.city,
            recipientName: ord.recipient_name,
            recipientPhone: ord.recipient_phone,
            note: ord.note,
            tracking_number: ord.tracking_number || undefined,
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
            isFavorite={favorites.isFavorite}
            onToggleFavorite={favorites.toggleFavorite}
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
            isFavorite={favorites.isFavorite}
            onToggleFavorite={favorites.toggleFavorite}
          />
        );
      case 'product': {
        return (
          <ProductPage
            productSlug={route.slug}
            products={products}
            categories={categories}
            navigate={navigate}
            onAddToCart={handleAddToCart}
            isFavorite={favorites.isFavorite}
            onToggleFavorite={favorites.toggleFavorite}
          />
        );
      }
      case 'cart':
        return (
          <CartPage
            items={cart.items}
            subtotal={cart.subtotal}
            deliveryFee={cart.deliveryFee}
            total={cart.total}
            timeRemaining={cart.timeRemaining}
            navigate={navigate}
            onUpdateQuantity={cart.updateQuantity}
            onRemove={cart.removeItem}
            appliedCoupon={cart.appliedCoupon}
            discountAmount={cart.discountAmount}
            onApplyCoupon={cart.applyCoupon}
            onRemoveCoupon={cart.removeCoupon}
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
            appliedCoupon={cart.appliedCoupon}
            discountAmount={cart.discountAmount}
            onApplyCoupon={cart.applyCoupon}
            onRemoveCoupon={cart.removeCoupon}
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
            navigate={navigate}
            onNavigateToShop={() => navigate({ name: 'shop' })}
          />
        );

      case 'favorites':
        return (
          <FavoritesPage
            products={products}
            favoriteIds={favorites.favoriteIds}
            navigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleFavorite={favorites.toggleFavorite}
          />
        );

      case 'about':
        return <AboutPage navigate={navigate} />;
      case 'contact':
        return <ContactPage navigate={navigate} />;
      case 'faq':
        return <FaqPage navigate={navigate} />;

      /* ⚙️ ADMİN ROTALARI */
      case 'admin-login':
        return <AdminLoginPage onLoginSuccess={() => navigate({ name: 'admin-dashboard' })} />;
      case 'admin-dashboard':
        return (
          <AdminLayout currentPage="admin-dashboard" navigate={navigate}>
            <AdminDashboardNew navigate={navigate} />
          </AdminLayout>
        );
        case 'admin-products':
          return (
            <AdminLayout currentPage="admin-products" navigate={navigate}>
              <AdminDashboard />
            </AdminLayout>
          );
      case 'admin-categories':
        return (
          <AdminLayout currentPage="admin-categories" navigate={navigate}>
            <AdminCategoriesPage />
          </AdminLayout>
        );
      case 'admin-orders':
        return (
          <AdminLayout currentPage="admin-orders" navigate={navigate}>
            <AdminOrdersPageNew />
          </AdminLayout>
        );
      case 'admin-shipping':
        return (
          <AdminLayout currentPage="admin-shipping" navigate={navigate}>
            <AdminShippingPage />
          </AdminLayout>
        );
      case 'admin-wiki':
        return (
          <AdminLayout currentPage="admin-wiki" navigate={navigate}>
            <AdminWikiPage />
          </AdminLayout>
        );
      case 'admin-reviews':
        return (
          <AdminLayout currentPage="admin-reviews" navigate={navigate}>
            <AdminReviewsPage />
          </AdminLayout>
        );

      /* 🎟️ KUPON YÖNETİMİ SAYFASI ROTASI */
      case 'admin-coupons':
        return (
          <AdminLayout currentPage="admin-coupons" navigate={navigate}>
            <AdminCouponsPage />
          </AdminLayout>
        );

      /* ✏️ DÜZENLEME SAYFASI ROTASI */
      case 'admin-editor':
        return (
          <AdminLayout currentPage="admin-editor" navigate={navigate}>
            <AdminEditorPage navigate={navigate} />
          </AdminLayout>
        );

      default:
        return (
          <HomePage
            categories={categories}
            featured={getFeaturedProducts(products)}
            discounted={getDiscountedProducts(products)}
            navigate={navigate}
            onAddToCart={handleAddToCart}
            isFavorite={favorites.isFavorite}
            onToggleFavorite={favorites.toggleFavorite}
          />
        );
    }
  };

  const isAdminRoute = route.name.startsWith('admin');

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-sand-50">
        {renderPage()}
        {toast && <Toast message={String(toast)} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Header
        cartCount={cart.totalItems}
        favoriteCount={favorites.favoriteCount}
        navigate={navigate}
        currentRoute={route}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      {toast && <Toast message={String(toast)} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;
