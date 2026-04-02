import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { estimate1Rm } from '../../lib'

// ---------------------------------------------------------------------------
// Standards data
// ---------------------------------------------------------------------------

interface LevelRatios {
  beginner: number
  intermediate: number
  advanced: number
  elite: number
}

interface Standard {
  exerciseId: string
  name: string
  ratio: LevelRatios
}

const STANDARDS: Standard[] = [
  {
    exerciseId: 'barbell_bench_press',
    name: 'Développé couche',
    ratio: { beginner: 0.5, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
  },
  {
    exerciseId: 'back_squat',
    name: 'Squat',
    ratio: { beginner: 0.75, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
  },
  {
    exerciseId: 'deadlift',
    name: 'Souleve de terre',
    ratio: { beginner: 1.0, intermediate: 1.75, advanced: 2.5, elite: 3.0 },
  },
  {
    exerciseId: 'overhead_press',
    name: 'Développé militaire',
    ratio: { beginner: 0.35, intermediate: 0.65, advanced: 1.0, elite: 1.35 },
  },
  {
    exerciseId: 'barbell_row',
    name: 'Rowing barre',
    ratio: { beginner: 0.4, intermediate: 0.85, advanced: 1.25, elite: 1.6 },
  },
]

type LevelKey = keyof LevelRatios

const LEVEL_ORDER: LevelKey[] = ['beginner', 'intermediate', 'advanced', 'elite']

const LEVEL_LABELS: Record<LevelKey, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  elite: 'Elite',
}

const LEVEL_COLORS: Record<LevelKey, string> = {
  beginner: '#94a3b8',
  intermediate: '#3b82f6',
  advanced: '#a855f7',
  elite: '#f59e0b',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface LiftResult {
  exerciseId: string
  name: string
  e1rm: number
  intermediateStandard: number
  percentage: number
  level: LevelKey
  ratios: LevelRatios
}

function getCurrentLevel(ratio: number, standards: LevelRatios): LevelKey {
  if (ratio >= standards.elite) return 'elite'
  if (ratio >= standards.advanced) return 'advanced'
  if (ratio >= standards.intermediate) return 'intermediate'
  return 'beginner'
}

function computeLiftResults(
  workouts: { exercises: { exerciseId: string; sets: { weightKg: number; reps: number }[] }[] }[],
  bodyweight: number,
): LiftResult[] {
  return STANDARDS.map((std) => {
    // Find best e1RM across all workouts
    let bestE1rm = 0
    for (const w of workouts) {
      const ex = w.exercises.find((e) => e.exerciseId === std.exerciseId)
      if (!ex) continue
      for (const s of ex.sets) {
        const e1rm = estimate1Rm(s.weightKg, s.reps)
        if (e1rm > bestE1rm) bestE1rm = e1rm
      }
    }

    const intermediateStandard = bodyweight * std.ratio.intermediate
    const bwRatio = bodyweight > 0 ? bestE1rm / bodyweight : 0
    const level = getCurrentLevel(bwRatio, std.ratio)
    const percentage =
      intermediateStandard > 0
        ? Math.round((bestE1rm / intermediateStandard) * 100)
        : 0

    return {
      exerciseId: std.exerciseId,
      name: std.name,
      e1rm: Math.round(bestE1rm * 10) / 10,
      intermediateStandard: Math.round(intermediateStandard * 10) / 10,
      percentage,
      level,
      ratios: std.ratio,
    }
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LevelBadge({ level }: { level: LevelKey }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: LEVEL_COLORS[level] + '22',
        color: LEVEL_COLORS[level],
        border: `1px solid ${LEVEL_COLORS[level]}44`,
      }}
      aria-label={`Niveau: ${LEVEL_LABELS[level]}`}
    >
      {LEVEL_LABELS[level]}
    </span>
  )
}

function ProgressBar({
  result,
  bodyweight,
}: {
  result: LiftResult
  bodyweight: number
}) {
  // Build tick marks for each level boundary
  const eliteKg = bodyweight * result.ratios.elite
  const maxKg = eliteKg * 1.15 // leave some headroom

  const ticks = LEVEL_ORDER.map((lvl) => ({
    key: lvl,
    kg: bodyweight * result.ratios[lvl],
    pct: Math.min(((bodyweight * result.ratios[lvl]) / maxKg) * 100, 100),
  }))

  const fillPct = Math.min((result.e1rm / maxKg) * 100, 100)

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: 6 }}>
      {/* Track */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={result.e1rm}
        aria-valuemin={0}
        aria-valuemax={Math.round(eliteKg)}
        aria-label={`${result.name}: ${result.e1rm} kg`}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: `${fillPct}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${LEVEL_COLORS[result.level]}cc, ${LEVEL_COLORS[result.level]})`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Tick marks */}
      <div style={{ position: 'relative', height: 16 }}>
        {ticks.map((t) => (
          <div
            key={t.key}
            style={{
              position: 'absolute',
              left: `${t.pct}%`,
              top: 0,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 1,
                height: 6,
                background: LEVEL_COLORS[t.key] + '88',
              }}
            />
            <div
              style={{
                fontSize: '0.5rem',
                color: LEVEL_COLORS[t.key],
                whiteSpace: 'nowrap',
              }}
            >
              {Math.round(t.kg)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiftCard({
  result,
  bodyweight,
}: {
  result: LiftResult
  bodyweight: number
}) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
          {result.name}
        </span>
        <LevelBadge level={result.level} />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          marginBottom: 2,
        }}
      >
        <span>
          e1RM:{' '}
          <strong style={{ color: 'var(--text)' }}>{result.e1rm} kg</strong>
        </span>
        <span>
          Standard:{' '}
          <strong style={{ color: 'var(--text)' }}>
            {result.intermediateStandard} kg
          </strong>
        </span>
        <span>
          <strong
            style={{
              color:
                result.percentage >= 100
                  ? 'var(--success, #22c55e)'
                  : 'var(--text)',
            }}
          >
            {result.percentage}%
          </strong>
        </span>
      </div>

      {/* Bar */}
      <ProgressBar result={result} bodyweight={bodyweight} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StrengthStandards() {
  const { state } = useAppState()
  const bodyweight = state.profile?.weightKg ?? 80

  const results = useMemo(
    () => computeLiftResults(state.workouts, bodyweight),
    [state.workouts, bodyweight],
  )

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        padding: 16,
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          margin: '0 0 4px',
        }}
      >
        Standards de force
      </h3>
      <p
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          margin: '0 0 12px',
        }}
      >
        Base sur ton poids de corps ({bodyweight} kg)
      </p>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {LEVEL_ORDER.map((lvl) => (
          <div
            key={lvl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.6rem',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: LEVEL_COLORS[lvl],
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              {LEVEL_LABELS[lvl]}
            </span>
          </div>
        ))}
      </div>

      {/* Lift cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r) => (
          <LiftCard key={r.exerciseId} result={r} bodyweight={bodyweight} />
        ))}
      </div>
    </div>
  )
}
