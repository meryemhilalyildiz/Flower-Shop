import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  
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
            role: 'customer',
          }
        }
      })

      setLoading(false)

      if (error) {
        setMessage('❌ ' + error.message)
      } else {
        setMessage('✅ Kayıt başarılı! Giriş yapabilirsiniz.')
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

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {isSignUp && (
            <input type="text" placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          )}

          <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
          
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#e11d48', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
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
