import { useState, useMemo } from 'react'

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipment: string[]
  setupCues?: string[]
  executionCues?: string[]
  alternatives?: string[]
}

const MUSCLE_GROUPS = [
  { id: 'pectoraux', label: 'Pectoraux', emoji: '🫁' },
  { id: 'dos', label: 'Dos', emoji: '🔙' },
  { id: 'epaules', label: 'Epaules', emoji: '🏋️' },
  { id: 'biceps', label: 'Biceps', emoji: '💪' },
  { id: 'triceps', label: 'Triceps', emoji: '🦾' },
  { id: 'quadriceps', label: 'Quadriceps', emoji: '🦵' },
  { id: 'ischio-jambiers', label: 'Ischio-jambiers', emoji: '🦿' },
  { id: 'fessiers', label: 'Fessiers', emoji: '🍑' },
  { id: 'mollets', label: 'Mollets', emoji: '🦶' },
  { id: 'abdominaux', label: 'Abdominaux', emoji: '🧱' },
  { id: 'avant-bras', label: 'Avant-bras', emoji: '✊' },
  { id: 'trapezes', label: 'Trapezes', emoji: '🔺' },
]

const EQUIPMENT_OPTIONS = [
  { id: 'barre', label: 'Barre' },
  { id: 'halteres', label: 'Halteres' },
  { id: 'machine', label: 'Machine' },
  { id: 'cable', label: 'Cable' },
  { id: 'poids-de-corps', label: 'Poids de corps' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'elastique', label: 'Elastique' },
  { id: 'barre-ez', label: 'Barre EZ' },
]

function ExerciseDetailModal({
  exercise,
  onClose,
}: {
  exercise: Exercise
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 16,
          padding: 24,
          maxWidth: 500,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#e2e8f0',
          border: '1px solid #2d3748',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#ed8936' }}>{exercise.name}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              fontSize: 22,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Muscle groups */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1 }}>
            Muscles cibles
          </h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {exercise.muscleGroups.map((mg) => {
              const group = MUSCLE_GROUPS.find((g) => g.id === mg)
              return (
                <span
                  key={mg}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'rgba(237,137,54,0.15)',
                    color: '#ed8936',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {group?.emoji} {group?.label || mg}
                </span>
              )
            })}
          </div>
        </div>

        {/* Equipment */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1 }}>
            Equipement
          </h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {exercise.equipment.map((eq) => {
              const opt = EQUIPMENT_OPTIONS.find((o) => o.id === eq)
              return (
                <span
                  key={eq}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'rgba(49,130,206,0.15)',
                    color: '#63b3ed',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {opt?.label || eq}
                </span>
              )
            })}
          </div>
        </div>

        {/* Setup cues */}
        {exercise.setupCues && exercise.setupCues.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Mise en place
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {exercise.setupCues.map((cue, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 4, color: '#cbd5e0' }}>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Execution cues */}
        {exercise.executionCues && exercise.executionCues.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Execution
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {exercise.executionCues.map((cue, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 4, color: '#cbd5e0' }}>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alternatives */}
        {exercise.alternatives && exercise.alternatives.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Alternatives
            </h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {exercise.alternatives.map((alt) => (
                <span
                  key={alt}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'rgba(56,161,105,0.15)',
                    color: '#68d391',
                    fontSize: 12,
                  }}
                >
                  {alt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChipRow({
  items,
  selected,
  onToggle,
  colorActive,
  colorBg,
}: {
  items: { id: string; label: string; emoji?: string }[]
  selected: Set<string>
  onToggle: (id: string) => void
  colorActive: string
  colorBg: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 12,
      }}
    >
      {items.map((item) => {
        const active = selected.has(item.id)
        return (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: active ? `2px solid ${colorActive}` : '2px solid transparent',
              background: active ? colorBg : '#16213e',
              color: active ? colorActive : '#a0aec0',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {item.emoji ? `${item.emoji} ` : ''}{item.label}
          </button>
        )
      })}
    </div>
  )
}

export function ExerciseLibrary({
  exercises,
  onSelectExercise,
}: {
  exercises: Exercise[]
  onSelectExercise?: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set())
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set())
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)

  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        search === '' || ex.name.toLowerCase().includes(search.toLowerCase())
      const matchMuscle =
        selectedMuscles.size === 0 ||
        ex.muscleGroups.some((mg) => selectedMuscles.has(mg))
      const matchEquip =
        selectedEquipment.size === 0 ||
        ex.equipment.some((eq) => selectedEquipment.has(eq))
      return matchSearch && matchMuscle && matchEquip
    })
  }, [exercises, search, selectedMuscles, selectedEquipment])

  const handleClearFilters = () => {
    setSearch('')
    setSelectedMuscles(new Set())
    setSelectedEquipment(new Set())
  }

  const hasFilters = search !== '' || selectedMuscles.size > 0 || selectedEquipment.size > 0

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 16,
        padding: 24,
        maxWidth: 700,
        margin: '0 auto',
        color: '#e2e8f0',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          margin: '0 0 20px',
          fontSize: 22,
          background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Bibliotheque d&apos;Exercices
      </h2>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un exercice..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: '2px solid #2d3748',
            background: '#16213e',
            color: '#e2e8f0',
            fontSize: 14,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Muscle group chips */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ fontSize: 12, color: '#718096', marginBottom: 6, display: 'block' }}>
          Groupes musculaires
        </label>
        <ChipRow
          items={MUSCLE_GROUPS}
          selected={selectedMuscles}
          onToggle={toggleMuscle}
          colorActive="#ed8936"
          colorBg="rgba(237,137,54,0.15)"
        />
      </div>

      {/* Equipment chips */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#718096', marginBottom: 6, display: 'block' }}>
          Equipement
        </label>
        <ChipRow
          items={EQUIPMENT_OPTIONS}
          selected={selectedEquipment}
          onToggle={toggleEquipment}
          colorActive="#63b3ed"
          colorBg="rgba(49,130,206,0.15)"
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={handleClearFilters}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#2d3748',
              color: '#a0aec0',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 12 }}>
        {filtered.length} exercice{filtered.length !== 1 ? 's' : ''} trouve{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Exercise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
        {filtered.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setDetailExercise(ex)}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#16213e',
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.border = '1px solid #ed8936'
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(237,137,54,0.05)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.border = '1px solid transparent'
              ;(e.currentTarget as HTMLElement).style.background = '#16213e'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ex.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {ex.muscleGroups.map((mg) => {
                    const group = MUSCLE_GROUPS.find((g) => g.id === mg)
                    return (
                      <span key={mg} style={{ fontSize: 11, color: '#a0aec0' }}>
                        {group?.emoji || ''} {group?.label || mg}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {ex.equipment.map((eq) => {
                  const opt = EQUIPMENT_OPTIONS.find((o) => o.id === eq)
                  return (
                    <span
                      key={eq}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: 'rgba(49,130,206,0.1)',
                        color: '#63b3ed',
                        fontSize: 10,
                      }}
                    >
                      {opt?.label || eq}
                    </span>
                  )
                })}
              </div>
            </div>
            {onSelectExercise && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectExercise(ex.id)
                }}
                style={{
                  marginTop: 8,
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ed8936',
                  color: '#1a202c',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Selectionner
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#718096', fontSize: 13 }}>
            Aucun exercice ne correspond a vos criteres.
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  )
}
