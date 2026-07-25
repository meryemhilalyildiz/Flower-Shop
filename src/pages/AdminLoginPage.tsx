import { useState, useEffect } from 'react';
import { Flower2, Lock, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { checkAdminAccess } from '../services/adminApi';

interface Props {
  onLoginSuccess: () => void;
}

export default function AdminLoginPage({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccessfulAdminLogin = () => {
    window.location.hash = '#/admin/dashboard';
    onLoginSuccess();
  };

  useEffect(() => {
    // Eğer zaten admin olarak giriş yapılmışsa, direkt dashboard'a yönlendir
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (uid && (await checkAdminAccess(uid))) {
        handleSuccessfulAdminLogin();
      }
    });
  }, [onLoginSuccess]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error || !data.user) {
        setError(error?.message || 'Giriş başarısız');
        return;
      }

      const isAdmin = await checkAdminAccess(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError('Bu alana erişim yetkiniz yok.');
        return;
      }

      handleSuccessfulAdminLogin();
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-brand-50 to-sand-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-brand-600 text-white items-center justify-center shadow-lg shadow-brand-200">
            <Flower2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl text-sand-900">Yönetim Paneli</h1>
          <p className="text-sand-600 text-sm mt-1">Flower Shop — Yönetici Girişi</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-sand-200">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-sand-700 mb-2">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="admin@flowershop.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-sand-700 mb-2">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sand-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <p className="text-xs text-sand-500 text-center">
            Yalnızca yönetici hesapları erişebilir.
          </p>
        </form>
      </div>
    </div>
  );
}
