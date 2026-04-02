import React, { useState, useMemo } from 'react'
import { exercises } from '../../data'
import type { Exercise, MuscleGroup } from '../../types'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
]

const MUSCLE_FR: Record<MuscleGroup, string> = {
  Chest: 'Pectoraux',
  Back: 'Dos',
  Shoulders: 'Épaules',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
  Quads: 'Quadriceps',
  Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers',
  Calves: 'Mollets',
  Core: 'Abdominaux',
}

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Cable', 'Machine',
  'Bodyweight', 'Kettlebell', 'Smith', 'Elastiques',
] as const

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Débutant',
  2: 'Intermédiaire',
  3: 'Avancé',
}

/* ------------------------------------------------------------------ */
/*  Styles (CSS-variable driven, zero hardcoded hex)                   */
/* ------------------------------------------------------------------ */

const s = {
  container: {
    padding: 16,
    background: 'var(--bg)',
    minHeight: '100vh',
    color: 'var(--text)',
  } satisfies React.CSSProperties,

  heading: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
    color: 'var(--text)',
  } satisfies React.CSSProperties,

  searchInput: {
    width: '100%',
    padding: '10px 14px',
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text)',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,

  filterSection: {
    marginBottom: 12,
  } satisfies React.CSSProperties,

  filterLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
    display: 'block',
  } satisfies React.CSSProperties,

  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  } satisfies React.CSSProperties,

  card: {
    background: 'var(--bg-card)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  } satisfies React.CSSProperties,

  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 4,
  } satisfies React.CSSProperties,

  cardMeta: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } satisfies React.CSSProperties,

  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    background: 'var(--border)',
    color: 'var(--text-secondary)',
  } satisfies React.CSSProperties,

  emptyState: {
    textAlign: 'center' as const,
    padding: 40,
    color: 'var(--text-secondary)',
    fontSize: 14,
  } satisfies React.CSSProperties,

  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  } satisfies React.CSSProperties,

  modal: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    border: '1px solid var(--border)',
    color: 'var(--text)',
  } satisfies React.CSSProperties,

  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
    color: 'var(--accent)',
  } satisfies React.CSSProperties,

  modalSection: { marginBottom: 14 } satisfies React.CSSProperties,

  modalLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  } satisfies React.CSSProperties,

  modalText: {
    fontSize: 14,
    color: 'var(--text)',
    lineHeight: 1.5,
    margin: 0,
  } satisfies React.CSSProperties,

  cueList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.7,
  } satisfies React.CSSProperties,

  closeBtn: {
    width: '100%',
    padding: '10px 0',
    marginTop: 8,
    borderRadius: 8,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  } satisfies React.CSSProperties,

  resultCount: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: '8px 0 12px',
  } satisfies React.CSSProperties,
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: active ? 'var(--accent)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
  }
}

/* ------------------------------------------------------------------ */
/*  Detail Modal                                                       */
/* ------------------------------------------------------------------ */

function ExerciseModal({
  exercise,
  onClose,
}: {
  exercise: Exercise
  onClose: () => void
}) {
  const musclesFr = (groups: MuscleGroup[]) =>
    groups.map((m) => MUSCLE_FR[m]).join(', ')

  return (
    <div
      style={s.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
    >
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.modalTitle}>{exercise.name}</h2>

        <div style={s.modalSection}>
          <p style={s.modalLabel}>Équipement</p>
          <p style={s.modalText}>{exercise.equipment}</p>
        </div>

        <div style={s.modalSection}>
          <p style={s.modalLabel}>Muscles principaux</p>
          <p style={s.modalText}>{musclesFr(exercise.primaryMuscles)}</p>
        </div>

        {exercise.secondaryMuscles.length > 0 && (
          <div style={s.modalSection}>
            <p style={s.modalLabel}>Muscles secondaires</p>
            <p style={s.modalText}>{musclesFr(exercise.secondaryMuscles)}</p>
          </div>
        )}

        <div style={s.modalSection}>
          <p style={s.modalLabel}>Difficulté</p>
          <p style={s.modalText}>{DIFFICULTY_LABEL[exercise.difficulty]}</p>
        </div>

        <div style={s.modalSection}>
          <p style={s.modalLabel}>Ratio stimulus / fatigue</p>
          <p style={s.modalText}>{exercise.stimulusFatigue} / 10</p>
        </div>

        {exercise.setupCues.length > 0 && (
          <div style={s.modalSection}>
            <p style={s.modalLabel}>Mise en place</p>
            <ol style={s.cueList}>
              {exercise.setupCues.map((cue, i) => (
                <li key={i}>{cue}</li>
              ))}
            </ol>
          </div>
        )}

        {exercise.executionCues.length > 0 && (
          <div style={s.modalSection}>
            <p style={s.modalLabel}>Exécution</p>
            <ol style={s.cueList}>
              {exercise.executionCues.map((cue, i) => (
                <li key={i}>{cue}</li>
              ))}
            </ol>
          </div>
        )}

        {exercise.alternatives.length > 0 && (
          <div style={s.modalSection}>
            <p style={s.modalLabel}>Alternatives</p>
            <p style={s.modalText}>
              {exercise.alternatives
                .map((altId) => {
                  const alt = exercises.find((e) => e.id === altId)
                  return alt ? alt.name : altId
                })
                .join(', ')}
            </p>
          </div>
        )}

        <button style={s.closeBtn} onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('')
  const [selectedMuscles, setSelectedMuscles] = useState<Set<MuscleGroup>>(
    new Set(),
  )
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    new Set(),
  )
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )

  const toggleMuscle = (m: MuscleGroup) => {
    setSelectedMuscles((prev) => {
      const next = new Set(prev)
      next.has(m) ? next.delete(m) : next.add(m)
      return next
    })
  }

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev)
      next.has(eq) ? next.delete(eq) : next.add(eq)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false

      if (
        selectedMuscles.size > 0 &&
        !ex.primaryMuscles.some((m) => selectedMuscles.has(m))
      ) {
        return false
      }

      if (
        selectedEquipment.size > 0 &&
        !selectedEquipment.has(ex.equipment)
      ) {
        return false
      }

      return true
    })
  }, [search, selectedMuscles, selectedEquipment])

  return (
    <div style={s.container}>
      <h1 style={s.heading}>Bibliothèque d'exercices</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher un exercice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={s.searchInput}
        aria-label="Rechercher un exercice"
      />

      {/* Muscle group filter chips */}
      <div style={s.filterSection}>
        <span style={s.filterLabel}>Groupe musculaire</span>
        <div
          style={s.chipRow}
          role="group"
          aria-label="Filtres par groupe musculaire"
        >
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              style={chip(selectedMuscles.has(m))}
              onClick={() => toggleMuscle(m)}
              aria-pressed={selectedMuscles.has(m)}
            >
              {MUSCLE_FR[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment filter chips */}
      <div style={s.filterSection}>
        <span style={s.filterLabel}>Équipement</span>
        <div
          style={s.chipRow}
          role="group"
          aria-label="Filtres par équipement"
        >
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              style={chip(selectedEquipment.has(eq))}
              onClick={() => toggleEquipment(eq)}
              aria-pressed={selectedEquipment.has(eq)}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={s.resultCount}>
        {filtered.length} exercice{filtered.length !== 1 ? 's' : ''}{' '}
        trouvé{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Exercise list */}
      <div role="list" aria-label="Liste des exercices">
        {filtered.length === 0 ? (
          <div style={s.emptyState}>
            Aucun exercice ne correspond aux filtres.
          </div>
        ) : (
          filtered.map((ex) => (
            <div
              key={ex.id}
              role="listitem"
              style={s.card}
              onClick={() => setSelectedExercise(ex)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedExercise(ex)
                }
              }}
            >
              <p style={s.cardName}>{ex.name}</p>
              <div style={s.cardMeta}>
                <span style={s.badge}>{ex.equipment}</span>
                <span>
                  {ex.primaryMuscles.map((m) => MUSCLE_FR[m]).join(', ')}
                </span>
                <span>{DIFFICULTY_LABEL[ex.difficulty]}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}
