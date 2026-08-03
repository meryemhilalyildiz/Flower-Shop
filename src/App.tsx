import { useState, useCallback, useEffect } from 'react';
import { useRouter } from './router';
import { useCart } from './useCart';
import { useFavorites } from './useFavorites';
import { supabase } from './supabaseClient';
import {
  getFeaturedProducts,
  getDiscountedProducts,
} from './data';
import { fetchCategoriesFromSupabase, fetchProductsFromSupabase } from './services/supabaseData';
import type { Product, OrderInfo } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
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
import AdminOrdersPage from './pages/AdminOrdersPage';
import { AdminDashboard } from './pages/AdminDashboardPage';
import { AdminShippingPage } from './pages/AdminShippingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardNew from './pages/AdminDashboardNew';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminWikiPage from './pages/AdminWikiPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import { normalizeOrderStatusToTurkish } from './services/adminApi';
import AdminLayout from './components/admin/AdminLayout';
import AdminCouponsPage from './pages/AdminCouponsPage';
import AdminEditorPage from './pages/AdminEditorPage';
import AdminCampaignsPage from './pages/AdminCampaignsPage';
import AdminFaqPage from './pages/AdminFaqPage';
import CustomBouquetPage from './pages/CustomBouquetPage';
import AdminCourierRoutePage from './pages/AdminCourierRoutePage';
import LegalPages from './pages/LegalPages';
import CourierDashboardPage from './pages/CourierDashboardPage';
import CourierLayout from './components/courier/CourierLayout';

function App() {
  const { route, navigate } = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const [toast, setToast] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

    // 🌸 OTURUM DURUMU DEĞİŞTİĞİNDE ANASAYFAYA YÖNLENDİRME
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate({ name: 'home' });
      }
    });

    const interval = setInterval(() => {
      fetchProductsFromSupabase()
        .then((newProducts) => {
          if (newProducts.length > 0) {
            setProducts(newProducts);
          }
        })
        .catch((error) => console.error('Ürünler yenilenirken hata:', error));
    }, 10000);

    return () => {
      clearInterval(interval);
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
    async (orderData: Omit<OrderInfo, 'id' | 'createdAt' | 'status'> & any): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      const validUserId = user?.id ? user.id : null;

      // 🌸 Tutar Değerlerini Güvenli Şekilde Alıyoruz
      const subtotal = Number(orderData.subtotal || orderData.subtotal_amount || 0);
      const deliveryFee = Number(orderData.deliveryFee ?? orderData.delivery_fee ?? 0);
      const couponDiscount = Number(orderData.coupon_discount || 0);
      const campaignDiscount = Number(orderData.campaign_discount || 0);
      const totalDiscount = Number(orderData.discountAmount || orderData.discount_amount || (couponDiscount + campaignDiscount));
      const totalAmount = Number(orderData.total || orderData.total_amount || 0);

      // 🌸 1. EKLENEN PARÇA: App.tsx -> handlePlaceOrder içindeki .insert({}) bloğu
      // App.tsx -> handlePlaceOrder içi:
      const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: validUserId,
        recipient_name: orderData.recipientName || orderData.recipient_name || 'Alıcı Adı Belirtilmedi',
        recipient_phone: orderData.recipientPhone || orderData.recipient_phone || '',
        shipping_address: orderData.address || orderData.shipping_address || 'Adres Belirtilmedi',
        city: orderData.city || '',
        delivery_date: orderData.deliveryDate || orderData.delivery_date || '',
        note: orderData.note || '',
    
        subtotal_amount: subtotal,
        delivery_fee: deliveryFee,
        coupon_discount: couponDiscount,
        campaign_discount: campaignDiscount,
    
        // 🌸 Kampanya Adı
        campaign_title: orderData.campaign_title || orderData.campaignTitle || null,
    
        discount_amount: totalDiscount,
        total_amount: totalAmount,
    
        applied_coupon_code: orderData.couponCode || orderData.applied_coupon_code || null,
        status: 'pending',
    
        // 🌸 BİNGO! İŞTE EKSİK OLAN KISIM: Sepetteki ürün listesini Supabase'e kaydediyoruz
        items: orderData.items || orderData.order_items || []
      })
      .select()
      .single();

      if (orderError) {
        alert(`❌ ORDERS HATASI:\n${orderError.message}`);
        throw orderError;
      }

      const orderId = insertedOrder.id.toString();

      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item: any) => ({
          order_id: orderId,
          product_id: String(item.product?.id || item.product_id || item.id),
          product_name: item.product?.name || item.product_name || 'Çiçek Ürünü',
          quantity: item.quantity || 1,
          unit_price: item.product?.price || item.unit_price || item.price || 0,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('ORDER_ITEMS HATASI:', itemsError);
        }

        for (const item of orderData.items) {
          try {
            const productId = String(item.product?.id || item.product_id || item.id);
            const buyQty = item.quantity || 1;

            const { data: dbProduct } = await supabase
              .from('products')
              .select('id, stock')
              .eq('id', productId)
              .single();

            if (dbProduct) {
              const currentStock = Number(dbProduct.stock || 0);
              const newStock = Math.max(0, currentStock - buyQty);

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
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discountAmount: totalDiscount,
        total: totalAmount,
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

      // 🌸 2. EKLENEN PARÇA: App.tsx -> fetchUserOrders içindeki .select() alanı
      const { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          delivery_date,
          status,
          subtotal_amount,
          delivery_fee,
          coupon_discount,
          campaign_discount,
          campaign_title,
          discount_amount,
          total_amount,
          applied_coupon_code,
          shipping_address,
          city,
          recipient_name,
          recipient_phone,
          note,
          tracking_number,
          order_items (
            id,
            product_id,
            product_name,
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

        // 🌸 3. EKLENEN PARÇA: App.tsx -> fetchUserOrders içi ordersMap nesnesi
        fetchedOrders.forEach((ord: any) => {
          ordersMap[ord.id] = {
            id: ord.id.toString(),
            createdAt: ord.created_at,
            deliveryDate: ord.delivery_date || '', // 🎯 Artık hata vermeyecek!
            status: normalizeOrderStatusToTurkish(ord.status) || 'Hazırlanıyor',
            subtotal: ord.subtotal_amount ?? (ord.total_amount != null ? ord.total_amount + (ord.discount_amount || 0) : 0),
            deliveryFee: ord.delivery_fee ?? 0,
            discountAmount: ord.discount_amount ?? 0,
            coupon_discount: ord.coupon_discount ?? 0,
            campaign_discount: ord.campaign_discount ?? 0,
            // 🌸 Kampanya Başlığını Sipariş Nesnesine Geçiriyoruz:
            campaign_title: ord.campaign_title || undefined,
            campaignTitle: ord.campaign_title || undefined,
            couponCode: ord.applied_coupon_code || undefined,
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
                name: item.product_name || 'Ürün Detayı',
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
          } as any;
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
      case 'legal':
        return <LegalPages navigate={navigate} />;
         
      case 'custom-bouquet':
      return <CustomBouquetPage onAddToCart={cart.addItem} />;

      case 'profile':
        return <ProfilePage />;

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
          selectedCampaign={cart.selectedCampaign}
          onSelectCampaign={cart.setSelectedCampaign}
        />
      );

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
            selectedCampaign={(cart as any).selectedCampaign} // 🌸 KARTTAN VEYA STATE'TEN AKTARILIYOR
          />
        );

      case 'order-success': {
        const order = orders[route.orderId];
        return <OrderSuccessPage order={order} navigate={navigate} onPlaceOrder={handlePlaceOrder} />;
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
            <AdminOrdersPage />
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

      /* 🏷️ KAMPANYA YÖNETİMİ SAYFASI ROTASI */
      case 'admin-campaigns':
        return (
          <AdminLayout currentPage="admin-campaigns" navigate={navigate}>
            <AdminCampaignsPage />
          </AdminLayout>
        );

      /* ✏️ DÜZENLEME SAYFASI ROTASI */
      case 'admin-editor':
        return (
          <AdminLayout currentPage="admin-editor" navigate={navigate}>
            <AdminEditorPage navigate={navigate} />
          </AdminLayout>
        );

      case 'admin-faq':
        return (
          <AdminLayout currentPage="admin-faq" navigate={navigate}>
            <AdminFaqPage />
          </AdminLayout>
        );

      case 'admin-kargo-rota':
        return (
          <AdminLayout currentPage="admin-kargo-rota" navigate={navigate}>
            <AdminCourierRoutePage />
          </AdminLayout>
        );

      /* 🚚 KURYE ROTALARI */
      case 'courier-dashboard':
      case 'courier-delivered':
      case 'courier-all': {
        return (
          <CourierLayout
            currentPage={route.name}
            navigate={navigate}
          >
            <CourierDashboardPage navigate={navigate} currentPage={route.name} />
          </CourierLayout>
        );
      }

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
  const isCourierRoute = route.name.startsWith('courier');

  if (isAdminRoute || isCourierRoute) {
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