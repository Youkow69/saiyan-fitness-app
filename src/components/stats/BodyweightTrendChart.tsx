// src/components/stats/BodyweightTrendChart.tsx
// Weight chart with 7-day moving average and target line

import { useAppState } from '../../context/AppContext'

interface Props {
  height?: number
  showTarget?: boolean
}

export function BodyweightTrendChart({ height = 200, showTarget = true }: Props) {
  const { state } = useAppState()
  const entries = (state.bodyweightEntries || []).slice(-90)

  if (entries.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
        {'\u2696\uFE0F'} Ajoute au moins 2 pes\u00e9es pour voir la courbe
      </div>
    )
  }

  const W = 320
  const H = height
  const PAD = { top: 20, right: 15, bottom: 30, left: 45 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const weights = entries.map(e => e.weightKg)
  const minW = Math.floor(Math.min(...weights) - 1)
  const maxW = Math.ceil(Math.max(...weights) + 1)
  const range = maxW - minW || 1

  // 7-day moving average
  const movingAvg: number[] = []
  for (let i = 0; i < entries.length; i++) {
    const window = entries.slice(Math.max(0, i - 6), i + 1)
    movingAvg.push(window.reduce((s, e) => s + e.weightKg, 0) / window.length)
  }

  const xScale = (i: number) => PAD.left + (i / (entries.length - 1)) * plotW
  const yScale = (w: number) => PAD.top + plotH - ((w - minW) / range) * plotH

  // Points
  const pointsStr = entries.map((e, i) => `${xScale(i)},${yScale(e.weightKg)}`).join(' ')
  const avgLine = movingAvg.map((w, i) => `${xScale(i)},${yScale(w)}`).join(' ')

  // Target weight
  const targetW = state.profile?.goal === 'fat_loss'
    ? (state.profile.weightKg - 5)
    : state.profile?.goal === 'muscle_gain'
    ? (state.profile.weightKg + 3)
    : state.profile?.weightKg || 70

  // Y axis labels
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => minW + (range * i) / yTicks)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid */}
      {yLabels.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <text x={PAD.left - 5} y={yScale(v) + 4} textAnchor="end"
            fill="var(--text-secondary, #a0a8c0)" fontSize={9}>
            {v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Target line */}
      {showTarget && targetW >= minW && targetW <= maxW && (
        <line x1={PAD.left} y1={yScale(targetW)} x2={W - PAD.right} y2={yScale(targetW)}
          stroke="#FFD700" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
      

      {/* FEAT-F12: Projection line based on 14-day slope */}
      {entries.length >= 14 && (() => {
        const last14 = entries.slice(-14)
        const slope = (last14[last14.length - 1].weightKg - last14[0].weightKg) / 14
        const lastW = entries[entries.length - 1].weightKg
        const projW = lastW + slope * 14
        if (projW >= minW && projW <= maxW) {
          const x1 = xScale(entries.length - 1)
          const y1 = yScale(lastW)
          const x2 = W - PAD.right
          const y2 = yScale(Math.max(minW, Math.min(maxW, projW)))
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeWidth={1} strokeDasharray="6,4" opacity={0.3} />
        }
        return null
      })()}
)}

      {/* Moving average line (gold) */}
      <polyline points={pointsStr} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.4} />
      <polyline points={avgLine} fill="none" stroke="#FFD700" strokeWidth={2} opacity={0.8} />

      {/* Individual points */}
      {entries.map((e, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(e.weightKg)} r={3}
          fill="#FF8C00" stroke="#0D0D0D" strokeWidth={1} />
      ))}

      {/* Date labels */}
      {entries.filter((_, i) => i === 0 || i === entries.length - 1 || i === Math.floor(entries.length / 2)).map((e, i) => (
        <text key={i}
          x={xScale(entries.indexOf(e))}
          y={H - 5}
          textAnchor="middle"
          fill="var(--text-secondary, #a0a8c0)"
          fontSize={8}>
          {e.date.slice(5)}
        </text>
      ))}

      {/* Legend */}
      <circle cx={PAD.left + 5} cy={10} r={3} fill="#FF8C00" />
      <text x={PAD.left + 12} y={13} fill="#FF8C00" fontSize={8}>Poids</text>
      <line x1={PAD.left + 55} y1={10} x2={PAD.left + 70} y2={10} stroke="#FFD700" strokeWidth={2} />
      <text x={PAD.left + 74} y={13} fill="#FFD700" fontSize={8}>Moy. 7j</text>
    </svg>
  )
}
