// ── Leaderboard.tsx ───────────────────────────────────────────────────────────
// Tenkaichi Budokai rankings by power level, volume, streak, PRs.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getPowerLevel, getWorkoutVolume } from '../../lib'
import { supabase } from '../../supabase'

interface LeaderboardEntry {
  id: string
  username: string
  avatar_level: number
  power_level: number
  total_volume: number
  streak: number
  pr_count: number
  rank?: number
}

type SortKey = 'power_level' | 'total_volume' | 'streak' | 'pr_count'

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'power_level', label: 'Power Level', icon: '\u26A1' },
  { key: 'total_volume', label: 'Volume total', icon: '\U0001f4aa' },
  { key: 'streak', label: 'Streak', icon: '\U0001f525' },
  { key: 'pr_count', label: 'Records', icon: '\U0001f3c6' },
]

export function Leaderboard() {
  const { state } = useAppState()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('power_level')
  const [loading, setLoading] = useState(true)

  // Calculate my stats
  const myStats = useMemo(() => {
    const pl = getPowerLevel(state)
    const totalVol = state.workouts.reduce((sum, w) => sum + getWorkoutVolume(w), 0)
    let prCount = 0
    state.workouts.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => { if (s.isPR) prCount++ })
      })
    })
    return {
      id: 'me',
      username: state.profile?.name || 'Moi',
      avatar_level: Math.min(9, Math.floor((state.workouts.length || 0) / 10)),
      power_level: pl,
      total_volume: Math.round(totalVol),
      streak: state.workouts.length > 0 ? calculateStreak(state.workouts.map(w => w.date)) : 0,
      pr_count: prCount,
    }
  }, [state])

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('power_level', { ascending: false })
        .limit(50)

      if (data && data.length > 0) {
        setEntries(data as LeaderboardEntry[])
      } else {
        setEntries(getDemoLeaderboard())
      }
    } catch {
      setEntries(getDemoLeaderboard())
    }
    setLoading(false)
  }

  const sorted = useMemo(() => {
    const all = [...entries.filter(e => e.id !== 'me'), myStats]
    return all
      .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [entries, myStats, sortBy])

  const myRank = sorted.find(e => e.id === 'me')?.rank || 0

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h3 style={{
          fontFamily: "'Bebas Neue', 'Orbitron', sans-serif",
          fontSize: '1.1rem', letterSpacing: '0.05em', margin: '0 0 4px',
          color: 'var(--accent-gold, #ffd700)',
        }}>
          {'\U0001f3c6'} Tenkaichi Budokai
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
          Classement des guerriers
        </p>
      </div>

      {/* Sort tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto' }}>
        {SORT_OPTIONS.map(opt => (
          <button key={opt.key} type="button" onClick={() => setSortBy(opt.key)} style={{
            flex: 1, padding: '6px 8px', borderRadius: 8,
            border: sortBy === opt.key ? '1px solid var(--accent)' : '1px solid var(--border, #333)',
            background: sortBy === opt.key ? 'rgba(255,140,0,0.12)' : 'transparent',
            color: sortBy === opt.key ? 'var(--accent)' : 'var(--text-secondary, #888)',
            fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* My rank banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,140,0,0.12), rgba(255,215,0,0.08))',
        borderRadius: 12, padding: '10px 14px', marginBottom: 12,
        border: '1px solid rgba(255,215,0,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ton rang</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold, #ffd700)' }}>
            #{myRank}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{SORT_OPTIONS.find(o => o.key === sortBy)?.label}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {sortBy === 'total_volume' ? myStats[sortBy].toLocaleString() + ' kg' : myStats[sortBy].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sorted.slice(0, 20).map(entry => {
            const isMe = entry.id === 'me'
            const medalColors: Record<number, string> = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' }
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: isMe ? 'rgba(255,140,0,0.08)' : 'var(--bg-card, #1a1a1a)',
                border: isMe ? '1px solid var(--accent)' : '1px solid var(--border, #333)',
              }}>
                {/* Rank */}
                <span style={{
                  width: 28, textAlign: 'center', fontWeight: 800,
                  fontSize: entry.rank && entry.rank <= 3 ? '1rem' : '0.85rem',
                  color: (entry.rank && medalColors[entry.rank]) || 'var(--text-secondary, #888)',
                }}>
                  {entry.rank && entry.rank <= 3 ? (entry.rank === 1 ? '\U0001f947' : entry.rank === 2 ? '\U0001f948' : '\U0001f949') : `#${entry.rank}`}
                </span>

                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${entry.avatar_level >= 5 ? '#ffd700' : '#ff8c00'}, #333)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.7rem', color: '#000',
                }}>
                  {entry.avatar_level}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: isMe ? 800 : 600, fontSize: '0.85rem',
                    color: isMe ? 'var(--accent)' : 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.username} {isMe ? '(toi)' : ''}
                  </div>
                </div>

                {/* Score */}
                <span style={{
                  fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                  color: isMe ? 'var(--accent)' : 'var(--text)',
                }}>
                  {sortBy === 'total_volume'
                    ? Math.round(entry[sortBy]).toLocaleString() + ' kg'
                    : entry[sortBy].toLocaleString()
                  }
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1])
    const d2 = new Date(sorted[i])
    const diff = (d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000)
    if (diff <= 2) streak++
    else break
  }
  return streak
}

function getDemoLeaderboard(): LeaderboardEntry[] {
  return [
    { id: 'd1', username: 'Goku', avatar_level: 9, power_level: 9500, total_volume: 245000, streak: 42, pr_count: 87 },
    { id: 'd2', username: 'Vegeta', avatar_level: 9, power_level: 9200, total_volume: 238000, streak: 38, pr_count: 82 },
    { id: 'd3', username: 'Gohan', avatar_level: 7, power_level: 7100, total_volume: 165000, streak: 22, pr_count: 45 },
    { id: 'd4', username: 'Piccolo', avatar_level: 6, power_level: 5800, total_volume: 142000, streak: 30, pr_count: 38 },
    { id: 'd5', username: 'Trunks', avatar_level: 5, power_level: 4500, total_volume: 98000, streak: 15, pr_count: 28 },
    { id: 'd6', username: 'Krillin', avatar_level: 4, power_level: 3200, total_volume: 72000, streak: 20, pr_count: 22 },
    { id: 'd7', username: 'Yamcha', avatar_level: 2, power_level: 1500, total_volume: 34000, streak: 5, pr_count: 8 },
  ]
}
