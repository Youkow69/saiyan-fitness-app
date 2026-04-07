import { useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Core'
type Status = 'rested' | 'recovering' | 'fatigued' | 'unknown'

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core']

const FR: Record<MuscleGroup, string> = {
  Chest: 'Pectoraux', Back: 'Dos', Shoulders: 'Épaules', Biceps: 'Biceps', Triceps: 'Triceps',
  Quads: 'Quadriceps', Hamstrings: 'Ischio-jambiers', Glutes: 'Fessiers', Calves: 'Mollets', Core: 'Abdominaux',
}

const STATUS_META: Record<Status, { label: string; color: string; points: number; advice: string }> = {
  rested:     { label: 'Reposé',        color: '#22c55e', points: 10, advice: 'Prêt à être retravailé.' },
  recovering: { label: 'Récupération', color: '#f59e0b', points: 5,  advice: 'Privilégie un entraînement léger.' },
  fatigued:   { label: 'Fatigué',       color: '#ef4444', points: 1,  advice: 'Évite de retravailler ce muscle.' },
  unknown:    { label: 'Inconnu',       color: '#6b7280', points: 0,  advice: 'Aucune donnée. Entraîne-toi !' },
}

function getStatus(hours: number | null): Status {
  if (hours === null) return 'unknown'
  if (hours >= 48) return 'rested'
  if (hours >= 24) return 'recovering'
  return 'fatigued'
}

function getPercent(hours: number | null): number {
  if (hours === null) return 0
  return Math.min(100, Math.round((hours / 48) * 100))
}

export function RecoveryMap() {
  const { state } = useAppState()
  const [expanded, setExpanded] = useState<MuscleGroup | null>(null)

  const muscleData = useMemo(() => {
    const now = Date.now()
    const lastHit: Record<string, number> = {}
    const SECONDARY_OFFSET = 24 * 3_600_000 // 24h offset = secondary muscles recover faster

    for (const w of state.workouts ?? []) {
      const ts = new Date(w.date).getTime()
      for (const ex of w.exercises ?? []) {
        const def = getExerciseById(ex.exerciseId)
        // Primary muscles: full fatigue (real timestamp)
        for (const m of def?.primaryMuscles ?? []) {
          if (!lastHit[m] || ts > lastHit[m]) lastHit[m] = ts
        }
        // BUG-F14: Secondary muscles use offset timestamp (0.5 factor)
        // Offset by 24h = they appear "hit earlier" = recover faster
        for (const m of def?.secondaryMuscles ?? []) {
          const adjusted = ts - SECONDARY_OFFSET
          // Only apply if no more recent PRIMARY hit exists
          if (!lastHit[m] || adjusted > lastHit[m]) lastHit[m] = adjusted
        }
      }
    }

    return MUSCLES.map((m) => {
      const ts = lastHit[m] ?? null
      const hours = ts ? Math.round((now - ts) / 3_600_000) : null
      const status = getStatus(hours)
      const pct = getPercent(hours)
      return { key: m, fr: FR[m], hours, status, pct, ...STATUS_META[status] }
    })
  }, [state.workouts])

  const score = muscleData.reduce((s, m) => s + m.points, 0)
  const counts = { rested: 0, recovering: 0, fatigued: 0, unknown: 0 }
  muscleData.forEach((m) => counts[m.status]++)

  const toggle = (m: MuscleGroup) => setExpanded((p) => (p === m ? null : m))

  return (
    <div style={{ padding: 20, background: 'var(--bg-card)', color: 'var(--text)', borderRadius: 16, fontFamily: 'Manrope, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-muted, #a3a3a3)' }}>
          Senzu Bean Recovery
        </span>
        <span style={{ fontSize: 28, fontWeight: 800 }}>
          {score}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted, #a3a3a3)' }}>/100</span>
        </span>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['rested', 'recovering', 'fatigued', 'unknown'] as Status[]).map((s) => (
          <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: STATUS_META[s].color + '18', color: STATUS_META[s].color, fontWeight: 600 }}>
            {counts[s]} {STATUS_META[s].label}
          </span>
        ))}
      </div>

      {/* Muscle rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {muscleData.map((m) => (
          <div key={m.key} onClick={() => toggle(m.key)} style={{ cursor: 'pointer', padding: '12px 14px', borderRadius: 10, background: expanded === m.key ? 'var(--bg-card)' : 'var(--bg)', transition: 'background .15s' }}>
            {/* Top line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{m.fr}</span>
              <span style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted, #a3a3a3)', minWidth: 36, textAlign: 'right' }}>
                {m.hours !== null ? `${m.hours}h` : '—'}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--border)' }}>
              <div style={{ height: '100%', width: `${m.pct}%`, borderRadius: 2, background: m.color, transition: 'width .3s' }} />
            </div>
            {/* Percent */}
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted, #a3a3a3)', textAlign: 'right' }}>{m.pct}%</div>
            {/* Expandable advice */}
            {expanded === m.key && (
              <div style={{ marginTop: 8, fontSize: 12, color: m.color, fontStyle: 'italic', paddingLeft: 18 }}>
                {m.advice}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
