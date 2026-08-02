import { Package, LogOut, Truck, Flower2, Clock, CheckCircle, List } from 'lucide-react';

interface Props {
  currentPage: string;
  navigate: (route: any) => void;
  onSignOut: () => void;
  onClose?: () => void;
}

const menuItems = [
  { 
    id: 'courier-dashboard', 
    label: 'Aktif Siparişler', 
    icon: Truck,
  },
  { id: 'courier-delivered', label: 'Teslim Edilenler', icon: CheckCircle },
  { id: 'courier-all', label: 'Toplam Siparişler', icon: List },
];

export default function CourierSidebar({ currentPage, navigate, onSignOut, onClose }: Props) {
  return (
    <div className="w-64 bg-white border-r border-sand-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sand-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sand-900">Flower Shop</h2>
            <p className="text-xs text-sand-500">Kurye Paneli</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const hasSubTabs = item.subTabs && item.subTabs.length > 0;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  navigate({ name: item.id as any });
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-sand-600 hover:bg-sand-50 hover:text-sand-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
              

            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sand-200">
        <button
          onClick={() => {
            onSignOut();
            onClose?.();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
