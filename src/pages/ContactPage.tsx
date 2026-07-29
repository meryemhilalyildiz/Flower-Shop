import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Check } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import { usePageContent } from '../hooks/usePageContent';
import EditableText from '../components/admin/EditableText';
import EditableImage from '../components/admin/EditableImage';
import { useAdminEditing } from '../contexts/AdminEditingContext';
import { supabase } from '../supabaseClient';

// Icon mapping for database string names to actual components
const iconMap: Record<string, any> = {
  MapPin,
  Phone,
  Mail,
  Clock,
};

type Props = {
  navigate: (r: Route) => void;
};

export default function ContactPage({ navigate }: Props) {
  const { content, loading } = usePageContent('contact');
  const { isEditing, onTextChange, onImageChange } = useAdminEditing();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'İletişim' },
  ];

  // Varsayılan değerler
  const defaultContactInfo = [
    { icon: 'MapPin', title: 'Adres', value: 'İstiklal Cd. No:123, Beyoğlu, İstanbul' },
    { icon: 'Phone', title: 'Telefon', value: '0850 123 45 67' },
    { icon: 'Mail', title: 'E-posta', value: 'flowershop.iletisim@gmail.com' },
    { icon: 'Clock', title: 'Çalışma Saatleri', value: 'Her gün 08:00 - 22:00' },
  ];

  const contactInfo = content?.contact_info || defaultContactInfo;

  // Icon string'ini bileşene çevir
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || MapPin;
  };
  const heroTitle = content?.hero_title || 'İletişime Geçin';
  const heroDescription = content?.hero_description || 'Sorularınız, özel siparişler veya işbirlikleri için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.';
  const contactImage = content?.contact_image || 'https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800';

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
      <div className="bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 text-center">
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
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
              {contactInfo.map((info: any, index: number) => {
                const IconComponent = getIconComponent(info.icon);
                return (
                  <div key={info.title} className="card p-5 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sand-800">{info.title}</p>
                      <p className="text-sand-600 text-sm mt-0.5">
                        {isEditing ? (
                          <EditableText
                            value={info.value}
                            onSave={(newValue) => onTextChange(`contact_info.${index}.value`, newValue)}
                          />
                        ) : (
                          info.value
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl overflow-hidden shadow-soft mt-6 aspect-video">
              {isEditing ? (
                <EditableImage
                  src={contactImage}
                  alt="Dükkanımız"
                  onSave={(newSrc) => onImageChange('contact_image', newSrc)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={contactImage}
                  alt="Dükkanımız"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Form */}
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
