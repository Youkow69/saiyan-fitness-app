import React, { useState } from 'react'
import type { AppState, CustomRoutine, SetType } from '../../types'
import { useAppState } from '../../context/AppContext'
import { exercises, programs } from '../../data'
import { getExerciseById, getProgramById, makeId } from '../../lib'
import { showToast } from '../ui/Toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PlateCalculator } from '../tools/PlateCalculator'
import { WorkoutTimer } from '../tools/WorkoutTimer'
import ExerciseLibrary from '../workout/ExerciseLibrary'
import { SectionTitle } from '../ui/Shared'
import { ExerciseVideoLink } from '../tools/ExerciseVideos'
import { ProgramBuilder } from '../tools/ProgramBuilder'
import { WorkoutHistory } from '../stats/WorkoutHistory'
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
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
    const [showBuilder, setShowBuilder] = useState(false)
    const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null)
    const [showLibrary, setShowLibrary] = useState(false)
    const [showTools, setShowTools] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null)

    const selectedProgram = getProgramById(state.selectedProgramId)
    const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
    const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
    const activeWorkout = state.activeWorkout
    const customRoutines = state.customRoutines

    /* ─────────────────────────────────────────────
       ACTIVE WORKOUT
       ───────────────────────────────────────────── */
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
                      {([['warmup', 'Échauffement'], ['normal', 'Normal'], ['top', 'Top set'], ['backoff', 'Back-off'], ['drop', 'Drop set'], ['amrap', 'superset', 'AMRAP']] as [SetType, string][]).map(([val, label]) => (
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

          {/* Small toggle buttons at the bottom of active workout */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <button onClick={() => setShowTools(!showTools)} type="button" style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
              background: showTools ? 'rgba(255,140,0,0.10)' : 'var(--bg-card)',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              ⚙️ Outils
            </button>
            <button onClick={() => setShowLibrary(!showLibrary)} type="button" style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
              background: showLibrary ? 'rgba(255,140,0,0.10)' : 'var(--bg-card)',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              📖 Exercices
            </button>
          </div>

          {showTools && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <PlateCalculator />
              <WorkoutTimer />
            </div>
          )}

        {showHistory && (
          <div style={{ marginBottom: 12 }}>
            <WorkoutHistory workouts={state.workouts} />
          </div>
        )}

          {showLibrary && (
            <div style={{ marginBottom: 12 }}>
              <ExerciseLibrary />
            </div>
          )}

          {showBuilder && <ProgramBuilder onClose={() => setShowBuilder(false)} />}
          {detailExerciseId && <ExerciseDetail exerciseId={detailExerciseId} onClose={() => setDetailExerciseId(null)} />}
        </div>
      )
    }

    /* ─────────────────────────────────────────────
       PROGRAM BROWSER (no active workout)
       ───────────────────────────────────────────── */
    return (
      <div className="page">
        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={onStartWorkout} type="button" style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 700, fontSize: '0.88rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span> Séance rapide
          </button>
          <button onClick={() => setShowBuilder(true)} type="button" style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px dashed var(--accent)',
            background: 'rgba(255,140,0,0.06)', color: 'var(--accent)', fontWeight: 700, fontSize: '0.88rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            + Créer un programme
          </button>
        </div>

        {/* ── Create routine inline form ── */}
        <button onClick={() => setCreatingRoutine(true)} type="button" style={{
          width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
        }}>
          ➕ Créer ma routine
        </button>

        {creatingRoutine && (
          <section className="hevy-card stack-md" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle icon="✏️" label={editingRoutineId ? "Modifier la routine" : "Nouvelle routine"} />
              <button className="ghost-btn" style={{ minHeight: 34, padding: '4px 12px' }} onClick={() => { setCreatingRoutine(false); setEditingRoutineId(null); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('') }} type="button">✕</button>
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
                const routine: CustomRoutine = { id: editingRoutineId || makeId('cr'), name: routineName.trim(), exercises: routineExercises }
                if (editingRoutineId) {
                  dispatch({ type: 'DELETE_CUSTOM_ROUTINE', payload: editingRoutineId })
                }
                dispatch({ type: 'ADD_CUSTOM_ROUTINE', payload: routine })
                showToast(`Routine "${routine.name}" creee`, 'success')
                setCreatingRoutine(false); setEditingRoutineId(null); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('')
              }}>
              {editingRoutineId ? "Mettre à jour" : "Sauvegarder la routine"}
            </button>
          </section>
        )}

        {/* ── Mes routines perso ── */}
        {customRoutines.length > 0 && (
          <>
            <SectionTitle icon="⭐" label="Mes routines perso" />
            {customRoutines.map((routine) => (
              <div key={routine.id} style={{
                background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
                padding: '12px 16px', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{routine.name}</span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--accent-blue)', color: '#fff', textTransform: 'uppercase',
                    }}>PERSO</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {routine.exercises.slice(0, 3).map((e) => getExerciseById(e.exerciseId)?.name ?? e.exerciseId.replace(/_/g, ' ')).join(', ')}
                    {routine.exercises.length > 3 ? ` +${routine.exercises.length - 3}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onStartCustomRoutine(routine)} type="button" style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                  }}>Commencer</button>
                  <button onClick={() => {
                    setEditingRoutineId(routine.id)
                    setRoutineName(routine.name)
                    setRoutineExercises(routine.exercises.map(e => ({ ...e })))
                    setCreatingRoutine(true)
                  }} type="button" style={{
                    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer',
                  }}>✏️</button>
                  <button onClick={() => setConfirmDeleteId(routine.id)} type="button" style={{
                    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
                  }}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}

        <ConfirmDialog
          isOpen={confirmDeleteId !== null}
          title="Supprimer la routine"
          message="Es-tu sûr de vouloir supprimer cette routine ? Cette action est irréversible."
          confirmLabel="Supprimer"
          confirmColor="var(--accent-red)"
          onConfirm={() => {
            if (confirmDeleteId) {
              dispatch({ type: 'DELETE_CUSTOM_ROUTINE', payload: confirmDeleteId })
              showToast('Routine supprimée', 'info')
            }
            setConfirmDeleteId(null)
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />

        {/* ── Programmes disponibles ── */}
        <SectionTitle icon="📋" label="Programmes disponibles" />

        {programs.map((program) => (
          <div key={program.id} style={{
            background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
            marginBottom: 8, overflow: 'hidden',
          }}>
            <button
              onClick={() => setExpandedProgram(expandedProgram === program.id ? null : program.id)}
              type="button"
              style={{
                width: '100%', padding: '12px 16px', background: 'transparent', border: 'none',
                color: 'var(--text)', textAlign: 'left', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{program.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {program.saga} — {program.daysPerWeek} jours — {program.split}
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {expandedProgram === program.id ? '▲' : '▼'}
              </span>
            </button>

            {expandedProgram === program.id && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '12px 0' }}>{program.description}</p>
                {program.sessions.map((session, idx) => (
                  <div key={session.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{session.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{session.focus}</div>
                    </div>
                    <button
                      onClick={() => { dispatch({ type: 'CHOOSE_PROGRAM', payload: program.id }); onStartSession(idx) }}
                      type="button"
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                      }}
                    >
                      Lancer
                    </button>
                  </div>
                ))}
                {state.selectedProgramId !== program.id && (
                  <button
                    onClick={() => dispatch({ type: 'CHOOSE_PROGRAM', payload: program.id })}
                    type="button"
                    style={{
                      width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
                      border: '1px solid var(--accent)', background: 'rgba(255,140,0,0.06)',
                      color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                    }}
                  >
                    Définir comme programme actif
                  </button>
                )}
                {state.selectedProgramId === program.id && (
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    ✓ Programme actif
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── Bottom utility buttons ── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
          <button onClick={() => setShowLibrary(!showLibrary)} type="button" style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
            background: showLibrary ? 'rgba(255,140,0,0.10)' : 'var(--bg-card)',
            color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            📖 Exercices
          </button>
          <button onClick={() => setShowTools(!showTools)} type="button" style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
            background: showTools ? 'rgba(255,140,0,0.10)' : 'var(--bg-card)',
            color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            ⚙️ Outils
          </button>
        </div>

        {showLibrary && (
          <div style={{ marginBottom: 12 }}>
            <ExerciseLibrary />
          </div>
        )}

        {showTools && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <PlateCalculator />
            <WorkoutTimer />
          </div>
        )}

        {showBuilder && <ProgramBuilder onClose={() => setShowBuilder(false)} />}
        {detailExerciseId && <ExerciseDetail exerciseId={detailExerciseId} onClose={() => setDetailExerciseId(null)} />}
      </div>
    )
  }
)
