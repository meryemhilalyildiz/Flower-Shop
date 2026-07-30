import { useState, useEffect } from 'react';
import { Save, RefreshCw, MapPin, Phone, Mail, Clock, HelpCircle, CheckCircle2, AlertCircle, Eye, Edit2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Route, Product, Category } from '../types';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import FaqPage from './FaqPage';
import HomePage from './HomePage';
import { fetchProductsFromSupabase, fetchCategoriesFromSupabase } from '../services/supabaseData';
import { getFeaturedProducts, getDiscountedProducts } from '../data';
import { AdminEditingProvider } from '../contexts/AdminEditingContext';

type PageContent = {
  page_key: string;
  content: any;
};

type Props = {
  navigate: (r: Route) => void;
};

type TabType = 'home' | 'about' | 'contact' | 'faq';

export default function AdminEditorPage({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('contact'); // Varsayılan olarak İletişim sekmesi
  const [isEditingMode, setIsEditingMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const tabs = [
    { id: 'home' as TabType, label: 'Anasayfa', icon: '🏠' },
    { id: 'about' as TabType, label: 'Hakkımızda', icon: '🌸' },
    { id: 'contact' as TabType, label: 'İletişim', icon: '📞' },
    { id: 'faq' as TabType, label: 'S.S.S.', icon: '❓' },
  ];

  // Sayfa içeriğini yükle
  const fetchPageContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .in('page_key', ['home', 'about', 'contact', 'faq']);

      if (error) throw error;

      const contentMap: Record<string, any> = {};
      if (data) {
        data.forEach((item: PageContent) => {
          contentMap[item.page_key] = item.content;
        });
      }
      setPageContent(contentMap);
    } catch (err) {
      console.error('Sayfa içeriği yüklenirken hata:', err);
    }
  };

  // Verileri yükle
  useEffect(() => {
    async function loadData() {
      try {
        const [supabaseProducts, supabaseCategories] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchCategoriesFromSupabase(),
        ]);

        setProducts(supabaseProducts || []);
        setCategories(supabaseCategories || []);
        await fetchPageContent();
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Metin değişikliği handler
  const handleTextChange = (fieldPath: string, newValue: string) => {
    setPageContent((prevContent) => {
      const currentTabContent = { ...(prevContent[activeTab] || {}) };
      
      // Eğer fieldPath doğrudan 'address' geldiyse veya 'contact.address' geldiyse
      const keys = fieldPath.split('.');
      let current: any = currentTabContent;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = newValue;

      return {
        ...prevContent,
        [activeTab]: currentTabContent,
      };
    });

    setHasChanges(true);
  };

  // Görsel değişikliği handler
  const handleImageChange = (fieldPath: string, newSrc: string) => {
    const updatedContent = { ...(pageContent[activeTab] || {}) };
    const keys = fieldPath.split('.');
    let current: any = updatedContent;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = newSrc;

    setPageContent({
      ...pageContent,
      [activeTab]: updatedContent,
    });
    setHasChanges(true);
  };

  // Helper fonksiyonlar
  const handleAddToCart = (product: Product) => {
    console.log('Sepete ekle:', product.name);
  };

  const isFavorite = (productId: string) => false;
  const onToggleFavorite = (product: Product) => {};

  // 🌸 İçeriği kaydet (Supabase `page_contents` Upsert)
  // 🌸 GÜNCELLENMİŞ VE KİLİTLENMİŞ HANDLE SAVE
  // 🌸 GÜNCELLENMİŞ VE KİLİTLENMİŞ HANDLE SAVE
  const handleSave = async () => {
    setSaving(true);
    setToastMessage(null);
    try {
      const activeData = { ...(pageContent[activeTab] || {}) };

      // 🌸 İletişim sayfasındaysak contact_info dizisini temizce güncelliyoruz
      if (activeTab === 'contact') {
        // Eğer dizi olarak geldiyse içindeki değerleri de okuyalım
        const currentList = Array.isArray(activeData.contact_info) ? activeData.contact_info : [];

        const addressVal = 
          activeData.address || 
          activeData['contact_info.0.value'] || 
          currentList[0]?.value || 
          'ankara-çankaya';

        const phoneVal = 
          activeData.phone || 
          activeData['contact_info.1.value'] || 
          currentList[1]?.value || 
          '055555';

        const emailVal = 
          activeData.email || 
          activeData['contact_info.2.value'] || 
          currentList[2]?.value || 
          'flowershop.iletisim@gmail.com';

        const clockVal = 
          activeData.working_hours || 
          activeData['contact_info.3.value'] || 
          currentList[3]?.value || 
          'Her gün 08:00 - 22:00';

        // Supabase JSON sütununun beklediği tam yapıyı baştan kuruyoruz
        activeData.contact_info = [
          { icon: 'MapPin', title: 'Adres', value: addressVal },
          { icon: 'Phone', title: 'Telefon', value: phoneVal },
          { icon: 'Mail', title: 'E-posta', value: emailVal },
          { icon: 'Clock', title: 'Çalışma Saatleri', value: clockVal },
        ];
      }

      // Genel başlık/açıklama değerlerini de koruyalım
      const finalContent = {
        ...activeData,
        hero_title: activeData.hero_title || 'İletişime Geçin',
        hero_description: activeData.hero_description || activeData.description || 'Sorularınız, özel siparişler veya işbirlikleri için bize ulaşın.',
      };

      const { error } = await supabase
        .from('page_contents')
        .upsert(
          {
            page_key: activeTab,
            content: finalContent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_key' }
        );

      if (error) throw error;

      setHasChanges(false);
      setToastMessage({ text: '🎉 Başarıyla veritabanına kaydedildi!', isError: false });
      
      // Yeniden güncel veriyi çek ve ekranı tazele
      await fetchPageContent();
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      setToastMessage({ text: 'Hata oluştu: ' + (err.message || err), isError: true });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
        <span className="ml-3 text-gray-600 font-medium">Sayfa Düzenleyici Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Sekme Butonları */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setToastMessage(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingMode(!isEditingMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                isEditingMode
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isEditingMode ? 'Düzenleme Modu' : 'Görüntüleme Modu'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Bildirim Mesajı */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in ${
          toastMessage.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {toastMessage.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Canlı Önizleme ve Düzenleme Alanı */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-pink-400" />
            <h2 className="font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label} - {isEditingMode ? 'Düzenleme Modu' : 'Görüntüleme Modu'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Yenile
            </button>

            {/* Kaydet Butonu */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-bold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-900/30"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {hasChanges ? 'Değişiklikleri Kaydet' : 'Kaydet'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* İçerik Alanı */}
        <div className="p-0 min-h-[600px]">
          <AdminEditingProvider
            isEditing={isEditingMode}
            onTextChange={handleTextChange}
            onImageChange={handleImageChange}
          >
            <div className={`admin-editable-container ${isEditingMode ? 'editing' : ''}`}>
              {activeTab === 'home' && (
                <HomePage
                  categories={categories}
                  featured={getFeaturedProducts(products)}
                  discounted={getDiscountedProducts(products)}
                  navigate={navigate}
                  onAddToCart={handleAddToCart}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                />
              )}
              {activeTab === 'about' && <AboutPage navigate={navigate} />}
              {activeTab === 'contact' && <ContactPage navigate={navigate} />}
              {activeTab === 'faq' && <FaqPage navigate={navigate} />}
            </div>
          </AdminEditingProvider>
        </div>
      </div>

      {/* Bilgi Notu */}
      {isEditingMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Edit2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Nasıl Düzenlenir?</p>
            <p>Ekranda görünen metinlerin veya alanların üzerine doğrudan tıklayarak içeriği düzenleyebilirsiniz. Düzenleme tamamlandığında sağ üstteki yeşil <b>Kaydet</b> butonuna basarak tüm değişiklikleri veritabanına aktarabilirsiniz.</p>
          </div>
        </div>
      )}
    </div>
  );
}