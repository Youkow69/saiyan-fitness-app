import { useMemo, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'

type Status = 'rested' | 'recovering' | 'fatigued' | 'unknown'

const MUSCLE_FR: Record<MuscleGroup, string> = {
  Chest: 'Pectoraux',
  Back: 'Dos',
  Shoulders: 'Epaules',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Quads: 'Quadriceps',
  Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers',
  Calves: 'Mollets',
  Core: 'Abdominaux',
}

const STATUS_COLORS: Record<Status, string> = {
  rested: '#22c55e',
  recovering: '#f59e0b',
  fatigued: '#ef4444',
  unknown: '#6b7280',
}

const STATUS_LABELS: Record<Status, string> = {
  rested: 'Repose (48h+)',
  recovering: 'Recuperation (24-48h)',
  fatigued: 'Fatigue (<24h)',
  unknown: 'Jamais entraine',
}

function getStatus(h: number): Status {
  if (h < 0) return 'unknown'
  if (h >= 48) return 'rested'
  if (h >= 24) return 'recovering'
  return 'fatigued'
}

// ---------------------------------------------------------------------------
// Zone definitions — each zone is a semi-transparent ellipse overlay
// ---------------------------------------------------------------------------

interface MuscleZone {
  id: string
  label: string
  muscle: MuscleGroup
  left: number
  top: number
  width: number
  height: number
}

const FRONT_ZONES: MuscleZone[] = [
  // Traps
  { id: 'f-traps', label: 'Trapezes', muscle: 'Shoulders', left: 35, top: 17, width: 28, height: 5 },
  // Shoulders
  { id: 'f-shoulder-l', label: 'Epaule G', muscle: 'Shoulders', left: 18, top: 19, width: 14, height: 8 },
  { id: 'f-shoulder-r', label: 'Epaule D', muscle: 'Shoulders', left: 66, top: 19, width: 14, height: 8 },
  // Pectorals
  { id: 'f-pec-l', label: 'Pectoral G', muscle: 'Chest', left: 30, top: 25, width: 18, height: 8 },
  { id: 'f-pec-r', label: 'Pectoral D', muscle: 'Chest', left: 52, top: 25, width: 18, height: 8 },
  // Biceps
  { id: 'f-bicep-l', label: 'Biceps G', muscle: 'Biceps', left: 13, top: 30, width: 10, height: 12 },
  { id: 'f-bicep-r', label: 'Biceps D', muscle: 'Biceps', left: 76, top: 30, width: 10, height: 12 },
  // Forearms
  { id: 'f-forearm-l', label: 'Avant-bras G', muscle: 'Biceps', left: 10, top: 42, width: 8, height: 12 },
  { id: 'f-forearm-r', label: 'Avant-bras D', muscle: 'Biceps', left: 80, top: 42, width: 8, height: 12 },
  // Abs
  { id: 'f-abs', label: 'Abdominaux', muscle: 'Core', left: 38, top: 35, width: 22, height: 14 },
  // Obliques
  { id: 'f-oblique-l', label: 'Oblique G', muscle: 'Core', left: 28, top: 37, width: 10, height: 10 },
  { id: 'f-oblique-r', label: 'Oblique D', muscle: 'Core', left: 60, top: 37, width: 10, height: 10 },
  // Quads
  { id: 'f-quad-l', label: 'Quadriceps G', muscle: 'Quads', left: 30, top: 53, width: 16, height: 18 },
  { id: 'f-quad-r', label: 'Quadriceps D', muscle: 'Quads', left: 53, top: 53, width: 16, height: 18 },
  // Tibialis
  { id: 'f-tib-l', label: 'Tibial G', muscle: 'Calves', left: 32, top: 75, width: 10, height: 12 },
  { id: 'f-tib-r', label: 'Tibial D', muscle: 'Calves', left: 57, top: 75, width: 10, height: 12 },
]

const BACK_ZONES: MuscleZone[] = [
  // Traps
  { id: 'b-traps', label: 'Trapezes', muscle: 'Shoulders', left: 33, top: 13, width: 32, height: 8 },
  // Shoulders
  { id: 'b-shoulder-l', label: 'Epaule G', muscle: 'Shoulders', left: 18, top: 16, width: 14, height: 8 },
  { id: 'b-shoulder-r', label: 'Epaule D', muscle: 'Shoulders', left: 66, top: 16, width: 14, height: 8 },
  // Lats
  { id: 'b-lat-l', label: 'Dorsal G', muscle: 'Back', left: 24, top: 22, width: 20, height: 14 },
  { id: 'b-lat-r', label: 'Dorsal D', muscle: 'Back', left: 54, top: 22, width: 20, height: 14 },
  // Lower back
  { id: 'b-lower', label: 'Lombaires', muscle: 'Back', left: 38, top: 37, width: 22, height: 8 },
  // Triceps
  { id: 'b-tricep-l', label: 'Triceps G', muscle: 'Triceps', left: 12, top: 30, width: 10, height: 12 },
  { id: 'b-tricep-r', label: 'Triceps D', muscle: 'Triceps', left: 76, top: 30, width: 10, height: 12 },
  // Forearms
  { id: 'b-forearm-l', label: 'Avant-bras G', muscle: 'Biceps', left: 8, top: 42, width: 8, height: 12 },
  { id: 'b-forearm-r', label: 'Avant-bras D', muscle: 'Biceps', left: 82, top: 42, width: 8, height: 12 },
  // Glutes
  { id: 'b-glute-l', label: 'Fessier G', muscle: 'Glutes', left: 32, top: 46, width: 17, height: 10 },
  { id: 'b-glute-r', label: 'Fessier D', muscle: 'Glutes', left: 50, top: 46, width: 17, height: 10 },
  // Hamstrings
  { id: 'b-ham-l', label: 'Ischio G', muscle: 'Hamstrings', left: 30, top: 56, width: 16, height: 16 },
  { id: 'b-ham-r', label: 'Ischio D', muscle: 'Hamstrings', left: 53, top: 56, width: 16, height: 16 },
  // Calves
  { id: 'b-calf-l', label: 'Mollet G', muscle: 'Calves', left: 32, top: 74, width: 12, height: 14 },
  { id: 'b-calf-r', label: 'Mollet D', muscle: 'Calves', left: 55, top: 74, width: 12, height: 14 },
]

// ---------------------------------------------------------------------------
// Zone overlay sub-component
// ---------------------------------------------------------------------------

function ZoneOverlay({
  zone,
  status,
  isActive,
  onClick,
}: {
  zone: MuscleZone
  status: Status
  isActive: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  // Rested = no overlay (green image shows through). Others get colored overlays.
  if (status === 'rested' && !isActive && !hovered) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        style={{
          position: 'absolute',
          left: `${zone.left}%`,
          top: `${zone.top}%`,
          width: `${zone.width}%`,
          height: `${zone.height}%`,
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 2,
        }}
        title={zone.label}
      />
    )
  }

  const color = STATUS_COLORS[status]
  const bgAlpha = status === 'rested' ? '22' : status === 'unknown' ? '33' : '44'
  const borderAlpha = status === 'rested' ? '44' : '66'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${zone.left}%`,
        top: `${zone.top}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        borderRadius: '50%',
        background: `${color}${bgAlpha}`,
        border: `1px solid ${color}${borderAlpha}`,
        boxShadow: isActive ? `0 0 12px 4px ${color}55` : 'none',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={zone.label}
    >
      {/* Floating label on hover or active */}
      {(hovered || isActive) && (
        <span
          style={{
            position: 'absolute',
            top: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: 'var(--rm-zone-label-size, 9px)',
            fontWeight: 700,
            color: 'var(--rm-zone-label-color, #f8fafc)',
            background: `${color}cc`,
            padding: '2px 6px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            letterSpacing: '0.3px',
          }}
        >
          {zone.label}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecoveryMap() {
  const { state } = useAppState()
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)

  // Compute hours since last training for each muscle group
  const muscleHours = useMemo(() => {
    const now = Date.now()
    const lastTrained: Partial<Record<MuscleGroup, number>> = {}

    for (const workout of state.workouts) {
      const ts = new Date(workout.date).getTime()
      for (const entry of workout.exercises) {
        const exercise = getExerciseById(entry.exerciseId)
        if (!exercise) continue
        for (const muscle of exercise.primaryMuscles) {
          const m = muscle as MuscleGroup
          const prev = lastTrained[m]
          if (prev === undefined || ts > prev) {
            lastTrained[m] = ts
          }
        }
      }
    }

    const result: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>
    const allMuscles = Object.keys(MUSCLE_FR) as MuscleGroup[]
    for (const m of allMuscles) {
      if (lastTrained[m] !== undefined) {
        result[m] = (now - lastTrained[m]!) / (1000 * 60 * 60)
      } else {
        result[m] = -1
      }
    }
    return result
  }, [state.workouts])

  const muscleStatus = useMemo(() => {
    const result: Record<MuscleGroup, Status> = {} as Record<MuscleGroup, Status>
    for (const [muscle, hours] of Object.entries(muscleHours)) {
      result[muscle as MuscleGroup] = getStatus(hours)
    }
    return result
  }, [muscleHours])

  const handleZoneClick = (muscle: MuscleGroup) => {
    setSelectedMuscle((prev) => (prev === muscle ? null : muscle))
  }

  const selectedStatus = selectedMuscle ? muscleStatus[selectedMuscle] : null
  const selectedHours = selectedMuscle ? muscleHours[selectedMuscle] : null

  // The green-tint CSS filter applied to body images
  const imageFilter = 'hue-rotate(85deg) saturate(1.2) brightness(1.05)'

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
        maxWidth: 'var(--rm-max-width, 620px)',
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
        Carte de Recuperation Musculaire
      </h2>

      {/* Subtitle explaining the concept */}
      <p
        style={{
          margin: 0,
          fontSize: 'var(--rm-subtitle-size, 12px)',
          textAlign: 'center',
          color: 'var(--rm-subtitle-color, #64748b)',
          lineHeight: 1.4,
        }}
      >
        Vert = repose • Les zones colorees indiquent la fatigue ou la recuperation
      </p>

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
            maxWidth: 'var(--rm-img-max-width, 280px)',
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
              filter: imageFilter,
            }}
          />
          {FRONT_ZONES.map((zone) => (
            <ZoneOverlay
              key={zone.id}
              zone={zone}
              status={muscleStatus[zone.muscle] ?? 'unknown'}
              isActive={selectedMuscle === zone.muscle}
              onClick={() => handleZoneClick(zone.muscle)}
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
            maxWidth: 'var(--rm-img-max-width, 280px)',
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
              filter: imageFilter,
            }}
          />
          {BACK_ZONES.map((zone) => (
            <ZoneOverlay
              key={zone.id}
              zone={zone}
              status={muscleStatus[zone.muscle] ?? 'unknown'}
              isActive={selectedMuscle === zone.muscle}
              onClick={() => handleZoneClick(zone.muscle)}
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

      {/* Selected muscle detail panel */}
      {selectedMuscle && selectedStatus && (
        <div
          style={{
            background: 'var(--rm-detail-bg, rgba(30, 41, 59, 0.8))',
            border: `2px solid ${STATUS_COLORS[selectedStatus]}`,
            borderRadius: 'var(--rm-detail-radius, 12px)',
            padding: 'var(--rm-detail-padding, 12px 16px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--rm-detail-gap, 12px)',
            animation: 'rmFadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              width: 'var(--rm-detail-dot-size, 16px)',
              height: 'var(--rm-detail-dot-size, 16px)',
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[selectedStatus],
              boxShadow: `0 0 8px ${STATUS_COLORS[selectedStatus]}80`,
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
              {MUSCLE_FR[selectedMuscle]}
            </div>
            <div
              style={{
                fontSize: 'var(--rm-detail-sub-size, 12px)',
                color: 'var(--rm-detail-sub-color, #94a3b8)',
                marginTop: 2,
              }}
            >
              {STATUS_LABELS[selectedStatus]}
              {selectedHours !== null && selectedHours >= 0
                ? ` — ${Math.round(selectedHours)}h depuis le dernier entrainement`
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
                backgroundColor: STATUS_COLORS[s],
                boxShadow: `0 0 4px ${STATUS_COLORS[s]}60`,
              }}
            />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Muscle grid at bottom */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(var(--rm-grid-min, 130px), 1fr))',
          gap: 'var(--rm-grid-gap, 8px)',
        }}
      >
        {(Object.keys(MUSCLE_FR) as MuscleGroup[]).map((muscle) => {
          const status = muscleStatus[muscle] ?? 'unknown'
          const hours = muscleHours[muscle] ?? -1
          const color = STATUS_COLORS[status]
          const isSelected = selectedMuscle === muscle
          return (
            <button
              key={muscle}
              onClick={() => handleZoneClick(muscle)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--rm-cell-gap, 8px)',
                padding: 'var(--rm-cell-padding, 10px 12px)',
                background: isSelected
                  ? 'var(--rm-cell-bg-active, rgba(51, 65, 85, 0.9))'
                  : 'var(--rm-cell-bg, rgba(30, 41, 59, 0.6))',
                border: isSelected
                  ? `2px solid ${color}`
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
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}60`,
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

      {/* Inline keyframes for fade-in animation */}
      <style>{`
        @keyframes rmFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
