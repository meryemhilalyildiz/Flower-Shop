import React, { useState } from 'react';
import { Mail, Lock, User, X, Flower2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (isSignUp) {
      // 📝 KAYIT OLMA AKIŞI
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer',
          },
        },
      });

      setLoading(false);

      if (error) {
        setMessage('❌ ' + error.message);
      } else {
        setMessage('✅ Kayıt başarılı! Giriş yapabilirsiniz.');
        setIsSignUp(false);
      }
    } else {
      // 🔑 GİRİŞ YAPMA AKIŞI
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        setMessage('❌ ' + error.message);
        return;
      }

      // Giriş yapan kullanıcının profil ve rol durumunu kontrol et
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      setLoading(false);

      if (profile?.role === 'admin') {
        setMessage('✅ Yönetici girişi başarılı!');
        setTimeout(() => {
          onClose();
          window.location.hash = '#/admin/dashboard';
        }, 500);
        return;
      }

      setMessage('✅ Giriş başarılı!');
      setTimeout(() => {
        onClose();
        window.location.hash = '#/magaza';
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-sand-100 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-sand-400 hover:text-sand-600 rounded-full hover:bg-sand-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Üst Logo ve Başlık */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-200">
            <Flower2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-sand-900">
            {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
          </h2>
          <p className="text-xs text-sand-500 mt-1">
            {isSignUp ? 'Taze çiçekler dünyasına katılın' : 'Flower Shop — Hoş Geldiniz'}
          </p>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleAuth} className="space-y-4">
          {/* Ad Soyad İnput (Yalnızca Kayıt Ol Modunda) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-sand-700 ml-1">Ad Soyad</label>
              <div className="relative">
                <User className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* E-posta İnput */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-sand-700 ml-1">E-posta</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Şifre İnput */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-sand-700 ml-1">Şifre</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Giriş Yap / Kayıt Ol Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'İşlem yapılıyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        {/* Mesaj Bildirim Kutusu */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs font-medium text-center border ${
              message.startsWith('❌')
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Alt Değiştirme ve Bilgi Metni */}
        <div className="mt-6 text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
          >
            {isSignUp ? 'Zaten hesabınız var mı? Giriş Yap' : 'Hesabınız yok mu? Kayıt Ol'}
          </button>

          <p className="text-[11px] text-sand-400 pt-2 border-t border-sand-100">
            Hesabınıza giriş yaparak tüm siparişlerinize ve avantajlara ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;