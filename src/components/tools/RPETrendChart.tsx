// -- RPETrendChart.tsx --
// Shows RPE trend over the last 30 days with fatigue alert.

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'

export function RPETrendChart() {
  const { state } = useAppState()

  const data = useMemo(() => {
    const feedbacks = (state.sessionFeedback || []).slice(-20)
    if (feedbacks.length < 2) return null

    // Compute average soreness per session as a proxy for RPE
    const points = feedbacks.map((f, i) => {
      const groups = f.muscleGroups || []
      if (groups.length === 0) return null
      const avgSoreness = groups.reduce((s, g) => s + g.soreness, 0) / groups.length
      // Map soreness 1-5 to RPE 6-10 scale
      const rpe = 5 + avgSoreness
      return { index: i, rpe, date: f.date || '' }
    }).filter((p): p is { index: number; rpe: number; date: string } => p != null)

    if (points.length < 2) return null

    const avgRpe = points.reduce((s, p) => s + p.rpe, 0) / points.length
    const last3 = points.slice(-3)
    const last3Avg = last3.reduce((s, p) => s + p.rpe, 0) / last3.length
    const isCritical = last3Avg > 9

    return { points, avgRpe, isCritical }
  }, [state.sessionFeedback])

  if (!data) return null

  const { points, avgRpe, isCritical } = data
  const maxIdx = points.length - 1
  const W = 280
  const H = 80

  // Scale RPE 6-10 to chart height
  const scaleY = (rpe: number) => H - ((rpe - 6) / 4) * H
  const scaleX = (i: number) => (i / maxIdx) * W

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(p.rpe!).toFixed(1)}`)
    .join(' ')

  const rpeColor = (rpe: number) => {
    if (rpe >= 9.5) return '#ef4444'
    if (rpe >= 8.5) return '#f97316'
    if (rpe >= 7.5) return '#eab308'
    return '#22c55e'
  }

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a2e)', borderRadius: 14,
      border: '1px solid var(--border, #2a2a40)', padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Tendance RPE</span>
        <span style={{
          fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6,
          background: isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
          color: isCritical ? '#ef4444' : '#22c55e', fontWeight: 600,
        }}>
          Moy: {avgRpe.toFixed(1)}
        </span>
      </div>

      {isCritical && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '6px 10px', marginBottom: 8,
          fontSize: '0.72rem', color: '#ef4444', fontWeight: 600,
        }}>
          Fatigue critique ! RPE moyen {'>'} 9 sur 3 seances. Envisage un deload.
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60 }}>
        {/* Grid lines at RPE 7, 8, 9 */}
        {[7, 8, 9].map(rpe => (
          <line key={rpe} x1="0" y1={scaleY(rpe)} x2={W} y2={scaleY(rpe)}
            stroke="var(--border, #333)" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {/* RPE line */}
        <path d={pathD} fill="none" stroke={rpeColor(avgRpe)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(i)} cy={scaleY(p.rpe!)} r="3"
            fill={rpeColor(p.rpe!)} stroke="var(--bg-card, #1a1a2e)" strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary, #888)', marginTop: 4 }}>
        <span>RPE 6</span>
        <span>Derniers {points.length} workouts</span>
        <span>RPE 10</span>
      </div>
    </div>
  )
}
