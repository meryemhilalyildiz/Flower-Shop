import { useState, useCallback, useEffect } from 'react';
import { useRouter } from './router';
import { useCart } from './useCart';
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
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';

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
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
        setUseApi(true);
      } catch (error) {
        console.warn('API not available, using mock data:', error);
        setProducts(mockProducts);
        setCategories(mockCategories);
        setUseApi(false);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      try {
        // Transform cart items to API format
        const items = orderData.items.map(item => ({
          productId: parseInt(item.product.id),
          quantity: item.quantity,
        }));

        // Create order via API
        const response = await apiService.createOrder({
          customerName: orderData.recipientName,
          customerPhone: orderData.recipientPhone,
          address: orderData.address,
          districtId: parseInt(orderData.city), // Assuming city contains district ID
          items,
        });

        // Create local order info for display
        const id = response.orderId.toString();
        const order: OrderInfo = {
          id,
          items: orderData.items,
          total: response.grandTotal,
          recipientName: response.customerName,
          recipientPhone: orderData.recipientPhone,
          address: orderData.address,
          city: response.districtName,
          deliveryDate: orderData.deliveryDate,
          note: orderData.note,
          createdAt: response.orderDate,
          status: response.orderStatus as 'Hazırlanıyor' | 'Yola Çıktı' | 'Teslim Edildi',
        };

        setOrders((prev) => ({ ...prev, [id]: order }));
        cart.clearCart();
        return id;
      } catch (error) {
        console.error('Error creating order:', error);
        // Fallback to local order creation if API fails
        const id = `CC${Date.now().toString().slice(-8)}`;
        const order: OrderInfo = {
          ...orderData,
          id,
          createdAt: new Date().toISOString(),
          status: 'Hazırlanıyor',
        };
        setOrders((prev) => ({ ...prev, [id]: order }));
        cart.clearCart();
        return id;
      }
    },
    [cart],
  );

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
      case 'about':
        return <AboutPage navigate={navigate} />;
      case 'contact':
        return <ContactPage navigate={navigate} />;
      case 'faq':
        return <FaqPage navigate={navigate} />;
      default:
        return <HomePage
          categories={categories}
          featured={getFeaturedProducts(products)}
          discounted={getDiscountedProducts(products)}
          navigate={navigate}
          onAddToCart={handleAddToCart}
        />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Header cartCount={cart.totalItems} navigate={navigate} currentRoute={route} />
      <main className="flex-1">{renderPage()}</main>
      <Footer navigate={navigate} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;
