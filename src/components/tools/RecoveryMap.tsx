import { useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

// ---------------------------------------------------------------------------
// Constants & Types
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

const RAW_COLORS: Record<RecoveryStatus, string> = {
  rested: '#22c55e',
  recovering: '#f59e0b',
  fatigued: '#ef4444',
  unknown: '#6b7280',
}

const STATUS_LABELS_FR: Record<RecoveryStatus, string> = {
  rested: 'Repos\u00e9',
  recovering: 'R\u00e9cup\u00e9ration',
  fatigued: 'Fatigu\u00e9',
  unknown: 'Jamais entra\u00een\u00e9',
}

// ---------------------------------------------------------------------------
// Dot positions (% of image container)
// ---------------------------------------------------------------------------

const FRONT_DOTS: { muscle: string; label: string; left: number; top: number }[] = [
  { muscle: 'Shoulders', label: '\u00c9PAULES', left: 28, top: 26 },
  { muscle: 'Shoulders', label: '\u00c9PAULES', left: 67, top: 26 },
  { muscle: 'Chest', label: 'PECS', left: 38, top: 31 },
  { muscle: 'Chest', label: 'PECS', left: 57, top: 31 },
  { muscle: 'Biceps', label: 'BICEPS', left: 22, top: 37 },
  { muscle: 'Biceps', label: 'BICEPS', left: 73, top: 37 },
  { muscle: 'Core', label: 'ABDOS', left: 47, top: 40 },
  { muscle: 'Quads', label: 'QUADS', left: 38, top: 58 },
  { muscle: 'Quads', label: 'QUADS', left: 57, top: 58 },
]

const BACK_DOTS: { muscle: string; label: string; left: number; top: number }[] = [
  { muscle: 'Back', label: 'HAUT DOS', left: 47, top: 28 },
  { muscle: 'Back', label: 'BAS DOS', left: 47, top: 38 },
  { muscle: 'Triceps', label: 'TRICEPS', left: 24, top: 37 },
  { muscle: 'Triceps', label: 'TRICEPS', left: 71, top: 37 },
  { muscle: 'Glutes', label: 'FESSIERS', left: 40, top: 50 },
  { muscle: 'Glutes', label: 'FESSIERS', left: 55, top: 50 },
  { muscle: 'Hamstrings', label: 'ISCH.', left: 39, top: 62 },
  { muscle: 'Hamstrings', label: 'ISCH.', left: 56, top: 62 },
  { muscle: 'Calves', label: 'MOLLETS', left: 38, top: 78 },
  { muscle: 'Calves', label: 'MOLLETS', left: 57, top: 78 },
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
// Sub-components
// ---------------------------------------------------------------------------

function MuscleDot({
  dot,
  status,
  isActive,
  onTap,
}: {
  dot: { muscle: string; label: string; left: number; top: number }
  status: RecoveryStatus
  isActive: boolean
  onTap: () => void
}) {
  const color = RAW_COLORS[status]
  const size = isActive ? 22 : 18

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${dot.label}: ${STATUS_LABELS_FR[status]}`}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
      style={{
        position: 'absolute',
        left: `${dot.left}%`,
        top: `${dot.top}%`,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: 6,
        background: `${color}cc`,
        border: `2px solid ${color}`,
        boxShadow: `0 0 ${isActive ? 14 : 8}px ${color}, 0 0 ${isActive ? 24 : 12}px ${color}55`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        zIndex: isActive ? 20 : 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
      }}
    >
      {/* Label above the dot */}
      <span
        style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 8,
          fontWeight: 700,
          color: 'var(--rm-text, #fff)',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          letterSpacing: 0.5,
          pointerEvents: 'none',
          opacity: isActive ? 1 : 0.85,
        }}
      >
        {dot.label}
      </span>

      {/* Tooltip on active */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--rm-tooltip-bg, rgba(0,0,0,0.85))',
            color: 'var(--rm-tooltip-text, #fff)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 30,
            border: `1px solid ${color}`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          {MUSCLE_FR[dot.muscle] ?? dot.muscle} — {STATUS_LABELS_FR[status]}
        </div>
      )}

      {/* Bright inner core */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.7,
        }}
      />
    </div>
  )
}

function BodyPanel({
  title,
  dots,
  flipped,
  recoveryMap,
  activeDot,
  onDotTap,
}: {
  title: string
  dots: typeof FRONT_DOTS
  flipped: boolean
  recoveryMap: Record<string, { status: RecoveryStatus; hoursSince: number }>
  activeDot: string | null
  onDotTap: (key: string) => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 220,
          aspectRatio: '3 / 5',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--rm-panel-bg, rgba(255,255,255,0.04))',
          border: '1px solid var(--rm-border, rgba(255,255,255,0.08))',
        }}
      >
        <img
          src="images/goku.png"
          alt={`Goku ${title}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            ...(flipped ? { transform: 'scaleX(-1)' } : {}),
            filter: 'brightness(0.85) contrast(1.05)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />
        {dots.map((dot, i) => {
          const key = `${title}-${dot.muscle}-${i}`
          const rec = recoveryMap[dot.muscle] ?? { status: 'unknown' as RecoveryStatus, hoursSince: -1 }
          return (
            <MuscleDot
              key={key}
              dot={dot}
              status={rec.status}
              isActive={activeDot === key}
              onTap={() => onDotTap(activeDot === key ? '' : key)}
            />
          )
        })}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: 'var(--rm-label, rgba(255,255,255,0.5))',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RecoveryMap() {
  const { state } = useAppState()
  const [activeDot, setActiveDot] = useState<string | null>(null)

  // Compute hours since last training per muscle
  const recoveryMap = useMemo(() => {
    const now = Date.now()
    const muscleLastTrained: Record<string, number> = {}

    state.workouts.forEach((session: any) => {
      const sessionTime = new Date(session.date).getTime()
      ;(session.exercises ?? []).forEach((ex: any) => {
        const def = getExerciseById(ex.exerciseId)
        if (!def) return
        const muscles = [...(def.primaryMuscles ?? []), ...(def.secondaryMuscles ?? [])]
        muscles.forEach((m: string) => {
          if (!muscleLastTrained[m] || sessionTime > muscleLastTrained[m]) {
            muscleLastTrained[m] = sessionTime
          }
        })
      })
    })

    const result: Record<string, { status: RecoveryStatus; hoursSince: number }> = {}
    Object.keys(MUSCLE_FR).forEach((muscle) => {
      const last = muscleLastTrained[muscle]
      if (!last) {
        result[muscle] = { status: 'unknown', hoursSince: -1 }
      } else {
        const hours = (now - last) / 3_600_000
        result[muscle] = { status: getRecoveryStatus(hours), hoursSince: hours }
      }
    })
    return result
  }, [state.workouts])

  return (
    <div
      style={{
        background: 'var(--rm-bg, #0f0f14)',
        borderRadius: 16,
        padding: 20,
        color: 'var(--rm-text, #e5e5e5)',
        fontFamily: 'var(--rm-font, system-ui, -apple-system, sans-serif)',
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1,
            color: 'var(--rm-heading, #fff)',
          }}
        >
          SENZU BEAN RECOVERY
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'var(--rm-subtext, rgba(255,255,255,0.45))',
          }}
        >
          {'\u00c9'}tat de r{'\u00e9'}cup{'\u00e9'}ration musculaire
        </p>
      </div>

      {/* Two body panels side by side */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <BodyPanel
          title="FACE"
          dots={FRONT_DOTS}
          flipped={false}
          recoveryMap={recoveryMap}
          activeDot={activeDot}
          onDotTap={setActiveDot}
        />
        <BodyPanel
          title="DOS"
          dots={BACK_DOTS}
          flipped={true}
          recoveryMap={recoveryMap}
          activeDot={activeDot}
          onDotTap={setActiveDot}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {(['rested', 'recovering', 'fatigued'] as RecoveryStatus[]).map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: RAW_COLORS[s],
                boxShadow: `0 0 6px ${RAW_COLORS[s]}`,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--rm-legend, rgba(255,255,255,0.6))' }}>
              {STATUS_LABELS_FR[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Muscle grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {Object.keys(MUSCLE_FR).map((muscle) => {
          const rec = recoveryMap[muscle]
          const color = RAW_COLORS[rec.status]
          return (
            <div
              key={muscle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--rm-card-bg, rgba(255,255,255,0.04))',
                border: '1px solid var(--rm-card-border, rgba(255,255,255,0.06))',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--rm-card-title, #fff)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {MUSCLE_FR[muscle]}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--rm-card-sub, rgba(255,255,255,0.4))',
                    marginTop: 1,
                  }}
                >
                  {rec.hoursSince < 0 ? 'Jamais entra\u00een\u00e9' : `${Math.round(rec.hoursSince)}h`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
