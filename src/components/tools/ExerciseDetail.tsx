import { useMemo, type CSSProperties } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById, estimate1Rm } from '../../lib'
import type { MuscleGroup } from '../../types'

interface Props {
  exerciseId: string
  onClose: () => void
  onAddToWorkout?: () => void
  onSelectAlternative?: (id: string) => void
}

// ── Traductions ─────────────────────────────────────────────────────────────

const MUSCLE_FR: Record<string, string> = {
  Chest: 'Pectoraux',
  Back: 'Dos',
  Shoulders: 'Epaules',
  Quads: 'Quadriceps',
  Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers',
  Calves: 'Mollets',
  Core: 'Abdominaux',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
}

const EQUIPMENT_FR: Record<string, string> = {
  barbell: 'Barre',
  dumbbell: 'Halteres',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Poids du corps',
  smith: 'Smith machine',
  band: 'Elastique',
  kettlebell: 'Kettlebell',
}

const DIFFICULTY_LABELS = ['', 'Debutant', 'Intermediaire', 'Avance']

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#e74c3c',
  Back: '#3498db',
  Shoulders: '#f39c12',
  Quads: '#2ecc71',
  Hamstrings: '#1abc9c',
  Glutes: '#e67e22',
  Calves: '#9b59b6',
  Core: '#e91e63',
  Biceps: '#ff7043',
  Triceps: '#ab47bc',
}

// ── Composant ───────────────────────────────────────────────────────────────

export function ExerciseDetail({
  exerciseId,
  onClose,
  onAddToWorkout,
  onSelectAlternative,
}: Props) {
  const { state } = useAppState()
  const exercise = getExerciseById(exerciseId)

  // ── Historique utilisateur ──────────────────────────────────────────────
  const history = useMemo(() => {
    let lastWeight = 0
    let bestE1rm = 0
    let totalSets = 0
    let lastDate = ''

    for (const w of state.workouts) {
      const ex = w.exercises.find((e) => e.exerciseId === exerciseId)
      if (ex) {
        lastDate = w.date
        totalSets += ex.sets.length
        for (const s of ex.sets) {
          if (s.weightKg > lastWeight) lastWeight = s.weightKg
          const e1rm = estimate1Rm(s.weightKg, s.reps)
          if (e1rm > bestE1rm) bestE1rm = e1rm
        }
      }
    }

    return {
      lastWeight,
      bestE1rm: Math.round(bestE1rm),
      totalSets,
      lastDate,
    }
  }, [state.workouts, exerciseId])

  // ── Exercice non trouve ────────────────────────────────────────────────
  if (!exercise) {
  
  // FEAT-F2: e1RM history chart data
  const e1RmHistory = useMemo(() => {
    const points: { date: string; e1rm: number }[] = []
    for (const w of state.workouts) {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (!ex) continue
      let best = 0
      ex.sets.forEach(s => {
        const val = estimate1Rm(s.weightKg, s.reps)
        if (val > best) best = val
      })
      if (best > 0) points.push({ date: w.date, e1rm: Math.round(best) })
    }
    return points.slice(-20)
  }, [state.workouts, exerciseId])

  return (
      <div
        style={overlayStyle}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Detail exercice"
      >
        <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
          <p style={{ color: 'var(--danger)', textAlign: 'center', margin: 20 }}>
            Exercice non trouve
          </p>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  const translateMuscle = (m: MuscleGroup) => MUSCLE_FR[m] ?? m
  const translateEquipment = (e: string) => EQUIPMENT_FR[e.toLowerCase()] ?? e
  const difficultyStars = (d: number) => '\u2605'.repeat(d) + '\u2606'.repeat(3 - d)

  const altExercises = exercise.alternatives
    .map((id) => {
      const alt = getExerciseById(id)
      return alt ? { id: alt.id, name: alt.name } : null
    })
    .filter(Boolean) as { id: string; name: string }[]

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detail de ${exercise.name}`}
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* En-tete */}
        <div style={cardHeaderStyle}>
          <div style={{ flex: 1 }}>
            <h2 style={nameStyle}>{exercise.name}</h2>
            <div style={metaRowStyle}>
              <span style={equipBadgeStyle}>
                {translateEquipment(exercise.equipment)}
              </span>
              <span style={difficultyStyle} title={DIFFICULTY_LABELS[exercise.difficulty]}>
                {difficultyStars(exercise.difficulty)}{' '}
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {DIFFICULTY_LABELS[exercise.difficulty]}
                </span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={headerCloseBtnStyle}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div style={scrollBodyStyle}>
          {/* Muscles */}
          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Muscles cibles</h3>
            <div style={badgeRowStyle}>
              {exercise.primaryMuscles.map((m) => (
                <span
                  key={m}
                  style={{
                    ...muscleBadgeStyle,
                    background: MUSCLE_COLORS[m] ?? 'var(--text-secondary)',
                  }}
                >
                  {translateMuscle(m)}
                </span>
              ))}
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <>
                <h4 style={subTitleStyle}>Muscles secondaires</h4>
                <div style={badgeRowStyle}>
                  {exercise.secondaryMuscles.map((m) => (
                    <span
                      key={m}
                      style={{
                        ...muscleBadgeStyle,
                        background: MUSCLE_COLORS[m] ?? 'var(--text-secondary)',
                        opacity: 0.7,
                      }}
                    >
                      {translateMuscle(m)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Mise en place */}
          {exercise.setupCues.length > 0 && (
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Mise en place</h3>
              <ul style={cueListStyle}>
                {exercise.setupCues.map((cue, i) => (
                  <li key={i} style={cueItemStyle}>
                    {cue}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Execution */}
          {exercise.executionCues.length > 0 && (
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Execution</h3>
              <ul style={cueListStyle}>
                {exercise.executionCues.map((cue, i) => (
                  <li key={i} style={cueItemStyle}>
                    {cue}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Historique personnel */}
          {history.totalSets > 0 && (
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Votre historique</h3>
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{history.lastWeight} kg</div>
                  <div style={statLabelStyle}>Dernier poids</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{history.bestE1rm} kg</div>
                  <div style={statLabelStyle}>Meilleur e1RM</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{history.totalSets}</div>
                  <div style={statLabelStyle}>Series totales</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{history.lastDate || '-'}</div>
                  <div style={statLabelStyle}>Dernier entr.</div>
                </div>
              </div>
            </section>
          )}
          {history.totalSets === 0 && (
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Votre historique</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                Aucune donnee enregistree pour cet exercice.
              </p>
            </section>
          )}

          {/* Alternatives */}
          {altExercises.length > 0 && (
            <section style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Alternatives</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {altExercises.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() =>
                      onSelectAlternative
                        ? onSelectAlternative(alt.id)
                        : undefined
                    }
                    style={altBtnStyle}
                    aria-label={`Voir ${alt.name}`}
                  >
                    {alt.name}
                    <span style={{ color: 'var(--info)', marginLeft: 'auto', flexShrink: 0 }}>
                      →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div style={cardFooterStyle}>
          {onAddToWorkout && (
            <button
              type="button"
              onClick={onAddToWorkout}
              style={addToWorkoutBtnStyle}
              aria-label="Ajouter au workout"
            >
              + Ajouter au workout
            </button>
          )}
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--panel-2)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
}

const cardStyle: CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 16,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid #333',
}

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '18px 18px 12px',
  borderBottom: '1px solid #2a2a3e',
}

const nameStyle: CSSProperties = {
  color: 'var(--text)',
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
  lineHeight: 1.3,
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 6,
  flexWrap: 'wrap',
}

const equipBadgeStyle: CSSProperties = {
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  padding: '3px 10px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

const difficultyStyle: CSSProperties = {
  color: 'var(--accent-gold)',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const headerCloseBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  fontSize: 20,
  cursor: 'pointer',
  padding: 4,
  flexShrink: 0,
}

const scrollBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 18px 12px',
}

const sectionStyle: CSSProperties = {
  marginTop: 16,
}

const sectionTitleStyle: CSSProperties = {
  color: 'var(--info)',
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  margin: '0 0 8px',
}

const subTitleStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  margin: '8px 0 4px',
}

const badgeRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
}

const muscleBadgeStyle: CSSProperties = {
  color: 'var(--text)',
  padding: '4px 12px',
  borderRadius: 14,
  fontSize: 12,
  fontWeight: 600,
}

const cueListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  listStyleType: 'disc',
}

const cueItemStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: 13,
  lineHeight: 1.6,
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 8,
}

const statCardStyle: CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 10,
  padding: '10px 12px',
  textAlign: 'center',
  border: '1px solid #2a2a3e',
}

const statValueStyle: CSSProperties = {
  color: 'var(--text)',
  fontSize: 16,
  fontWeight: 700,
}

const statLabelStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: 11,
  marginTop: 2,
  textTransform: 'uppercase',
}

const altBtnStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid #2a2a3e',
  borderRadius: 8,
  color: 'var(--text-secondary)',
  padding: '8px 12px',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
}

const cardFooterStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: '12px 18px 18px',
  borderTop: '1px solid #2a2a3e',
  justifyContent: 'flex-end',
}

const addToWorkoutBtnStyle: CSSProperties = {
  background: 'var(--info)',
  border: 'none',
  borderRadius: 10,
  color: 'var(--bg)',
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const closeBtnStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid #333',
  borderRadius: 10,
  color: 'var(--text-secondary)',
  padding: '10px 20px',
  fontSize: 14,
  cursor: 'pointer',
}
