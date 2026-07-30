import { useState, useEffect } from 'react';
import { Menu, RefreshCw, X, LogOut, Flower2, Store } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminSidebar from './AdminSidebar';
import { supabase } from '../../supabaseClient';

interface Props {
  children: React.ReactNode;
  currentPage: string;
  navigate: (route: any) => void;
}

const PAGE_TITLES: Record<string, string> = {
  'admin-dashboard': 'Genel Bakış',
  'admin-products': 'Ürünler',
  'admin-categories': 'Kategoriler',
  'admin-orders': 'Siparişler',
  'admin-shipping': 'Kargo Yönetimi',
  'admin-wiki': 'Botanik Wiki',
  'admin-reviews': 'Yorumlar',
  'admin-coupons': 'Kupon Yönetimi',
  'admin-campaigns': 'Kampanya & Banner',
  'admin-editor': 'Düzenleme',
  'admin-faq': 'S.S.S Yönetimi',
};

export default function AdminLayout({ children, currentPage, navigate }: Props) {
  const { loading, profile, isAdmin } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    // 🌸 Yönetici oturumu yoksa admin-login yerine doğrudan anasayfaya (home) yönlendir
    if (!profile || !isAdmin) {
      navigate({ name: 'home' });
    }
  }, [loading, profile, isAdmin, navigate]);

  // 🌸 Çıkış yapıldığında oturumu kapatıp doğrudan Anasayfa'ya yönlendirir
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({ name: 'home' });
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      navigate({ name: 'home' });
    }
  };

  const handleGoToStore = () => {
    navigate({ name: 'shop' });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-sand-50">
        <div className="flex items-center gap-3 text-sand-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!profile || !isAdmin) {
    return null;
  }

  const title = PAGE_TITLES[currentPage] || 'Yönetim';

  return (
    <div className="min-h-screen bg-sand-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <AdminSidebar currentPage={currentPage} navigate={navigate} onSignOut={handleSignOut} />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-sand-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar 
              currentPage={currentPage} 
              navigate={navigate} 
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)} 
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b border-black/20">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10"
                aria-label="Menü"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Flower2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-brand-300">Flower Shop • Admin</p>
                  <h1 className="font-display text-lg md:text-xl">{title}</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToStore}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
              >
                <Store className="h-4 w-4" /> Mağaza
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Yenile
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-red-600 hover:bg-red-700 text-sm cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Çıkış
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}