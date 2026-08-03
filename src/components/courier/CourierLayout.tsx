import { useState, useEffect } from 'react';
import { Menu, RefreshCw, X, LogOut, Truck, Store } from 'lucide-react';
import CourierSidebar from './CourierSidebar';
import { getCurrentCourier, courierLogout } from '../../services/courierApi';

interface Props {
  children: React.ReactNode;
  currentPage: string;
  navigate: (route: any) => void;
}

const PAGE_TITLES: Record<string, string> = {
  'courier-dashboard': 'Aktif Siparişler',
  'courier-delivered': 'Teslim Edilenler',
  'courier-all': 'Toplam Siparişler',
};

export default function CourierLayout({ children, currentPage, navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [currentCourier, setCurrentCourier] = useState<{ id: string; name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const courier = getCurrentCourier();
    if (!courier) {
      navigate({ name: 'home' });
      return;
    }
    setCurrentCourier(courier);
    setLoading(false);
  }, [navigate]);

  const handleSignOut = () => {
    courierLogout();
    navigate({ name: 'home' });
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

  if (!currentCourier) {
    return null;
  }

  const title = PAGE_TITLES[currentPage] || 'Kurye Paneli';

  return (
    <div className="min-h-screen bg-sand-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <CourierSidebar 
          currentPage={currentPage} 
          navigate={navigate} 
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-sand-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <CourierSidebar 
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
        <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 text-white border-b border-brand-900/20">
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
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-brand-200">Flower Shop • Kurye</p>
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
