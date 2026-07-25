import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from './types';

const STORAGE_KEY = 'cicekci-cart';
const RESERVATION_KEY = 'cicekci-cart-reservation';
const RESERVATION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      // Check if reservation expired
      const reservationStr = localStorage.getItem(RESERVATION_KEY);
      if (reservationStr) {
        const reservationTime = parseInt(reservationStr, 10);
        const now = Date.now();

        if (now - reservationTime > RESERVATION_DURATION) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(RESERVATION_KEY);
          return [];
        }
      }

      return JSON.parse(stored) as CartItem[];
    } catch {
      return [];
    }
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    // Set reservation time when first item added
    if (items.length > 0 && !localStorage.getItem(RESERVATION_KEY)) {
      localStorage.setItem(RESERVATION_KEY, Date.now().toString());
    }

    // Clear reservation when cart empty
    if (items.length === 0) {
      localStorage.removeItem(RESERVATION_KEY);
    }
  }, [items]);

  // 5-minute countdown timer
  useEffect(() => {
    const reservationStr = localStorage.getItem(RESERVATION_KEY);
    if (!reservationStr) {
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const reservationTime = parseInt(reservationStr, 10);
      const now = Date.now();
      const elapsed = now - reservationTime;
      const remaining = Math.max(0, RESERVATION_DURATION - elapsed);

      if (remaining === 0) {
        // Time expired, clear cart
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(RESERVATION_KEY);
        setTimeRemaining(null);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [items.length]);

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
    setItems([]);
    localStorage.removeItem(RESERVATION_KEY);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // 🌸 Kargo ücreti artık dinamik olarak CheckoutPage'de hesaplanır.
  // Sepet sayfasında göstermek için varsayılan değer (500 TL ve üzeri kargo bedava).
  // CheckoutPage'de kullanıcı il seçtikçe gerçek kargo ücreti hesaplanır.
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const total = subtotal + deliveryFee;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    deliveryFee,
    total,
    timeRemaining,
  };
}
