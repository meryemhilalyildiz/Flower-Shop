import { Flower2, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { routeToHash } from '../router';
import type { Route } from '../types';
import { usePageContent } from '../hooks/usePageContent';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Footer() {
  // 🌸 Hakkımızda sayfasının canlı içeriğini çekiyoruz
  const { content: aboutContent, refresh: refreshAbout } = usePageContent('about');
  // 🌸 İletişim sayfasının canlı içeriğini çekiyoruz
  const { content: contactContent, refresh: refreshContact } = usePageContent('contact');
  
  // 🌸 Store settings'ten mağaza adresini çek
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // 🌸 Store settings'ten mağaza adresini çek
  const fetchStoreSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setStoreSettings(data);
      }
    } catch (error) {
      console.error('Mağaza ayarları çekilirken hata:', error);
    }
  };

  // 🌸 Store settings'i yükle ve güncellemeleri dinle
  useEffect(() => {
    fetchStoreSettings();

    const handleStoreSettingsUpdate = () => {
      fetchStoreSettings();
    };

    window.addEventListener('storeSettingsUpdated', handleStoreSettingsUpdate);
    return () => {
      window.removeEventListener('storeSettingsUpdated', handleStoreSettingsUpdate);
    };
  }, []);

  // 🌸 Admin panelinden kayıt yapıldığında footer'ı güncelle
  useEffect(() => {
    const handlePageUpdate = (event: CustomEvent) => {
      const { pageKey } = event.detail;
      if (pageKey === 'contact') {
        refreshContact();
      } else if (pageKey === 'about') {
        refreshAbout();
      }
    };

    window.addEventListener('pageContentUpdated', handlePageUpdate as EventListener);
    return () => {
      window.removeEventListener('pageContentUpdated', handlePageUpdate as EventListener);
    };
  }, [refreshContact, refreshAbout]);

  // Hakkımızda Açıklaması
  const footerDescription = 
    aboutContent?.hero_description || 
    aboutContent?.description || 
    aboutContent?.story || 
    "1998'den beri taze çiçekler ve özel buketler tasarlıyoruz. Sevdiklerinizi en güzel çiçeklerle mutlu ediyoruz.";

  // 🌸 İletişim bilgilerini veritabanından alıyoruz
  const defaultContactInfo = [
    { icon: 'MapPin', title: 'Adres', value: 'İstiklal Cd. No:123, Beyoğlu, İstanbul' },
    { icon: 'Phone', title: 'Telefon', value: '0850 123 45 67' },
    { icon: 'Mail', title: 'E-posta', value: 'destek@cicekci.com' },
  ];
  
  // 🌸 Store settings'ten adres bilgisi varsa onu kullan
  let contactInfo = contactContent?.contact_info || defaultContactInfo;
  
  if (storeSettings) {
    const fullAddress = [
      storeSettings.address,
      storeSettings.street,
      storeSettings.neighborhood,
      storeSettings.district,
      storeSettings.city
    ].filter(part => part && typeof part === 'string' && part.trim() !== '').join(', ');
    
    contactInfo = [
      { icon: 'MapPin', title: 'Adres', value: fullAddress },
      ...contactInfo.slice(1) // Diğer bilgileri koru
    ];
  }
  const linkGroups = [
    {
      title: 'Mağaza',
      links: [
        { label: 'Buketler', route: { name: 'shop', categorySlug: 'buketler' } as Route },
        { label: 'Gül Aranjmanları', route: { name: 'shop', categorySlug: 'gul-aranjmanlari' } as Route },
        { label: 'Saksılı Bitkiler', route: { name: 'shop', categorySlug: 'saksili-bitkiler' } as Route },
        { label: 'Özel Günler', route: { name: 'shop', categorySlug: 'ozel-gunler' } as Route },
      ],
    },
    {
      title: 'Kurumsal',
      links: [
        { label: 'Hakkımızda', route: { name: 'about' } as Route },
        { label: 'İletişim', route: { name: 'contact' } as Route },
        { label: 'S.S.S.', route: { name: 'faq' } as Route },
        { label: 'Anasayfa', route: { name: 'home' } as Route },
      ],
    },
  ];

  return (
    <footer className="bg-sand-900 text-sand-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Logo & Hakkında */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-white">Çiçekçi</span>
            </div>
            
            <p className="text-sm text-sand-400 leading-relaxed mb-4">
              {footerDescription}
            </p>

            <div className="flex gap-2">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#/"
                  className="w-10 h-10 rounded-xl bg-sand-800 hover:bg-brand-600 flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Sosyal medya"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Mağaza & Kurumsal Linkler */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="font-display text-lg font-semibold text-white mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={routeToHash(link.route)}
                      className="text-sm text-sand-400 hover:text-brand-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 🌸 İLETİŞİM BİLGİLERİ (DİNAMİK) */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-4">İletişim</h4>
            <ul className="space-y-3 text-sm text-sand-400">
              {contactInfo.map((info: any) => {
                const IconComponent = info.icon === 'MapPin' ? MapPin : 
                                     info.icon === 'Phone' ? Phone : 
                                     info.icon === 'Mail' ? Mail : MapPin;
                return (
                  <li key={info.title} className="flex items-start gap-2">
                    <IconComponent className="w-4 h-4 mt-0.5 text-brand-400 flex-shrink-0" />
                    <span>{info.value}</span>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

        {/* Alt Bilgi & Telif */}
        <div className="border-t border-sand-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sand-500">© 2026 Çiçekçi. Tüm hakları saklıdır.</p>
          <div className="flex gap-6 text-sm text-sand-500">
            <a href="#/" className="hover:text-brand-300 transition-colors">Gizlilik Politikası</a>
            <a href="#/" className="hover:text-brand-300 transition-colors">Kullanım Şartları</a>
            <a href="#/" className="hover:text-brand-300 transition-colors">Kargo & İade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}