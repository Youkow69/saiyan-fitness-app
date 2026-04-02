// ── MesocycleProgress.tsx ──────────────────────────────────────────────────
// Displays mesocycle week progress (1-4), volume ramp, deload indicator.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'

export function MesocycleProgress() {
  const { state } = useAppState()

  const mesoInfo = useMemo(() => {
    const workouts = state.workouts
    if (workouts.length < 2) return null

    // Calculate current mesocycle week based on workout count
    // A mesocycle = 4 weeks. We estimate week by grouping workouts.
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= fourWeeksAgo)

    // Group by week
    const weeks: number[][] = [[], [], [], []]
    recentWorkouts.forEach(w => {
      const daysSince = Math.floor((now.getTime() - new Date(w.date).getTime()) / (24 * 60 * 60 * 1000))
      const weekIdx = Math.min(3, Math.floor(daysSince / 7))
      weeks[3 - weekIdx].push(
        w.exercises.reduce((sum, ex) =>
          sum + ex.sets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)
      )
    })

    const weekVolumes = weeks.map(w =>
      w.length > 0 ? w.reduce((a, b) => a + b, 0) : 0
    )

    // Current week = weeks[3] (most recent)
    const currentWeek = weeks[3].length > 0 ? 4 : weeks[2].length > 0 ? 3 : weeks[1].length > 0 ? 2 : 1

    // Volume trend
    const validWeeks = weekVolumes.filter(v => v > 0)
    const avgVolume = validWeeks.length > 0 ? validWeeks.reduce((a, b) => a + b, 0) / validWeeks.length : 0

    // Should deload? (week 4 or volume stagnation)
    const shouldDeload = currentWeek >= 4
    const volumeMultiplier = shouldDeload ? 0.6 : 1 + (currentWeek - 1) * 0.1

    return {
      currentWeek,
      weekVolumes,
      avgVolume,
      shouldDeload,
      volumeMultiplier,
      totalWorkouts: recentWorkouts.length,
    }
  }, [state.workouts])

  if (!mesoInfo || mesoInfo.totalWorkouts < 3) return null

  const weekLabels = ['S1', 'S2', 'S3', 'S4']
  const weekColors = ['#22c55e', '#84cc16', '#eab308', '#ef4444']

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a1a)', borderRadius: 14,
      border: '1px solid var(--border, #333)', padding: '12px 14px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
          {'\U0001f4ca'} M\u00e9socycle
        </span>
        <span style={{
          fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6,
          background: mesoInfo.shouldDeload ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          color: mesoInfo.shouldDeload ? '#ef4444' : '#22c55e',
          fontWeight: 600,
        }}>
          {mesoInfo.shouldDeload ? 'Deload recommand\u00e9' : `Semaine ${mesoInfo.currentWeek}/4`}
        </span>
      </div>

      {/* Week progress bars */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {weekLabels.map((label, i) => {
          const isActive = i < mesoInfo.currentWeek
          const isCurrent = i === mesoInfo.currentWeek - 1
          return (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 6, borderRadius: 3,
                background: isActive ? weekColors[i] : 'var(--border, #333)',
                opacity: isCurrent ? 1 : isActive ? 0.6 : 0.3,
                transition: 'all 0.3s ease',
              }} />
              <span style={{
                fontSize: '0.6rem', color: isCurrent ? weekColors[i] : 'var(--text-secondary, #888)',
                fontWeight: isCurrent ? 700 : 400,
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Volume info */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #888)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Volume moyen: {Math.round(mesoInfo.avgVolume).toLocaleString()} kg</span>
        <span>Multiplicateur: x{mesoInfo.volumeMultiplier.toFixed(1)}</span>
      </div>
    </div>
  )
}
