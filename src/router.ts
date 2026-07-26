import { useState, useEffect, useCallback } from 'react';
import type { Route } from './types';

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'magaza') {
    if (parts.length >= 2) return { name: 'shop', categorySlug: decodeURIComponent(parts[1]) };
    return { name: 'shop' };
  }
  if (parts[0] === 'urun' && parts[1]) return { name: 'product', slug: decodeURIComponent(parts[1]) };
  if (parts[0] === 'sepet') return { name: 'cart' };
  if (parts[0] === 'odeme') return { name: 'checkout' };
  if (parts[0] === 'siparislerim') return { name: 'orders' }; // 🌸 Siparişlerim rotası yakalanıyor
  if (parts[0] === 'siparis-tamamlandi' && parts[1]) return { name: 'order-success', orderId: decodeURIComponent(parts[1]) };
  if (parts[0] === 'hakkimizda') return { name: 'about' };
  if (parts[0] === 'iletisim') return { name: 'contact' };
  if (parts[0] === 'sss') return { name: 'faq' };
  if (parts[0] === 'admin') {
    if (parts[1] === 'login') return { name: 'admin-login' };
    if (parts[1] === 'dashboard' || parts.length === 1) return { name: 'admin-dashboard' };
    if (parts[1] === 'urunler') return { name: 'admin-products' };
    if (parts[1] === 'kategoriler') return { name: 'admin-categories' };
    if (parts[1] === 'siparisler') return { name: 'admin-orders' };
    if (parts[1] === 'kargo') return { name: 'admin-shipping' };
    if (parts[1] === 'wiki') return { name: 'admin-wiki' };
  }
  return { name: 'home' };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'shop':
      return route.categorySlug ? `#/magaza/${route.categorySlug}` : '#/magaza';
    case 'product':
      return `#/urun/${route.slug}`;
    case 'cart':
      return '#/sepet';
    case 'checkout':
      return '#/odeme';
    case 'orders':
      return '#/siparislerim'; // 🌸 'orders' rotasını hash adresine çevirir
    case 'order-success':
      return `#/siparis-tamamlandi/${route.orderId}`;
    case 'about':
      return '#/hakkimizda';
    case 'contact':
      return '#/iletisim';
    case 'faq':
      return '#/sss';
    case 'admin-login':
      return '#/admin/login';
    case 'admin-dashboard':
      return '#/admin/dashboard';
    case 'admin-products':
      return '#/admin/urunler';
    case 'admin-categories':
      return '#/admin/kategoriler';
    case 'admin-orders':
      return '#/admin/siparisler';
    case 'admin-shipping':
      return '#/admin/kargo';
    case 'admin-wiki':
      return '#/admin/wiki';
    default:
      return '#/';
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((r: Route) => {
    window.location.hash = routeToHash(r);
  }, []);

  return { route, navigate };
}
