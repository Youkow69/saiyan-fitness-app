import React, { useState } from 'react'
import type { AppState, CustomRoutine, SetType } from '../../types'
import { useAppState } from '../../context/AppContext'
import { exercises } from '../../data'
import { getExerciseById, getProgramById, makeId } from '../../lib'
import { showToast } from '../ui/Toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PlateCalculator } from '../tools/PlateCalculator'
import { WorkoutTimer } from '../tools/WorkoutTimer'
import ExerciseLibrary from '../workout/ExerciseLibrary'
import { SectionTitle } from '../ui/Shared'
import { ProgressiveOverload } from '../tools/ProgressiveOverload'
import { ExerciseVideoLink } from '../tools/ExerciseVideos'
import { ProgramBuilder } from '../tools/ProgramBuilder'
import { ExerciseDetail } from '../tools/ExerciseDetail'

function getLastSet(workouts: AppState['workouts'], exerciseId: string) {
  for (let index = workouts.length - 1; index >= 0; index -= 1) {
    const exerciseLog = workouts[index].exercises.find(
      (entry) => entry.exerciseId === exerciseId && entry.sets.length > 0
    )
    if (exerciseLog) return exerciseLog.sets[exerciseLog.sets.length - 1]
  }
  return null
}

interface TrainViewProps {
  restTimer: number
  onSkipTimer: () => void
  onStartWorkout: () => void
  onStartSession: (sessionIndex: number) => void
  onStartCustomRoutine: (routine: CustomRoutine) => void
  onAddSet: (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => void
  onFinishWorkout: () => void
}

export const TrainView: React.FC<TrainViewProps> = React.memo(
  function TrainView({
    restTimer,
    onSkipTimer,
    onStartWorkout,
    onStartSession,
    onStartCustomRoutine,
    onAddSet,
    onFinishWorkout,
  }) {
    const { state, dispatch } = useAppState()
    const [draftInputs, setDraftInputs] = useState<Record<string, { weight: string; reps: string; rir: string; setType: SetType }>>({})
    const [creatingRoutine, setCreatingRoutine] = useState(false)
    const [routineName, setRoutineName] = useState('')
    const [routineExercises, setRoutineExercises] = useState<Array<{ exerciseId: string; sets: number; repMin: number; repMax: number; restSeconds: number }>>([])
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [showBuilder, setShowBuilder] = useState(false)
    const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null)

    const selectedProgram = getProgramById(state.selectedProgramId)
    const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
    const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
    const activeWorkout = state.activeWorkout
    const customRoutines = state.customRoutines

    if (!selectedProgram) {
      return (
        <div className="page">
          <section className="hevy-card">
            <div className="empty-state">
              <div className="empty-icon">🏋️</div>
              <p>Choisis un programme depuis le profil pour commencer ta Saga.</p>
            </div>
          </section>
        </div>
      )
    }

    if (activeWorkout && nextSession) {
      return (
        <div className="page">
          {restTimer > 0 && (
            <section className="hevy-card timer-panel">
              <div>
                <SectionTitle icon="⏱️" label="Repos" />
                <h3 style={{ fontSize: '3.2rem', margin: '4px 0 0', color: 'var(--accent-gold)' }}>{restTimer}s</h3>
              </div>
              <button className="ghost-btn" onClick={onSkipTimer} type="button">Passer</button>
            </section>
          )}
          <section className="hevy-card stack-md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <SectionTitle icon="🏋️" label="Séance en cours" />
                <h3 style={{ margin: '4px 0 0' }}>{nextSession.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { if (window.confirm('Annuler la séance ? Tes séries non terminées seront perdues.')) { dispatch({ type: 'ABANDON_WORKOUT' }) } }} type="button" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                ← Annuler
              </button>
              <button className="primary-btn" onClick={onFinishWorkout} type="button" style={{ flex: 1 }}>Terminer la séance</button>
            </div>
            </div>
          </section>
          {activeWorkout.exercises.map((exerciseLog) => {
            const exercise = getExerciseById(exerciseLog.exerciseId)
            if (!exercise) return null
            const target = exerciseLog.target
            const previous = getLastSet(state.workouts, exercise.id)
            const currentInput = draftInputs[exercise.id] ?? {
              weight: previous?.weightKg?.toString() ?? '',
              reps: previous?.reps?.toString() ?? `${target.repMin}`,
              rir: String(target.targetRir),
              setType: 'normal' as SetType,
            }
            return (
              <section className="hevy-card stack-md" key={exercise.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      <span
                        onClick={() => setDetailExerciseId(exercise.id)}
                        style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setDetailExerciseId(exercise.id) }}
                      >
                        {exercise.name}
                      </span>
                      {' '}<ExerciseVideoLink exerciseId={exercise.id} />
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>{target.sets}×{target.repMin}-{target.repMax} — RIR {target.targetRir} — Repos {target.restSeconds}s</p>
                  </div>
                  {previous && <span className="badge" style={{ fontSize: '0.72rem' }}>Dernier: {previous.weightKg}×{previous.reps}</span>}
                </div>
                <div className="field-grid compact-grid">
                  <label><span>Poids (kg)</span><input value={currentInput.weight} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, weight: e.target.value } })} /></label>
                  <label><span>Reps</span><input value={currentInput.reps} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, reps: e.target.value } })} /></label>
                  <label><span>RIR</span><input value={currentInput.rir} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, rir: e.target.value } })} /></label>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Type</span>
                    <div className="chip-row">
                      {([['warmup', 'Échauffement'], ['normal', 'Normal'], ['top', 'Top set'], ['backoff', 'Back-off'], ['drop', 'Drop set'], ['amrap', 'AMRAP']] as [SetType, string][]).map(([val, label]) => (
                        <button key={val} type="button"
                          className={`chip chip--sm ${currentInput.setType === val ? 'chip--active' : ''}`}
                          onClick={() => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, setType: val } })}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="secondary-btn" type="button" onClick={() => onAddSet(exercise.id, Number(currentInput.weight || 0), Number(currentInput.reps || 0), Number(currentInput.rir || target.targetRir), currentInput.setType)}>
                  + Ajouter la série
                </button>
                <div className="set-list">
                  {exerciseLog.sets.length === 0
                    ? <div className="empty-state" style={{ padding: '10px 0' }}><p style={{ margin: 0, fontSize: '0.83rem' }}>Commence avec la charge précédente.</p></div>
                    : exerciseLog.sets.map((set) => (
                        <div className="set-row" key={set.id}>
                          <span>S{set.setIndex}</span>
                          <strong>{set.weightKg} kg × {set.reps}</strong>
                          <span>RIR {set.rir}</span>
                          <span>{set.setType}</span>
                        </div>
                      ))
                  }
                </div>
                {exercise.alternatives.length > 0 && (
                  <div className="chip-row">
                    {exercise.alternatives.map((altId) => (
                      <span className="chip chip--static" key={altId} style={{ fontSize: '0.72rem' }}>{getExerciseById(altId)?.name ?? altId.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {showBuilder && <ProgramBuilder onClose={() => setShowBuilder(false)} />}
          {detailExerciseId && <ExerciseDetail exerciseId={detailExerciseId} onClose={() => setDetailExerciseId(null)} />}
        </div>
      )
    }

    return (
      <div className="page">
        <section className="hevy-hero">
          <div style={{ flex: 1 }}>
            <span className="eyebrow">{selectedProgram.saga}</span>
            <h2 style={{ margin: '4px 0' }}>{selectedProgram.name}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>{selectedProgram.split} — {selectedProgram.daysPerWeek} jours/semaine</p>
          </div>
          <div className="hero-badge" style={{ alignSelf: 'flex-start' }}>{selectedProgram.daysPerWeek} j/sem</div>
        </section>

        {!activeWorkout && (
          <section className="hevy-card stack-md">
            <SectionTitle icon="🛠️" label="Outils" />
            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', padding: '4px 0' }}>Chronomètre & Calculateur de plaques</summary>
              <div className="stack-md" style={{ marginTop: 12 }}>
                <WorkoutTimer />
                <PlateCalculator />
              </div>
            </details>
          </section>
        )}

        <button className="secondary-btn" onClick={onStartWorkout} type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%', padding: '12px 16px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span>Séance rapide</span>
        </button>

        <button onClick={() => setShowBuilder(true)} type="button" style={{
          width: '100%', padding: '14px', borderRadius: 12, border: '1px dashed var(--accent)',
          background: 'rgba(255,140,0,0.06)', color: 'var(--accent)',
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          + Créer un programme personnalisé
        </button>

        <button className="primary-btn" onClick={() => setCreatingRoutine(true)} type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%', padding: '14px 16px', fontSize: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>➕</span>
          <span>Créer ma routine</span>
        </button>

        <ExerciseLibrary />

        {creatingRoutine && (
          <section className="hevy-card stack-md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle icon="✏️" label="Nouvelle routine" />
              <button className="ghost-btn" style={{ minHeight: 34, padding: '4px 12px' }} onClick={() => { setCreatingRoutine(false); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('') }} type="button">✕</button>
            </div>
            <label><span>Nom de la routine</span><input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Ex: Full Body A" /></label>
            <div>
              <span className="eyebrow">Ajouter des exercices</span>
              <input value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} placeholder="Chercher un exercice..." style={{ marginBottom: 8 }} />
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 6 }}>
                {exercises.filter((ex) => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).slice(0, 12).map((ex) => (
                  <button key={ex.id} className="ghost-btn" style={{ minHeight: 36, padding: '6px 12px', textAlign: 'left', fontSize: '0.82rem' }} type="button"
                    onClick={() => { if (!routineExercises.find((e) => e.exerciseId === ex.id)) { setRoutineExercises((prev) => [...prev, { exerciseId: ex.id, sets: 3, repMin: 8, repMax: 12, restSeconds: 90 }]) } }}>
                    {ex.name} <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>— {ex.primaryMuscles.join(', ')}</span>
                  </button>
                ))}
              </div>
            </div>
            {routineExercises.length > 0 && (
              <div className="stack-md">
                <span className="eyebrow">Exercices ajoutés ({routineExercises.length})</span>
                {routineExercises.map((re, idx) => {
                  const ex = getExerciseById(re.exerciseId)
                  return (
                    <div key={re.exerciseId} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--stroke)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong style={{ fontSize: '0.85rem' }}>{ex?.name ?? re.exerciseId.replace(/_/g, ' ')}</strong>
                        <button type="button" onClick={() => setRoutineExercises((prev) => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                        <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Series</span><input type="number" value={re.sets} min={1} max={10} onChange={(e) => setRoutineExercises((prev) => prev.map((x, i) => i === idx ? { ...x, sets: Number(e.target.value) } : x))} /></label>
                        <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Reps min</span><input type="number" value={re.repMin} min={1} max={50} onChange={(e) => setRoutineExercises((prev) => prev.map((x, i) => i === idx ? { ...x, repMin: Number(e.target.value) } : x))} /></label>
                        <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Reps max</span><input type="number" value={re.repMax} min={1} max={50} onChange={(e) => setRoutineExercises((prev) => prev.map((x, i) => i === idx ? { ...x, repMax: Number(e.target.value) } : x))} /></label>
                        <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Repos(s)</span><input type="number" value={re.restSeconds} min={30} max={600} step={15} onChange={(e) => setRoutineExercises((prev) => prev.map((x, i) => i === idx ? { ...x, restSeconds: Number(e.target.value) } : x))} /></label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button className="primary-btn" type="button" disabled={!routineName.trim() || routineExercises.length === 0}
              onClick={() => {
                const routine: CustomRoutine = { id: makeId('cr'), name: routineName.trim(), exercises: routineExercises }
                dispatch({ type: 'ADD_CUSTOM_ROUTINE', payload: routine })
                showToast(`Routine "${routine.name}" creee`, 'success')
                setCreatingRoutine(false); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('')
              }}>
              Sauvegarder la routine
            </button>
          </section>
        )}

        {nextSession && (
          <ProgressiveOverload sessionExercises={nextSession.exercises} />
        )}

        <SectionTitle icon="📋" label="Séances pre-faites" />

        {selectedProgram.sessions.map((session, idx) => {
          const isNext = idx === nextIndex % selectedProgram.sessions.length
          const exerciseNames = session.exercises.slice(0, 3).map((e) => getExerciseById(e.exerciseId)?.name ?? e.exerciseId.replace(/_/g, ' ')).join(', ')
          const moreCount = session.exercises.length - 3
          return (
            <section key={session.id} className={`routine-card ${isNext ? 'routine-card--next' : ''}`}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ margin: 0 }}>{session.name}</h3>
                  {isNext && <span className="next-badge">PROCHAINE</span>}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{session.focus}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {exerciseNames}{moreCount > 0 ? ` +${moreCount} exercices` : ''}
                </p>
              </div>
              <button className="cta-button" style={{ fontSize: '1.1rem', padding: '0.9rem' }} onClick={() => onStartSession(idx)} type="button">
                Commencer la séance
              </button>
            </section>
          )
        })}

        {customRoutines.length > 0 && (
          <>
            <SectionTitle icon="⭐" label="Mes routines perso" />
            {customRoutines.map((routine) => (
              <section key={routine.id} className="routine-card">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0 }}>{routine.name}</h3>
                    <span className="next-badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>PERSO</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {routine.exercises.slice(0, 3).map((e) => getExerciseById(e.exerciseId)?.name ?? e.exerciseId.replace(/_/g, ' ')).join(', ')}
                    {routine.exercises.length > 3 ? ` +${routine.exercises.length - 3} exercices` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="cta-button" style={{ fontSize: '1.1rem', padding: '0.9rem', flex: 1 }} onClick={() => onStartCustomRoutine(routine)} type="button">
                    Commencer
                  </button>
                  <button className="ghost-btn" style={{ minHeight: 48, padding: '8px 14px', borderRadius: 12 }} onClick={() => setConfirmDeleteId(routine.id)} type="button">🗑️</button>
                </div>
              </section>
            ))}
          </>
        )}

        <ConfirmDialog
          isOpen={confirmDeleteId !== null}
          title="Supprimer la routine"
          message="Es-tu sur de vouloir supprimer cette routine ? Cette action est irreversible."
          confirmLabel="Supprimer"
          confirmColor="var(--accent-red)"
          onConfirm={() => {
            if (confirmDeleteId) {
              dispatch({ type: 'DELETE_CUSTOM_ROUTINE', payload: confirmDeleteId })
              showToast('Routine supprimee', 'info')
            }
            setConfirmDeleteId(null)
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />

        {showBuilder && <ProgramBuilder onClose={() => setShowBuilder(false)} />}
        {detailExerciseId && <ExerciseDetail exerciseId={detailExerciseId} onClose={() => setDetailExerciseId(null)} />}
      </div>
    )
  }
)
