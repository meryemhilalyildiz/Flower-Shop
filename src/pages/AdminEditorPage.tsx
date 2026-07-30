import { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, Edit2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isEditingMode, setIsEditingMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState<Record<string, any>>({});
  const [previewScale, setPreviewScale] = useState(0.6);

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
    const updatedContent = { ...(pageContent[activeTab] || {}) };
    const keys = fieldPath.split('.');
    let current: any = updatedContent;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = newValue;

    setPageContent({
      ...pageContent,
      [activeTab]: updatedContent,
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


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
        <span className="ml-3 text-gray-600">Yükleniyor...</span>
      </div>
    );
  }

  // 🌸 İçeriği kaydet (Aktif tab'a göre kesin Supabase Upsert)
  const handleSave = async () => {
    setSaving(true);
    try {
      const activeData = pageContent[activeTab] || {};

      // Metin alanlarının hepsini senkronize edelim
      const finalContent = {
        ...activeData,
        hero_description: activeData.hero_description || activeData.description || activeData.story,
        description: activeData.hero_description || activeData.description || activeData.story,
        story: activeData.hero_description || activeData.description || activeData.story,
      };

      const { error } = await supabase
        .from('page_contents')
        .upsert(
          {
            page_key: activeTab, // 'about', 'home' vb.
            content: finalContent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_key' }
        );

      if (error) throw error;

      setHasChanges(false);
      alert('İçerik veritabanına başarıyla kaydedildi! 🌸');
      window.location.reload();
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      alert('Kaydederken bir hata oluştu: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Sekme Butonları */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Preview Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Preview Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            <h2 className="font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label} - {isEditingMode ? 'Düzenleme Modu' : 'Görüntüleme Modu'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewScale(Math.max(0.2, previewScale - 0.1))}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-sm cursor-pointer"
            >
              -
            </button>
            <span className="text-xs bg-white/10 px-2 py-1 rounded">{Math.round(previewScale * 100)}%</span>
            <button
              onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-sm cursor-pointer"
            >
              +
            </button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Yenile
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm transition-colors cursor-pointer disabled:opacity-50"
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

        {/* Preview Content */}
        <div className="p-4 bg-gray-100 overflow-auto" style={{ height: '700px' }}>
          <div 
            className="bg-white mx-auto shadow-lg overflow-hidden"
            style={{ 
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
              width: `${100 / previewScale}%`,
              minHeight: `${700 / previewScale}px`
            }}
          >
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
      </div>

      {/* Bilgi Notu */}
      {isEditingMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Edit2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Nasıl Düzenlenir?</p>
            <p>Düzenleme modunda metinlerin veya görsellerin üzerine tıklayarak düzenleyebilirsiniz. İşlem bitince sağ üstteki yeşil <b>Kaydet</b> butonuna basın.</p>
          </div>
        </div>
      )}
    </div>
  );
}