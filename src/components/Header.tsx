import { useState, useEffect } from 'react';
import { Flower2, ShoppingBag, Menu, X, Search, Phone, User, LogOut, History } from 'lucide-react';
import type { Route } from '../types';
import { routeToHash } from '../router';
import { AuthModal } from './AuthModal';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { checkAdminAccess } from '../services/adminApi';

type Props = {
  cartCount: number;
  navigate: (r: Route) => void;
  currentRoute: Route;
};

export default function Header({ cartCount, navigate, currentRoute }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 🌸 Supabase Oturum Dinleyicisi
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const adminCheck = await checkAdminAccess(user.id);
        setIsAdmin(adminCheck);
      } else {
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const adminCheck = await checkAdminAccess(session.user.id);
        setIsAdmin(adminCheck);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navLinks: { label: string; route: Route }[] = isAdmin
    ? [
        { label: 'Anasayfa', route: { name: 'home' } },
        { label: 'Hakkımızda', route: { name: 'about' } },
        { label: 'İletişim', route: { name: 'contact' } },
      ]
    : [
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

              {/* 🌸 Giriş Yapılmışsa "Sipariş Geçmişi", "Kullanıcı Adı" ve "Çıkış Yap" Butonu */}
              {user ? (
                <div className="flex items-center gap-1.5 ml-1">
                  {/* 🕒 Geçmiş Siparişlerim İkonu */}
                  <button
                    onClick={() => {
                      window.location.hash = '#/siparislerim';
                      if (typeof navigate === 'function') {
                        navigate({ name: 'orders' as any });
                      }
                    }}
                    title="Geçmiş Siparişlerim"
                    className="p-2 text-sand-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-all cursor-pointer"
                  >
                    <History className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-semibold text-brand-700 hidden md:inline bg-brand-50 px-2.5 py-1.5 rounded-full border border-brand-200">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-500 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all ml-1"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Çıkış</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-600 text-brand-700 hover:bg-brand-50 text-sm font-semibold transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Giriş Yap</span>
                  </button>
                </div>
              )}

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
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      window.location.hash = '#/siparislerim';
                      if (typeof navigate === 'function') {
                        navigate({ name: 'orders' as any });
                      }
                    }}
                    className="mt-2 w-full py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold flex items-center justify-center gap-2 border border-brand-200"
                  >
                    <History className="w-5 h-5" />
                    Geçmiş Siparişlerim
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="mt-1 w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-center"
                  >
                    Çıkış Yap ({user.email})
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="mt-2 w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-center"
                >
                  Giriş Yap / Kayıt Ol
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* 🌸 Giriş & Kayıt Modal Penceresi */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}