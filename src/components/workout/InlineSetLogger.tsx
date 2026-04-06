// ── InlineSetLogger.tsx ──────────────────────────────────────────────────────
// Hevy-style inline set grid for logging workout sets.
// Replaces the old "add set" form with a compact, editable table.
// Each logged set is a row; tap "+" to instantly add a pre-filled set.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'
import type { SetType, SetLog } from '../../types'
import { MiniPlateCalc } from '../tools/MiniPlateCalc'
import { RPESlider } from '../tools/RPESlider'
import { ExerciseDemo } from '../tools/ExerciseDemo'

// ── CSS keyframes injected once ──────────────────────────────────────────────

const STYLE_ID = 'inline-set-logger-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes isl-slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes isl-flash {
      0%   { background: rgba(255,140,0,0.25); }
      100% { background: transparent; }
    }
    .isl-row-enter {
      animation: isl-slideUp 0.22s ease-out, isl-flash 0.6s ease-out;
    }
    .isl-input {
      width: 100%;
      padding: 8px 4px;
      border-radius: 8px;
      border: 1px solid var(--border, #333);
      background: var(--bg, #111);
      color: var(--text, #fff);
      font-size: 0.9rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
      -webkit-appearance: none;
      appearance: none;
      min-height: 36px;
      transition: border-color 0.15s;
    }
    .isl-input:focus {
      outline: none;
      border-color: var(--accent, #ff8c00);
      box-shadow: 0 0 0 2px rgba(255,140,0,0.15);
    }
    .isl-input::placeholder {
      color: var(--text-secondary, #888);
      opacity: 0.6;
    }
    .isl-delete-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .isl-delete-btn:active {
      background: rgba(239,68,68,0.25);
      transform: scale(0.9);
    }
    .isl-delete-btn:focus-visible {
      outline: 2px solid var(--danger, #ef4444);
      outline-offset: 1px;
    }
    .isl-add-btn {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 10px;
      border: none;
      background: var(--accent, #ff8c00);
      color: #000;
      font-weight: 800;
      font-size: 1.15rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s, opacity 0.15s;
    }
    .isl-add-btn:active {
      transform: scale(0.92);
    }
    .isl-add-btn:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
    .isl-toggle-btn {
      width: 100%;
      padding: 6px;
      margin-top: 4px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #888);
      font-size: 0.72rem;
      cursor: pointer;
      transition: color 0.15s;
    }
    .isl-toggle-btn:hover {
      color: var(--text, #fff);
    }
    .isl-toggle-btn:focus-visible {
      outline: 2px solid var(--accent, #ff8c00);
      outline-offset: 1px;
      border-radius: 6px;
    }
    .isl-check {
      color: var(--accent, #ff8c00);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .isl-set-type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  `
  document.head.appendChild(style)
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  exerciseId: string
  target: {
    sets: number
    repMin: number
    repMax: number
    targetRir: number
    restSeconds: number
  }
  onSetAdded: (restSeconds: number) => void
}

// ── Inline editable cell ─────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  inputMode = 'decimal',
  suffix = '',
}: {
  value: number
  onChange: (v: number) => void
  inputMode?: 'decimal' | 'numeric'
  suffix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(String(value)); setEditing(true) }}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') { setDraft(String(value)); setEditing(true) } }}
        style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 4px',
          borderRadius: 6,
          transition: 'background 0.15s',
          display: 'block',
          textAlign: 'center',
          minHeight: 32,
          lineHeight: '20px',
        }}
      >
        {value}{suffix}
      </span>
    )
  }

  const commit = () => {
    const parsed = inputMode === 'decimal' ? parseFloat(draft) : parseInt(draft, 10)
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed)
    setEditing(false)
  }

  return (
    <input
      ref={inputRef}
      className="isl-input"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      inputMode={inputMode}
      style={{ padding: '4px 2px', fontSize: '0.85rem' }}
    />
  )
}

// ── Set type color helper ────────────────────────────────────────────────────

function setTypeBadge(t: SetType) {
  const colors: Record<SetType, { bg: string; fg: string }> = {
    warmup:  { bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa' },
    normal:  { bg: 'rgba(255,255,255,0.06)', fg: 'var(--text-secondary, #888)' },
    top:     { bg: 'rgba(255,140,0,0.15)', fg: 'var(--accent)' },
    backoff: { bg: 'rgba(168,85,247,0.15)', fg: '#a855f7' },
    drop:    { bg: 'rgba(236,72,153,0.15)', fg: '#ec4899' },
    amrap:   { bg: 'rgba(34,197,94,0.15)', fg: 'var(--success)' },
    superset: { bg: 'rgba(155,89,182,0.15)', fg: 'var(--accent-purple)' },
  }
  const c = colors[t] ?? colors.normal
  return (
    <span className="isl-set-type-badge" style={{ background: c.bg, color: c.fg }}>
      {t === 'warmup' ? 'W' : t === 'normal' ? 'N' : t === 'backoff' ? 'BO' : t.toUpperCase()}
    </span>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function InlineSetLogger({ exerciseId, target, onSetAdded }: Props) {
  const { state, dispatch } = useAppState()
  const [showRir, setShowRir] = useState(false)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [showPlates, setShowPlates] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const newRowRef = useRef<HTMLDivElement>(null)

  // Inject CSS once
  useEffect(() => { injectStyles() }, [])

  const activeExercise = state.activeWorkout?.exercises.find(e => e.exerciseId === exerciseId)
  const exerciseNotes = activeExercise?.notes || ''
  const sets: SetLog[] = activeExercise?.sets ?? []

  // Get previous workout's last set for this exercise
  const previousSet = useMemo(() => {
    for (let i = state.workouts.length - 1; i >= 0; i--) {
      const ex = state.workouts[i].exercises.find(e => e.exerciseId === exerciseId)
      if (ex && ex.sets.length > 0) return ex.sets[ex.sets.length - 1]
    }
    return null
  }, [state.workouts, exerciseId])

  // Draft values for the next set (pre-filled from last logged set or previous session)
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : previousSet

  const [draft, setDraft] = useState({
    weight: lastSet?.weightKg?.toString() ?? '',
    reps: lastSet?.reps?.toString() ?? String(target.repMin),
    rir: String(target.targetRir),
    setType: 'normal' as SetType,
  })

  // Update draft when a new set is added (carry over values)
  useEffect(() => {
    if (sets.length > 0) {
      const last = sets[sets.length - 1]
      setDraft(prev => ({
        ...prev,
        weight: String(last.weightKg),
        reps: String(last.reps),
        rir: String(last.rir),
      }))
    }
  }, [sets.length])

  // Add a new set via dispatch
  const addSet = useCallback(() => {
    const w = parseFloat(draft.weight) || 0
    const r = parseInt(draft.reps, 10) || 0
    if (r <= 0) return
    // BUG-F1: Reject 0kg for non-warmup sets
    if (w <= 0 && draft.setType !== 'warmup') return
    // BUG-F5: Clamp RIR between 0 and 5
    const rirVal = Math.max(0, Math.min(5, parseInt(draft.rir, 10) || target.targetRir))
    dispatch({
      type: 'ADD_SET',
      payload: {
        exerciseId,
        weightKg: w,
        reps: r,
        rir: rirVal,
        setType: draft.setType,
      },
    })
    onSetAdded(target.restSeconds)

    // Scroll the new row into view after render
    requestAnimationFrame(() => {
      newRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [draft, exerciseId, target, dispatch, onSetAdded])

  // Edit an existing logged set inline (dispatches a state update)
  const updateSet = useCallback((setId: string, field: 'weightKg' | 'reps' | 'rir', value: number) => {
    // We build a new exercises array with the updated set
    if (!state.activeWorkout) return
    const updatedExercises = state.activeWorkout.exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
      }
    })
    dispatch({
      type: 'START_WORKOUT',
      payload: { ...state.activeWorkout, exercises: updatedExercises },
    })
  }, [state.activeWorkout, exerciseId, dispatch])

  const updateNotes = useCallback((notes: string) => {
    if (!state.activeWorkout) return
    const updatedExercises = state.activeWorkout.exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      return { ...ex, notes }
    })
    dispatch({
      type: 'START_WORKOUT',
      payload: { ...state.activeWorkout, exercises: updatedExercises },
    })
  }, [state.activeWorkout, exerciseId, dispatch])

  // Delete a set (remove from active workout)
  const deleteSet = useCallback((setId: string) => {
    if (!state.activeWorkout) return
    setRemovingId(setId)
    // Small delay for visual feedback before removing
    setTimeout(() => {
      const updatedExercises = state.activeWorkout!.exercises.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId),
        }
      })
      dispatch({
        type: 'START_WORKOUT',
        payload: { ...state.activeWorkout!, exercises: updatedExercises },
      })
      setRemovingId(null)
    }, 150)
  }, [state.activeWorkout, exerciseId, dispatch])

  const exercise = getExerciseById(exerciseId)

  // Determine progress toward target sets
  const completedSets = sets.length
  const targetSets = target.sets
  const progress = Math.min(completedSets / targetSets, 1)

  // Grid template columns
  const gridCols = showRir
    ? '32px 1fr 1fr 56px 32px 32px'
    : '32px 1fr 1fr 32px 32px'

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a1a)',
      borderRadius: 16,
      border: '1px solid var(--border, #333)',
      padding: 12,
      marginBottom: 12,
    }}>
      {/* ── Exercise header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {exercise?.name ?? exerciseId.replace(/_/g, ' ')}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary, #888)',
            marginTop: 2,
          }}>
            {target.sets}×{target.repMin}-{target.repMax} — RIR {target.targetRir} — Repos {target.restSeconds}s
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {previousSet && (
            <span style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid var(--border, #333)',
              color: 'var(--text-secondary, #888)',
              whiteSpace: 'nowrap',
            }}>
              Préc: {previousSet.weightKg}×{previousSet.reps}
            </span>
          )}
          {/* Progress indicator */}
          <div style={{
            width: 64,
            height: 4,
            borderRadius: 2,
            background: 'var(--border, #333)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: 2,
              background: progress >= 1
                ? 'var(--accent-green, #22c55e)'
                : 'var(--accent, #ff8c00)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)' }}>
            {completedSets}/{targetSets} séries
          </span>
        </div>
      </div>

      {/* ── Column headers ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: 6,
        fontSize: '0.62rem',
        color: 'var(--text-secondary, #888)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 4,
        padding: '0 2px',
      }}>
        <span>#</span>
        <span>Poids (kg)</span>
        <span>Reps</span>
        {showRir && <span>RIR</span>}
        <span></span>
        <span></span>
      </div>

      {/* ── Logged sets rows ───────────────────────────────────────────── */}
      {sets.map((set, idx) => (
        <div
          key={set.id}
          className="isl-row-enter"
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: 6,
            alignItems: 'center',
            minHeight: 44,
            padding: '4px 2px',
            borderBottom: '1px solid var(--border, #333)',
            opacity: removingId === set.id ? 0.3 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {/* Set number */}
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-secondary, #888)',
            textAlign: 'center',
          }}>
            {idx + 1}
          </span>

          {/* Weight (editable) */}
          <EditableCell
            value={set.weightKg}
            onChange={v => updateSet(set.id, 'weightKg', v)}
            inputMode="decimal"
          />

          {/* Reps (editable) */}
          <EditableCell
            value={set.reps}
            onChange={v => updateSet(set.id, 'reps', v)}
            inputMode="numeric"
          />

          {/* RIR (editable, collapsible) */}
          {showRir && (
            <EditableCell
              value={set.rir}
              onChange={v => updateSet(set.id, 'rir', v)}
              inputMode="numeric"
            />
          )}

          {/* Set type badge */}
          {setTypeBadge(set.setType)}

          {/* Delete button */}
          <button
            className="isl-delete-btn"
            onClick={() => deleteSet(set.id)}
            type="button"
            aria-label={`Supprimer la série ${idx + 1}`}
          >
            ×
          </button>
        </div>
      ))}

      {/* ── Dernier entrainement ── */}
      {previousSet && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 8px', marginTop: 4, marginBottom: 2,
          background: 'rgba(255,255,255,0.03)', borderRadius: 8,
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #999)' }}>
            Dernier : {previousSet.weightKg}kg {String.fromCharCode(215)} {previousSet.reps} @ RIR {previousSet.rir}
          </span>
          <button
            type="button"
            onClick={() => setDraft(prev => ({
              ...prev,
              weight: String(previousSet.weightKg),
              reps: String(previousSet.reps),
              rir: String(previousSet.rir),
            }))}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border, #333)',
              background: 'rgba(255,140,0,0.08)', color: 'var(--accent, #ff8c00)',
              fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Copier la derni\u00e8re s\u00e9rie
          </button>
        </div>
      )}
      {previousSet && previousSet.rir === 0 && (
        <div style={{
          padding: '4px 8px', marginBottom: 2, borderRadius: 6,
          background: 'rgba(239,68,68,0.08)', fontSize: '0.7rem',
          color: '#ef4444', fontWeight: 600,
        }}>
          \u26A0\uFE0F Tu \u00e9tais \u00e0 fond la derni\u00e8re fois
        </div>
      )}

            {/* ── Add new set row ────────────────────────────────────────────── */}
      <div
        ref={newRowRef}
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 6,
          alignItems: 'center',
          minHeight: 44,
          padding: '6px 2px',
          marginTop: 4,
        }}
      >
        {/* Next set number */}
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--accent, #ff8c00)',
          textAlign: 'center',
        }}>
          {sets.length + 1}
        </span>

        {/* Weight input */}
        <input
          className="isl-input"
          value={draft.weight}
          onChange={e => setDraft(prev => ({ ...prev, weight: e.target.value }))}
          inputMode="decimal"
          placeholder="kg"
          aria-label="Poids en kg"
        />
        {previousSet && <div onClick={() => setDraft(d => ({...d, weight: String(previousSet.weightKg)}))} style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', cursor: 'pointer', marginTop: 1 }}>{previousSet.weightKg}kg</div>}

        {/* Reps input */}
        <input
          className="isl-input"
          value={draft.reps}
          onChange={e => setDraft(prev => ({ ...prev, reps: e.target.value }))}
          inputMode="numeric"
          placeholder="reps"
          aria-label="Nombre de répétitions"
        />
        {previousSet && <div onClick={() => setDraft(d => ({...d, reps: String(previousSet.reps)}))} style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', cursor: 'pointer', marginTop: 1 }}>{previousSet.reps}r</div>}

        {/* RIR input (collapsible) */}
        {showRir && (<>
          <input
            className="isl-input"
            value={draft.rir}
            onChange={e => setDraft(prev => ({ ...prev, rir: e.target.value }))}
            inputMode="numeric"
            placeholder="RIR"
            aria-label="RIR"
            style={{ fontSize: '0.82rem' }}
          />
                <RPESlider
                  rir={parseInt(draft.rir, 10) || target.targetRir}
                  onChange={(newRir) => setDraft(d => ({ ...d, rir: String(newRir) }))}
                  compact
                />
        </>)}

        {/* Set type selector (mini) */}
        <select
          value={draft.setType}
          onChange={e => setDraft(prev => ({ ...prev, setType: e.target.value as SetType }))}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border, #333)',
            background: 'var(--bg, #111)',
            color: 'var(--text, #fff)',
            fontSize: '0.55rem',
            padding: 0,
            textAlign: 'center',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
          aria-label="Type de série"
        >
          <option value="normal">N</option>
          <option value="warmup">W</option>
          <option value="top">TOP</option>
          <option value="backoff">BO</option>
          <option value="drop">DR</option>
          <option value="amrap">AM</option>
        </select>

        {/* Add button */}
        <button
          className="isl-add-btn"
          onClick={addSet}
          type="button"
          aria-label="Ajouter la série"
        >
          +
        </button>
      </div>

      {/* ── Quick-add hint ─────────────────────────────────────────────── */}
      {sets.length === 0 && (
        <p style={{
          margin: '4px 0 0',
          fontSize: '0.7rem',
          color: 'var(--text-secondary, #888)',
          textAlign: 'center',
        }}>
          Appuie sur <strong>+</strong> pour ajouter ta première série
        </p>
      )}

      {/* ── Toggle RIR column ──────────────────────────────────────────── */}
      <button
        className="isl-toggle-btn"
        onClick={() => setShowRir(prev => !prev)}
        type="button"
      >
        {showRir ? 'Masquer RIR \u25B2' : 'Afficher RIR \u25BC'}
      </button>

      {/* Notes */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          style={{
            flex: 1, padding: '4px', border: 'none', borderRadius: 6,
            background: exerciseNotes ? 'rgba(255,140,0,0.1)' : 'transparent',
            color: exerciseNotes ? 'var(--accent)' : 'var(--text-secondary, #888)',
            fontSize: '0.7rem', cursor: 'pointer',
          }}
        >
          {'📝'} {showNotes ? 'Masquer notes' : exerciseNotes ? 'Voir notes' : 'Ajouter une note'}
        </button>
      
        <button
          type="button"
          onClick={() => setShowPlates(!showPlates)}
          style={{
            flex: 1, padding: '4px', border: 'none', borderRadius: 6,
            background: showPlates ? 'rgba(49,130,206,0.1)' : 'transparent',
            color: showPlates ? '#3182ce' : 'var(--text-secondary, #888)',
            fontSize: '0.7rem', cursor: 'pointer',
          }}
        >
          {'🏋️'} Plaques
        </button>
        <button
          type="button"
          onClick={() => setShowDemo(!showDemo)}
          style={{
            flex: 1, padding: '4px', border: 'none', borderRadius: 6,
            background: showDemo ? 'rgba(59,130,246,0.1)' : 'transparent',
            color: showDemo ? '#3b82f6' : 'var(--text-secondary, #888)',
            fontSize: '0.7rem', cursor: 'pointer',
          }}
        >
          {'🎬'} Démo
        </button>
      </div>
      {showPlates && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" onClick={() => setShowPlateCalc(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 2 }} aria-label="Calculateur de plaques">
            {showPlateCalc ? '\u2716' : '\U0001f3cb\ufe0f'}
          </button>
        </div>
        {showPlateCalc && <MiniPlateCalc weight={parseFloat(draft.weight) || 0} />}
      )}
      {showDemo && (
        <ExerciseDemo exerciseId={exerciseId} />
      )}
      {showNotes && (
        <textarea
          value={exerciseNotes}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder="Notes pour cet exercice..."
          rows={2}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8, marginTop: 6,
            border: '1px solid var(--border, #333)', background: 'var(--bg, #111)',
            color: 'var(--text, #fff)', fontSize: '0.78rem', resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

export default InlineSetLogger
