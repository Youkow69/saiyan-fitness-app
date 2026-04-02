import { useCallback, useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import {
  getPowerLevel,
  getCurrentTransformationFull,
  getTotalVolume,
} from '../../lib'
import { showToast } from '../ui/Toast'

// ── Types ───────────────────────────────────────────────────────────
interface WarriorCard {
  id: string
  name: string
  powerLevel: number
  transformation: string
  workouts: number
  volume: number
  addedAt: string
}

// ── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'sf_friends'

// ── Encoding / Decoding ─────────────────────────────────────────────
function encodeWarrior(card: Omit<WarriorCard, 'addedAt'>): string {
  const payload = JSON.stringify(card)
  return btoa(unescape(encodeURIComponent(payload)))
}

function decodeWarrior(code: string): Omit<WarriorCard, 'addedAt'> | null {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())))
    const parsed = JSON.parse(json)
    if (!parsed.id || !parsed.name || typeof parsed.powerLevel !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

// ── Storage ─────────────────────────────────────────────────────────
function loadFriends(): WarriorCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WarriorCard[]) : []
  } catch {
    return []
  }
}

function saveFriends(friends: WarriorCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(friends))
}

// ── Generate stable user ID ─────────────────────────────────────────
function getUserId(): string {
  const KEY = 'sf_user_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = 'w_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem(KEY, id)
  }
  return id
}

// ── Rank badge ──────────────────────────────────────────────────────
function getRankIcon(index: number): string {
  if (index === 0) return '1'
  if (index === 1) return '2'
  if (index === 2) return '3'
  return String(index + 1)
}

function getRankColor(index: number): string {
  if (index === 0) return '#FFD700'
  if (index === 1) return '#C0C0C0'
  if (index === 2) return '#CD7F32'
  return 'var(--text-secondary)'
}

// ── Component ───────────────────────────────────────────────────────
export function Leaderboard() {
  const { state } = useAppState()
  const [friends, setFriends] = useState<WarriorCard[]>(loadFriends)
  const [inputCode, setInputCode] = useState('')
  const [showMyCode, setShowMyCode] = useState(false)

  const userPL = useMemo(() => getPowerLevel(state), [state])
  const tf = useMemo(() => getCurrentTransformationFull(state), [state])
  const volume = useMemo(() => getTotalVolume(state.workouts), [state.workouts])

  const userId = useMemo(() => getUserId(), [])
  const userName = state.profile?.name || 'Guerrier anonyme'

  // Build own warrior card
  const myCard: Omit<WarriorCard, 'addedAt'> = useMemo(
    () => ({
      id: userId,
      name: userName,
      powerLevel: userPL,
      transformation: tf.current.name,
      workouts: state.workouts.length,
      volume,
    }),
    [userId, userName, userPL, tf, state.workouts.length, volume],
  )

  const myCode = useMemo(() => encodeWarrior(myCard), [myCard])

  // Combined sorted list (self + friends)
  const leaderboard = useMemo(() => {
    const self: WarriorCard = { ...myCard, addedAt: '' }
    const all = [self, ...friends]
    return all.sort((a, b) => b.powerLevel - a.powerLevel)
  }, [myCard, friends])

  // Add friend
  const addFriend = useCallback(() => {
    const decoded = decodeWarrior(inputCode)
    if (!decoded) {
      showToast('Code invalide. Verifie et reessaie.', 'error')
      return
    }
    if (decoded.id === userId) {
      showToast('C\'est ton propre code !', 'error')
      return
    }
    // Update if exists, otherwise add
    const existing = friends.findIndex((f) => f.id === decoded.id)
    let updated: WarriorCard[]
    if (existing >= 0) {
      updated = [...friends]
      updated[existing] = { ...decoded, addedAt: new Date().toISOString() }
      showToast(`${decoded.name} mis a jour !`, 'success')
    } else {
      updated = [...friends, { ...decoded, addedAt: new Date().toISOString() }]
      showToast(`${decoded.name} ajoute au classement !`, 'success')
    }
    saveFriends(updated)
    setFriends(updated)
    setInputCode('')
  }, [inputCode, friends, userId])

  // Remove friend
  const removeFriend = useCallback(
    (id: string) => {
      const updated = friends.filter((f) => f.id !== id)
      saveFriends(updated)
      setFriends(updated)
      showToast('Guerrier retire.', 'success')
    },
    [friends],
  )

  // Copy own code
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(myCode)
      showToast('Code copie !', 'success')
    } catch {
      showToast('Impossible de copier. Copie manuellement.', 'error')
    }
  }, [myCode])

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>Classement guerriers</h3>

      {/* Leaderboard list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {leaderboard.map((w, i) => {
          const isMe = w.id === userId
          return (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: isMe ? '#FF8C0012' : '#ffffff06',
                border: isMe ? '1px solid #FF8C0033' : '1px solid transparent',
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: getRankColor(i),
                  minWidth: 24,
                  textAlign: 'center',
                }}
              >
                {getRankIcon(i)}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: isMe ? '#FF8C00' : 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w.name} {isMe && '(toi)'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {w.transformation} · {w.workouts} seances
                </div>
              </div>

              {/* Power Level */}
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: getRankColor(i) }}>
                {w.powerLevel.toLocaleString('fr-FR')}
              </span>

              {/* Remove button (not for self) */}
              {!isMe && (
                <button
                  onClick={() => removeFriend(w.id)}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                  }}
                  title="Retirer"
                >
                  X
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* My warrior code */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShowMyCode(!showMyCode)}
          type="button"
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          {showMyCode ? 'Masquer mon code' : 'Afficher mon code guerrier'}
        </button>

        {showMyCode && (
          <div style={{ marginTop: 8 }}>
            <textarea
              readOnly
              value={myCode}
              style={{
                width: '100%',
                minHeight: 60,
                padding: 10,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button onClick={copyCode} type="button" style={actionBtnStyle}>
              Copier mon code
            </button>
          </div>
        )}
      </div>

      {/* Add friend */}
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
          Colle le code d'un ami pour l'ajouter au classement :
        </p>
        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Colle le code guerrier ici..."
          style={{
            width: '100%',
            minHeight: 50,
            padding: 10,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontFamily: 'monospace',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={addFriend}
          type="button"
          disabled={!inputCode.trim()}
          style={{
            ...actionBtnStyle,
            marginTop: 8,
            opacity: inputCode.trim() ? 1 : 0.5,
            cursor: inputCode.trim() ? 'pointer' : 'default',
          }}
        >
          Ajouter le guerrier
        </button>
      </div>
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
  margin: '0 0 12px',
}

const actionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
  color: '#000',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  marginTop: 6,
}
