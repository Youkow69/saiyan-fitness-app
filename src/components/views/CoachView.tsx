import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getDailyNutrition, getPowerLevel, getStreak, getWeeklyWorkouts } from '../../lib'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}


// Local fallback when Gemini edge function is unavailable
function getLocalFallback(question: string, context: any): string {
  const q = question.toLowerCase()
  const offline = '\n\n⚠️ Réponse hors-ligne. Vérifie ta clé Gemini dans Supabase > Edge Functions > coach-ai > Secrets.'

  if (q.includes('programme') || q.includes('routine') || q.includes('ance')) {
    const days = context?.trainingDays || 4
    return 'Pour ' + days + ' jours/semaine, je recommande un PPL :\n'
      + '\n• Jour 1 : Push (Bench, OHP, Dips, Lateral Raise)'
      + '\n• Jour 2 : Pull (Deadlift, Row, Pull-up, Curl)'
      + '\n• Jour 3 : Legs (Squat, RDL, Leg Press, Calf Raise)'
      + '\n• Jour 4 : Upper (Incline Bench, Chin-up, Face Pull)'
      + '\n\nVise 3-4 sets de 8-12 reps, RIR 2.' + offline
  }

  if (q.includes('nutrition') || q.includes('macro') || q.includes('calorie') || q.includes('manger')) {
    const w = context?.weight || 75
    return 'Macros recommandés pour ' + w + 'kg :\n'
      + '\n• Protéines : ' + Math.round(w * 2) + 'g/jour'
      + '\n• Lipides : ' + Math.round(w * 0.8) + 'g/jour'
      + '\n• Glucides : le reste de tes calories'
      + '\n\nSources : poulet, thon, oeufs, whey, fromage blanc.' + offline
  }

  if (q.includes('deload') || q.includes('repos') || q.includes('fatigue')) {
    return 'Signes de deload nécessaire :\n'
      + '\n• RIR moyen < 1 sur 3 séances'
      + '\n• Courbatures > 72h'
      + '\n• Aucun PR depuis 3+ séances'
      + '\n\nDeload = -40% volume, -20% poids pendant 1 semaine. Senzu Bean !' + offline
  }

  return 'Le coach Whis est temporairement indisponible.\n\n'
    + 'En attendant :\n'
    + '• Générateur de séance (onglet Training)\n'
    + '• ReadinessScore pour évaluer ta forme\n'
    + '• Macros dans l\'onglet Nutrition' + offline
}

export const CoachView: React.FC = React.memo(function CoachView() {
  const { state } = useAppState()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check auth status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      if (session) loadHistory(session.user.id)
      else setLoadingHistory(false)
    })
  }, [])

  async function loadHistory(userId: string) {
    const { data } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setMessages(data as Message[])
    setLoadingHistory(false)
  }

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      })
      if (error) throw error
      setIsLoggedIn(true)
      localStorage.removeItem('sf_local_mode')
      if (data.user) loadHistory(data.user.id)
    } catch (e: any) {
      setAuthError(e.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : e.message || 'Erreur de connexion')
    }
    setAuthLoading(false)
  }

  const handleSignup = async () => {
    if (!authEmail.trim() || !authPassword) return
    if (authPassword.length < 6) { setAuthError('Mot de passe : 6 caractères minimum'); return }
    setAuthLoading(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      })
      if (error) throw error
      setAuthError('')
      setIsLoggedIn(true)
      localStorage.removeItem('sf_local_mode')
    } catch (e: any) {
      setAuthError(e.message || 'Erreur')
    }
    setAuthLoading(false)
  }

  const buildContext = useCallback(() => {
    const nutrition = getDailyNutrition(state.foodEntries)
    const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
    return {
      profile: state.profile ? {
        age: state.profile.age,
        weightKg: state.profile.weightKg,
        heightCm: state.profile.heightCm,
        goal: state.profile.goal,
      } : undefined,
      recentWorkouts: weeklyWorkouts.length,
      todayNutrition: nutrition,
      targets: state.targets,
      powerLevel: getPowerLevel(state),
      streak: getStreak(state),
    }
  }, [state])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non connecté')

      const resp = await fetch(
        SUPABASE_URL + '/functions/v1/coach-ai',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: text,
            context: buildContext(),
          }),
        }
      )

      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      // Fallback: generate a local response based on the question
      const localReply = getLocalFallback(text, buildContext())
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: localReply,
      }])
    }
    setLoading(false)
  }, [input, loading, buildContext])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'Comment améliorer mon développé couché ?',
    'Programme pour prendre de la masse',
    'Combien de protéines par jour ?',
    'Conseils de récupération',
  ]

  // ── Not logged in: show inline login ──
  if (isLoggedIn === false) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: 24 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{'🥊'}</div>
        <h2 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '1.2rem' }}>Coach Saiyan</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center', margin: '0 0 20px', maxWidth: 300 }}>
          Connecte-toi pour accéder au Coach IA. Utilise le même compte que Saiyan Fitness.
        </p>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <input
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            type="email"
            placeholder="Email"
            style={{
              width: '100%', padding: '10px 14px', marginBottom: 8, borderRadius: 10,
              border: '1px solid var(--stroke)', background: 'var(--bg-card)',
              color: 'var(--text)', fontSize: '0.85rem', boxSizing: 'border-box',
            }}
          />
          <input
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            type="password"
            placeholder="Mot de passe"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: 10, borderRadius: 10,
              border: '1px solid var(--stroke)', background: 'var(--bg-card)',
              color: 'var(--text)', fontSize: '0.85rem', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLogin}
              disabled={authLoading}
              type="button"
              className="cta-button"
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              {authLoading ? '...' : 'Connexion'}
            </button>
            <button
              onClick={handleSignup}
              disabled={authLoading}
              type="button"
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: '1px solid var(--accent)', background: 'transparent',
                color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              Inscription
            </button>
          </div>
          {authError && (
            <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-red)', textAlign: 'center' }}>
              {authError}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (isLoggedIn === null) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Chargement...</div>
      </div>
    )
  }

  // ── Logged in: show chat ──
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--stroke)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-orange), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {'🥊'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Coach Saiyan</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Expert musculation & nutrition</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {loadingHistory && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: '0.82rem' }}>
            Chargement...
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{'🥊'}</div>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '1rem' }}>Coach Saiyan</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 16px' }}>
              Pose-moi tes questions sur la musculation, la nutrition ou la récupération.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  type="button"
                  style={{
                    padding: '6px 12px', borderRadius: 16,
                    border: '1px solid var(--stroke)', background: 'var(--bg-card)',
                    color: 'var(--text)', fontSize: '0.75rem', cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: 16,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent-orange), var(--accent))'
                : 'var(--bg-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '0.85rem', lineHeight: 1.5,
              borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-orange)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.6,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px 16px', borderTop: '1px solid var(--stroke)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pose ta question au coach..."
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 20,
            border: '1px solid var(--stroke)', background: 'var(--bg-card)',
            color: 'var(--text)', fontSize: '0.85rem', resize: 'none',
            outline: 'none', maxHeight: 100, lineHeight: 1.4,
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          type="button"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, var(--accent-orange), var(--accent))'
              : 'var(--bg-elev)',
            color: input.trim() && !loading ? '#fff' : 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {'↑'}
        </button>
      </div>
    </div>
  )
})
