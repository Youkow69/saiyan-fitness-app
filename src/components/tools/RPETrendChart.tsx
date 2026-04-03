// -- RPETrendChart.tsx --
// Shows RPE trend over the last 30 days with fatigue alert.

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'

export function RPETrendChart() {
  const { state } = useAppState()

  const data = useMemo(() => {
    const feedbacks = (state.sessionFeedback || []).slice(-20)
    if (feedbacks.length < 2) return null

    const points = feedbacks.map((f, i) => ({
      index: i,
      rpe: f.averageRpe ?? (f.rir != null ? 10 - f.rir : null),
      date: f.date || '',
      soreness: f.soreness ?? 0,
    })).filter(p => p.rpe != null)

    if (points.length < 2) return null

    const avgRpe = points.reduce((s, p) => s + (p.rpe || 0), 0) / points.length
    const last3Avg = points.slice(-3).reduce((s, p) => s + (p.rpe || 0), 0) / Math.min(3, points.length)
    const isCritical = last3Avg > 9

    return { points, avgRpe, last3Avg, isCritical }
  }, [state.sessionFeedback])

  if (!data) return null

  const { points, avgRpe, last3Avg, isCritical } = data
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
          Fatigue critique ! RPE moyen > 9 sur 3 seances. Envisage un deload.
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
