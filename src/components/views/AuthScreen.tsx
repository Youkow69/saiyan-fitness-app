import { useState, useEffect } from 'react'

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, name: string) => Promise<void>
  onSkip: () => void
  loading: boolean
}

export function AuthScreen({ onSignIn, onSignUp, onSkip, loading }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [checkingConnection, setCheckingConnection] = useState(true)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Check connectivity on mount
  useEffect(() => {
    const timer = setTimeout(() => setCheckingConnection(false), 1500)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSignupSuccess(false)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await onSignIn(email, password)
      } else {
        if (name.trim().length < 2) { setError('Nom trop court (2 caract\u00E8res min)'); setSubmitting(false); return }
        if (!isEmailValid) { setError('Adresse email invalide'); setSubmitting(false); return }
        if (!isPasswordValid) { setError('Mot de passe trop court (6 caract\u00E8res min)'); setSubmitting(false); return }
        await onSignUp(email, password, name)
        // If we reach here without error, signup succeeded
        setSignupSuccess(true)
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion')
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #0c0c14)', color: 'var(--text, #f0f0f5)', padding: 24,
    }}>
      {/* Offline badge */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: '#ef4444', color: '#fff', padding: '8px 16px',
          textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
        }}>
          Mode hors ligne \u2014 pas de connexion internet
        </div>
      )}

      {/* Checking connection */}
      {checkingConnection && (
        <div style={{
          position: 'fixed', top: isOnline ? 0 : 32, left: 0, right: 0, zIndex: 99,
          background: 'rgba(255,140,0,0.9)', color: '#000', padding: '6px 16px',
          textAlign: 'center', fontSize: '0.75rem', fontWeight: 600,
        }}>
          V\u00E9rification de la connexion...
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', margin: 0, letterSpacing: '0.04em' }}>
          Saiyan Fitness
        </h1>
        <p style={{ color: 'var(--text-secondary, #a0a8c0)', fontSize: '0.9rem', marginTop: 4 }}>
          {mode === 'login' ? 'Content de te revoir, guerrier' : 'Rejoins les rangs'}
        </p>
      </div>

      {/* Signup success message */}
      {signupSuccess && (
        <div style={{
          width: '100%', maxWidth: 360, marginBottom: 16,
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22c55e', fontSize: '0.85rem', textAlign: 'center',
        }}>
          Compte cr\u00E9\u00E9 ! V\u00E9rifie ton email pour confirmer ton inscription, puis connecte-toi.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {mode === 'signup' && (
          <input
            type="text" placeholder="Nom de guerrier" value={name}
            onChange={e => setName(e.target.value)}
            style={{
              padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border, rgba(255,255,255,0.06))',
              background: 'var(--bg-card, #16182a)', color: 'var(--text)', fontSize: '0.95rem',
            }}
            aria-label="Nom"
          />
        )}
        <div style={{ position: 'relative' }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); if (!emailTouched) setEmailTouched(true) }}
            onBlur={() => setEmailTouched(true)}
            required
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${emailTouched && email && !isEmailValid ? 'rgba(239,68,68,0.5)' : 'var(--border, rgba(255,255,255,0.06))'}`,
              background: 'var(--bg-card, #16182a)', color: 'var(--text)', fontSize: '0.95rem',
            }}
            aria-label="Email"
          />
          {emailTouched && email && !isEmailValid && (
            <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: 4, paddingLeft: 4 }}>
              Email invalide
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password}
            onChange={e => { setPassword(e.target.value); if (!passwordTouched) setPasswordTouched(true) }}
            onBlur={() => setPasswordTouched(true)}
            required minLength={6}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '14px 44px 14px 16px', borderRadius: 12,
              border: `1px solid ${passwordTouched && password && !isPasswordValid ? 'rgba(239,68,68,0.5)' : 'var(--border, rgba(255,255,255,0.06))'}`,
              background: 'var(--bg-card, #16182a)', color: 'var(--text)', fontSize: '0.95rem',
            }}
            aria-label="Mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-secondary, #a0a8c0)',
              cursor: 'pointer', fontSize: '0.85rem', padding: '4px',
            }}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            tabIndex={-1}
          >
            {showPassword ? '\uD83D\uDE48' : '\uD83D\uDC41\uFE0F'}
          </button>
          {passwordTouched && password && !isPasswordValid && (
            <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: 4, paddingLeft: 4 }}>
              6 caract\u00E8res minimum
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.8rem', textAlign: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting || loading} style={{
          padding: '14px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #FF8C00, #FF6B00)', color: '#000',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSignupSuccess(false) }} style={{
          padding: '10px', borderRadius: 12, border: '1px solid var(--border, rgba(255,255,255,0.06))',
          background: 'transparent', color: 'var(--text-secondary, #a0a8c0)', fontSize: '0.85rem', cursor: 'pointer',
        }}>
          {mode === 'login' ? "Pas de compte ? S'inscrire" : "D\u00E9j\u00E0 un compte ? Se connecter"}
        </button>

        <button type="button" onClick={onSkip} style={{
          padding: '10px', border: 'none', background: 'transparent',
          color: 'var(--text-secondary, #a0a8c0)', fontSize: '0.8rem', cursor: 'pointer',
          textDecoration: 'underline',
        }}>
          Continuer sans compte (mode local)
        </button>
      </form>
    </div>
  )
}
