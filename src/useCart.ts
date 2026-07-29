import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { CartItem, Product } from './types';

const RESERVATION_DURATION = 999999 * 60 * 1000; // Rezervasyon sistemini devre dışı bırak

// Function to return products to stock when reservation expired - DEVRE DIŞI
async function returnProductsToStock(items: CartItem[]) {
  return;
}

export function useCart() {
  const [userId, setUserId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null); // Keep track of last logged in user
  const [items, setItems] = useState<CartItem[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [autoDiscount, setAutoDiscount] = useState<{ percentage: number; minAmount: number } | null>(null);

  // Get localStorage keys based on userId
  const getStorageKeys = () => {
    if (!userId) return null;
    return {
      STORAGE_KEY: `cicekci-cart-${userId}`,
      RESERVATION_KEY: `cicekci-cart-reservation-${userId}`,
      COUPON_KEY: `cicekci-cart-coupon-${userId}`,
    };
  };

  // 🌸 Aktif Kampanyayı Supabase'den Çek
  useEffect(() => {
    const fetchCartCampaign = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('campaigns')
        .select('discount_percentage, min_order_amount')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('discount_percentage', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setAutoDiscount({
          percentage: Number(data[0].discount_percentage),
          minAmount: Number(data[0].min_order_amount),
        });
      } else {
        setAutoDiscount(null);
      }
    };

    fetchCartCampaign();
  }, []);

  // Load user ID from localStorage on mount
  useEffect(() => {
    const loadUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // Try to get from localStorage as fallback
        const storedUser = localStorage.getItem('cicekci-current-user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUserId(parsedUser.id);
          } catch {
            setUserId(null);
          }
        } else {
          setUserId(null);
        }
      }
    };
    loadUserId();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLastUserId(session.user.id);
        setUserId(session.user.id);
      } else {
        setUserId(null);
        // Don't clear localStorage when user logs out - let it continue in background
        // Only clear UI state
        setItems([]);
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setTimeRemaining(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load cart from localStorage when userId changes
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setTimeRemaining(null);
      return;
    }

    const keys = getStorageKeys();
    if (!keys) return;

    try {
      const stored = localStorage.getItem(keys.STORAGE_KEY);
      if (!stored) {
        setItems([]);
        return;
      }

      // Check if reservation expired
      const reservationStr = localStorage.getItem(keys.RESERVATION_KEY);
      if (reservationStr) {
        const reservationTime = parseInt(reservationStr, 10);
        const now = Date.now();

        if (now - reservationTime > RESERVATION_DURATION) {
          // Reservation expired - return products to stock
          const cartItems = JSON.parse(stored) as CartItem[];
          returnProductsToStock(cartItems);
          
          localStorage.removeItem(keys.STORAGE_KEY);
          localStorage.removeItem(keys.RESERVATION_KEY);
          localStorage.removeItem(keys.COUPON_KEY);
          setItems([]);
          return;
        }
        
        // Set the initial time remaining based on existing reservation
        const elapsed = now - reservationTime;
        const remaining = Math.max(0, RESERVATION_DURATION - elapsed);
        setTimeRemaining(remaining);
      }

      setItems(JSON.parse(stored) as CartItem[]);
    } catch {
      setItems([]);
    }
  }, [userId]);

  // Load coupon from localStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    
    const keys = getStorageKeys();
    if (!keys) return;

    try {
      const storedCoupon = localStorage.getItem(keys.COUPON_KEY);
      if (storedCoupon) {
        const couponData = JSON.parse(storedCoupon);
        setAppliedCoupon(couponData.coupon);
        setDiscountAmount(couponData.discountAmount || 0);
      }
    } catch {
      // Ignore parsing errors
    }
  }, [userId]);

  // Save cart to localStorage when items change
  useEffect(() => {
    const keys = getStorageKeys();
    if (!keys) return;

    localStorage.setItem(keys.STORAGE_KEY, JSON.stringify(items));

    // Set reservation time when first item added
    if (items.length > 0 && !localStorage.getItem(keys.RESERVATION_KEY)) {
      localStorage.setItem(keys.RESERVATION_KEY, Date.now().toString());
    }

    // Clear reservation when cart empty
    if (items.length === 0) {
      localStorage.removeItem(keys.RESERVATION_KEY);
    }
  }, [items, userId]);

  // Save coupon to localStorage when it changes
  useEffect(() => {
    const keys = getStorageKeys();
    if (!keys) return;

    if (appliedCoupon) {
      localStorage.setItem(keys.COUPON_KEY, JSON.stringify({
        coupon: appliedCoupon,
        discountAmount
      }));
    } else {
      localStorage.removeItem(keys.COUPON_KEY);
    }
  }, [appliedCoupon, discountAmount, userId]);

  // 15-minute countdown timer - continues even when user logs out
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const checkReservation = () => {
      // Use lastUserId to track the cart reservation even when user is logged out
      const effectiveUserId = userId || lastUserId;
      if (!effectiveUserId) {
        setTimeRemaining(null);
        return;
      }

      const STORAGE_KEY = `cicekci-cart-${effectiveUserId}`;
      const RESERVATION_KEY = `cicekci-cart-reservation-${effectiveUserId}`;
      const COUPON_KEY = `cicekci-cart-coupon-${effectiveUserId}`;

      const reservationStr = localStorage.getItem(RESERVATION_KEY);
      if (!reservationStr) {
        setTimeRemaining(null);
        return;
      }

      const reservationTime = parseInt(reservationStr, 10);
      const now = Date.now();
      const elapsed = now - reservationTime;
      const remaining = Math.max(0, RESERVATION_DURATION - elapsed);

      if (remaining === 0) {
        // Time expired, return products to stock and clear cart
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const cartItems = JSON.parse(stored) as CartItem[];
          returnProductsToStock(cartItems);
        }
        
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(RESERVATION_KEY);
        localStorage.removeItem(COUPON_KEY);
        setTimeRemaining(null);
        if (interval) clearInterval(interval);
      } else {
        // Only update timeRemaining if user is logged in (to show in UI)
        if (userId) {
          setTimeRemaining(remaining);
        }
      }
    };

    // Initial check
    checkReservation();

    // Set up interval - runs continuously regardless of auth state
    interval = setInterval(checkReservation, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lastUserId]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    const keys = getStorageKeys();
    if (keys) {
      localStorage.removeItem(keys.RESERVATION_KEY);
      localStorage.removeItem(keys.COUPON_KEY);
    }
    setItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, [userId]);

  const applyCoupon = useCallback((coupon: any, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // 🌸 Otomatik Kampanya İndirimi Hesabı
  const campaignDiscountAmount =
    autoDiscount && subtotal >= autoDiscount.minAmount
      ? (subtotal * autoDiscount.percentage) / 100
      : 0;

  // En yüksek avantaj sağlayan indirimi seç (Kupon veya Otomatik Kampanya)
  const effectiveDiscount = Math.max(discountAmount || 0, campaignDiscountAmount);

  // Kargo ve Nihai Toplam
  const deliveryFee = 0;
  const total = Math.max(0, subtotal - effectiveDiscount + deliveryFee);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    deliveryFee,
    discountAmount: effectiveDiscount, // 👈 Otomatik indirimi sepete yansıtıyoruz
    total,
    timeRemaining,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  };
}