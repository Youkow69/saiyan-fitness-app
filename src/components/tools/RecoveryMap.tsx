import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecoveryStatus = 'rested' | 'recovering' | 'fatigued'

type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'upper_back'
  | 'lower_back'

interface MuscleRecovery {
  muscle: MuscleGroup
  label: string
  status: RecoveryStatus
  hoursSince: number | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS: Record<RecoveryStatus, string> = {
  rested: '#22c55e',
  recovering: '#f59e0b',
  fatigued: '#ef4444',
}

const LABELS: Record<RecoveryStatus, string> = {
  rested: 'Repose',
  recovering: 'En recuperation',
  fatigued: 'Fatigue',
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  shoulders: 'Epaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Abdos',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  upper_back: 'Haut du dos',
  lower_back: 'Bas du dos',
}

const ALL_MUSCLES: MuscleGroup[] = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'upper_back',
  'lower_back',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecoveryStatus(hoursSinceLastTrained: number | null): RecoveryStatus {
  if (hoursSinceLastTrained === null) return 'rested'
  if (hoursSinceLastTrained >= 48) return 'rested'
  if (hoursSinceLastTrained >= 24) return 'recovering'
  return 'fatigued'
}

function computeRecovery(
  workouts: { date: string; exercises: { exerciseId: string }[] }[],
): MuscleRecovery[] {
  const now = Date.now()
  const lastHit: Record<MuscleGroup, number | null> = {} as any
  ALL_MUSCLES.forEach((m) => (lastHit[m] = null))

  // Walk workouts newest-first to find the most recent hit per muscle
  for (let i = workouts.length - 1; i >= 0; i--) {
    const wDate = new Date(workouts[i].date).getTime()
    for (const ex of workouts[i].exercises) {
      const info = getExerciseById(ex.exerciseId)
      if (!info?.primaryMuscles) continue
      for (const muscle of info.primaryMuscles as MuscleGroup[]) {
        if (ALL_MUSCLES.includes(muscle)) {
          const existing = lastHit[muscle]
          if (existing === null || wDate > existing) {
            lastHit[muscle] = wDate
          }
        }
      }
    }
  }

  return ALL_MUSCLES.map((muscle) => {
    const ts = lastHit[muscle]
    const hoursSince = ts !== null ? (now - ts) / (1000 * 60 * 60) : null
    return {
      muscle,
      label: MUSCLE_LABELS[muscle],
      status: getRecoveryStatus(hoursSince),
      hoursSince: hoursSince !== null ? Math.round(hoursSince) : null,
    }
  })
}

// ---------------------------------------------------------------------------
// SVG body parts (front view)
// ---------------------------------------------------------------------------

function FrontBody({ recoveryMap }: { recoveryMap: Map<MuscleGroup, MuscleRecovery> }) {
  const c = (m: MuscleGroup) => COLORS[recoveryMap.get(m)?.status ?? 'rested']
  const title = (m: MuscleGroup) => {
    const r = recoveryMap.get(m)
    if (!r) return ''
    return `${r.label}: ${LABELS[r.status]}${r.hoursSince !== null ? ` (${r.hoursSince}h)` : ''}`
  }

  return (
    <svg viewBox="0 0 200 400" width="180" height="360" aria-label="Vue de face">
      {/* Head */}
      <circle cx="100" cy="35" r="20" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" opacity="0.4" />

      {/* Neck */}
      <rect x="94" y="55" width="12" height="12" rx="3" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.3" />

      {/* Shoulders */}
      <circle cx="60" cy="82" r="14" fill={c('shoulders')} opacity="0.7" stroke={c('shoulders')} strokeWidth="1.5">
        <title>{title('shoulders')}</title>
      </circle>
      <circle cx="140" cy="82" r="14" fill={c('shoulders')} opacity="0.7" stroke={c('shoulders')} strokeWidth="1.5">
        <title>{title('shoulders')}</title>
      </circle>

      {/* Chest */}
      <rect x="72" y="72" width="56" height="40" rx="8" fill={c('chest')} opacity="0.7" stroke={c('chest')} strokeWidth="1.5">
        <title>{title('chest')}</title>
      </rect>

      {/* Biceps */}
      <rect x="38" y="96" width="16" height="40" rx="6" fill={c('biceps')} opacity="0.7" stroke={c('biceps')} strokeWidth="1.5">
        <title>{title('biceps')}</title>
      </rect>
      <rect x="146" y="96" width="16" height="40" rx="6" fill={c('biceps')} opacity="0.7" stroke={c('biceps')} strokeWidth="1.5">
        <title>{title('biceps')}</title>
      </rect>

      {/* Forearms (decorative, no muscle tracking) */}
      <rect x="38" y="140" width="14" height="36" rx="5" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />
      <rect x="148" y="140" width="14" height="36" rx="5" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />

      {/* Core */}
      <rect x="78" y="116" width="44" height="50" rx="6" fill={c('core')} opacity="0.7" stroke={c('core')} strokeWidth="1.5">
        <title>{title('core')}</title>
      </rect>

      {/* Quads */}
      <rect x="72" y="175" width="24" height="60" rx="8" fill={c('quads')} opacity="0.7" stroke={c('quads')} strokeWidth="1.5">
        <title>{title('quads')}</title>
      </rect>
      <rect x="104" y="175" width="24" height="60" rx="8" fill={c('quads')} opacity="0.7" stroke={c('quads')} strokeWidth="1.5">
        <title>{title('quads')}</title>
      </rect>

      {/* Lower legs (decorative) */}
      <rect x="74" y="242" width="20" height="55" rx="6" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />
      <rect x="106" y="242" width="20" height="55" rx="6" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />

      {/* Labels */}
      <text x="100" y="96" textAnchor="middle" fontSize="8" fill="var(--text)" fontWeight="700" opacity="0.8">PECS</text>
      <text x="100" y="144" textAnchor="middle" fontSize="7" fill="var(--text)" fontWeight="700" opacity="0.8">ABDOS</text>
      <text x="84" y="210" textAnchor="middle" fontSize="7" fill="var(--text)" fontWeight="700" opacity="0.8">QUAD</text>
      <text x="116" y="210" textAnchor="middle" fontSize="7" fill="var(--text)" fontWeight="700" opacity="0.8">QUAD</text>

      {/* View label */}
      <text x="100" y="320" textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">FACE</text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// SVG body parts (back view)
// ---------------------------------------------------------------------------

function BackBody({ recoveryMap }: { recoveryMap: Map<MuscleGroup, MuscleRecovery> }) {
  const c = (m: MuscleGroup) => COLORS[recoveryMap.get(m)?.status ?? 'rested']
  const title = (m: MuscleGroup) => {
    const r = recoveryMap.get(m)
    if (!r) return ''
    return `${r.label}: ${LABELS[r.status]}${r.hoursSince !== null ? ` (${r.hoursSince}h)` : ''}`
  }

  return (
    <svg viewBox="0 0 200 400" width="180" height="360" aria-label="Vue de dos">
      {/* Head */}
      <circle cx="100" cy="35" r="20" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" opacity="0.4" />

      {/* Neck */}
      <rect x="94" y="55" width="12" height="12" rx="3" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.3" />

      {/* Upper back */}
      <rect x="68" y="70" width="64" height="36" rx="8" fill={c('upper_back')} opacity="0.7" stroke={c('upper_back')} strokeWidth="1.5">
        <title>{title('upper_back')}</title>
      </rect>

      {/* Lower back */}
      <rect x="76" y="112" width="48" height="34" rx="6" fill={c('lower_back')} opacity="0.7" stroke={c('lower_back')} strokeWidth="1.5">
        <title>{title('lower_back')}</title>
      </rect>

      {/* Triceps */}
      <rect x="40" y="80" width="16" height="40" rx="6" fill={c('triceps')} opacity="0.7" stroke={c('triceps')} strokeWidth="1.5">
        <title>{title('triceps')}</title>
      </rect>
      <rect x="144" y="80" width="16" height="40" rx="6" fill={c('triceps')} opacity="0.7" stroke={c('triceps')} strokeWidth="1.5">
        <title>{title('triceps')}</title>
      </rect>

      {/* Forearms (decorative) */}
      <rect x="40" y="124" width="14" height="36" rx="5" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />
      <rect x="146" y="124" width="14" height="36" rx="5" fill="none" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.25" />

      {/* Glutes */}
      <rect x="72" y="152" width="24" height="24" rx="8" fill={c('glutes')} opacity="0.7" stroke={c('glutes')} strokeWidth="1.5">
        <title>{title('glutes')}</title>
      </rect>
      <rect x="104" y="152" width="24" height="24" rx="8" fill={c('glutes')} opacity="0.7" stroke={c('glutes')} strokeWidth="1.5">
        <title>{title('glutes')}</title>
      </rect>

      {/* Hamstrings */}
      <rect x="72" y="182" width="24" height="55" rx="8" fill={c('hamstrings')} opacity="0.7" stroke={c('hamstrings')} strokeWidth="1.5">
        <title>{title('hamstrings')}</title>
      </rect>
      <rect x="104" y="182" width="24" height="55" rx="8" fill={c('hamstrings')} opacity="0.7" stroke={c('hamstrings')} strokeWidth="1.5">
        <title>{title('hamstrings')}</title>
      </rect>

      {/* Calves */}
      <rect x="74" y="244" width="20" height="50" rx="7" fill={c('calves')} opacity="0.7" stroke={c('calves')} strokeWidth="1.5">
        <title>{title('calves')}</title>
      </rect>
      <rect x="106" y="244" width="20" height="50" rx="7" fill={c('calves')} opacity="0.7" stroke={c('calves')} strokeWidth="1.5">
        <title>{title('calves')}</title>
      </rect>

      {/* Labels */}
      <text x="100" y="92" textAnchor="middle" fontSize="7" fill="var(--text)" fontWeight="700" opacity="0.8">HAUT DOS</text>
      <text x="100" y="133" textAnchor="middle" fontSize="7" fill="var(--text)" fontWeight="700" opacity="0.8">BAS DOS</text>
      <text x="84" y="168" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">GLUTE</text>
      <text x="116" y="168" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">GLUTE</text>
      <text x="84" y="214" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">ISCH</text>
      <text x="116" y="214" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">ISCH</text>
      <text x="84" y="274" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">MOLL</text>
      <text x="116" y="274" textAnchor="middle" fontSize="6" fill="var(--text)" fontWeight="700" opacity="0.8">MOLL</text>

      {/* View label */}
      <text x="100" y="320" textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">DOS</text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function Legend() {
  const statuses: RecoveryStatus[] = ['rested', 'recovering', 'fatigued']
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
        flexWrap: 'wrap',
      }}
    >
      {statuses.map((s) => (
        <div
          key={s}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: COLORS[s],
              opacity: 0.8,
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{LABELS[s]}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Muscle list (detail view below the SVG)
// ---------------------------------------------------------------------------

function MuscleList({ recoveries }: { recoveries: MuscleRecovery[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 6,
        marginTop: 12,
      }}
    >
      {recoveries.map((r) => (
        <div
          key={r.muscle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 8,
            background: COLORS[r.status] + '11',
            border: `1px solid ${COLORS[r.status]}33`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: COLORS[r.status],
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.label}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
              {r.hoursSince !== null ? `${r.hoursSince}h` : 'Jamais entraine'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecoveryMap() {
  const { state } = useAppState()

  const recoveries = useMemo(() => computeRecovery(state.workouts), [state.workouts])

  const recoveryMap = useMemo(() => {
    const m = new Map<MuscleGroup, MuscleRecovery>()
    recoveries.forEach((r) => m.set(r.muscle, r))
    return m
  }, [recoveries])

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
      {/* Title */}
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
        Senzu Bean Recovery
      </h3>
      <p
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          margin: '0 0 12px',
        }}
      >
        Etat de recuperation musculaire
      </p>

      {/* Body maps side by side */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <FrontBody recoveryMap={recoveryMap} />
        <BackBody recoveryMap={recoveryMap} />
      </div>

      {/* Legend */}
      <Legend />

      {/* Detailed muscle list */}
      <MuscleList recoveries={recoveries} />
    </div>
  )
}
