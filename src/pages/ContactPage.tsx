import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Check } from 'lucide-react';
import type { Route } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const crumbs = [
    { label: 'Anasayfa', route: { name: 'home' } as Route },
    { label: 'İletişim' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Ad gerekli';
    if (!form.email.trim()) newErrors.email = 'E-posta gerekli';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Geçerli bir e-posta girin';
    if (!form.message.trim()) newErrors.message = 'Mesaj gerekli';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    }
  };

  const contactInfo = [
    { icon: MapPin, title: 'Adres', value: 'İstiklal Cd. No:123, Beyoğlu, İstanbul' },
    { icon: Phone, title: 'Telefon', value: '0850 123 45 67' },
    { icon: Mail, title: 'E-posta', value: 'destek@cicekci.com' },
    { icon: Clock, title: 'Çalışma Saatleri', value: 'Her gün 08:00 - 22:00' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-brand-50 via-sand-50 to-leaf-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 text-center">
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-sand-900">İletişime Geçin</h1>
            <p className="text-sand-600 mt-3 text-lg max-w-xl mx-auto">
              Sorularınız, özel siparişler veya işbirlikleri için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <h2 className="font-display text-2xl font-bold text-sand-900 mb-6">İletişim Bilgileri</h2>
            <div className="space-y-4">
              {contactInfo.map((info) => (
                <div key={info.title} className="card p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sand-800">{info.title}</p>
                    <p className="text-sand-600 text-sm mt-0.5">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl overflow-hidden shadow-soft mt-6 aspect-video">
              <img
                src="https://images.pexels.com/photos/568685/pexels-photo-568685.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Dükkanımız"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="font-display text-2xl font-bold text-sand-900 mb-6">Mesaj Gönderin</h2>
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div>
                <label className="label">Adınız Soyadınız *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Adınız"
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
                />
              </div>
              <div>
                <label className="label">Mesajınız *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Mesajınızı buraya yazın..."
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>
              <button type="submit" className={`btn-primary w-full ${sent ? 'bg-leaf-600 hover:bg-leaf-600' : ''}`}>
                {sent ? (
                  <>
                    <Check className="w-5 h-5" />
                    Mesaj Gönderildi
                  </>
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
