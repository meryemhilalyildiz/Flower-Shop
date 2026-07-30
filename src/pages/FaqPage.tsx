import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { usePageContent } from '../hooks/usePageContent';
import EditableText from '../components/admin/EditableText';
import { useAdminEditing } from '../contexts/AdminEditingContext';
import { supabase } from '../supabaseClient';

type Props = {
  navigate: (r: Route) => void;
  adminContent?: any;
};

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order?: number;
}

const CATEGORIES = [
  'Teslimat',
  'Çiçekler & Bakım',
  'Ödeme & İade',
  'Hesap & Sipariş',
];

export default function FaqPage({ navigate, adminContent }: Props) {
  const { content, loading: contentLoading } = usePageContent('faq');
  
  // 🌸 Admin panelinden gelen içerik varsa onu kullan, yoksa veritabanından geleni
  const displayContent = adminContent || content;
  const { isEditing, onTextChange } = useAdminEditing();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Teslimat');
  
  // 🌸 Supabase Canlı S.S.S Verileri State'i
  const [dbFaqs, setDbFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'S.S.S.' },
  ];

  // 🌸 Supabase'den Canlı S.S.S Verilerini Çek
  useEffect(() => {
    async function fetchFaqs() {
      try {
        setFaqsLoading(true);
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          setDbFaqs(data);
        }
      } catch (err) {
        console.error('S.S.S çekilirken hata oluştu:', err);
      } finally {
        setFaqsLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  // Yedek varsayılan sorular (Veritabanı boşsa gösterilir)
  const defaultCategories = [
    {
      category: 'Teslimat',
      questions: [
        { id: 'def-1', question: 'Siparişim ne zaman teslim edilir?', answer: 'Saat 16:00\'dan önce verilen siparişler aynı gün, 16:00\'dan sonra verilen siparişler ertesi gün teslim edilir.' },
        { id: 'def-2', question: 'Teslimat ücreti ne kadar?', answer: 'Teslimat ücreti mesafe ve lokasyona göre dinamik hesaplanmaktadır.' },
        { id: 'def-3', question: 'Türkiye\'nin her yerine teslimat yapıyor musunuz?', answer: 'Evet, Türkiye\'nin 81 iline teslimat yapıyoruz.' },
      ],
    },
    {
      category: 'Çiçekler & Bakım',
      questions: [
        { id: 'def-4', question: 'Çiçeklerim ne kadar süre taze kalır?', answer: 'Doğru bakım ile kesme çiçekler 5-7 gün taze kalır. 7 gün tazelik garantisi sunuyoruz.' },
        { id: 'def-5', question: 'Çiçeklerimi nasıl bakım yapmalıyım?', answer: 'Vazoyu temiz su ile doldurun, çiçek saplarını 45 derece açıyla kesin ve suyu her 2 günde bir değiştirin.' },
      ],
    },
    {
      category: 'Ödeme & İade',
      questions: [
        { id: 'def-6', question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', answer: 'Tüm kredi/banka kartları kabul edilmektedir.' },
        { id: 'def-7', question: 'İade politikası nedir?', answer: 'Çiçek tazelik garantisi kapsamında 48 saat içinde ücretsiz değiştirme veya iade yapılır.' },
      ],
    },
    {
      category: 'Hesap & Sipariş',
      questions: [
        { id: 'def-8', question: 'Üyelik zorunlu mu?', answer: 'Hayır, üye olmadan misafir olarak sipariş verebilirsiniz.' },
        { id: 'def-9', question: 'Siparişimi nasıl takip edebilirim?', answer: 'Siparişlerim sayfasından sipariş durumunuzu takip edebilirsiniz.' },
      ],
    },
  ];

  // Supabase'de veri varsa Supabase verisini süz, yoksa varsayılan verileri kullan
  const currentFaqs: { id: string; question: string; answer: string }[] = dbFaqs.length > 0
    ? dbFaqs
        .filter((f) => f.category === activeCategory)
        .map((f) => ({ id: f.id, question: f.question, answer: f.answer }))
    : (defaultCategories.find((c) => c.category === activeCategory)?.questions || []);

  const heroTitle = displayContent?.hero_title || 'Sıkça Sorulan Sorular';
  const heroDescription = displayContent?.hero_description || 'Merak ettiğiniz soruların cevaplarını burada bulamadıysanız, bize ulaşmaktan çekinmeyin.';

  if (contentLoading || faqsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <p className="ml-4 text-sand-600 font-medium">Yükleniyor...</p>
      </div>
    );
  }

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 text-brand-600" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-sand-900">
              {isEditing ? (
                <EditableText
                  value={heroTitle}
                  onSave={(newValue) => onTextChange('hero_title', newValue)}
                  onChange={(newValue) => onTextChange('hero_title', newValue)}
                />
              ) : (
                heroTitle
              )}
            </h1>
            <p className="text-sand-600 mt-3 text-lg max-w-xl mx-auto">
              {isEditing ? (
                <EditableText
                  value={heroDescription}
                  onSave={(newValue) => onTextChange('hero_description', newValue)}
                  onChange={(newValue) => onTextChange('hero_description', newValue)}
                  multiline
                />
              ) : (
                heroDescription
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category tabs */}
        <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenId(null);
              }}
              className={`chip whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {currentFaqs.length === 0 ? (
            <div className="text-center py-12 bg-sand-50 rounded-2xl border border-sand-200 text-sand-500 text-sm">
              Bu kategoride henüz yayınlanmış soru bulunmuyor.
            </div>
          ) : (
            currentFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="card overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                  >
                    <span className="font-bold text-sand-900 text-base md:text-lg">
                      {isEditing ? (
                        <EditableText
                          value={item.question}
                          onSave={(newValue) => onTextChange(`faq_${item.id}_question`, newValue)}
                        />
                      ) : (
                        item.question
                      )}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-sand-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sand-600 text-sm md:text-base leading-relaxed border-t border-sand-100 pt-3 animate-fade-in">
                      {isEditing ? (
                        <EditableText
                          value={item.answer}
                          onSave={(newValue) => onTextChange(`faq_${item.id}_answer`, newValue)}
                          multiline
                        />
                      ) : (
                        item.answer
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* CTA (İletişim Yönlendirmesi) */}
        <div className="text-center mt-12 p-8 rounded-3xl bg-sand-100/70 border border-sand-200">
          <h3 className="font-display text-xl font-bold text-sand-900">
            {isEditing ? (
              <EditableText
                value="Sorunuz cevaplanmadı mı?"
                onSave={(newValue) => onTextChange('faq_cta_title', newValue)}
              />
            ) : (
              'Sorunuz cevaplanmadı mı?'
            )}
          </h3>
          <p className="text-sand-600 mt-2 text-sm md:text-base">
            {isEditing ? (
              <EditableText
                value="Müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyar."
                onSave={(newValue) => onTextChange('faq_cta_description', newValue)}
                multiline
              />
            ) : (
              'Müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyar.'
            )}
          </p>
          <button
            onClick={() => navigate({ name: 'contact' })}
            className="btn-primary mt-6 cursor-pointer"
          >
            İletişime Geç
          </button>
        </div>
      </div>
    </div>
  );
}