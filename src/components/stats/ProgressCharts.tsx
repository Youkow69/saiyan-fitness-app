import { useMemo } from 'react'

// Types expected by chart components
export interface BodyweightEntry {
  date: string // ISO date
  weight: number
}

export interface WorkoutSet {
  exerciseId: string
  weight: number
  reps: number
  rpe?: number
}

export interface WorkoutLog {
  id: string
  date: string // ISO date
  exercises: WorkoutSet[]
}

export interface NutritionData {
  protein: number
  carbs: number
  fat: number
}

export interface NutritionTargets {
  protein: number
  carbs: number
  fat: number
  calories: number
}

// ─── Utility ────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function getWeekKey(date: string): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

// ─── Weight Trend Chart ─────────────────────────────────────────────────────

export function WeightChart({ entries }: { entries: BodyweightEntry[] }) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  )

  if (sorted.length < 2) {
    return (
      <ChartContainer title="Poids corporel">
        <div style={{ color: '#718096', fontSize: 13, textAlign: 'center', padding: 32 }}>
          Ajoutez au moins 2 entrees pour voir le graphique.
        </div>
      </ChartContainer>
    )
  }

  const weights = sorted.map((e) => e.weight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const padding = range * 0.1

  const svgW = 500
  const svgH = 200
  const inset = { top: 20, right: 20, bottom: 40, left: 50 }
  const plotW = svgW - inset.left - inset.right
  const plotH = svgH - inset.top - inset.bottom

  const points = sorted.map((e, i) => ({
    x: inset.left + (i / (sorted.length - 1)) * plotW,
    y: inset.top + plotH - ((e.weight - minW + padding) / (range + padding * 2)) * plotH,
    date: e.date,
    weight: e.weight,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${inset.top + plotH} L ${points[0].x} ${inset.top + plotH} Z`

  // Moving average (7-point)
  const maPoints = points.map((p, i) => {
    const start = Math.max(0, i - 3)
    const end = Math.min(points.length, i + 4)
    const avg =
      sorted.slice(start, end).reduce((s, e) => s + e.weight, 0) / (end - start)
    return {
      x: p.x,
      y:
        inset.top +
        plotH -
        ((avg - minW + padding) / (range + padding * 2)) * plotH,
    }
  })
  const maPath = maPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const yTicks = 5
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = minW - padding + ((range + padding * 2) * i) / (yTicks - 1)
    return Math.round(val * 10) / 10
  })

  const xLabelInterval = Math.max(1, Math.floor(sorted.length / 5))

  return (
    <ChartContainer title="Poids corporel (kg)">
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {yLabels.map((val, i) => {
          const y = inset.top + plotH - ((val - minW + padding) / (range + padding * 2)) * plotH
          return (
            <g key={i}>
              <line
                x1={inset.left}
                y1={y}
                x2={svgW - inset.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text x={inset.left - 8} y={y + 4} textAnchor="end" fill="#718096" fontSize={10}>
                {val}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#weightGradient)" opacity={0.3} />
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ed8936" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#ed8936" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Main line */}
        <path d={linePath} fill="none" stroke="#ed8936" strokeWidth={2} />

        {/* Moving average */}
        <path
          d={maPath}
          fill="none"
          stroke="#f6ad55"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#ed8936" stroke="#1a1a2e" strokeWidth={1.5} />
        ))}

        {/* X-axis labels */}
        {sorted.map(
          (e, i) =>
            i % xLabelInterval === 0 && (
              <text
                key={i}
                x={points[i].x}
                y={svgH - 8}
                textAnchor="middle"
                fill="#718096"
                fontSize={9}
              >
                {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </text>
            )
        )}
      </svg>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 11 }}>
        <span style={{ color: '#ed8936' }}>-- Poids</span>
        <span style={{ color: '#f6ad55', opacity: 0.7 }}>--- Moyenne mobile</span>
      </div>
    </ChartContainer>
  )
}

// ─── Volume Per Week Bar Chart ──────────────────────────────────────────────

export function VolumeChart({ workouts }: { workouts: WorkoutLog[] }) {
  const weeklyVolume = useMemo(() => {
    const map: Record<string, number> = {}
    workouts.forEach((w) => {
      const key = getWeekKey(w.date)
      const volume = w.exercises.reduce((s, ex) => s + ex.weight * ex.reps, 0)
      map[key] = (map[key] || 0) + volume
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, volume]) => ({ week, volume }))
  }, [workouts])

  if (weeklyVolume.length === 0) {
    return (
      <ChartContainer title="Volume hebdomadaire">
        <div style={{ color: '#718096', fontSize: 13, textAlign: 'center', padding: 32 }}>
          Aucune donnee de volume disponible.
        </div>
      </ChartContainer>
    )
  }

  const maxVol = Math.max(...weeklyVolume.map((w) => w.volume))
  const svgW = 500
  const svgH = 200
  const inset = { top: 20, right: 20, bottom: 40, left: 60 }
  const plotW = svgW - inset.left - inset.right
  const plotH = svgH - inset.top - inset.bottom
  const barGap = 4
  const barW = (plotW - barGap * (weeklyVolume.length - 1)) / weeklyVolume.length

  return (
    <ChartContainer title="Volume hebdomadaire (kg)">
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = Math.round(maxVol * frac)
          const y = inset.top + plotH * (1 - frac)
          return (
            <g key={frac}>
              <line
                x1={inset.left}
                y1={y}
                x2={svgW - inset.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
              />
              <text x={inset.left - 8} y={y + 4} textAnchor="end" fill="#718096" fontSize={9}>
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {weeklyVolume.map((w, i) => {
          const h = (w.volume / maxVol) * plotH
          const x = inset.left + i * (barW + barGap)
          const y = inset.top + plotH - h
          return (
            <g key={w.week}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                fill="url(#barGrad)"
              />
              <text
                x={x + barW / 2}
                y={svgH - 8}
                textAnchor="middle"
                fill="#718096"
                fontSize={8}
                transform={`rotate(-30, ${x + barW / 2}, ${svgH - 8})`}
              >
                {new Date(w.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3182ce" />
            <stop offset="100%" stopColor="#2c5282" />
          </linearGradient>
        </defs>
      </svg>
    </ChartContainer>
  )
}

// ─── Macro Pie Chart ────────────────────────────────────────────────────────

export function MacroPieChart({
  nutrition,
  targets,
}: {
  nutrition: NutritionData
  targets: NutritionTargets
}) {
  const total = nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9
  const proteinCal = nutrition.protein * 4
  const carbsCal = nutrition.carbs * 4
  const fatCal = nutrition.fat * 9

  const slices = [
    { label: 'Proteines', value: proteinCal, color: '#e53e3e', grams: nutrition.protein, target: targets.protein, unit: 'g' },
    { label: 'Glucides', value: carbsCal, color: '#3182ce', grams: nutrition.carbs, target: targets.carbs, unit: 'g' },
    { label: 'Lipides', value: fatCal, color: '#ecc94b', grams: nutrition.fat, target: targets.fat, unit: 'g' },
  ]

  const size = 180
  const cx = size / 2
  const cy = size / 2
  const r = 70
  const innerR = 45

  let cumAngle = -Math.PI / 2

  const arcs = slices.map((slice) => {
    const angle = total > 0 ? (slice.value / total) * 2 * Math.PI : 0
    const startAngle = cumAngle
    cumAngle += angle
    const endAngle = cumAngle

    const largeArc = angle > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(startAngle)
    const iy1 = cy + innerR * Math.sin(startAngle)
    const ix2 = cx + innerR * Math.cos(endAngle)
    const iy2 = cy + innerR * Math.sin(endAngle)

    const path =
      angle >= 2 * Math.PI - 0.001
        ? `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}
           M ${cx + innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`
        : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}
           L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`

    return { ...slice, path }
  })

  return (
    <ChartContainer title="Repartition des macros">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size}>
            {arcs.map((arc, i) => (
              <path key={i} d={arc.path} fill={arc.color} stroke="#1a1a2e" strokeWidth={2} />
            ))}
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>
              {Math.round(total)}
            </div>
            <div style={{ fontSize: 10, color: '#718096' }}>kcal</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slices.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
            const progress = s.target > 0 ? clamp(s.grams / s.target, 0, 1) : 0
            return (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: '#a0aec0' }}>
                    {s.grams}{s.unit} / {s.target}{s.unit} ({pct}%)
                  </span>
                </div>
                <div style={{ height: 6, background: '#2d3748', borderRadius: 3 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progress * 100}%`,
                      background: s.color,
                      borderRadius: 3,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
            Objectif: {targets.calories} kcal
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}

// ─── 1RM Progression Chart ──────────────────────────────────────────────────

export function OneRmChart({
  workouts,
  exerciseId,
  exerciseName,
}: {
  workouts: WorkoutLog[]
  exerciseId: string
  exerciseName?: string
}) {
  const data = useMemo(() => {
    const points: { date: string; rm: number }[] = []
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
    sorted.forEach((w) => {
      const sets = w.exercises.filter((e) => e.exerciseId === exerciseId)
      if (sets.length === 0) return
      const best1RM = Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)))
      if (best1RM > 0) {
        points.push({ date: w.date, rm: best1RM })
      }
    })
    return points
  }, [workouts, exerciseId])

  if (data.length < 2) {
    return (
      <ChartContainer title={`1RM - ${exerciseName || exerciseId}`}>
        <div style={{ color: '#718096', fontSize: 13, textAlign: 'center', padding: 32 }}>
          Pas assez de donnees pour cet exercice.
        </div>
      </ChartContainer>
    )
  }

  const rms = data.map((d) => d.rm)
  const minRM = Math.min(...rms)
  const maxRM = Math.max(...rms)
  const range = maxRM - minRM || 1
  const pad = range * 0.15

  const svgW = 500
  const svgH = 180
  const inset = { top: 20, right: 20, bottom: 40, left: 50 }
  const plotW = svgW - inset.left - inset.right
  const plotH = svgH - inset.top - inset.bottom

  const points = data.map((d, i) => ({
    x: inset.left + (i / (data.length - 1)) * plotW,
    y: inset.top + plotH - ((d.rm - minRM + pad) / (range + pad * 2)) * plotH,
    rm: d.rm,
    date: d.date,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <ChartContainer title={`Progression 1RM - ${exerciseName || exerciseId}`}>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
        {/* Grid */}
        {[0, 0.5, 1].map((frac) => {
          const val = Math.round(minRM - pad + (range + pad * 2) * frac)
          const y = inset.top + plotH * (1 - frac)
          return (
            <g key={frac}>
              <line x1={inset.left} y1={y} x2={svgW - inset.right} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={inset.left - 8} y={y + 4} textAnchor="end" fill="#718096" fontSize={10}>
                {val}
              </text>
            </g>
          )
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#38a169" strokeWidth={2.5} />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#38a169" stroke="#1a1a2e" strokeWidth={2} />
            {i === points.length - 1 && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#38a169" fontSize={11} fontWeight="bold">
                {p.rm} kg
              </text>
            )}
          </g>
        ))}

        {/* X labels */}
        {data.map(
          (d, i) =>
            i % Math.max(1, Math.floor(data.length / 5)) === 0 && (
              <text key={i} x={points[i].x} y={svgH - 8} textAnchor="middle" fill="#718096" fontSize={9}>
                {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </text>
            )
        )}
      </svg>
    </ChartContainer>
  )
}

// ─── Shared Container ───────────────────────────────────────────────────────

function ChartContainer({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        maxWidth: 560,
        margin: '0 auto 16px',
        color: '#e2e8f0',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 15,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
