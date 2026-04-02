// =============================================================================
// PremiumLogging.tsx
// Enhanced set logging: edit, delete, undo, notes, tempo, superset,
// warm-up builder, busy-gym alternatives. French labels. Dark theme. ARIA.
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import { getExerciseById, makeId } from '../../lib'
import { exercises } from '../../data'
import type { SetType } from '../../types'

// Inline type definitions (originally from ./types_additions)
interface Tempo {
  eccentric: number
  pause: number
  concentric: number
  top: number
}

interface EnhancedSetLog {
  id: string
  exerciseId: string
  setIndex: number
  setType: SetType
  weightKg: number
  reps: number
  rir: number
  timestamp: string
  note?: string
  tempo?: Tempo
  side?: 'left' | 'right' | 'both'
  supersetGroupId?: string
}

interface SupersetGroup {
  id: string
  type: 'superset' | 'giant_set' | 'rest_pause' | 'myo_reps'
  exerciseIds: string[]
}

interface UndoAction {
  type: 'ADD_SET' | 'DELETE_SET' | 'EDIT_SET'
  exerciseId: string
  set: EnhancedSetLog
  timestamp: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SetDraft {
  weight: string
  reps: string
  rir: string
  setType: SetType
  note: string
  tempo: string // "3-1-1-0" format
  side: 'left' | 'right' | 'both'
}

const DEFAULT_DRAFT: SetDraft = {
  weight: '',
  reps: '',
  rir: '2',
  setType: 'normal',
  note: '',
  tempo: '',
  side: 'both',
}

const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Echauffement',
  normal: 'Normal',
  top: 'Top set',
  backoff: 'Back-off',
  drop: 'Drop set',
  amrap: 'AMRAP', superset: 'Superset',
}

function parseTempo(raw: string): Tempo | undefined {
  const parts = raw.replace(/\s/g, '').split(/[-/]/)
  if (parts.length !== 4) return undefined
  const nums = parts.map(Number)
  if (nums.some(isNaN)) return undefined
  return { eccentric: nums[0], pause: nums[1], concentric: nums[2], top: nums[3] }
}

function formatTempo(t?: Tempo): string {
  if (!t) return ''
  return `${t.eccentric}-${t.pause}-${t.concentric}-${t.top}`
}

// ---------------------------------------------------------------------------
// Warm-up builder
// ---------------------------------------------------------------------------

function generateWarmup(workingWeight: number): { weight: number; reps: number; type: SetType }[] {
  if (workingWeight <= 0) return []
  if (workingWeight <= 20) return [{ weight: 0, reps: 10, type: 'warmup' }]

  const warmups: { weight: number; reps: number; type: SetType }[] = []
  // Bar only
  warmups.push({ weight: 20, reps: 10, type: 'warmup' })

  if (workingWeight > 40) {
    warmups.push({
      weight: Math.round((workingWeight * 0.5) / 2.5) * 2.5,
      reps: 10,
      type: 'warmup',
    })
  }
  if (workingWeight > 60) {
    warmups.push({
      weight: Math.round((workingWeight * 0.7) / 2.5) * 2.5,
      reps: 5,
      type: 'warmup',
    })
  }
  warmups.push({
    weight: Math.round((workingWeight * 0.85) / 2.5) * 2.5,
    reps: 3,
    type: 'warmup',
  })

  return warmups
}

// ---------------------------------------------------------------------------
// Busy-gym alternatives
// ---------------------------------------------------------------------------

function getAlternatives(exerciseId: string): typeof exercises {
  const ex = getExerciseById(exerciseId)
  if (!ex) return []
  return exercises
    .filter(
      (e) =>
        e.id !== exerciseId &&
        ex.primaryMuscles.some((m) => e.primaryMuscles.includes(m)) &&
        e.equipment !== ex.equipment
    )
    .sort((a, b) => b.stimulusFatigue - a.stimulusFatigue)
    .slice(0, 3)
}

// ---------------------------------------------------------------------------
// Styles (dark theme, inline)
// ---------------------------------------------------------------------------

const S = {
  card: {
    background: 'var(--bg-card, #1a1a2e)',
    borderRadius: 16,
    border: '1px solid var(--border, #2a2a40)',
    padding: 16,
    marginBottom: 12,
  } as React.CSSProperties,
  heading: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.05rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent, #FF6B00)',
    margin: '0 0 10px',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    flex: 1,
    background: 'var(--bg-input, #12121f)',
    border: '1px solid var(--border, #2a2a40)',
    borderRadius: 8,
    color: 'var(--text, #e0e0e0)',
    padding: '7px 10px',
    fontSize: '0.85rem',
    outline: 'none',
    minWidth: 0,
  } as React.CSSProperties,
  inputSmall: {
    width: 60,
    textAlign: 'center' as const,
    background: 'var(--bg-input, #12121f)',
    border: '1px solid var(--border, #2a2a40)',
    borderRadius: 8,
    color: 'var(--text, #e0e0e0)',
    padding: '7px 6px',
    fontSize: '0.85rem',
    outline: 'none',
  } as React.CSSProperties,
  select: {
    background: 'var(--bg-input, #12121f)',
    border: '1px solid var(--border, #2a2a40)',
    borderRadius: 8,
    color: 'var(--text, #e0e0e0)',
    padding: '7px 8px',
    fontSize: '0.8rem',
    outline: 'none',
  } as React.CSSProperties,
  btnPrimary: {
    background: 'var(--accent, #FF6B00)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '9px 16px',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  btnSecondary: {
    background: 'transparent',
    color: 'var(--accent, #FF6B00)',
    border: '1px solid var(--accent, #FF6B00)',
    borderRadius: 10,
    padding: '7px 12px',
    fontWeight: 600,
    fontSize: '0.78rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnDanger: {
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: '0.72rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnGhost: {
    background: 'transparent',
    color: 'var(--text-secondary, #888)',
    border: 'none',
    padding: '5px 8px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
  setRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
    marginBottom: 4,
    fontSize: '0.82rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary, #888)',
    marginBottom: 2,
  } as React.CSSProperties,
  chip: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: '0.68rem',
    fontWeight: 600,
    background: 'rgba(255,107,0,0.15)',
    color: 'var(--accent, #FF6B00)',
    marginRight: 4,
  } as React.CSSProperties,
  undoBtn: {
    position: 'fixed' as const,
    bottom: 90,
    right: 16,
    background: '#1e1e30',
    border: '1px solid var(--accent, #FF6B00)',
    color: 'var(--accent, #FF6B00)',
    borderRadius: 14,
    padding: '10px 16px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  } as React.CSSProperties,
  note: {
    width: '100%',
    background: 'var(--bg-input, #12121f)',
    border: '1px solid var(--border, #2a2a40)',
    borderRadius: 8,
    color: 'var(--text, #e0e0e0)',
    padding: '6px 10px',
    fontSize: '0.78rem',
    outline: 'none',
    resize: 'none' as const,
    marginTop: 4,
  } as React.CSSProperties,
  altCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border, #2a2a40)',
    marginBottom: 6,
    fontSize: '0.8rem',
  } as React.CSSProperties,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PremiumSetLoggerProps {
  exerciseId: string
  onAddSet: (set: EnhancedSetLog) => void
  onDeleteSet: (setId: string) => void
  onEditSet: (set: EnhancedSetLog) => void
  onSwapExercise?: (newExerciseId: string) => void
  onLinkSuperset?: (exerciseId: string) => void
  existingSets: EnhancedSetLog[]
  supersetGroup?: SupersetGroup | null
}

export function PremiumSetLogger({
  exerciseId,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onSwapExercise,
  onLinkSuperset,
  existingSets,
  supersetGroup,
}: PremiumSetLoggerProps) {
  const exercise = getExerciseById(exerciseId)

  // Draft state
  const [draft, setDraft] = useState<SetDraft>({ ...DEFAULT_DRAFT })
  const [showNote, setShowNote] = useState(false)
  const [showTempo, setShowTempo] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  // Editing state
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<SetDraft>({ ...DEFAULT_DRAFT })

  // Undo stack
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  // Alternatives
  const alternatives = useMemo(() => getAlternatives(exerciseId), [exerciseId])

  // Warm-up sets
  const warmupSets = useMemo(() => {
    const w = parseFloat(draft.weight)
    if (!w || w <= 0) return []
    return generateWarmup(w)
  }, [draft.weight])

  // ------- Draft handlers -------

  const updateDraft = useCallback((field: keyof SetDraft, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const handleAddSet = useCallback(() => {
    const weight = parseFloat(draft.weight)
    const reps = parseInt(draft.reps, 10)
    const rir = parseInt(draft.rir, 10)
    if (isNaN(weight) || isNaN(reps)) return

    const newSet: EnhancedSetLog = {
      id: makeId(),
      exerciseId,
      setIndex: existingSets.length,
      setType: draft.setType,
      weightKg: weight,
      reps,
      rir: isNaN(rir) ? 2 : rir,
      timestamp: new Date().toISOString(),
      note: draft.note || undefined,
      tempo: parseTempo(draft.tempo),
      side: draft.side !== 'both' ? draft.side : undefined,
      supersetGroupId: supersetGroup?.id,
    }

    onAddSet(newSet)

    // Push to undo stack
    setUndoStack((s) => [...s, { type: 'ADD_SET', exerciseId, set: newSet, timestamp: Date.now() }])

    // Reset note & tempo but keep weight/reps for quick re-logging
    setDraft((d) => ({ ...d, note: '', tempo: '' }))
    setShowNote(false)
  }, [draft, exerciseId, existingSets.length, onAddSet, supersetGroup])

  // ------- Add warm-up sets -------

  const handleAddWarmups = useCallback(() => {
    warmupSets.forEach((ws, i) => {
      const warmupSet: EnhancedSetLog = {
        id: makeId(),
        exerciseId,
        setIndex: existingSets.length + i,
        setType: ws.type,
        weightKg: ws.weight,
        reps: ws.reps,
        rir: 5,
        timestamp: new Date().toISOString(),
      }
      onAddSet(warmupSet)
    })
    setShowWarmup(false)
  }, [warmupSets, exerciseId, existingSets.length, onAddSet])

  // ------- Delete set -------

  const handleDeleteSet = useCallback(
    (setId: string) => {
      const deletedSet = existingSets.find((s) => s.id === setId)
      if (deletedSet) {
        setUndoStack((s) => [
          ...s,
          { type: 'DELETE_SET', exerciseId, set: deletedSet, timestamp: Date.now() },
        ])
      }
      onDeleteSet(setId)
    },
    [existingSets, exerciseId, onDeleteSet]
  )

  // ------- Edit set -------

  const startEdit = useCallback(
    (set: EnhancedSetLog) => {
      setEditingSetId(set.id)
      setEditDraft({
        weight: String(set.weightKg),
        reps: String(set.reps),
        rir: String(set.rir),
        setType: set.setType,
        note: set.note || '',
        tempo: formatTempo(set.tempo),
        side: set.side || 'both',
      })
    },
    []
  )

  const confirmEdit = useCallback(() => {
    if (!editingSetId) return
    const original = existingSets.find((s) => s.id === editingSetId)
    if (!original) return

    const updated: EnhancedSetLog = {
      ...original,
      weightKg: parseFloat(editDraft.weight) || original.weightKg,
      reps: parseInt(editDraft.reps, 10) || original.reps,
      rir: parseInt(editDraft.rir, 10) ?? original.rir,
      setType: editDraft.setType,
      note: editDraft.note || undefined,
      tempo: parseTempo(editDraft.tempo),
      side: editDraft.side !== 'both' ? editDraft.side : undefined,
    }

    // Save original for undo
    setUndoStack((s) => [
      ...s,
      { type: 'EDIT_SET', exerciseId, set: original, timestamp: Date.now() },
    ])

    onEditSet(updated)
    setEditingSetId(null)
  }, [editingSetId, editDraft, existingSets, exerciseId, onEditSet])

  const cancelEdit = useCallback(() => setEditingSetId(null), [])

  // ------- Undo -------

  const handleUndo = useCallback(() => {
    const last = undoStack[undoStack.length - 1]
    if (!last) return

    if (last.type === 'ADD_SET') {
      onDeleteSet(last.set.id)
    } else if (last.type === 'DELETE_SET') {
      onAddSet(last.set)
    } else if (last.type === 'EDIT_SET') {
      onEditSet(last.set)
    }

    setUndoStack((s) => s.slice(0, -1))
  }, [undoStack, onAddSet, onDeleteSet, onEditSet])

  // ------- Render -------

  if (!exercise) return null

  return (
    <div style={S.card} role="region" aria-label={`Logger pour ${exercise.name}`}>
      {/* Header */}
      <h3 style={S.heading}>{exercise.name}</h3>

      {/* Superset badge */}
      {supersetGroup && (
        <div style={{ marginBottom: 8 }}>
          <span style={S.chip}>
            {supersetGroup.type === 'superset'
              ? 'Superset'
              : supersetGroup.type === 'giant_set'
                ? 'Giant Set'
                : supersetGroup.type === 'rest_pause'
                  ? 'Rest-Pause'
                  : 'Myo-Reps'}
          </span>
        </div>
      )}

      {/* Existing sets list */}
      <div role="list" aria-label="Series enregistrees">
        {existingSets.map((set, i) => (
          <div key={set.id} role="listitem">
            {editingSetId === set.id ? (
              /* ---- Inline edit mode ---- */
              <div style={{ ...S.setRow, border: '1px solid var(--accent, #FF6B00)' }}>
                <span style={{ fontWeight: 700, minWidth: 22 }}>{i + 1}.</span>
                <input
                  type="number"
                  inputMode="decimal"
                  style={S.inputSmall}
                  value={editDraft.weight}
                  onChange={(e) => setEditDraft((d) => ({ ...d, weight: e.target.value }))}
                  aria-label="Poids (kg)"
                />
                <span style={{ fontSize: '0.7rem', color: '#888' }}>kg</span>
                <input
                  type="number"
                  inputMode="numeric"
                  style={S.inputSmall}
                  value={editDraft.reps}
                  onChange={(e) => setEditDraft((d) => ({ ...d, reps: e.target.value }))}
                  aria-label="Repetitions"
                />
                <span style={{ fontSize: '0.7rem', color: '#888' }}>reps</span>
                <input
                  type="number"
                  inputMode="numeric"
                  style={{ ...S.inputSmall, width: 44 }}
                  value={editDraft.rir}
                  onChange={(e) => setEditDraft((d) => ({ ...d, rir: e.target.value }))}
                  aria-label="RIR"
                />
                <span style={{ fontSize: '0.7rem', color: '#888' }}>RIR</span>
                <button onClick={confirmEdit} style={S.btnPrimary} aria-label="Confirmer la modification">
                  OK
                </button>
                <button onClick={cancelEdit} style={S.btnGhost} aria-label="Annuler la modification">
                  Annuler
                </button>
              </div>
            ) : (
              /* ---- Display mode ---- */
              <div style={S.setRow}>
                <span style={{ fontWeight: 700, minWidth: 22, color: set.setType === 'warmup' ? '#f59e0b' : 'var(--text, #e0e0e0)' }}>
                  {i + 1}.
                </span>
                <span>{set.weightKg} kg</span>
                <span style={{ color: 'var(--text-secondary, #888)' }}>x</span>
                <span style={{ fontWeight: 700 }}>{set.reps}</span>
                <span style={{ fontSize: '0.7rem', color: '#888' }}>@{set.rir} RIR</span>
                {set.setType !== 'normal' && <span style={S.chip}>{SET_TYPE_LABELS[set.setType]}</span>}
                {set.tempo && (
                  <span style={{ fontSize: '0.65rem', color: '#888' }}>{formatTempo(set.tempo)}</span>
                )}
                {set.side && set.side !== 'both' && (
                  <span style={{ fontSize: '0.65rem', color: '#888' }}>
                    {set.side === 'left' ? 'G' : 'D'}
                  </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => startEdit(set)}
                    style={S.btnGhost}
                    aria-label={`Modifier la serie ${i + 1}`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteSet(set.id)}
                    style={S.btnDanger}
                    aria-label={`Supprimer la serie ${i + 1}`}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            )}
            {/* Set note display */}
            {set.note && editingSetId !== set.id && (
              <div style={{ fontSize: '0.7rem', color: '#888', paddingLeft: 30, marginBottom: 4 }}>
                {set.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ------- New set input ------- */}
      <div style={{ marginTop: 12 }}>
        <div style={S.label}>Nouvelle serie</div>
        <div style={S.row}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={S.label} htmlFor={`weight-${exerciseId}`}>Poids (kg)</label>
            <input
              id={`weight-${exerciseId}`}
              type="number"
              inputMode="decimal"
              step="0.5"
              style={S.inputSmall}
              value={draft.weight}
              onChange={(e) => updateDraft('weight', e.target.value)}
              placeholder="0"
              aria-label="Poids en kilogrammes"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={S.label} htmlFor={`reps-${exerciseId}`}>Reps</label>
            <input
              id={`reps-${exerciseId}`}
              type="number"
              inputMode="numeric"
              style={S.inputSmall}
              value={draft.reps}
              onChange={(e) => updateDraft('reps', e.target.value)}
              placeholder="0"
              aria-label="Nombre de repetitions"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={S.label} htmlFor={`rir-${exerciseId}`}>RIR</label>
            <input
              id={`rir-${exerciseId}`}
              type="number"
              inputMode="numeric"
              style={{ ...S.inputSmall, width: 48 }}
              value={draft.rir}
              onChange={(e) => updateDraft('rir', e.target.value)}
              aria-label="Repetitions en reserve"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={S.label} htmlFor={`type-${exerciseId}`}>Type</label>
            <select
              id={`type-${exerciseId}`}
              style={S.select}
              value={draft.setType}
              onChange={(e) => updateDraft('setType', e.target.value)}
              aria-label="Type de serie"
            >
              {Object.entries(SET_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Side selector (for unilateral) */}
        <div style={{ ...S.row, marginTop: 4 }}>
          <label style={S.label}>Cote :</label>
          {(['both', 'left', 'right'] as const).map((side) => (
            <button
              key={side}
              onClick={() => updateDraft('side', side)}
              style={{
                ...S.btnGhost,
                fontWeight: draft.side === side ? 700 : 400,
                color: draft.side === side ? 'var(--accent, #FF6B00)' : '#888',
                textDecoration: draft.side === side ? 'none' : 'underline',
              }}
              aria-pressed={draft.side === side}
              aria-label={(side as string) === 'both' ? 'Deux cotes' : side === 'left' ? 'Cote gauche' : 'Cote droit'}
            >
              {(side as string) === 'both' ? 'Deux' : side === 'left' ? 'Gauche' : 'Droit'}
            </button>
          ))}
        </div>

        {/* Toggle buttons for note & tempo */}
        <div style={{ ...S.row, marginTop: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNote((v) => !v)}
            style={S.btnGhost}
            aria-expanded={showNote}
            aria-controls={`note-input-${exerciseId}`}
          >
            {showNote ? '- Note' : '+ Note'}
          </button>
          <button
            onClick={() => setShowTempo((v) => !v)}
            style={S.btnGhost}
            aria-expanded={showTempo}
            aria-controls={`tempo-input-${exerciseId}`}
          >
            {showTempo ? '- Tempo' : '+ Tempo'}
          </button>
          <button
            onClick={() => setShowWarmup((v) => !v)}
            style={S.btnSecondary}
            aria-expanded={showWarmup}
          >
            Echauffement auto
          </button>
          {onLinkSuperset && (
            <button
              onClick={() => onLinkSuperset(exerciseId)}
              style={S.btnSecondary}
              aria-label="Lier en superset avec l'exercice precedent"
            >
              Superset
            </button>
          )}
          <button
            onClick={() => setShowAlternatives((v) => !v)}
            style={S.btnSecondary}
            aria-expanded={showAlternatives}
          >
            Salle occupee ?
          </button>
        </div>

        {/* Note input */}
        {showNote && (
          <textarea
            id={`note-input-${exerciseId}`}
            style={S.note}
            rows={2}
            maxLength={200}
            placeholder="Note pour cette serie..."
            value={draft.note}
            onChange={(e) => updateDraft('note', e.target.value)}
            aria-label="Note pour la serie"
          />
        )}

        {/* Tempo input */}
        {showTempo && (
          <div style={{ marginTop: 4 }}>
            <label style={S.label} htmlFor={`tempo-input-${exerciseId}`}>
              Tempo (ex : 3-1-1-0 = 3s excentrique, 1s pause, 1s concentrique, 0s haut)
            </label>
            <input
              id={`tempo-input-${exerciseId}`}
              type="text"
              inputMode="numeric"
              style={{ ...S.input, maxWidth: 140 }}
              placeholder="3-1-1-0"
              value={draft.tempo}
              onChange={(e) => updateDraft('tempo', e.target.value)}
              aria-label="Tempo de la serie"
            />
          </div>
        )}

        {/* Warm-up builder */}
        {showWarmup && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              border: '1px solid var(--border, #2a2a40)',
            }}
            role="region"
            aria-label="Echauffement automatique"
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>
              Echauffement automatique
            </div>
            {draft.weight && parseFloat(draft.weight) > 0 ? (
              <>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 6 }}>
                  Base : {draft.weight} kg de travail
                </div>
                {warmupSets.map((ws, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', marginBottom: 2 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{ws.weight} kg</span>
                    <span style={{ color: '#888' }}> x {ws.reps} reps</span>
                  </div>
                ))}
                <button
                  onClick={handleAddWarmups}
                  style={{ ...S.btnPrimary, marginTop: 8, width: '100%' }}
                  aria-label="Ajouter les series d'echauffement"
                >
                  Ajouter echauffement ({warmupSets.length} series)
                </button>
              </>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                Entre un poids de travail pour generer l'echauffement.
              </div>
            )}
          </div>
        )}

        {/* Busy gym alternatives */}
        {showAlternatives && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              border: '1px solid var(--border, #2a2a40)',
            }}
            role="region"
            aria-label="Alternatives si equipement occupe"
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8 }}>
              Alternatives ({exercise.primaryMuscles.join(', ')})
            </div>
            {alternatives.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                Aucune alternative trouvee.
              </div>
            ) : (
              alternatives.map((alt) => (
                <div key={alt.id} style={S.altCard}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{alt.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#888' }}>
                      {alt.equipment} - S/F : {alt.stimulusFatigue.toFixed(1)}
                    </div>
                  </div>
                  {onSwapExercise && (
                    <button
                      onClick={() => {
                        onSwapExercise(alt.id)
                        setShowAlternatives(false)
                      }}
                      style={S.btnSecondary}
                      aria-label={`Remplacer par ${alt.name}`}
                    >
                      Utiliser
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Add set button */}
        <button
          onClick={handleAddSet}
          disabled={!draft.weight || !draft.reps}
          style={{
            ...S.btnPrimary,
            marginTop: 10,
            width: '100%',
            opacity: !draft.weight || !draft.reps ? 0.4 : 1,
          }}
          aria-label="Enregistrer la serie"
        >
          Enregistrer la serie
        </button>
      </div>

      {/* ------- Undo floating button ------- */}
      {undoStack.length > 0 && (
        <button
          onClick={handleUndo}
          style={S.undoBtn}
          aria-label="Annuler la derniere action"
        >
          Annuler ({undoStack.length})
        </button>
      )}
    </div>
  )
}

export default PremiumSetLogger
