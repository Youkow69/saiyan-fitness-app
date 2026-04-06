import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getPowerLevel, getStreak } from '../../lib'

// ── Types ───────────────────────────────────────────────────────────
interface RivalState {
  name: string
  powerLevel: number
  lastUpdate: string // ISO date
  startDate: string  // ISO date
  startPowerLevel: number
}

// ── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'sf_rival'
const DAILY_GAIN_ACTIVE = 150
const DAILY_GAIN_INACTIVE = 250
const INACTIVE_THRESHOLD_DAYS = 3

const VEGETA_TAUNTS_AHEAD = [
  "Tu crois pouvoir me depasser ? Pathétique.",
  "Je suis le prince des Saiyans. Tu n'es rien.",
  "Pendant que tu te reposes, je m'entraine.",
  "C'est tout ce que tu as ? Lamentable.",
  "Mon power level ne cesse de grandir. Et le tien ?",
  "Tu abandonnes deja ? Typique d'un guerrier de bas etage.",
  "Kakarot s'entrainait meme dans l'espace. Et toi ?",
  "Chaque jour sans entrainement, je prends l'avantage.",
]

const VEGETA_TAUNTS_BEHIND = [
  "Tch... Ne crois pas que ca va durer.",
  "Je te rattraperai. C'est une promesse.",
  "Profite bien de ton avance. Elle est temporaire.",
  "Tu as de la chance, rien de plus.",
  "Je vais m'entrainer 10 fois plus dur demain.",
  "Un vrai Saiyan ne reste jamais en arriere longtemps.",
]

const VEGETA_TAUNTS_CLOSE = [
  "Nous sommes au coude a coude... Interessant.",
  "Tu es presque a mon niveau. Presque.",
  "Le prochain entrainement decidera tout.",
]

// ── Helpers ─────────────────────────────────────────────────────────
function loadRival(): RivalState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RivalState) : null
  } catch {
    return null
  }
}

function saveRival(rival: RivalState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rival))
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
  )
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function updateRivalToToday(rival: RivalState, userIsActive: boolean): RivalState {
  const today = todayISO()
  const daysSinceUpdate = daysBetween(rival.lastUpdate, today)

  if (daysSinceUpdate <= 0) return rival

  const dailyGain = userIsActive ? DAILY_GAIN_ACTIVE : DAILY_GAIN_INACTIVE
  const newPL = rival.powerLevel + dailyGain * daysSinceUpdate

  return { ...rival, powerLevel: newPL, lastUpdate: today }
}

// ── Component ───────────────────────────────────────────────────────
export function RivalSystem() {
  const { state } = useAppState()
  const [rival, setRival] = useState<RivalState | null>(loadRival)

  const userPL = useMemo(() => getPowerLevel(state), [state])
  const streak = useMemo(() => getStreak(state), [state])

  // Determine if user has been active recently
  const hasRecentWorkout = state.workouts.length > 0
    && daysBetween(state.workouts[state.workouts.length - 1].date, todayISO()) <= INACTIVE_THRESHOLD_DAYS
  const userIsActive = streak > 0 || hasRecentWorkout

  // Initialize rival on first use
  const initRival = useCallback(() => {
    const newRival: RivalState = {
      name: 'Vegeta',
      powerLevel: userPL,
      lastUpdate: todayISO(),
      startDate: todayISO(),
      startPowerLevel: userPL,
    }
    saveRival(newRival)
    setRival(newRival)
  }, [userPL])

  // Update rival daily
  useEffect(() => {
    if (!rival) return
    const updated = updateRivalToToday(rival, userIsActive)
    if (updated !== rival) {
      saveRival(updated)
      setRival(updated)
    }
  }, [rival, userIsActive])

  // Reset rival
  const resetRival = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRival(null)
  }, [])

  // ── Taunt logic ──
  const taunt = useMemo(() => {
    if (!rival) return ''
    const diff = rival.powerLevel - userPL
    const threshold = Math.max(userPL * 0.05, 200)

    if (diff > threshold) return pickRandom(VEGETA_TAUNTS_AHEAD)
    if (diff < -threshold) return pickRandom(VEGETA_TAUNTS_BEHIND)
    return pickRandom(VEGETA_TAUNTS_CLOSE)
  }, [rival, userPL])

  // ── Bar percentages ──
  const maxPL = rival ? Math.max(userPL, rival.powerLevel, 1) : userPL || 1
  const userPct = (userPL / maxPL) * 100
  const rivalPct = rival ? (rival.powerLevel / maxPL) * 100 : 0

  // ── Not initialized ──
  if (!rival) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>Rival : Vegeta</h3>
        <p style={descStyle}>
          Active ton rival ! Vegeta s'entrainera chaque jour. S'il te depasse... tu
          subiras ses moqueries.
        </p>
        <button onClick={initRival} type="button" style={btnStyle}>
          Activer le rival
        </button>
      </div>
    )
  }

  const vegetaAhead = rival.powerLevel > userPL

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>Rival : Vegeta</h3>

      {/* Taunt */}
      <p
        style={{
          fontSize: '0.82rem',
          fontStyle: 'italic',
          color: vegetaAhead ? '#EF4444' : '#10B981',
          margin: '0 0 12px',
          minHeight: 36,
        }}
      >
        « {taunt} »
      </p>

      {/* Comparison bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {/* User bar */}
        <div>
          <div style={barLabelRow}>
            <span style={{ color: '#FF8C00', fontWeight: 600, fontSize: '0.82rem' }}>Toi</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {userPL.toLocaleString('fr-FR')}
            </span>
          </div>
          <div style={barTrack}>
            <div
              style={{
                ...barFill,
                width: `${userPct}%`,
                background: 'linear-gradient(90deg, #FF8C00, #FF6B00)',
              }}
            />
          </div>
        </div>

        {/* Vegeta bar */}
        <div>
          <div style={barLabelRow}>
            <span style={{ color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}>Vegeta</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {rival.powerLevel.toLocaleString('fr-FR')}
            </span>
          </div>
          <div style={barTrack}>
            <div
              style={{
                ...barFill,
                width: `${rivalPct}%`,
                background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Delta */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: vegetaAhead ? '#EF4444' : '#10B981',
          margin: '0 0 8px',
        }}
      >
        {vegetaAhead
          ? `Vegeta te devance de ${(rival.powerLevel - userPL).toLocaleString('fr-FR')} PL`
          : `Tu devances Vegeta de ${(userPL - rival.powerLevel).toLocaleString('fr-FR')} PL`}
      </p>

      {/* Info */}
      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #999)', margin: '0 0 8px', textAlign: 'center' }}>
        Vegeta gagne {DAILY_GAIN_ACTIVE}/jour si tu t'entraines, {DAILY_GAIN_INACTIVE}/jour sinon.
        {!userIsActive && (
          <span style={{ color: '#EF4444' }}> Tu es inactif !</span>
        )}
      </p>

      <button onClick={resetRival} type="button" style={resetBtnStyle}>
        Reinitialiser le rival
      </button>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  padding: 16,
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.1rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  margin: '0 0 8px',
}

const descStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  margin: '0 0 12px',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
}

const resetBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  fontSize: '0.8rem',
  cursor: 'pointer',
}

const barLabelRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
}

const barTrack: React.CSSProperties = {
  width: '100%',
  height: 14,
  borderRadius: 7,
  background: '#ffffff0a',
  overflow: 'hidden',
}

const barFill: React.CSSProperties = {
  height: '100%',
  borderRadius: 7,
  transition: 'width 0.6s ease',
  minWidth: 4,
}
