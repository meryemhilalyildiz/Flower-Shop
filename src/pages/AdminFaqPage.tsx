import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { usePageContent } from '../hooks/usePageContent';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  'Teslimat',
  'Çiçekler & Bakım',
  'Ödeme & İade',
  'Hesap & Sipariş',
];

export default function AdminFaqPage() {
    const { content } = usePageContent('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Teslimat');

  // Header & Footer Metin State'leri (Ekran görüntüsündeki ifadeler)
  const [heroTitle, setHeroTitle] = useState('Sıkça Sorulan Sorular');
  const [heroDescription, setHeroDescription] = useState('Merak ettiğiniz soruların cevaplarını burada bulamadıysanız, bize ulaşmaktan çekinmeyin.');
  const [ctaTitle, setCtaTitle] = useState('Sorunuz cevaplanmadı mı?');
  const [ctaDescription, setCtaDescription] = useState('Müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyar.');
  const [savingContent, setSavingContent] = useState(false);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: 'Teslimat',
    question: '',
    answer: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (content) {
      if (content.hero_title) setHeroTitle(content.hero_title);
      if (content.hero_description) setHeroDescription(content.hero_description);
      if (content.cta_title) setCtaTitle(content.cta_title);
      if (content.cta_description) setCtaDescription(content.cta_description);
    }
  }, [content]);

  const fetchFaqs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) setFaqs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  // Sayfa başlık ve alt metinlerini kaydetme
  // 🌸 Sayfa başlık ve alt metinlerini doğrudan Supabase'e kaydetme
  const handleSavePageContent = async () => {
    setSavingContent(true);
    try {
      const updatedData = {
        page_slug: 'faq',
        hero_title: heroTitle,
        hero_description: heroDescription,
        cta_title: ctaTitle,
        cta_description: ctaDescription,
      };

      const { error } = await supabase
        .from('page_contents')
        .upsert(updatedData, { onConflict: 'page_slug' });

      if (error) {
        throw error;
      }

      alert('Sayfa başlıkları ve açıklamaları başarıyla güncellendi! 🌸');
    } catch (err: any) {
      console.error('Kaydetme hatası:', err);
      alert('Kaydedilirken bir hata oluştu: ' + (err.message || err));
    } finally {
      setSavingContent(false);
    }
  };

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order,
        is_active: faq.is_active,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        category: selectedCategory,
        question: '',
        answer: '',
        sort_order: faqs.length + 1,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Lütfen soru ve cevap alanlarını doldurun.');
      return;
    }

    if (editingFaq) {
      await supabase.from('faqs').update(formData).eq('id', editingFaq.id);
    } else {
      await supabase.from('faqs').insert([formData]);
    }

    setIsModalOpen(false);
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      await supabase.from('faqs').delete().eq('id', id);
      fetchFaqs();
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    await supabase.from('faqs').update({ is_active: !faq.is_active }).eq('id', faq.id);
    fetchFaqs();
  };

  const filteredFaqs = faqs.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 🌸 1. BÖLÜM: SAYFA BAŞLIĞI VE AÇIKLAMALARI DÜZENLEME ALANI */}
      <section className="card p-6 bg-gradient-to-br from-brand-50/50 to-white border border-brand-200/80">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-100">
          <div className="flex items-center gap-2 text-brand-800 font-bold font-display text-lg">
            <HelpCircle className="w-5 h-5 text-brand-600" />
            <span>Sayfa Başlıkları ve Genel Metin Düzenleme</span>
          </div>
          <button
            onClick={handleSavePageContent}
            disabled={savingContent}
            className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2 cursor-pointer"
          >
            {savingContent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Metin Değişikliklerini Kaydet
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Ana Başlık (Ekran Görüntüsündeki)</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="input bg-white"
              placeholder="Örn: Sıkça Sorulan Sorular"
            />
          </div>

          <div>
            <label className="label">Alt Açıklama Metni</label>
            <input
              type="text"
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              className="input bg-white"
              placeholder="Örn: Merak ettiğiniz soruların cevaplarını..."
            />
          </div>

          <div>
            <label className="label">Soru İletişim Kutusu Başlığı (En Alt Kısım)</label>
            <input
              type="text"
              value={ctaTitle}
              onChange={(e) => setCtaTitle(e.target.value)}
              className="input bg-white"
              placeholder="Örn: Sorunuz cevaplanmadı mı?"
            />
          </div>

          <div>
            <label className="label">Soru İletişim Kutusu Açıklaması</label>
            <input
              type="text"
              value={ctaDescription}
              onChange={(e) => setCtaDescription(e.target.value)}
              className="input bg-white"
              placeholder="Örn: Müşteri hizmetleri ekibimiz..."
            />
          </div>
        </div>
      </section>

      {/* 🌸 2. BÖLÜM: SORU VE CEVAP YÖNETİMİ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-sand-900 font-display">Sorular ve Cevaplar</h2>
            <p className="text-xs text-sand-500">Kategori sekmelerine tıklayarak soruları düzenleyin veya yenisini ekleyin.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Soru Ekle
          </button>
        </div>

        {/* Kategori Sekmeleri (Ekran Görüntüsündeki İle Birebir Aynı) */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-sand-600 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              {cat} ({faqs.filter((f) => f.category === cat).length})
            </button>
          ))}
        </div>

        {/* Sorular Listesi */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sand-500">Sorular yükleniyor...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-sand-50 rounded-2xl border border-sand-200 text-sand-500 text-sm">
              '{selectedCategory}' kategorisinde henüz soru bulunmuyor. Yeni eklemek için yukarıdaki butonu kullanabilirsiniz.
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="card p-5 hover:border-brand-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {faq.category}
                      </span>
                      {!faq.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                          Pasif (Yayında Değil)
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sand-900 text-base">{faq.question}</h3>
                    <p className="text-sm text-sand-600 leading-relaxed bg-sand-50/60 p-3 rounded-xl border border-sand-100">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(faq)}
                      title={faq.is_active ? 'Yayından Kaldır' : 'Yayınla'}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        faq.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {faq.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(faq)}
                      className="p-2 text-sand-600 hover:bg-sand-100 rounded-lg cursor-pointer"
                      title="Soru ve Cevabı Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 🌸 MODAL: EKLENEN VEYA DÜZENLENEN SORU POPUP'I */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-sand-200 pb-3">
              <h3 className="font-bold text-lg text-sand-900 font-display">
                {editingFaq ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-sand-400 hover:text-sand-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFaq} className="space-y-4">
              <div>
                <label className="label">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Soru Metni *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input"
                  placeholder="Örn: Siparişim ne zaman teslim edilir?"
                />
              </div>

              <div>
                <label className="label">Cevap Metni *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Detaylı cevabı yazın..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-sand-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                  />
                  Soru Yayında Olsun
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-sand-600 hover:bg-sand-100 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary text-sm cursor-pointer">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}