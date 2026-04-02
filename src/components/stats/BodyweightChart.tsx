import { useMemo, useState } from 'react'
import type { BodyweightEntry } from '../../types'

interface Props {
  entries: BodyweightEntry[]
  targetWeight?: number
}

export function BodyweightChart({ entries, targetWeight }: Props) {
  const [range, setRange] = useState<'30' | '90' | 'all'>('90')

  const data = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    if (range === 'all') return sorted
    const days = Number(range)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return sorted.filter(e => e.date >= cutoffStr)
  }, [entries, range])

  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)', fontSize: '0.8rem' }}>
        Pas assez de donnees. Pese-toi au moins 2 fois pour voir le graphique.
      </div>
    )
  }

  const weights = data.map(e => e.weightKg)
  const minW = Math.min(...weights) - 1
  const maxW = Math.max(...weights) + 1
  const rangeW = maxW - minW || 1

  // 7-day moving average
  const movingAvg = data.map((_, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1)
    return window.reduce((s, e) => s + e.weightKg, 0) / window.length
  })

  const width = 300
  const height = 120
  const paddingX = 30
  const paddingY = 10
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const points = data.map((e, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW
    const y = paddingY + (1 - (e.weightKg - minW) / rangeW) * chartH
    return { x, y, date: e.date, weight: e.weightKg }
  })

  const avgPoints = movingAvg.map((w, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW
    const y = paddingY + (1 - (w - minW) / rangeW) * chartH
    return { x, y }
  })

  const avgLine = avgPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['30', '90', 'all'] as const).map(r => (
          <button
            key={r}
            type="button"
            className={'chip' + (range === r ? ' chip--active' : '')}
            onClick={() => setRange(r)}
          >
            {r === 'all' ? 'Tout' : r + 'j'}
          </button>
        ))}
      </div>
      <svg viewBox={'0 0 ' + width + ' ' + height} style={{ width: '100%', height: 'auto' }}>
        {/* Y axis labels */}
        <text x={2} y={paddingY + 4} fill="var(--muted)" fontSize={8}>{maxW.toFixed(0)}kg</text>
        <text x={2} y={height - paddingY + 4} fill="var(--muted)" fontSize={8}>{minW.toFixed(0)}kg</text>

        {/* Target line */}
        {targetWeight && targetWeight >= minW && targetWeight <= maxW && (
          <>
            <line
              x1={paddingX} y1={paddingY + (1 - (targetWeight - minW) / rangeW) * chartH}
              x2={width - paddingX} y2={paddingY + (1 - (targetWeight - minW) / rangeW) * chartH}
              stroke="var(--accent)" strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
            />
            <text
              x={width - paddingX + 2}
              y={paddingY + (1 - (targetWeight - minW) / rangeW) * chartH + 3}
              fill="var(--accent)" fontSize={7}
            >
              Obj.
            </text>
          </>
        )}

        {/* Moving average line */}
        <path d={avgLine} fill="none" stroke="var(--accent-orange)" strokeWidth={2} opacity={0.7} />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={2.5}
            fill="var(--accent)"
            opacity={0.8}
          >
            <title>{p.date}: {p.weight}kg</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>
        <span>{data[0]?.date.slice(5)}</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
          Actuel: {data[data.length - 1]?.weightKg}kg
          {data.length > 7 ? ' (moy. 7j: ' + movingAvg[movingAvg.length - 1].toFixed(1) + 'kg)' : ''}
        </span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}
