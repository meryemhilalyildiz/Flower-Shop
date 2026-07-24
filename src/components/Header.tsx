import { useState, useEffect } from 'react';
import { Flower2, ShoppingBag, Menu, X, Search, Phone } from 'lucide-react';
import type { Route } from '../types';
import { routeToHash } from '../router';

type Props = {
  cartCount: number;
  navigate: (r: Route) => void;
  currentRoute: Route;
};

export default function Header({ cartCount, navigate, currentRoute }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks: { label: string; route: Route }[] = [
    { label: 'Anasayfa', route: { name: 'home' } },
    { label: 'Mağaza', route: { name: 'shop' } },
    { label: 'Hakkımızda', route: { name: 'about' } },
    { label: 'İletişim', route: { name: 'contact' } },
    { label: 'S.S.S.', route: { name: 'faq' } },
  ];

  const isActive = (route: Route) => {
    if (route.name === 'home' && currentRoute.name === 'home') return true;
    if (route.name === 'shop' && (currentRoute.name === 'shop' || currentRoute.name === 'product')) return true;
    return route.name === currentRoute.name;
  };

  return (
    <>
      <div className="bg-brand-700 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aynı gün teslimat · 0850 123 45 67</span>
            <span className="sm:hidden">Aynı gün teslimat</span>
          </span>
          <span className="hidden md:block">500 TL ve üzeri siparişlerde ücretsiz kargo</span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-soft' : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Flower2 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="font-display text-2xl lg:text-3xl font-bold text-brand-700 tracking-tight">
                Çiçekçi
              </span>
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={routeToHash(link.route)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive(link.route)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-sand-600 hover:text-brand-600 hover:bg-sand-50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ name: 'shop' })}
                className="hidden sm:flex btn-ghost"
                aria-label="Ara"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate({ name: 'cart' })}
                className="relative btn-ghost"
                aria-label="Sepet"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden btn-ghost"
                aria-label="Menü"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-sand-100 bg-white animate-slide-up">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={routeToHash(link.route)}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(link.route)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-sand-600 hover:bg-sand-50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
