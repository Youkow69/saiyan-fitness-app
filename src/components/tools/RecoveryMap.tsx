import { useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecoveryStatus = 'rested' | 'recovering' | 'fatigued' | 'unknown'

const MUSCLE_FR: Record<string, string> = {
  Chest: 'Pectoraux',
  Back: 'Dos',
  Shoulders: '\u00c9paules',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Quads: 'Quadriceps',
  Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers',
  Calves: 'Mollets',
  Core: 'Abdominaux',
}

const STATUS_COLORS: Record<RecoveryStatus, string> = {
  rested: 'var(--recovery-rested, #22c55e)',
  recovering: 'var(--recovery-recovering, #f59e0b)',
  fatigued: 'var(--recovery-fatigued, #ef4444)',
  unknown: 'var(--recovery-unknown, #888888)',
}

const STATUS_RAW_COLORS: Record<RecoveryStatus, string> = {
  rested: '#22c55e',
  recovering: '#f59e0b',
  fatigued: '#ef4444',
  unknown: '#888888',
}

const STATUS_LABELS: Record<RecoveryStatus, string> = {
  rested: 'Repos\u00e9 (48h+)',
  recovering: 'En r\u00e9cup\u00e9ration (24-48h)',
  fatigued: 'Fatigu\u00e9 (<24h)',
  unknown: 'Jamais entra\u00een\u00e9',
}

// ---------------------------------------------------------------------------
// Muscle dot positions on Goku image (% from top-left)
// ---------------------------------------------------------------------------

const MUSCLE_DOTS: { muscle: string; positions: { left: number; top: number }[] }[] = [
  { muscle: 'Chest', positions: [{ left: 38, top: 32 }, { left: 55, top: 32 }] },
  { muscle: 'Shoulders', positions: [{ left: 25, top: 27 }, { left: 68, top: 27 }] },
  { muscle: 'Biceps', positions: [{ left: 20, top: 38 }, { left: 73, top: 38 }] },
  { muscle: 'Triceps', positions: [{ left: 22, top: 42 }, { left: 71, top: 42 }] },
  { muscle: 'Core', positions: [{ left: 47, top: 42 }] },
  { muscle: 'Back', positions: [{ left: 47, top: 35 }] },
  { muscle: 'Quads', positions: [{ left: 37, top: 62 }, { left: 56, top: 62 }] },
  { muscle: 'Hamstrings', positions: [{ left: 38, top: 68 }, { left: 55, top: 68 }] },
  { muscle: 'Glutes', positions: [{ left: 47, top: 55 }] },
  { muscle: 'Calves', positions: [{ left: 37, top: 78 }, { left: 56, top: 78 }] },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecoveryStatus(hoursSince: number): RecoveryStatus {
  if (hoursSince < 0) return 'unknown'
  if (hoursSince >= 48) return 'rested'
  if (hoursSince >= 24) return 'recovering'
  return 'fatigued'
}

// ---------------------------------------------------------------------------
// Muscle Dot component
// ---------------------------------------------------------------------------

function MuscleDot({
  muscle,
  pos,
  idx,
  recovery,
  isHovered,
  onToggle,
}: {
  muscle: string
  pos: { left: number; top: number }
  idx: number
  recovery: { status: RecoveryStatus; hoursSince: number }
  isHovered: boolean
  onToggle: () => void
}) {
  const status = recovery?.status ?? 'unknown'
  const color = STATUS_COLORS[status]
  const rawColor = STATUS_RAW_COLORS[status]
  const size = isHovered ? 22 : 16
  const glowSize = isHovered ? 14 : 8

  return (
    <div
      key={`${muscle}-${idx}`}
      role="button"
      tabIndex={0}
      aria-label={`${MUSCLE_FR[muscle]}: ${STATUS_LABELS[status]}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      style={{
        position: 'absolute',
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${rawColor}ee 0%, ${rawColor}88 60%, ${rawColor}00 100%)`,
        transform: 'translate(-50%, -50%)',
        boxShadow: `0 0 ${glowSize}px ${rawColor}, 0 0 ${glowSize * 2}px ${rawColor}66`,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        zIndex: isHovered ? 10 : 1,
        border: `2px solid ${rawColor}`,
        outline: 'none',
      }}
      title={`${MUSCLE_FR[muscle]}: ${STATUS_LABELS[status]}`}
    >
      {/* Inner bright core */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, ${rawColor} 100%)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tooltip component
// ---------------------------------------------------------------------------

function MuscleTooltip({
  muscle,
  recovery,
}: {
  muscle: string
  recovery: { status: RecoveryStatus; hoursSince: number }
}) {
  const status = recovery?.status ?? 'unknown'
  const rawColor = STATUS_RAW_COLORS[status]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card, #1a1a2e)',
        border: '1px solid var(--border, #333)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: '0.8rem',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        zIndex: 20,
        boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${rawColor}33`,
        pointerEvents: 'none',
      }}
    >
      <strong style={{ color: rawColor }}>
        {MUSCLE_FR[muscle]}
      </strong>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #999)', marginTop: 2 }}>
        {recovery?.hoursSince >= 0
          ? `${Math.round(recovery.hoursSince)}h \u2014 ${STATUS_LABELS[status]}`
          : STATUS_LABELS.unknown}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecoveryMap() {
  const { state } = useAppState()
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)

  const muscleRecovery = useMemo(() => {
    const now = Date.now()
    const recovery: Record<string, { status: RecoveryStatus; hoursSince: number }> = {}

    // Initialize all muscles as unknown
    Object.keys(MUSCLE_FR).forEach((m) => {
      recovery[m] = { status: 'unknown', hoursSince: -1 }
    })

    // Find most recent workout for each muscle
    for (let i = state.workouts.length - 1; i >= 0; i--) {
      const w = state.workouts[i]
      const workoutTime = new Date(w.date + 'T12:00:00').getTime()
      const hoursSince = (now - workoutTime) / 3600000

      for (const ex of w.exercises) {
        const exercise = getExerciseById(ex.exerciseId)
        if (!exercise) continue
        for (const muscle of exercise.primaryMuscles) {
          if (
            !recovery[muscle] ||
            recovery[muscle].hoursSince < 0 ||
            hoursSince < recovery[muscle].hoursSince
          ) {
            recovery[muscle] = {
              status: getRecoveryStatus(hoursSince),
              hoursSince,
            }
          }
        }
      }
    }

    return recovery
  }, [state.workouts])

  return (
    <div
      style={{
        background: 'var(--bg-card, #1a1a2e)',
        borderRadius: 16,
        border: '1px solid var(--border, #333)',
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
          color: 'var(--accent, #ff8c00)',
          margin: '0 0 4px',
        }}
      >
        Senzu Bean Recovery
      </h3>
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary, #999)',
          margin: '0 0 16px',
        }}
      >
        {'\u00c9'}tat de r{'\u00e9'}cup{'\u00e9'}ration musculaire
      </p>

      {/* Goku body with muscle dots */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 280,
          margin: '0 auto 16px',
          aspectRatio: '1 / 2',
        }}
      >
        <img
          src="images/goku.png"
          alt="Goku - carte de r\u00e9cup\u00e9ration"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.85,
            filter: 'drop-shadow(0 0 10px var(--accent-glow, rgba(255,140,0,0.25)))',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          loading="lazy"
          draggable={false}
        />

        {/* Muscle indicator dots */}
        {MUSCLE_DOTS.map(({ muscle, positions }) => {
          const recovery = muscleRecovery[muscle]
          const isHovered = hoveredMuscle === muscle

          return positions.map((pos, idx) => (
            <MuscleDot
              key={`${muscle}-${idx}`}
              muscle={muscle}
              pos={pos}
              idx={idx}
              recovery={recovery}
              isHovered={isHovered}
              onToggle={() =>
                setHoveredMuscle(hoveredMuscle === muscle ? null : muscle)
              }
            />
          ))
        })}

        {/* Hovered muscle tooltip */}
        {hoveredMuscle && muscleRecovery[hoveredMuscle] && (
          <MuscleTooltip
            muscle={hoveredMuscle}
            recovery={muscleRecovery[hoveredMuscle]}
          />
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 12,
          fontSize: '0.72rem',
          flexWrap: 'wrap',
        }}
      >
        {(['rested', 'recovering', 'fatigued'] as RecoveryStatus[]).map((s) => (
          <div
            key={s}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: STATUS_RAW_COLORS[s],
                boxShadow: `0 0 4px ${STATUS_RAW_COLORS[s]}88`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--text-secondary, #999)' }}>
              {STATUS_LABELS[s].split(' (')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Muscle grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {Object.entries(MUSCLE_FR).map(([eng, fr]) => {
          const rec = muscleRecovery[eng]
          const status = rec?.status ?? 'unknown'
          const rawColor = STATUS_RAW_COLORS[status]
          const isActive = hoveredMuscle === eng

          return (
            <div
              key={eng}
              role="button"
              tabIndex={0}
              onClick={() =>
                setHoveredMuscle(hoveredMuscle === eng ? null : eng)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setHoveredMuscle(hoveredMuscle === eng ? null : eng)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: isActive
                  ? `${rawColor}18`
                  : 'var(--bg-card-inner, rgba(255,255,255,0.02))',
                border: `1px solid ${isActive ? `${rawColor}55` : 'var(--border, #333)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: rawColor,
                  boxShadow: `0 0 4px ${rawColor}88`,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text, #eee)',
                  }}
                >
                  {fr}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary, #999)',
                  }}
                >
                  {rec?.hoursSince >= 0
                    ? `${Math.round(rec.hoursSince)}h`
                    : 'Jamais entra\u00een\u00e9'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
