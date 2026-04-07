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
import { ProgramBuilder } from '../tools/ProgramBuilder'
import { WorkoutHistory } from '../stats/WorkoutHistory'
import { SmartWorkoutGenerator } from '../tools/SmartWorkoutGenerator'
import { MesocycleProgress } from '../tools/MesocycleProgress'
import { SupersetManager } from '../tools/SupersetIndicator'
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
  onSetRestTimer?: (seconds: number) => void
  onStartWorkout: () => void
  onStartSession: (sessionIndex: number) => void
  onStartCustomRoutine: (routine: CustomRoutine) => void
  onAddSet: (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType, skipRest?: boolean) => void
  onFinishWorkout: () => void
}

export const TrainView: React.FC<TrainViewProps> = React.memo(
  function TrainView({
    restTimer,
    onSkipTimer,
    onSetRestTimer,
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
    const [routineGroups, setRoutineGroups] = useState<string[][]>([])
    const [groupingMode, setGroupingMode] = useState(false)
    const [groupSelection, setGroupSelection] = useState<string[]>([])
    const [exerciseSearch, setExerciseSearch] = useState('')
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
    const [showBuilder, setShowBuilder] = useState(false)
    const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null)
    const [showLibrary, setShowLibrary] = useState(false)
    const [showTools, setShowTools] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
    const [showAiGenerator, setShowAiGenerator] = useState(false)
    const [supersetGroups, setSupersetGroups] = useState<string[][]>([])
    const [currentExIdx, setCurrentExIdx] = useState(0)

    const selectedProgram = getProgramById(state.selectedProgramId)
    const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
    const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
    const activeWorkout = state.activeWorkout
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    // Session chrono — ticks every second using Date.now() for accuracy
    React.useEffect(() => {
      if (!activeWorkout) return
      const startMs = new Date(activeWorkout.startedAt).getTime()
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000))
      tick()
      const id = setInterval(tick, 1000)
      return () => clearInterval(id)
    }, [activeWorkout?.startedAt])
    const customRoutines = state.customRoutines

    /* ─────────────────────────────────────────────
       ACTIVE WORKOUT
       ───────────────────────────────────────────── */
    if (activeWorkout) {
      return (
        <div className="page">
          {restTimer > 0 && (
            <section className="hevy-card timer-panel">
              <div>
                <SectionTitle icon="⏱️" label="Repos" />
                <h3 style={{ fontSize: '3.2rem', margin: '4px 0 0', color: 'var(--accent-gold)' }}>{restTimer}s</h3>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {[60, 90, 120, 180, 300].map(t => (
                  <button key={t} type="button" onClick={() => onSetRestTimer?.(t)}
                    style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,200,61,0.08)', color: 'var(--accent-gold)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>
                    {t}s
                  </button>
                ))}
              </div>
              <button className="ghost-btn" onClick={onSkipTimer} type="button">Passer</button>
            </section>
          )}
          <section className="hevy-card stack-md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <SectionTitle icon="🏋️" label="Séance en cours" />
                <h3 style={{ margin: '4px 0 0' }}>{nextSession?.name || activeWorkout.sessionName || 'Seance personnalisee'}</h3>
                {/* Session chrono */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: '1.4rem', fontFamily: "'Bebas Neue', sans-serif", color: 'var(--accent-gold)', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
                    {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>temps de séance</span>
                </div>

              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => {
                  const note = window.prompt("Note de seance:", activeWorkout.sessionName || "")
                  if (note !== null) dispatch({ type: "SET_STATE", payload: { ...state, activeWorkout: { ...activeWorkout, sessionName: note } } as any })
                }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer" }}>
                  {String.fromCodePoint(0x1F4DD)}
                </button>
                <button onClick={() => { if (window.confirm('Annuler la séance ? Tes séries non terminées seront perdues.')) { dispatch({ type: 'ABANDON_WORKOUT' }) } }} type="button" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  ← Annuler
                </button>
                {/* Terminer moved to guided mode bottom */}
              </div>
            </div>
          </section>


          {/* === GUIDED MODE: Progress bar === */}
          {(() => {
            const total = activeWorkout.exercises.length
            const safeIdx = Math.min(currentExIdx, total - 1)
            const pct = ((safeIdx + 1) / total) * 100
            return (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent)' }}>Exercice {safeIdx + 1}/{total}</span>
                  <span style={{ color: 'var(--muted)' }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--stroke)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: pct + '%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )
          })()}

          <MesocycleProgress />

          <SupersetManager
            exercises={activeWorkout.exercises}
            onGroupExercises={setSupersetGroups}
          />

          {/* === GUIDED MODE: One exercise at a time (superset-aware) === */}
          {(() => {
            const safeIdx = Math.min(currentExIdx, activeWorkout.exercises.length - 1)
            const currentExLog = activeWorkout.exercises[safeIdx]
            if (!currentExLog) return null

            // Check if current exercise is in a superset group
            const supersetGroup = supersetGroups.find(g => g.includes(currentExLog.exerciseId))
            // Get all exercises to display (single or group)
            const displayExercises = supersetGroup
              ? supersetGroup.map(id => activeWorkout.exercises.find(e => e.exerciseId === id)).filter(Boolean)
              : [currentExLog]

            // Check if ALL exercises in the group are complete
            const allComplete = displayExercises.every(ex => ex && ex.sets.length >= (ex.target?.sets || 3))
            // Find which exercises in group still need sets
            const nextInGroup = displayExercises.find(ex => ex && ex.sets.length < (ex.target?.sets || 3))
            // For supersets: check if the LAST exercise of the group is the last overall
            const groupEndIdx = supersetGroup
              ? Math.max(...supersetGroup.map(id => activeWorkout.exercises.findIndex(e => e.exerciseId === id)))
              : safeIdx
            const isLastGroup = groupEndIdx >= activeWorkout.exercises.length - 1

            return (
              <div>
                {/* Groupe alterné label */}
                {supersetGroup && supersetGroup.length > 1 && (
                  <div style={{ textAlign: 'center', padding: '4px 12px', marginBottom: 8, borderRadius: 8, background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)', fontSize: '0.75rem', fontWeight: 700, color: '#9b59b6' }}>
                    {String.fromCodePoint(0x26A1)} Groupe alterné {String.fromCharCode(8212)} {supersetGroup.length} exercices
                  </div>
                )}

                {displayExercises.map((exerciseLog) => {
                  if (!exerciseLog) return null
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
                  const setsCompleted = exerciseLog.sets.length
                  const setsTarget = target.sets
                  const isExComplete = setsCompleted >= setsTarget
                  // In superset: highlight the exercise that needs the next set
                  const isActiveInGroup = nextInGroup?.exerciseId === exerciseLog.exerciseId

                  return (
                    <section key={exercise.id} className='hevy-card stack-md' style={{ borderColor: isActiveInGroup && supersetGroup ? '#9b59b633' : undefined, borderWidth: isActiveInGroup && supersetGroup ? 2 : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>
                            <span onClick={() => setDetailExerciseId(exercise.id)} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }} role='button' tabIndex={0}>
                              {exercise.name}
                            </span>
                          </h3>
                          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>{target.sets}{String.fromCharCode(215)}{target.repMin}-{target.repMax} | RIR {target.targetRir} | Repos {target.restSeconds}s</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: 10, background: isExComplete ? 'rgba(34,197,94,0.12)' : 'rgba(255,140,0,0.1)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isExComplete ? '#22c55e' : 'var(--accent)' }}>{setsCompleted}/{setsTarget}</div>
                          <div style={{ fontSize: 'max(0.75rem, 0.65rem)', color: 'var(--muted)' }}>S\u00e9ries</div>
                        </div>
                      </div>
                      {previous && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Dernier: {previous.weightKg}kg {String.fromCharCode(215)} {previous.reps}</div>}
                      {!isExComplete && (!supersetGroup || isActiveInGroup) && (
                        <div>
                          <div className='field-grid compact-grid'>
                            <label><span>Poids (kg)</span><input value={currentInput.weight} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, weight: e.target.value } })} /></label>
                            <label><span>Reps</span><input value={currentInput.reps} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, reps: e.target.value } })} /></label>
                            <label><span>RIR</span><input value={currentInput.rir} onChange={(e) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, rir: e.target.value } })} /></label>
                          </div>
                          <button className='primary-btn' type='button' style={{ width: '100%', marginTop: 8 }} onClick={() => {
                            // Series alternees: repos apres CHAQUE serie (meme entre exercices du groupe)
                            onAddSet(exercise.id, Number(currentInput.weight || 0), Number(currentInput.reps || 0), Number(currentInput.rir || target.targetRir), currentInput.setType, false)
                          }}>
                            S\u00e9rie {setsCompleted + 1}/{setsTarget}
                          </button>
                        </div>
                      )}
                      {exerciseLog.sets.length > 0 && (
                        <div className='set-list'>
                          {exerciseLog.sets.map((set) => (
                            <div className='set-row' key={set.id}>
                              <span>S{set.setIndex}</span>
                              <strong>{set.weightKg} kg {String.fromCharCode(215)} {set.reps}</strong>
                              <span>RIR {set.rir}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )
                })}

                {allComplete && !isLastGroup && (
                  <button className='primary-btn' type='button' style={{ width: '100%', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }} onClick={() => {
                    // Skip to next exercise after the group
                    const nextIdx = supersetGroup ? groupEndIdx + 1 : safeIdx + 1
                    setCurrentExIdx(nextIdx)
                  }}>
                    Exercice suivant {String.fromCodePoint(0x27A1)}
                  </button>
                )}
                {allComplete && isLastGroup && (
                  <button className='primary-btn' type='button' style={{ width: '100%', background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }} onClick={onFinishWorkout}>
                    {String.fromCodePoint(0x1F3C6)} Terminer la s\u00e9ance
                  </button>
                )}
                {!allComplete && (
                  <button type='button' onClick={() => { if (window.confirm('Passer ? Les s\u00e9ries manquantes ne seront pas compt\u00e9es.')) { const next = supersetGroup ? groupEndIdx + 1 : safeIdx + 1; setCurrentExIdx(Math.min(next, activeWorkout.exercises.length - 1)) } }} style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Passer
                  </button>
                )}
              </div>
            )
          })()}
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
          <button onClick={() => setShowHistory(!showHistory)} type="button" style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
            background: showHistory ? 'rgba(255,140,0,0.10)' : 'var(--bg-card)',
            color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            Historique
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

        <button onClick={() => setShowAiGenerator(true)} type="button" style={{
          width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', marginBottom: 12,
          background: 'linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,215,0,0.15))',
          color: '#ffd700', fontWeight: 700, fontSize: '0.88rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {'✨'} Générer une séance IA (Whis)
        </button>

        {showAiGenerator && <SmartWorkoutGenerator onClose={() => setShowAiGenerator(false)} />}


        {creatingRoutine && (
          <section className="hevy-card stack-md" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle icon="✏️" label={editingRoutineId ? "Modifier la routine" : "Nouvelle routine"} />
              <button className="ghost-btn" style={{ minHeight: 34, padding: '4px 12px' }} onClick={() => { setCreatingRoutine(false); setEditingRoutineId(null); setRoutineName(''); setRoutineExercises([]); setRoutineGroups([]); setGroupSelection([]); setGroupingMode(false); setExerciseSearch('') }} type="button">✕</button>
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
            {/* Grouper des exercices (series alternees) */}
            {routineExercises.length >= 2 && (
              <div style={{ padding: 10, borderRadius: 10, border: "1px dashed rgba(155,89,182,0.4)", background: "rgba(155,89,182,0.05)" }}>
                {!groupingMode ? (
                  <button type="button" onClick={() => setGroupingMode(true)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "none", background: "rgba(155,89,182,0.15)", color: "#9b59b6", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                    {String.fromCodePoint(0x26A1)} Grouper des exercices (séries alternées)
                  </button>
                ) : (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 8px" }}>Sélectionne 2+ exercices à alterner :</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                      {routineExercises.map(re => {
                        const ex = getExerciseById(re.exerciseId)
                        const isSelected = groupSelection.includes(re.exerciseId)
                        const alreadyGrouped = routineGroups.some(g => g.includes(re.exerciseId))
                        return (
                          <button key={re.exerciseId} type="button" disabled={alreadyGrouped}
                            onClick={() => setGroupSelection(prev => isSelected ? prev.filter(id => id !== re.exerciseId) : [...prev, re.exerciseId])}
                            style={{ padding: "8px 12px", borderRadius: 8, border: isSelected ? "2px solid #9b59b6" : alreadyGrouped ? "1px solid var(--border)" : "1px solid var(--border)", background: isSelected ? "rgba(155,89,182,0.15)" : "transparent", color: alreadyGrouped ? "var(--muted)" : "var(--text)", textAlign: "left", fontSize: "0.82rem", cursor: alreadyGrouped ? "default" : "pointer", opacity: alreadyGrouped ? 0.5 : 1 }}>
                            {isSelected ? String.fromCodePoint(0x2705) + " " : ""}{ex?.name || re.exerciseId}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" disabled={groupSelection.length < 2} onClick={() => {
                        setRoutineGroups(prev => [...prev, groupSelection])
                        setGroupSelection([])
                        setGroupingMode(false)
                      }} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#9b59b6", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", opacity: groupSelection.length < 2 ? 0.5 : 1 }}>Valider le groupe</button>
                      <button type="button" onClick={() => { setGroupingMode(false); setGroupSelection([]) }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: "0.82rem", cursor: "pointer" }}>Annuler</button>
                    </div>
                    {routineGroups.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: "0.72rem", color: "#9b59b6", fontWeight: 600 }}>Groupes créés :</span>
                        {routineGroups.map((g, gi) => (
                          <div key={gi} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text)" }}>{g.map(id => getExerciseById(id)?.name || id).join(" + ")}</span>
                            <button type="button" onClick={() => setRoutineGroups(prev => prev.filter((_, i) => i !== gi))} style={{ background: "none", border: "none", color: "var(--accent-red)", cursor: "pointer", fontSize: "0.75rem" }}>{String.fromCodePoint(0x2716)}</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button className="primary-btn" type="button" disabled={!routineName.trim() || routineExercises.length === 0}
              onClick={() => {
                const routine: CustomRoutine = { id: editingRoutineId || makeId('cr'), name: routineName.trim(), exercises: routineExercises, alternatingGroups: routineGroups.length > 0 ? routineGroups : undefined }
                if (editingRoutineId) {
                  // BUG-F4: Preserve routine ID on edit via UPDATE action
                  dispatch({ type: 'UPDATE_CUSTOM_ROUTINE', payload: { id: editingRoutineId, routine } })
                } else {
                  dispatch({ type: 'ADD_CUSTOM_ROUTINE', payload: routine })
                }
                showToast(`Routine "${routine.name}" creee`, 'success')
                setCreatingRoutine(false); setEditingRoutineId(null); setRoutineName(''); setRoutineExercises([]); setRoutineGroups([]); setGroupSelection([]); setGroupingMode(false); setExerciseSearch('')
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
