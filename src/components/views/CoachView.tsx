import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getDailyNutrition, getPowerLevel, getStreak, getWeeklyWorkouts } from '../../lib'
import { supabase } from '../../supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export const CoachView: React.FC = React.memo(function CoachView() {
  const { state } = useAppState()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load history on mount
  useEffect(() => {
    async function loadHistory() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoadingHistory(false); return }
      const { data } = await supabase
        .from('coach_messages')
        .select('role, content, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data as Message[])
      setLoadingHistory(false)
    }
    loadHistory()
  }, [])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

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
      if (!session) throw new Error('Non connect\u00e9')

      const resp = await fetch(
        `https://kwgqkycuviybgzyharwb.supabase.co/functions/v1/coach-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Erreur : ${err.message || 'Impossible de contacter le coach.'}`,
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
    'Comment am\u00e9liorer mon d\u00e9velopp\u00e9 couch\u00e9 ?',
    'Programme pour prendre de la masse',
    'Combien de prot\u00e9ines par jour ?',
    'Conseils de r\u00e9cup\u00e9ration',
  ]

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
          {'\uD83E\uDD4A'}
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
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{'\uD83E\uDD4A'}</div>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '1rem' }}>Coach Saiyan</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 16px' }}>
              Pose-moi tes questions sur la musculation, la nutrition ou la r\u00e9cup\u00e9ration.
              J'ai acc\u00e8s \u00e0 tes donn\u00e9es pour personnaliser mes conseils.
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
          {'\u2191'}
        </button>
      </div>
    </div>
  )
})
