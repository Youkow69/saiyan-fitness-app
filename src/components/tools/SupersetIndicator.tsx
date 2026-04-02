// ── SupersetIndicator.tsx ──────────────────────────────────────────────────
// Visual indicator linking exercises in a superset group.
// Shows a colored sidebar connecting grouped exercises.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { LoggedExercise } from '../../types'
import { getExerciseById } from '../../lib'

const SUPERSET_COLORS = [
  '#9b59b6', // Purple
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
]

interface Props {
  exercises: LoggedExercise[]
  onGroupExercises: (groups: string[][]) => void
}

export function SupersetManager({ exercises, onGroupExercises }: Props) {
  const [groupMode, setGroupMode] = useState(false)
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([])
  const [groups, setGroups] = useState<string[][]>([])

  const toggleExercise = (id: string) => {
    setSelectedForGroup(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const createGroup = () => {
    if (selectedForGroup.length >= 2) {
      const newGroups = [...groups, selectedForGroup]
      setGroups(newGroups)
      onGroupExercises(newGroups)
      setSelectedForGroup([])
    }
  }

  const removeGroup = (idx: number) => {
    const newGroups = groups.filter((_, i) => i !== idx)
    setGroups(newGroups)
    onGroupExercises(newGroups)
  }

  const getGroupForExercise = (exerciseId: string): { color: string; position: 'first' | 'middle' | 'last' | 'only' } | null => {
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i]
      const idx = g.indexOf(exerciseId)
      if (idx >= 0) {
        const color = SUPERSET_COLORS[i % SUPERSET_COLORS.length]
        const position = g.length === 1 ? 'only'
          : idx === 0 ? 'first'
          : idx === g.length - 1 ? 'last'
          : 'middle'
        return { color, position }
      }
    }
    return null
  }

  if (!groupMode) {
    return (
      <div style={{ marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setGroupMode(true)}
          style={{
            width: '100%', padding: '8px', borderRadius: 8,
            border: '1px dashed var(--accent-purple, #9b59b6)',
            background: groups.length > 0 ? 'rgba(155,89,182,0.08)' : 'transparent',
            color: 'var(--accent-purple, #9b59b6)',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\u26A1'} {groups.length > 0 ? `${groups.length} superset(s) actif(s)` : 'Cr\u00e9er un superset'}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(155,89,182,0.06)', borderRadius: 12,
      border: '1px solid rgba(155,89,182,0.2)', padding: 12, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#9b59b6' }}>
          {'\u26A1'} Mode superset
        </span>
        <button type="button" onClick={() => setGroupMode(false)} style={{
          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.85rem',
        }}>{'\u2715'}</button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
        S\u00e9lectionne 2-3 exercices puis appuie sur "Grouper"
      </p>

      {/* Exercise selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {exercises.map(ex => {
          const info = getExerciseById(ex.exerciseId)
          const isSelected = selectedForGroup.includes(ex.exerciseId)
          const groupInfo = getGroupForExercise(ex.exerciseId)
          return (
            <button
              key={ex.exerciseId}
              type="button"
              onClick={() => toggleExercise(ex.exerciseId)}
              disabled={!!groupInfo}
              style={{
                padding: '6px 10px', borderRadius: 8, textAlign: 'left',
                border: isSelected ? '2px solid #9b59b6' : groupInfo ? `2px solid ${groupInfo.color}` : '1px solid var(--border, #333)',
                background: isSelected ? 'rgba(155,89,182,0.12)' : groupInfo ? `${groupInfo.color}11` : 'transparent',
                color: groupInfo ? groupInfo.color : 'var(--text)',
                fontSize: '0.8rem', cursor: groupInfo ? 'default' : 'pointer',
                opacity: groupInfo ? 0.7 : 1,
              }}
            >
              {isSelected ? '\u2611' : groupInfo ? '\u26A1' : '\u2610'} {info?.name || ex.exerciseId}
            </button>
          )
        })}
      </div>

      {/* Create group button */}
      {selectedForGroup.length >= 2 && (
        <button type="button" onClick={createGroup} style={{
          width: '100%', padding: 8, borderRadius: 8, border: 'none',
          background: '#9b59b6', color: '#fff', fontWeight: 700,
          fontSize: '0.82rem', cursor: 'pointer', marginBottom: 8,
        }}>
          Grouper en superset ({selectedForGroup.length} exercices)
        </button>
      )}

      {/* Existing groups */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {groups.map((g, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px', borderRadius: 6,
              borderLeft: `4px solid ${SUPERSET_COLORS[i % SUPERSET_COLORS.length]}`,
              background: `${SUPERSET_COLORS[i % SUPERSET_COLORS.length]}11`,
            }}>
              <span style={{ flex: 1, fontSize: '0.72rem' }}>
                {g.map(id => getExerciseById(id)?.name || id).join(' + ')}
              </span>
              <button type="button" onClick={() => removeGroup(i)} style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.8rem',
              }}>{'\u2715'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Wrapper to visually indicate superset membership on each exercise card
// Enhanced: gold->orange gradient, SUPERSET/GIANT SET label, move up/down
export function SupersetBar({ exerciseId, groups, onMoveExercise }: {
  exerciseId: string
  groups: string[][]
  onMoveExercise?: (groupIdx: number, fromIdx: number, direction: 'up' | 'down') => void
}) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    const idx = g.indexOf(exerciseId)
    if (idx >= 0) {
      const isFirst = idx === 0
      const isLast = idx === g.length - 1
      const label = g.length >= 3 ? 'GIANT SET' : 'SUPERSET'
      return (
        <div style={{
          position: 'absolute', left: -2, top: isFirst ? 20 : 0,
          bottom: isLast ? 20 : 0, width: 4,
          background: 'linear-gradient(180deg, #ffd700, #ff8c00)',
          borderRadius: isFirst ? '4px 4px 0 0' : isLast ? '0 0 4px 4px' : 0,
        }}>
          {isFirst && (
            <span style={{
              position: 'absolute', top: -14, left: 8,
              fontSize: '0.55rem', fontWeight: 700,
              background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          )}
          {/* Move up/down buttons */}
          {onMoveExercise && (
            <div style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {!isFirst && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveExercise(i, idx, 'up') }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, border: 'none',
                    background: 'rgba(255,215,0,0.15)', color: '#ffd700',
                    fontSize: '0.65rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                  aria-label="Monter"
                >{'\u2191'}</button>
              )}
              {!isLast && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveExercise(i, idx, 'down') }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, border: 'none',
                    background: 'rgba(255,140,0,0.15)', color: '#ff8c00',
                    fontSize: '0.65rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                  aria-label="Descendre"
                >{'\u2193'}</button>
              )}
            </div>
          )}
        </div>
      )
    }
  }
  return null
}
