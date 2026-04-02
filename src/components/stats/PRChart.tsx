// ── PRChart.tsx ──────────────────────────────────────────────────────────────
// Graphique SVG des records personnels (e1RM) au fil du temps.
// Affiche aussi les categories de PR : poids max, volume max, reps max.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import type { WorkoutLog } from '../../types'
import { estimate1Rm } from '../../lib'

interface Props {
  exerciseId: string
  workouts: WorkoutLog[]
}

interface PRDataPoint {
  date: string
  e1rm: number
}

interface PRCategories {
  maxWeight: { value: number; date: string }
  maxVolume: { value: number; date: string }
  maxReps: { value: number; date: string }
}

export function PRChart({ exerciseId, workouts }: Props) {
  const { dataPoints, categories } = useMemo(() => {
    const points: PRDataPoint[] = []
    let bestWeight = { value: 0, date: '' }
    let bestVolume = { value: 0, date: '' }
    let bestReps = { value: 0, date: '' }

    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))

    for (const w of sorted) {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (!ex || ex.sets.length === 0) continue

      let sessionBestE1rm = 0
      let sessionVolume = 0

      for (const s of ex.sets) {
        if (s.setType === 'warmup') continue
        const e1rm = estimate1Rm(s.weightKg, s.reps)
        if (e1rm > sessionBestE1rm) sessionBestE1rm = e1rm
        sessionVolume += s.weightKg * s.reps

        if (s.weightKg > bestWeight.value) {
          bestWeight = { value: s.weightKg, date: w.date }
        }
        if (s.reps > bestReps.value) {
          bestReps = { value: s.reps, date: w.date }
        }
      }

      if (sessionVolume > bestVolume.value) {
        bestVolume = { value: sessionVolume, date: w.date }
      }

      if (sessionBestE1rm > 0) {
        points.push({ date: w.date, e1rm: Math.round(sessionBestE1rm * 10) / 10 })
      }
    }

    return {
      dataPoints: points,
      categories: { maxWeight: bestWeight, maxVolume: bestVolume, maxReps: bestReps } as PRCategories,
    }
  }, [exerciseId, workouts])

  if (dataPoints.length < 2) {
    return (
      <div style={{
        background: 'var(--bg-card, #1a1a1a)', borderRadius: 12,
        border: '1px solid var(--border, #333)', padding: 16, textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #888)', margin: 0 }}>
          Pas assez de donnees pour afficher le graphique.
          Minimum 2 seances enregistrees.
        </p>
      </div>
    )
  }

  // SVG dimensions
  const W = 320
  const H = 160
  const PAD = { top: 20, right: 16, bottom: 30, left: 44 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minE1rm = Math.min(...dataPoints.map(d => d.e1rm))
  const maxE1rm = Math.max(...dataPoints.map(d => d.e1rm))
  const range = maxE1rm - minE1rm || 1

  const scaleX = (i: number) => PAD.left + (i / (dataPoints.length - 1)) * chartW
  const scaleY = (v: number) => PAD.top + chartH - ((v - minE1rm) / range) * chartH

  // Build polyline points
  const polylinePoints = dataPoints.map((d, i) => `${scaleX(i)},${scaleY(d.e1rm)}`).join(' ')

  // Gradient area path
  const areaPath = `M ${scaleX(0)},${scaleY(dataPoints[0].e1rm)} ` +
    dataPoints.map((d, i) => `L ${scaleX(i)},${scaleY(d.e1rm)}`).join(' ') +
    ` L ${scaleX(dataPoints.length - 1)},${PAD.top + chartH} L ${scaleX(0)},${PAD.top + chartH} Z`

  // Y axis labels (3 ticks)
  const yTicks = [minE1rm, (minE1rm + maxE1rm) / 2, maxE1rm].map(v => Math.round(v))

  // X axis: first and last date
  const formatDate = (d: string) => {
    const parts = d.split('-')
    return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : d
  }

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a1a)', borderRadius: 12,
      border: '1px solid var(--border, #333)', padding: 12,
    }}>
      <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700 }}>
        Progression e1RM
      </h4>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="pr-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff8c00" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <line key={i}
            x1={PAD.left} y1={scaleY(v)}
            x2={PAD.left + chartW} y2={scaleY(v)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#pr-gradient)" />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#ff8c00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((d, i) => (
          <circle key={i}
            cx={scaleX(i)} cy={scaleY(d.e1rm)}
            r="3" fill="#ff8c00"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((v, i) => (
          <text key={i}
            x={PAD.left - 6} y={scaleY(v) + 4}
            textAnchor="end" fontSize="9" fill="#888"
          >
            {v}
          </text>
        ))}

        {/* X axis labels */}
        <text x={PAD.left} y={H - 4} fontSize="8" fill="#888">
          {formatDate(dataPoints[0].date)}
        </text>
        <text x={PAD.left + chartW} y={H - 4} textAnchor="end" fontSize="8" fill="#888">
          {formatDate(dataPoints[dataPoints.length - 1].date)}
        </text>
      </svg>

      {/* PR Categories */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10,
      }}>
        {[
          { label: 'Poids max', value: `${categories.maxWeight.value}kg`, date: categories.maxWeight.date, color: '#ff8c00' },
          { label: 'Volume max', value: `${categories.maxVolume.value}kg`, date: categories.maxVolume.date, color: '#ffd700' },
          { label: 'Reps max', value: `${categories.maxReps.value}`, date: categories.maxReps.date, color: '#22c55e' },
        ].map(cat => (
          <div key={cat.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            padding: '8px 6px', textAlign: 'center',
            border: `1px solid ${cat.color}22`,
          }}>
            <div style={{ fontSize: '0.62rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
              {cat.label}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: cat.color, margin: '2px 0' }}>
              {cat.value}
            </div>
            {cat.date && (
              <div style={{ fontSize: '0.58rem', color: '#666' }}>
                {formatDate(cat.date)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PRChart
