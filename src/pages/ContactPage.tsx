import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Check, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { usePageContent } from '../hooks/usePageContent';
import { useAdminEditing } from '../contexts/AdminEditingContext';
import { supabase } from '../supabaseClient';
import EditableText from '../components/admin/EditableText';

type Props = {
  navigate: (r: Route) => void;
  adminContent?: any;
};

export default function ContactPage({ navigate, adminContent }: Props) {
  const { content, loading } = usePageContent('contact');
  const { isEditing, onTextChange } = useAdminEditing();
  
  // 🌸 Admin panelinden gelen içerik varsa onu kullan, yoksa veritabanından geleni
  const displayContent = adminContent || content;
  
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 🌸 Admin Düzenleme State'leri
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [editableHeroTitle, setEditableHeroTitle] = useState('');
  const [editableHeroDesc, setEditableHeroDesc] = useState('');
  const [addressVal, setAddressVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [hoursVal, setHoursVal] = useState('');
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
        // 🌸 Store settings'ten gelen adres bilgilerini ContactPage'e uygula
        const fullAddress = [
          data.address,
          data.street,
          data.neighborhood,
          data.district,
          data.city
        ].filter(part => part && typeof part === 'string' && part.trim() !== '').join(', ');
        
        setAddressVal(fullAddress);
      }
    } catch (error) {
      console.error('Mağaza ayarları çekilirken hata:', error);
    }
  };

  // Veritabanından gelen veriler yüklendiğinde state'leri doldur
  useEffect(() => {
    if (displayContent) {
      setEditableHeroTitle(displayContent.hero_title || 'İletişime Geçin');
      setEditableHeroDesc(displayContent.hero_description || 'Sorularınız, özel siparişler veya işbirlikleri için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.');
      
      const infoList = displayContent.contact_info || [];
      // 🌸 Store settings'ten adres bilgisi yoksa page_contents'ten kullan
      if (!storeSettings) {
        setAddressVal(infoList[0]?.value || 'İstiklal Cd. No:123, Beyoğlu, İstanbul');
      }
      setPhoneVal(infoList[1]?.value || '0850 123 45 67');
      setEmailVal(infoList[2]?.value || 'flowershop.iletisim@gmail.com');
      setHoursVal(infoList[3]?.value || 'Her gün 08:00 - 22:00');
    }
  }, [displayContent, storeSettings]);

  // 🌸 Store settings'i yükle ve güncellemeleri dinle
  useEffect(() => {
    fetchStoreSettings();

    // 🌸 Store settings güncellendiğinde yeniden yükle
    const handleStoreSettingsUpdate = () => {
      fetchStoreSettings();
    };

    window.addEventListener('storeSettingsUpdated', handleStoreSettingsUpdate);
    return () => {
      window.removeEventListener('storeSettingsUpdated', handleStoreSettingsUpdate);
    };
  }, []);

  // 🌸 Admin editing context ile değişiklikleri sync et
  const handleContactFieldChange = (field: string, value: string) => {
    if (onTextChange) {
      onTextChange(field, value);
    }
  };

  // 🌸 AdminContent güncellendiğinde local state'leri de güncelle
  useEffect(() => {
    if (adminContent) {
      if (adminContent.address !== undefined) setAddressVal(adminContent.address);
      if (adminContent.phone !== undefined) setPhoneVal(adminContent.phone);
      if (adminContent.email !== undefined) setEmailVal(adminContent.email);
      if (adminContent.working_hours !== undefined) setHoursVal(adminContent.working_hours);
      if (adminContent.hero_title !== undefined) setEditableHeroTitle(adminContent.hero_title);
      if (adminContent.hero_description !== undefined) setEditableHeroDesc(adminContent.hero_description);
    }
  }, [adminContent]);

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'İletişim' },
  ];

  // 🌸 ADMIN KAYDETME FONKSİYONU
  const handleAdminSave = async () => {
    setSaving(true);
    setToastMessage(null);
    try {
      const updatedContent = {
        hero_title: editableHeroTitle,
        hero_description: editableHeroDesc,
        contact_info: [
          { icon: 'MapPin', title: 'Adres', value: addressVal },
          { icon: 'Phone', title: 'Telefon', value: phoneVal },
          { icon: 'Mail', title: 'E-posta', value: emailVal },
          { icon: 'Clock', title: 'Çalışma Saatleri', value: hoursVal },
        ],
        contact_image: content?.contact_image || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800'
      };

      const { error } = await supabase
        .from('page_contents')
        .upsert(
          {
            page_key: 'contact',
            content: updatedContent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_key' }
        );

      if (error) throw error;

      setToastMessage({ text: '🎉 Değişiklikler veritabanına başarıyla kaydedildi!', isError: false });
      
      // 🌸 Footer ve diğer bileşenleri tetikle
      window.dispatchEvent(new CustomEvent('pageContentUpdated', { detail: { pageKey: 'contact' } }));
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="ml-4 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Ad gerekli';
    if (!form.email.trim()) newErrors.email = 'E-posta gerekli';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (!form.message.trim()) newErrors.message = 'Mesaj gerekli';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('contact_messages').insert([
          {
            name: form.name.trim(),
            email: form.email.trim(),
            subject: form.subject.trim() || 'Konu Yok',
            message: form.message.trim(),
          },
        ]);

        if (error) throw error;

        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSent(false), 4000);
      } catch (error: any) {
        console.error('Mesaj gönderilirken hata oluştu:', error.message);
        alert('Mesaj gönderilirken bir hata oluştu, lütfen tekrar deneyin.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      {/* 🌸 Admin Düzenleme Modu Bilgi ve Kaydet Barı */}
      {isEditing && (
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 sticky top-16 lg:top-20 z-40 shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            İletişim Sayfası Canlı Düzenleme Modu
          </div>
          <button
            onClick={handleAdminSave}
            disabled={saving}
            className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      )}

      {/* Toast Mesajı */}
      {toastMessage && (
        <div className={`p-4 text-sm font-semibold flex items-center gap-2 ${
          toastMessage.isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {toastMessage.isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      <div className="bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 text-center space-y-3">
            {isEditing ? (
              <EditableText
                value={editableHeroTitle}
                onSave={(newValue) => {
                  setEditableHeroTitle(newValue);
                  handleContactFieldChange('hero_title', newValue);
                }}
                onChange={(newValue) => {
                  setEditableHeroTitle(newValue);
                  handleContactFieldChange('hero_title', newValue);
                }}
                className="font-display text-3xl lg:text-4xl font-bold text-sand-900 text-center w-full max-w-lg mx-auto"
                placeholder="Başlık"
              />
            ) : (
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-sand-900">{editableHeroTitle}</h1>
            )}

            {isEditing ? (
              <EditableText
                value={editableHeroDesc}
                onSave={(newValue) => {
                  setEditableHeroDesc(newValue);
                  handleContactFieldChange('hero_description', newValue);
                }}
                onChange={(newValue) => {
                  setEditableHeroDesc(newValue);
                  handleContactFieldChange('hero_description', newValue);
                }}
                multiline={true}
                className="text-sand-600 text-sm lg:text-base text-center w-full max-w-xl mx-auto"
                placeholder="Açıklama"
              />
            ) : (
              <p className="text-sand-600 text-lg max-w-xl mx-auto">{editableHeroDesc}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info Section */}
          <div>
            <h2 className="font-display text-2xl font-bold text-sand-900 mb-6">
              {isEditing ? (
                <EditableText
                  value="İletişim Bilgileri"
                  onSave={(newValue) => onTextChange('contact_info_title', newValue)}
                />
              ) : (
                'İletişim Bilgileri'
              )}
            </h2>
            <div className="space-y-4">
              
              {/* Adres */}
              <div className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sand-800">Adres</p>
                  {isEditing ? (
                    <EditableText
                      value={addressVal}
                      onSave={(newValue) => {
                        setAddressVal(newValue);
                        handleContactFieldChange('address', newValue);
                      }}
                      onChange={(newValue) => {
                        setAddressVal(newValue);
                        handleContactFieldChange('address', newValue);
                      }}
                      className="mt-1 text-sm font-medium text-sand-900"
                      placeholder="Adres girin"
                    />
                  ) : (
                    <p className="text-sand-600 text-sm mt-0.5">{addressVal}</p>
                  )}
                </div>
              </div>

              {/* Telefon */}
              <div className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sand-800">Telefon</p>
                  {isEditing ? (
                    <EditableText
                      value={phoneVal}
                      onSave={(newValue) => {
                        setPhoneVal(newValue);
                        handleContactFieldChange('phone', newValue);
                      }}
                      onChange={(newValue) => {
                        setPhoneVal(newValue);
                        handleContactFieldChange('phone', newValue);
                      }}
                      className="mt-1 text-sm font-medium text-sand-900"
                      placeholder="Telefon girin"
                    />
                  ) : (
                    <p className="text-sand-600 text-sm mt-0.5">{phoneVal}</p>
                  )}
                </div>
              </div>

              {/* E-posta */}
              <div className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sand-800">E-posta</p>
                  {isEditing ? (
                    <EditableText
                      value={emailVal}
                      onSave={(newValue) => {
                        setEmailVal(newValue);
                        handleContactFieldChange('email', newValue);
                      }}
                      onChange={(newValue) => {
                        setEmailVal(newValue);
                        handleContactFieldChange('email', newValue);
                      }}
                      className="mt-1 text-sm font-medium text-sand-900"
                      placeholder="E-posta girin"
                    />
                  ) : (
                    <p className="text-sand-600 text-sm mt-0.5">{emailVal}</p>
                  )}
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sand-800">Çalışma Saatleri</p>
                  {isEditing ? (
                    <EditableText
                      value={hoursVal}
                      onSave={(newValue) => {
                        setHoursVal(newValue);
                        handleContactFieldChange('working_hours', newValue);
                      }}
                      onChange={(newValue) => {
                        setHoursVal(newValue);
                        handleContactFieldChange('working_hours', newValue);
                      }}
                      className="mt-1 text-sm font-medium text-sand-900"
                      placeholder="Çalışma saatleri girin"
                    />
                  ) : (
                    <p className="text-sand-600 text-sm mt-0.5">{hoursVal}</p>
                  )}
                </div>
              </div>

            </div>

            <div className="rounded-3xl overflow-hidden shadow-soft mt-6 aspect-video">
              <img
                src={displayContent?.contact_image || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt="Dükkanımız"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form Section */}
          <div>
            <h2 className="font-display text-2xl font-bold text-sand-900 mb-6">
              {isEditing ? (
                <EditableText
                  value="Mesaj Gönderin"
                  onSave={(newValue) => onTextChange('contact_form_title', newValue)}
                />
              ) : (
                'Mesaj Gönderin'
              )}
            </h2>
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div>
                <label className="label">Adınız Soyadınız *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Adınız"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">E-posta *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="ornek@email.com"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="label">Konu</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                  placeholder="Mesaj konusu"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="label">Mesajınız *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Mesajınızı buraya yazın..."
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>
              <button type="submit" className={`btn-primary w-full ${sent ? 'bg-leaf-600 hover:bg-leaf-600' : ''}`}>
                {sent ? (
                  <>
                    <Check className="w-5 h-5" />
                    Mesaj Gönderildi
                  </>
                ) : isSubmitting ? (
                  <>Gönderiliyor...</>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Gönder
                  </>
                )}
              </button>
              {sent && (
                <p className="text-sm text-leaf-600 text-center">Teşekkürler! En kısa sürede size dönüş yapacağız.</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}