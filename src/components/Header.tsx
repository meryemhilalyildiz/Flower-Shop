import { useState, useEffect, useRef } from 'react';
import { Flower2, ShoppingBag, Menu, X, Search, Phone, User, LogOut, History, Heart } from 'lucide-react';
import type { Route } from '../types';
import { routeToHash } from '../router';
import { AuthModal } from './AuthModal';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { checkAdminAccess } from '../services/adminApi';

type Props = {
  cartCount: number;
  favoriteCount: number;
  navigate: (r: Route) => void;
  currentRoute: Route;
};

export default function Header({ cartCount, favoriteCount, navigate, currentRoute }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

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
    try {
      // 1. Oturumu Kapat
      await supabase.auth.signOut();
      
      // 2. 🌸 Otomatik Anasayfaya Yönlendir
      navigate({ name: 'home' }); 
    } catch (error) {
      console.error('Çıkış hatası:', error);
      navigate({ name: 'home' });
    }
  };

  const handleAccountClick = () => {
    if (isAdmin) {
      window.location.hash = '#/admin/dashboard';
      navigate({ name: 'admin-dashboard' as any });
      return;
    }

    // 🌸 Değişiklik burada: Artık siparişler yerine profil sayfasına gidiyor
    window.location.hash = '#/profil';
    navigate({ name: 'profile' as any });
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
      setSearchOpen(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    }
  };

  const navLinks: { label: string; route: Route }[] = isAdmin
    ? [
        { label: 'Anasayfa', route: { name: 'home' } },
        { label: 'Mağaza', route: { name: 'shop' } },
        { label: 'Hakkımızda', route: { name: 'about' } },
        { label: 'İletişim', route: { name: 'contact' } },
        { label: 'S.S.S.', route: { name: 'faq' } },
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
    if (route.name === 'favorites' && currentRoute.name === 'favorites') return true;
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

            <nav className="hidden md:flex items-center gap-8">
  {navLinks.map((link) => {
    const isActive = currentRoute.name === link.route.name;
    return (
      <button
        key={link.label}
        onClick={() => navigate(link.route)}
        className={`text-sm font-medium transition-colors cursor-pointer ${
          isActive
            ? 'text-brand-600 font-semibold px-3 py-1 bg-brand-50 rounded-full'
            : 'text-sand-600 hover:text-sand-900'
        }`}
      >
        {link.label}
      </button>
    );
  })}
</nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-sand-100 rounded-full px-4 py-2 w-64 relative search-container">
                <Search className="w-4 h-4 text-sand-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    
                    // Clear previous timeout
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    
                    // Debounce search for dropdown
                    searchTimeoutRef.current = setTimeout(() => {
                      handleSearch(value);
                    }, 300);
                  }}
                  onFocus={() => searchQuery && setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setSearchOpen(false);
                      setSearchResults([]);
                      sessionStorage.setItem('searchQuery', searchQuery.trim());
                      navigate({ name: 'shop' });
                    }
                  }}
                  placeholder="Çiçek ara..."
                  className="bg-transparent text-sm text-sand-700 placeholder-sand-400 outline-none w-full"
                />
                
                {/* Dropdown Results */}
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-sand-100 overflow-hidden z-50">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSearchQuery('');
                          setSearchOpen(false);
                          setSearchResults([]);
                          navigate({ name: 'product', slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]/g, '-') });
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-sand-50 transition-colors text-left cursor-pointer"
                      >
                        <img
                          src={product.image || product.image_url || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=100'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sand-800 truncate">{product.name}</p>
                          <p className="text-xs text-sand-500">{product.price} TL</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 🌸 Favoriler butonu */}
              <button
                onClick={() => navigate({ name: 'favorites' })}
                className="relative btn-ghost"
                aria-label="Favorilerim"
              >
                <Heart
                  className={`w-5 h-5 ${
                    currentRoute.name === 'favorites' ? 'fill-brand-600 text-brand-600' : 'text-sand-600'
                  }`}
                />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {favoriteCount}
                  </span>
                )}
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

                  <button
  onClick={() => {
    window.location.hash = '#/profil';
  }}
  className="text-xs font-semibold text-brand-700 hidden md:inline bg-brand-50 px-2.5 py-1.5 rounded-full border border-brand-200 hover:bg-brand-100 transition-all cursor-pointer"
>
  {user.user_metadata?.full_name || user.email?.split('@')[0]}
</button>
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
              <button
                onClick={() => {
                  setMobileOpen(false);
                  window.location.hash = '#/favoriler';
                  if (typeof navigate === 'function') {
                    navigate({ name: 'favorites' as any });
                  }
                }}
                className="mt-2 w-full py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold flex items-center justify-center gap-2 border border-brand-200"
              >
                <Heart className="w-5 h-5" />
                Favorilerim ({favoriteCount})
              </button>
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
