import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { usePageContent } from '../hooks/usePageContent';
import EditableText from '../components/admin/EditableText';
import { useAdminEditing } from '../contexts/AdminEditingContext';

type Props = {
  navigate: (r: Route) => void;
};

export default function FaqPage({ navigate }: Props) {
  const { content, loading } = usePageContent('faq');
  const { isEditing, onTextChange } = useAdminEditing();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Teslimat');

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'S.S.S.' },
  ];

  // Varsayılan kategoriler (veritabanından içerik yüklenemezse)
  const defaultCategories = [
    {
      category: 'Teslimat',
      questions: [
        { q: 'Siparişim ne zaman teslim edilir?', a: 'Saat 16:00\'dan önce verilen siparişler aynı gün, 16:00\'dan sonra verilen siparişler ertesi gün teslim edilir. Teslimat saatleri 09:00-22:00 arasındadır.' },
        { q: 'Teslimat ücreti ne kadar?', a: 'Teslimat ücreti 49 TL\'dir.' },
        { q: 'Türkiye\'nin her yerine teslimat yapıyor musunuz?', a: 'Evet, Türkiye\'nin 81 iline teslimat yapıyoruz. Kırsal bölgelerde teslimat süresi 1-2 gün uzayabilir.' },
        { q: 'Teslimat saatini seçebilir miyim?', a: 'Sipariş sırasında teslimat tarihini belirtebilirsiniz. Özel saat talepleri için müşteri hizmetlerimizi arayabilirsiniz.' },
      ],
    },
    {
      category: 'Çiçekler & Bakım',
      questions: [
        { q: 'Çiçeklerim ne kadar süre taze kalır?', a: 'Doğru bakım ile kesme çiçekler 5-7 gün taze kalır. Saksılı bitkiler çok daha uzun ömümlüdür. 7 gün tazelik garantisi sunuyoruz.' },
        { q: 'Çiçeklerimi nasıl bakım yapmalıyım?', a: 'Vazoyu temiz su ile doldurun, çiçek saplarını 45 derece açıyla kesin ve suyu her 2 günde bir değiştirin. Direkt güneş ışığından uzak tutun.' },
        { q: 'Çiçekler taze değilse ne yapmalıyım?', a: 'Çiçekleriniz taze değilse, teslimattan itibaren 48 saat içinde bize ulaşın. Ücretsiz değiştirme veya iade sağlıyoruz.' },
        { q: 'Özel buket siparişi verebilir miyim?', a: 'Evet! Özel günler için kişiselleştirilmiş buketler tasarlıyoruz. İletişim sayfamızdan bize ulaşın, floristlerimiz size yardımcı olsun.' },
      ],
    },
    {
      category: 'Ödeme & İade',
      questions: [
        { q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', a: 'Tüm kredi/banka kartları kabul edilmektedir. Ödemeleriniz 256-bit SSL sertifikası ile güvenle işlenir.' },
        { q: 'İade politikası nedir?', a: 'Çiçek tazelik garantisi kapsamında, teslimattan sonraki 48 saat içinde çiçeklerde sorun tespit ederseniz ücretsiz değiştirme veya iade yapılır.' },
        { q: 'Fatura alabilir miyim?', a: 'Evet, sipariş sırasında fatura bilgilerinizi girebilirsiniz. Fatura e-posta adresinize PDF olarak gönderilir.' },
        { q: 'Hediye kartı veya kupon kullanabilir miyim?', a: 'Sipariş ödeme sayfasında indirim kodunuzu girebilirsiniz. Hediye kartları da aynı şekilde kullanılabilir.' },
      ],
    },
    {
      category: 'Hesap & Sipariş',
      questions: [
        { q: 'Üyelik zorunlu mu?', a: 'Hayır, üye olmadan misafir olarak sipariş verebilirsiniz. Ancak üyelik ile sipariş geçmişinize erişebilir ve daha hızlı sipariş verebilirsiniz.' },
        { q: 'Siparişimi nasıl takip edebilirim?', a: 'Sipariş onay sayfasından ve size gönderilen e-posta linkinden sipariş durumunuzu takip edebilirsiniz.' },
        { q: 'Siparişimi iptal edebilir miyim?', a: 'Siparişiniz henüz hazırlanma aşamasındaysa iptal edebilirsiniz. Çiçekler hazırlanmaya başlandıysa iptal mümkün olmayabilir.' },
      ],
    },
  ];

  const categories = content?.categories || defaultCategories;
  const heroTitle = content?.hero_title || 'Sıkça Sorulan Sorular';
  const heroDescription = content?.hero_description || 'Merak ettiğiniz soruların cevaplarını burada bulamadıysanız, bize ulaşmaktan çekinmeyin.';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="ml-4 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  return (
    <div className="animate-fade-in">
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
                  multiline
                />
              ) : (
                heroDescription
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
          {categories.map((cat: any) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`chip whitespace-nowrap ${
                activeCategory === cat.category ? 'bg-brand-600 text-white' : 'bg-white text-sand-600 border border-sand-200 hover:border-brand-300'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          {categories
            .filter((cat: any) => cat.category === activeCategory)
            .flatMap((cat: any, catIndex: number) => cat.questions.map((q: any, qIndex: number) => ({ ...q, catIndex, qIndex })))
            .map((item: any, i: number) => {
              const id = `${activeCategory}-${i}`;
              const isOpen = openId === id;
              return (
                <div key={id} className="card overflow-hidden">
                  <button
                    onClick={() => toggle(id)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-semibold text-sand-800">
                      {isEditing ? (
                        <EditableText
                          value={item.q}
                          onSave={(newValue) => onTextChange(`categories.${item.catIndex}.questions.${item.qIndex}.q`, newValue)}
                        />
                      ) : (
                        item.q
                      )}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-sand-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sand-600 leading-relaxed">
                        {isEditing ? (
                          <EditableText
                            value={item.a}
                            onSave={(newValue) => onTextChange(`categories.${item.catIndex}.questions.${item.qIndex}.a`, newValue)}
                            multiline
                          />
                        ) : (
                          item.a
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 p-8 rounded-3xl bg-sand-100">
          <h3 className="font-display text-xl font-bold text-sand-900">Sorunuz cevaplanmadı mı?</h3>
          <p className="text-sand-600 mt-2">Müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyar.</p>
          <button onClick={() => navigate({ name: 'contact' })} className="btn-primary mt-6">
            İletişime Geç
          </button>
        </div>
      </div>
    </div>
  );
}
