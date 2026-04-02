import { useState, useCallback, useMemo, type CSSProperties } from 'react'
import { useAppState } from '../../context/AppContext'
import { exercises } from '../../data'
import { makeId } from '../../lib'
import type { CustomRoutine, Exercise, Goal } from '../../types'

// ── Types internes ──────────────────────────────────────────────────────────

interface BuilderExercise {
  uid: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  targetRir: number
  restSeconds: number
}

interface BuilderSession {
  uid: string
  name: string
  exercises: BuilderExercise[]
}

interface Props {
  onClose: () => void
  editRoutineIds?: string[] // IDs des CustomRoutine existantes a editer
}

// ── Constantes ──────────────────────────────────────────────────────────────

const OBJECTIVES: { value: Goal; label: string }[] = [
  { value: 'muscle_gain', label: 'Prise de muscle' },
  { value: 'fat_loss', label: 'Perte de gras' },
  { value: 'recomp', label: 'Recomposition' },
  { value: 'strength', label: 'Force' },
  { value: 'endurance', label: 'Endurance' },
]

const DAYS_OPTIONS = [2, 3, 4, 5, 6]

const SESSION_LETTERS = 'ABCDEFGHIJ'

function defaultExercise(): BuilderExercise {
  return {
    uid: makeId('bex'),
    exerciseId: '',
    sets: 3,
    repMin: 8,
    repMax: 12,
    targetRir: 2,
    restSeconds: 120,
  }
}

function defaultSession(index: number): BuilderSession {
  return {
    uid: makeId('bsess'),
    name: `Seance ${SESSION_LETTERS[index] ?? index + 1}`,
    exercises: [],
  }
}

// ── Composant principal ─────────────────────────────────────────────────────

export function ProgramBuilder({ onClose, editRoutineIds }: Props) {
  const { state, dispatch } = useAppState()

  // ── Initialisation depuis routines existantes ───────────────────────────
  const initialData = useMemo(() => {
    if (!editRoutineIds || editRoutineIds.length === 0) {
      return null
    }
    const routines = editRoutineIds
      .map((id) => state.customRoutines.find((r) => r.id === id))
      .filter(Boolean) as CustomRoutine[]
    if (routines.length === 0) return null

    // Extraire le nom du programme depuis le pattern "Nom - Seance X"
    const firstName = routines[0].name
    const dashIdx = firstName.lastIndexOf(' - Seance ')
    const programName = dashIdx > 0 ? firstName.substring(0, dashIdx) : firstName

    const sessions: BuilderSession[] = routines.map((r, i) => {
      const sIdx = r.name.lastIndexOf(' - Seance ')
      const sessName = sIdx > 0 ? r.name.substring(sIdx + 3) : `Seance ${SESSION_LETTERS[i]}`
      return {
        uid: makeId('bsess'),
        name: sessName,
        exercises: r.exercises.map((ex) => ({
          uid: makeId('bex'),
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          repMin: ex.repMin,
          repMax: ex.repMax,
          targetRir: 2,
          restSeconds: ex.restSeconds,
        })),
      }
    })

    return { programName, sessions }
  }, [editRoutineIds, state.customRoutines])

  // ── State du builder ──────────────────────────────────────────────────────
  const [programName, setProgramName] = useState(initialData?.programName ?? '')
  const [objective, setObjective] = useState<Goal>('muscle_gain')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [split, setSplit] = useState('')
  const [description, setDescription] = useState('')
  const [sessions, setSessions] = useState<BuilderSession[]>(
    initialData?.sessions ?? [defaultSession(0)]
  )
  const [activeSessionIdx, setActiveSessionIdx] = useState(0)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const activeSession = sessions[activeSessionIdx] ?? sessions[0]

  // ── Handlers sessions ─────────────────────────────────────────────────────

  const addSession = useCallback(() => {
    setSessions((prev) => [...prev, defaultSession(prev.length)])
    setActiveSessionIdx((prev) => prev + 1)
  }, [])

  const deleteSession = useCallback(
    (idx: number) => {
      if (sessions.length <= 1) return
      setSessions((prev) => prev.filter((_, i) => i !== idx))
      setActiveSessionIdx((prev) => Math.min(prev, sessions.length - 2))
    },
    [sessions.length]
  )

  const duplicateSession = useCallback(
    (idx: number) => {
      const source = sessions[idx]
      if (!source) return
      const copy: BuilderSession = {
        uid: makeId('bsess'),
        name: `${source.name} (copie)`,
        exercises: source.exercises.map((ex) => ({ ...ex, uid: makeId('bex') })),
      }
      setSessions((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)])
      setActiveSessionIdx(idx + 1)
    },
    [sessions]
  )

  const renameSession = useCallback(
    (idx: number, name: string) => {
      setSessions((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, name } : s))
      )
    },
    []
  )

  // ── Handlers exercices ────────────────────────────────────────────────────

  const addExerciseToSession = useCallback(
    (exerciseId: string) => {
      const ex: BuilderExercise = { ...defaultExercise(), exerciseId }
      setSessions((prev) =>
        prev.map((s, i) =>
          i === activeSessionIdx ? { ...s, exercises: [...s.exercises, ex] } : s
        )
      )
      setShowExercisePicker(false)
      setSearchQuery('')
    },
    [activeSessionIdx]
  )

  const updateExercise = useCallback(
    (uid: string, field: keyof BuilderExercise, value: number | string) => {
      setSessions((prev) =>
        prev.map((s, i) =>
          i === activeSessionIdx
            ? {
                ...s,
                exercises: s.exercises.map((ex) =>
                  ex.uid === uid ? { ...ex, [field]: value } : ex
                ),
              }
            : s
        )
      )
    },
    [activeSessionIdx]
  )

  const deleteExercise = useCallback(
    (uid: string) => {
      setSessions((prev) =>
        prev.map((s, i) =>
          i === activeSessionIdx
            ? { ...s, exercises: s.exercises.filter((ex) => ex.uid !== uid) }
            : s
        )
      )
    },
    [activeSessionIdx]
  )

  const moveExercise = useCallback(
    (uid: string, direction: 'up' | 'down') => {
      setSessions((prev) =>
        prev.map((s, i) => {
          if (i !== activeSessionIdx) return s
          const idx = s.exercises.findIndex((ex) => ex.uid === uid)
          if (idx < 0) return s
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1
          if (targetIdx < 0 || targetIdx >= s.exercises.length) return s
          const copy = [...s.exercises]
          ;[copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]]
          return { ...s, exercises: copy }
        })
      )
    },
    [activeSessionIdx]
  )

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    const errs: string[] = []
    if (!programName.trim()) errs.push('Nom du programme requis')
    if (sessions.some((s) => s.exercises.length === 0))
      errs.push('Chaque seance doit avoir au moins un exercice')
    if (sessions.some((s) => s.exercises.some((ex) => !ex.exerciseId)))
      errs.push('Tous les exercices doivent etre selectionnes')
    if (errs.length > 0) {
      setErrors(errs)
      return
    }

    // Supprimer anciennes routines si on edite
    if (editRoutineIds) {
      for (const id of editRoutineIds) {
        dispatch({ type: 'DELETE_CUSTOM_ROUTINE', payload: id })
      }
    }

    // Creer une CustomRoutine par seance
    for (const session of sessions) {
      const routine: CustomRoutine = {
        id: makeId('cr'),
        name:
          sessions.length > 1
            ? `${programName.trim()} - ${session.name}`
            : programName.trim(),
        exercises: session.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          repMin: ex.repMin,
          repMax: ex.repMax,
          restSeconds: ex.restSeconds,
        })),
      }
      dispatch({ type: 'ADD_CUSTOM_ROUTINE', payload: routine })
    }

    onClose()
  }, [programName, sessions, editRoutineIds, dispatch, onClose])

  // ── Recherche exercices ───────────────────────────────────────────────────

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises.slice(0, 30)
    const q = searchQuery.toLowerCase()
    return exercises
      .filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          ex.equipment.toLowerCase().includes(q) ||
          ex.pattern.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [searchQuery])

  // ── Helpers affichage ─────────────────────────────────────────────────────

  const getExerciseName = (id: string): string => {
    const ex = exercises.find((e) => e.id === id)
    return ex?.name ?? id
  }

  const getExerciseMuscles = (id: string): string => {
    const ex = exercises.find((e) => e.id === id)
    if (!ex) return ''
    return ex.primaryMuscles.join(', ')
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Constructeur de programme">
      <div style={containerStyle}>
        {/* ── En-tete ──────────────────────────────────────────────────── */}
        <header style={headerStyle}>
          <h2 style={titleStyle}>
            {editRoutineIds ? 'Modifier le programme' : 'Nouveau programme'}
          </h2>

          {/* Nom du programme */}
          <div style={fieldRowStyle}>
            <label htmlFor="prog-name" style={labelStyle}>
              Nom du programme
            </label>
            <input
              id="prog-name"
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="Ex: PPL Force"
              style={inputStyle}
              aria-required="true"
            />
          </div>

          {/* Objectif */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Objectif</span>
            <div style={chipRowStyle} role="radiogroup" aria-label="Objectif du programme">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.value}
                  type="button"
                  role="radio"
                  aria-checked={objective === obj.value}
                  onClick={() => setObjective(obj.value)}
                  style={{
                    ...chipStyle,
                    ...(objective === obj.value ? chipActiveStyle : {}),
                  }}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jours / semaine */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Jours / semaine</span>
            <div style={chipRowStyle} role="radiogroup" aria-label="Jours par semaine">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={daysPerWeek === d}
                  onClick={() => setDaysPerWeek(d)}
                  style={{
                    ...chipStyle,
                    ...(daysPerWeek === d ? chipActiveStyle : {}),
                    minWidth: 40,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Split + Description */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label htmlFor="prog-split" style={labelStyle}>
                Split
              </label>
              <input
                id="prog-split"
                type="text"
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                placeholder="Ex: Push/Pull/Legs"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label htmlFor="prog-desc" style={labelStyle}>
                Description
              </label>
              <input
                id="prog-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                style={inputStyle}
              />
            </div>
          </div>
        </header>

        {/* ── Onglets des seances ───────────────────────────────────────── */}
        <nav style={tabBarStyle} role="tablist" aria-label="Seances du programme">
          {sessions.map((sess, idx) => (
            <button
              key={sess.uid}
              type="button"
              role="tab"
              aria-selected={idx === activeSessionIdx}
              aria-controls={`session-panel-${idx}`}
              onClick={() => setActiveSessionIdx(idx)}
              style={{
                ...tabStyle,
                ...(idx === activeSessionIdx ? tabActiveStyle : {}),
              }}
            >
              {sess.name}
            </button>
          ))}
          <button
            type="button"
            onClick={addSession}
            style={addTabBtnStyle}
            aria-label="Ajouter une seance"
            title="Ajouter une seance"
          >
            +
          </button>
        </nav>

        {/* ── Panneau de la seance active ────────────────────────────────── */}
        <div
          id={`session-panel-${activeSessionIdx}`}
          role="tabpanel"
          aria-label={activeSession.name}
          style={panelStyle}
        >
          {/* Entete seance */}
          <div style={sessionHeaderStyle}>
            <input
              type="text"
              value={activeSession.name}
              onChange={(e) => renameSession(activeSessionIdx, e.target.value)}
              style={{ ...inputStyle, flex: 1, maxWidth: 220 }}
              aria-label="Nom de la seance"
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => duplicateSession(activeSessionIdx)}
                style={smallBtnStyle}
                title="Dupliquer cette seance"
                aria-label="Dupliquer cette seance"
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={() => deleteSession(activeSessionIdx)}
                style={{ ...smallBtnStyle, color: '#ff6b6b' }}
                disabled={sessions.length <= 1}
                title="Supprimer cette seance"
                aria-label="Supprimer cette seance"
              >
                Supprimer
              </button>
            </div>
          </div>

          {/* Liste des exercices */}
          <div style={exerciseListStyle}>
            {activeSession.exercises.length === 0 && (
              <p style={emptyTextStyle}>
                Aucun exercice. Appuyez sur "Ajouter un exercice" ci-dessous.
              </p>
            )}
            {activeSession.exercises.map((ex, exIdx) => {
              const exName = getExerciseName(ex.exerciseId)
              const exMuscles = getExerciseMuscles(ex.exerciseId)
              return (
                <div key={ex.uid} style={exerciseCardStyle}>
                  {/* Entete exercice */}
                  <div style={exHeaderStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={exNameStyle}>{exName}</div>
                      {exMuscles && (
                        <div style={exMusclesStyle}>{exMuscles}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => moveExercise(ex.uid, 'up')}
                        disabled={exIdx === 0}
                        style={arrowBtnStyle}
                        aria-label={`Monter ${exName}`}
                        title="Monter"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(ex.uid, 'down')}
                        disabled={exIdx === activeSession.exercises.length - 1}
                        style={arrowBtnStyle}
                        aria-label={`Descendre ${exName}`}
                        title="Descendre"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExercise(ex.uid)}
                        style={{ ...arrowBtnStyle, color: '#ff6b6b' }}
                        aria-label={`Supprimer ${exName}`}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div style={exConfigGridStyle}>
                    <div style={configCellStyle}>
                      <label style={configLabelStyle}>Series</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ex.sets}
                        onChange={(e) =>
                          updateExercise(ex.uid, 'sets', Math.max(1, Math.min(10, Number(e.target.value))))
                        }
                        style={configInputStyle}
                        aria-label={`Series pour ${exName}`}
                      />
                    </div>
                    <div style={configCellStyle}>
                      <label style={configLabelStyle}>Reps min</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={ex.repMin}
                        onChange={(e) =>
                          updateExercise(ex.uid, 'repMin', Math.max(1, Math.min(50, Number(e.target.value))))
                        }
                        style={configInputStyle}
                        aria-label={`Reps min pour ${exName}`}
                      />
                    </div>
                    <div style={configCellStyle}>
                      <label style={configLabelStyle}>Reps max</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={ex.repMax}
                        onChange={(e) =>
                          updateExercise(ex.uid, 'repMax', Math.max(1, Math.min(50, Number(e.target.value))))
                        }
                        style={configInputStyle}
                        aria-label={`Reps max pour ${exName}`}
                      />
                    </div>
                    <div style={configCellStyle}>
                      <label style={configLabelStyle}>RIR</label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={ex.targetRir}
                        onChange={(e) =>
                          updateExercise(ex.uid, 'targetRir', Math.max(0, Math.min(5, Number(e.target.value))))
                        }
                        style={configInputStyle}
                        aria-label={`RIR cible pour ${exName}`}
                      />
                    </div>
                    <div style={configCellStyle}>
                      <label style={configLabelStyle}>Repos (s)</label>
                      <input
                        type="number"
                        min={30}
                        max={600}
                        step={15}
                        value={ex.restSeconds}
                        onChange={(e) =>
                          updateExercise(ex.uid, 'restSeconds', Math.max(30, Math.min(600, Number(e.target.value))))
                        }
                        style={configInputStyle}
                        aria-label={`Repos en secondes pour ${exName}`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bouton ajouter exercice */}
          <button
            type="button"
            onClick={() => {
              setShowExercisePicker(true)
              setSearchQuery('')
            }}
            style={addExerciseBtnStyle}
            aria-label="Ajouter un exercice a cette seance"
          >
            + Ajouter un exercice
          </button>
        </div>

        {/* ── Erreurs ────────────────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div style={errorBoxStyle} role="alert">
            {errors.map((e, i) => (
              <p key={i} style={{ margin: '2px 0' }}>
                {e}
              </p>
            ))}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer style={footerStyle}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Annuler
          </button>
          <button type="button" onClick={handleSave} style={saveBtnStyle}>
            {editRoutineIds ? 'Mettre a jour' : 'Sauvegarder'}
          </button>
        </footer>
      </div>

      {/* ── Modal de selection d'exercice ───────────────────────────────── */}
      {showExercisePicker && (
        <ExercisePickerModal
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          exercises={filteredExercises}
          onSelect={addExerciseToSession}
          onClose={() => {
            setShowExercisePicker(false)
            setSearchQuery('')
          }}
          alreadyAdded={activeSession.exercises.map((ex) => ex.exerciseId)}
        />
      )}
    </div>
  )
}

// ── Sous-composant : modal de selection d'exercice ──────────────────────────

function ExercisePickerModal({
  searchQuery,
  onSearchChange,
  exercises: exList,
  onSelect,
  onClose,
  alreadyAdded,
}: {
  searchQuery: string
  onSearchChange: (q: string) => void
  exercises: Exercise[]
  onSelect: (id: string) => void
  onClose: () => void
  alreadyAdded: string[]
}) {
  return (
    <div
      style={pickerOverlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Selectionner un exercice"
    >
      <div style={pickerContainerStyle}>
        <div style={pickerHeaderStyle}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>
            Choisir un exercice
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={pickerCloseBtnStyle}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, muscle, equipement..."
          style={pickerSearchStyle}
          autoFocus
          aria-label="Rechercher un exercice"
        />

        <div style={pickerListStyle}>
          {exList.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>
              Aucun exercice trouve.
            </p>
          )}
          {exList.map((ex) => {
            const isAdded = alreadyAdded.includes(ex.id)
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelect(ex.id)}
                style={{
                  ...pickerItemStyle,
                  opacity: isAdded ? 0.5 : 1,
                }}
                aria-label={`Ajouter ${ex.name}`}
                disabled={isAdded}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                    {ex.name}
                  </div>
                  <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>
                    {ex.primaryMuscles.join(', ')} | {ex.equipment}
                    {ex.difficulty && ` | ${'*'.repeat(ex.difficulty)}`}
                  </div>
                </div>
                {isAdded ? (
                  <span style={{ color: '#666', fontSize: 12, flexShrink: 0 }}>Deja ajoute</span>
                ) : (
                  <span style={{ color: '#4ecdc4', fontSize: 18, flexShrink: 0 }}>+</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
}

const containerStyle: CSSProperties = {
  background: '#1a1a2e',
  borderRadius: 16,
  width: '100%',
  maxWidth: 680,
  maxHeight: '94vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid #333',
}

const headerStyle: CSSProperties = {
  padding: '20px 20px 12px',
  borderBottom: '1px solid #2a2a3e',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const titleStyle: CSSProperties = {
  color: '#fff',
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
}

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const labelStyle: CSSProperties = {
  color: '#aaa',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const inputStyle: CSSProperties = {
  background: '#16162a',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#fff',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const chipRowStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
}

const chipStyle: CSSProperties = {
  background: '#16162a',
  border: '1px solid #333',
  borderRadius: 20,
  color: '#aaa',
  padding: '5px 14px',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const chipActiveStyle: CSSProperties = {
  background: '#4ecdc4',
  color: '#000',
  borderColor: '#4ecdc4',
  fontWeight: 600,
}

const tabBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '0 16px',
  borderBottom: '1px solid #2a2a3e',
  overflowX: 'auto',
  flexShrink: 0,
}

const tabStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: '#888',
  padding: '10px 16px',
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
}

const tabActiveStyle: CSSProperties = {
  color: '#4ecdc4',
  borderBottomColor: '#4ecdc4',
  fontWeight: 600,
}

const addTabBtnStyle: CSSProperties = {
  background: 'transparent',
  border: '1px dashed #444',
  borderRadius: 6,
  color: '#4ecdc4',
  width: 32,
  height: 32,
  fontSize: 18,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginLeft: 4,
}

const panelStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const sessionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const smallBtnStyle: CSSProperties = {
  background: '#16162a',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#aaa',
  padding: '5px 10px',
  fontSize: 11,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const exerciseListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const emptyTextStyle: CSSProperties = {
  color: '#666',
  textAlign: 'center',
  padding: '24px 0',
  fontSize: 14,
}

const exerciseCardStyle: CSSProperties = {
  background: '#16162a',
  borderRadius: 10,
  border: '1px solid #2a2a3e',
  padding: 12,
}

const exHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  marginBottom: 10,
}

const exNameStyle: CSSProperties = {
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const exMusclesStyle: CSSProperties = {
  color: '#4ecdc4',
  fontSize: 11,
  marginTop: 2,
}

const arrowBtnStyle: CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#aaa',
  width: 28,
  height: 28,
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

const exConfigGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8,
}

const configCellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const configLabelStyle: CSSProperties = {
  color: '#888',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
}

const configInputStyle: CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#fff',
  padding: '6px 4px',
  fontSize: 13,
  textAlign: 'center',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const addExerciseBtnStyle: CSSProperties = {
  background: 'transparent',
  border: '1px dashed #4ecdc4',
  borderRadius: 10,
  color: '#4ecdc4',
  padding: '12px 0',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
}

const errorBoxStyle: CSSProperties = {
  background: '#2a1a1a',
  border: '1px solid #ff6b6b',
  borderRadius: 8,
  color: '#ff6b6b',
  padding: '8px 16px',
  margin: '0 16px',
  fontSize: 13,
}

const footerStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: '12px 20px 20px',
  borderTop: '1px solid #2a2a3e',
  justifyContent: 'flex-end',
}

const cancelBtnStyle: CSSProperties = {
  background: '#16162a',
  border: '1px solid #333',
  borderRadius: 10,
  color: '#aaa',
  padding: '10px 24px',
  fontSize: 14,
  cursor: 'pointer',
}

const saveBtnStyle: CSSProperties = {
  background: '#4ecdc4',
  border: 'none',
  borderRadius: 10,
  color: '#000',
  padding: '10px 32px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

// ── Styles modal picker ─────────────────────────────────────────────────────

const pickerOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const pickerContainerStyle: CSSProperties = {
  background: '#1a1a2e',
  borderRadius: 14,
  width: '100%',
  maxWidth: 480,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid #333',
}

const pickerHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderBottom: '1px solid #2a2a3e',
}

const pickerCloseBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#888',
  fontSize: 18,
  cursor: 'pointer',
  padding: 4,
}

const pickerSearchStyle: CSSProperties = {
  background: '#16162a',
  border: 'none',
  borderBottom: '1px solid #2a2a3e',
  color: '#fff',
  padding: '10px 16px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const pickerListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
}

const pickerItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #1e1e32',
  padding: '10px 16px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.1s',
}
