import React, { useState } from 'react';
import { Mail, Lock, User, X, Flower2, KeyRound } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Adım: 6 Haneli Kod Gönderme Akışı
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('❌ Lütfen e-posta adresinizi girin.');
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      // Supabase'in yerleşik recovery token akışı (veya özel OTP)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      setLoading(false);

      if (error) {
        setMessage('❌ ' + error.message);
      } else {
        setMessage('✅ 🌸 6 haneli doğrulama kodunuz e-posta adresinize gönderildi!');
        setMode('verify'); // Kod ve yeni şifre ekranına geç
      }
    } catch (err: any) {
      setLoading(false);
      setMessage('❌ Bir hata oluştu: ' + err.message);
    }
  };

  // 2. Adım: 6 Haneli Kodu Doğrulayıp Yeni Şifreyi Kaydetme
  // 🌸 Şifremi Unuttum Sonrası Yeni Şifreyi Kaydetme
  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setMessage('❌ Lütfen kodu ve yeni şifrenizi girin.');
      return;
    }

    setMessage('');
    setLoading(true);

    try {
      // 1. Kodu doğrula
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'recovery',
      });

      if (otpError) {
        setLoading(false);
        setMessage('❌ Kod hatalı veya süresi dolmuş: ' + otpError.message);
        return;
      }

      // 2. Yeni şifreyi kesin olarak güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      setLoading(false);

      if (updateError) {
        setMessage('❌ Şifre güncellenemedi: ' + updateError.message);
      } else {
        setMessage('✅ Şifreniz başarıyla değiştirildi! Yeni şifrenizle giriş yapabilirsiniz.');
        setTimeout(() => {
          setMode('signin');
          setPassword(newPassword);
          setCode('');
          setNewPassword('');
          setMessage('');
        }, 2000);
      }
    } catch (err: any) {
      setLoading(false);
      setMessage('❌ Bir hata oluştu: ' + err.message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'customer' },
        },
      });

      setLoading(false);

      if (error) {
        setMessage('❌ ' + error.message);
      } else {
        setMessage('✅ Kayıt başarılı! Giriş yapabilirsiniz.');
        setMode('signin');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        setMessage('❌ ' + error.message);
        return;
      }

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
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-sand-400 hover:text-sand-600 rounded-full hover:bg-sand-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-200">
            <Flower2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-sand-900">
            {mode === 'forgot' && 'Şifremi Unuttum'}
            {mode === 'verify' && 'Yeni Şifre Belirleme'}
            {mode === 'signup' && 'Hesap Oluştur'}
            {mode === 'signin' && 'Giriş Yap'}
          </h2>
          <p className="text-xs text-sand-500 mt-1">
            {mode === 'forgot' && 'E-postanıza 6 haneli doğrulama kodu gönderelim'}
            {mode === 'verify' && 'E-postanıza gelen 6 haneli kodu ve yeni şifrenizi girin'}
            {mode === 'signup' && 'Taze çiçekler dünyasına katılın'}
            {mode === 'signin' && 'Flower Shop — Hoş Geldiniz'}
          </p>
        </div>

        {/* 1. E-posta İsteme Formu */}
        {mode === 'forgot' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-sand-700 ml-1">E-posta Adresiniz</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Kod Gönderiliyor...' : '6 Haneli Kod Gönder'}
            </button>
          </form>
        )}

        {/* 2. 6 Haneli Kod ve Yeni Şifre Giriş Formu */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyAndSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-sand-700 ml-1">E-postanıza Gelen 6 Haneli Kod</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-sand-700 ml-1">Yeni Şifre</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Yeni Şifreyi Kaydet'}
            </button>
          </form>
        )}

        {/* 3. Normal Giriş ve Kayıt Formu */}
        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
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
                    className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
            )}

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
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-sand-700">Şifre</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setMessage(''); }}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
                  >
                    Şifremi Unuttum?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-sand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'İşlem yapılıyor...' : mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs font-medium text-center border ${
              message.startsWith('❌') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          {mode !== 'signin' && mode !== 'signup' ? (
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(''); }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            >
              ← Giriş ekranına geri dön
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            >
              {mode === 'signin' ? 'Hesabınız yok mu? Kayıt Ol' : 'Zaten hesabınız var mı? Giriş Yap'}
            </button>
          )}

          <p className="text-[11px] text-sand-400 pt-2 border-t border-sand-100">
            Hesabınıza giriş yaparak tüm siparişlerinize ve avantajlara ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;