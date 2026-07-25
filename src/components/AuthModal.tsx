import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'customer' | 'company'>('customer')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGoToAdminLogin = () => {
    onClose()
    window.location.hash = '#/admin/login'
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (isSignUp) {
      // 📝 KAYIT OLMA AKIŞI
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            company_name: role === 'company' ? companyName : null,
          }
        }
      })

      setLoading(false)

      if (error) {
        setMessage('❌ ' + error.message)
      } else {
        if (role === 'company') {
          setMessage('⏳ Şirket kaydınız alındı! Yönetici onayından sonra giriş yapabilirsiniz.')
        } else {
          setMessage('✅ Kayıt başarılı! Giriş yapabilirsiniz.')
        }
      }
    } else {
      // 🔑 GİRİŞ YAPMA AKIŞI
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setLoading(false)
        setMessage('❌ ' + error.message)
        return
      }

      // Giriş yapan kullanıcının profil ve onay durumunu kontrol et
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      setLoading(false)

      if (profile && profile.role === 'company' && !profile.is_approved) {
        await supabase.auth.signOut()
        setMessage('⚠️ Şirket hesabınız henüz yönetici tarafından onaylanmamıştır.')
        return
      }

      if (profile?.role === 'admin') {
        setMessage('✅ Yönetici girişi başarılı!')
        setTimeout(() => {
          onClose()
          window.location.hash = '#/admin/dashboard'
        }, 500)
        return
      }

      setMessage('✅ Giriş başarılı!')
      setTimeout(() => {
        onClose()
        window.location.hash = '#/magaza'
      }, 500)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1rem', color: '#111827' }}>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
        
        {/* Müşteri / Şirket Sekme Seçimi */}
        {isSignUp && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setRole('customer')}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', background: role === 'customer' ? '#e11d48' : '#f3f4f6', color: role === 'customer' ? 'white' : 'black', cursor: 'pointer' }}
            >
              Müşteri
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', background: role === 'company' ? '#e11d48' : '#f3f4f6', color: role === 'company' ? 'white' : 'black', cursor: 'pointer' }}
            >
              Şirket (B2B)
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {isSignUp && (
            <input type="text" placeholder="Ad Soyad / Yetkili" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          )}

          {isSignUp && role === 'company' && (
            <input type="text" placeholder="Şirket Resmi Adı" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          )}

          <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#e11d48', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'İşleniyor...' : (isSignUp ? (role === 'company' ? 'Şirket Kaydı Oluştur' : 'Müşteri Kaydı Oluştur') : 'Giriş Yap')}
          </button>
        </form>

        {message && <p style={{ fontSize: '0.875rem', marginTop: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px' }}>{message}</p>}

        <p onClick={() => { setIsSignUp(!isSignUp); setMessage('') }} style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#2563eb', cursor: 'pointer', textAlign: 'center' }}>
          {isSignUp ? 'Zaten hesabınız var mı? Giriş Yap' : 'Hesabınız yok mu? Kayıt Ol'}
        </p>

        <button
          type="button"
          onClick={handleGoToAdminLogin}
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#111827', cursor: 'pointer', textAlign: 'center', textDecoration: 'underline' }}
        >
          Yönetici girişi için buraya tıklayın
        </button>
        
        <button onClick={onClose} style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', border: 'none', background: '#e5e7eb', borderRadius: '6px', cursor: 'pointer' }}>Kapat</button>
      </div>
    </div>
  )
}