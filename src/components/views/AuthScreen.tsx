import { useState } from 'react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await onSignIn(email, password)
      } else {
        if (name.trim().length < 2) { setError('Nom trop court'); setSubmitting(false); return }
        if (password.length < 6) { setError('Mot de passe trop court (6 min)'); setSubmitting(false); return }
        await onSignUp(email, password, name)
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
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', margin: 0, letterSpacing: '0.04em' }}>
          Saiyan Fitness
        </h1>
        <p style={{ color: 'var(--text-secondary, #a0a8c0)', fontSize: '0.9rem', marginTop: 4 }}>
          {mode === 'login' ? 'Content de te revoir, guerrier' : 'Rejoins les rangs'}
        </p>
      </div>

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
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={{
            padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border, rgba(255,255,255,0.06))',
            background: 'var(--bg-card, #16182a)', color: 'var(--text)', fontSize: '0.95rem',
          }}
          aria-label="Email"
        />
        <input
          type="password" placeholder="Mot de passe" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6}
          style={{
            padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border, rgba(255,255,255,0.06))',
            background: 'var(--bg-card, #16182a)', color: 'var(--text)', fontSize: '0.95rem',
          }}
          aria-label="Mot de passe"
        />

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

        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
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
