import { useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

const MUSCLE_FR: Record<string, string> = {
  Chest: 'Pectoraux', Back: 'Dos', Shoulders: 'Épaules', Biceps: 'Biceps',
  Triceps: 'Triceps', Quads: 'Quadriceps', Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers', Calves: 'Mollets', Core: 'Abdominaux',
}

type Status = 'rested' | 'recovering' | 'fatigued' | 'unknown'
const COLORS: Record<Status, string> = { rested: '#22c55e', recovering: '#f59e0b', fatigued: '#ef4444', unknown: '#6b7280' }
const LABELS: Record<Status, string> = { rested: 'Reposé (48h+)', recovering: 'Récupération (24-48h)', fatigued: 'Fatigué (<24h)', unknown: 'Jamais entraîné' }

function getStatus(h: number): Status {
  if (h < 0) return 'unknown'
  if (h >= 48) return 'rested'
  if (h >= 24) return 'recovering'
  return 'fatigued'
}

const FRONT = [
  { muscle: 'Chest', label: 'PECS', left: 38, top: 29 },
  { muscle: 'Chest', label: 'PECS', left: 60, top: 29 },
  { muscle: 'Shoulders', label: 'ÉP.', left: 24, top: 23 },
  { muscle: 'Shoulders', label: 'ÉP.', left: 74, top: 23 },
  { muscle: 'Biceps', label: 'BIC.', left: 18, top: 35 },
  { muscle: 'Biceps', label: 'BIC.', left: 80, top: 35 },
  { muscle: 'Core', label: 'ABDOS', left: 49, top: 40 },
  { muscle: 'Quads', label: 'QUADS', left: 38, top: 60 },
  { muscle: 'Quads', label: 'QUADS', left: 60, top: 60 },
  { muscle: 'Calves', label: 'MOLL.', left: 38, top: 80 },
  { muscle: 'Calves', label: 'MOLL.', left: 60, top: 80 },
]

const BACK_DOTS = [
  { muscle: 'Back', label: 'DOS', left: 49, top: 25 },
  { muscle: 'Back', label: 'DOS', left: 49, top: 35 },
  { muscle: 'Shoulders', label: 'ÉP.', left: 24, top: 20 },
  { muscle: 'Shoulders', label: 'ÉP.', left: 74, top: 20 },
  { muscle: 'Triceps', label: 'TRI.', left: 18, top: 37 },
  { muscle: 'Triceps', label: 'TRI.', left: 80, top: 37 },
  { muscle: 'Glutes', label: 'FESS.', left: 40, top: 50 },
  { muscle: 'Glutes', label: 'FESS.', left: 58, top: 50 },
  { muscle: 'Hamstrings', label: 'ISCH.', left: 38, top: 62 },
  { muscle: 'Hamstrings', label: 'ISCH.', left: 60, top: 62 },
  { muscle: 'Calves', label: 'MOLL.', left: 38, top: 80 },
  { muscle: 'Calves', label: 'MOLL.', left: 60, top: 80 },
]

// ---------------------------------------------------------------------------
// Dot sub-component
// ---------------------------------------------------------------------------

function Dot({
  left,
  top,
  color,
  label,
  onClick,
}: {
  left: number
  top: number
  color: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        width: 'var(--dot-size, 22px)',
        height: 'var(--dot-size, 22px)',
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid var(--dot-border, rgba(255,255,255,0.9))',
        boxShadow: `0 0 8px 2px ${color}80, 0 0 16px 4px ${color}40`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        zIndex: 2,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.3)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px 4px ${color}90, 0 0 24px 8px ${color}50`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px 2px ${color}80, 0 0 16px 4px ${color}40`
      }}
      title={label}
      aria-label={label}
    >
      <span
        style={{
          fontSize: 'var(--dot-font-size, 6px)',
          fontWeight: 700,
          color: 'var(--dot-text-color, #fff)',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecoveryMap() {
  const { state } = useAppState()
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)

  // Compute hours since last training for each muscle
  const muscleHours = useMemo(() => {
    const now = Date.now()
    const lastTrained: Record<string, number> = {}

    for (const workout of state.workouts) {
      const ts = new Date(workout.date).getTime()
      for (const entry of workout.exercises) {
        const exercise = getExerciseById(entry.exerciseId)
        if (!exercise) continue
        for (const muscle of exercise.primaryMuscles) {
          const prev = lastTrained[muscle]
          if (prev === undefined || ts > prev) {
            lastTrained[muscle] = ts
          }
        }
      }
    }

    const result: Record<string, number> = {}
    const allMuscles = Object.keys(MUSCLE_FR)
    for (const m of allMuscles) {
      if (lastTrained[m] !== undefined) {
        result[m] = (now - lastTrained[m]) / (1000 * 60 * 60)
      } else {
        result[m] = -1 // never trained
      }
    }
    return result
  }, [state.workouts])

  const muscleStatus = useMemo(() => {
    const result: Record<string, Status> = {}
    for (const [muscle, hours] of Object.entries(muscleHours)) {
      result[muscle] = getStatus(hours)
    }
    return result
  }, [muscleHours])

  const selectedStatus = selectedMuscle ? muscleStatus[selectedMuscle] : null
  const selectedHours = selectedMuscle ? muscleHours[selectedMuscle] : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rm-gap, 16px)',
        padding: 'var(--rm-padding, 16px)',
        fontFamily: 'var(--rm-font, system-ui, -apple-system, sans-serif)',
        color: 'var(--rm-text-color, #e2e8f0)',
        background: 'var(--rm-bg, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))',
        borderRadius: 'var(--rm-radius, 16px)',
        maxWidth: 'var(--rm-max-width, 600px)',
        margin: '0 auto',
      }}
    >
      {/* Title */}
      <h2
        style={{
          margin: 0,
          fontSize: 'var(--rm-title-size, 20px)',
          fontWeight: 700,
          textAlign: 'center',
          color: 'var(--rm-title-color, #f8fafc)',
          letterSpacing: '0.5px',
        }}
      >
        Carte de Récupération Musculaire
      </h2>

      {/* Anatomy images side by side */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--rm-images-gap, 8px)',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Front view */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 0',
            maxWidth: 'var(--rm-img-max-width, 260px)',
          }}
        >
          <img
            src="images/goku_muscles_front.png"
            alt="Vue de face - muscles"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 'var(--rm-img-radius, 12px)',
              opacity: 'var(--rm-img-opacity, 0.85)',
            }}
          />
          {FRONT.map((dot, i) => (
            <Dot
              key={`front-${i}`}
              left={dot.left}
              top={dot.top}
              color={COLORS[muscleStatus[dot.muscle] ?? 'unknown']}
              label={dot.label}
              onClick={() => setSelectedMuscle(dot.muscle)}
            />
          ))}
          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--rm-label-mt, 6px)',
              fontSize: 'var(--rm-label-size, 12px)',
              fontWeight: 600,
              color: 'var(--rm-label-color, #94a3b8)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Face
          </div>
        </div>

        {/* Back view */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 0',
            maxWidth: 'var(--rm-img-max-width, 260px)',
          }}
        >
          <img
            src="images/goku_muscles_back.png"
            alt="Vue de dos - muscles"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 'var(--rm-img-radius, 12px)',
              opacity: 'var(--rm-img-opacity, 0.85)',
            }}
          />
          {BACK_DOTS.map((dot, i) => (
            <Dot
              key={`back-${i}`}
              left={dot.left}
              top={dot.top}
              color={COLORS[muscleStatus[dot.muscle] ?? 'unknown']}
              label={dot.label}
              onClick={() => setSelectedMuscle(dot.muscle)}
            />
          ))}
          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--rm-label-mt, 6px)',
              fontSize: 'var(--rm-label-size, 12px)',
              fontWeight: 600,
              color: 'var(--rm-label-color, #94a3b8)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Dos
          </div>
        </div>
      </div>

      {/* Selected muscle detail */}
      {selectedMuscle && selectedStatus && (
        <div
          style={{
            background: 'var(--rm-detail-bg, rgba(30, 41, 59, 0.8))',
            border: `2px solid ${COLORS[selectedStatus]}`,
            borderRadius: 'var(--rm-detail-radius, 12px)',
            padding: 'var(--rm-detail-padding, 12px 16px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--rm-detail-gap, 12px)',
          }}
        >
          <div
            style={{
              width: 'var(--rm-detail-dot-size, 16px)',
              height: 'var(--rm-detail-dot-size, 16px)',
              borderRadius: '50%',
              backgroundColor: COLORS[selectedStatus],
              boxShadow: `0 0 8px ${COLORS[selectedStatus]}80`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--rm-detail-title-size, 15px)',
                color: 'var(--rm-detail-title-color, #f1f5f9)',
              }}
            >
              {MUSCLE_FR[selectedMuscle] ?? selectedMuscle}
            </div>
            <div
              style={{
                fontSize: 'var(--rm-detail-sub-size, 12px)',
                color: 'var(--rm-detail-sub-color, #94a3b8)',
                marginTop: 2,
              }}
            >
              {LABELS[selectedStatus]}
              {selectedHours !== null && selectedHours >= 0
                ? ` — ${Math.round(selectedHours)}h depuis le dernier entraînement`
                : ''}
            </div>
          </div>
          <button
            onClick={() => setSelectedMuscle(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--rm-detail-close-color, #64748b)',
              cursor: 'pointer',
              fontSize: 'var(--rm-detail-close-size, 18px)',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--rm-legend-gap, 16px)',
          flexWrap: 'wrap',
        }}
      >
        {(['rested', 'recovering', 'fatigued', 'unknown'] as Status[]).map((s) => (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--rm-legend-item-gap, 6px)',
              fontSize: 'var(--rm-legend-font-size, 11px)',
              color: 'var(--rm-legend-color, #94a3b8)',
            }}
          >
            <div
              style={{
                width: 'var(--rm-legend-dot-size, 10px)',
                height: 'var(--rm-legend-dot-size, 10px)',
                borderRadius: '50%',
                backgroundColor: COLORS[s],
                boxShadow: `0 0 4px ${COLORS[s]}60`,
              }}
            />
            {LABELS[s]}
          </div>
        ))}
      </div>

      {/* Muscle grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(var(--rm-grid-min, 130px), 1fr))',
          gap: 'var(--rm-grid-gap, 8px)',
        }}
      >
        {Object.keys(MUSCLE_FR).map((muscle) => {
          const status = muscleStatus[muscle] ?? 'unknown'
          const hours = muscleHours[muscle] ?? -1
          const isSelected = selectedMuscle === muscle
          return (
            <button
              key={muscle}
              onClick={() => setSelectedMuscle(isSelected ? null : muscle)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--rm-cell-gap, 8px)',
                padding: 'var(--rm-cell-padding, 10px 12px)',
                background: isSelected
                  ? 'var(--rm-cell-bg-active, rgba(51, 65, 85, 0.9))'
                  : 'var(--rm-cell-bg, rgba(30, 41, 59, 0.6))',
                border: isSelected
                  ? `2px solid ${COLORS[status]}`
                  : '2px solid var(--rm-cell-border, rgba(51, 65, 85, 0.5))',
                borderRadius: 'var(--rm-cell-radius, 10px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 'var(--rm-cell-dot, 12px)',
                  height: 'var(--rm-cell-dot, 12px)',
                  borderRadius: '50%',
                  backgroundColor: COLORS[status],
                  boxShadow: `0 0 6px ${COLORS[status]}60`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 'var(--rm-cell-title-size, 13px)',
                    color: 'var(--rm-cell-title-color, #e2e8f0)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {MUSCLE_FR[muscle]}
                </div>
                <div
                  style={{
                    fontSize: 'var(--rm-cell-sub-size, 10px)',
                    color: 'var(--rm-cell-sub-color, #64748b)',
                    marginTop: 1,
                  }}
                >
                  {hours >= 0 ? `${Math.round(hours)}h` : '—'}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
