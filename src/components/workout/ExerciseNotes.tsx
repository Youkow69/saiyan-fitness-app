// src/components/workout/ExerciseNotes.tsx
// Inline notes for exercises during workout

import { useState } from 'react'

interface Props {
  exerciseId: string
  initialNote?: string
  onSave: (exerciseId: string, note: string) => void
}

export function ExerciseNotes({ exerciseId, initialNote = '', onSave }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState(initialNote)

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{
          background: note ? 'rgba(255,215,0,0.08)' : 'transparent',
          border: note ? '1px solid rgba(255,215,0,0.3)' : '1px dashed var(--border, #333)',
          borderRadius: 8, padding: '4px 10px',
          color: note ? '#FFD700' : 'var(--text-secondary)',
          fontSize: '0.72rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {'\U0001f4dd'} {note ? note.slice(0, 30) + (note.length > 30 ? '...' : '') : 'Notes'}
      </button>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
      border: '1px solid var(--border, #333)', padding: 8,
    }}>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Ex: Douleur \u00e9paule gauche, prise large..."
        rows={2}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: 'var(--text, #f0f0f5)', fontSize: '0.78rem',
          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={() => { onSave(exerciseId, note); setExpanded(false) }}
          style={{
            flex: 1, padding: 4, borderRadius: 6, border: 'none',
            background: '#FFD700', color: '#000', fontWeight: 700,
            fontSize: '0.72rem', cursor: 'pointer',
          }}>Sauver</button>
        <button type="button" onClick={() => setExpanded(false)}
          style={{
            padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: '0.72rem', cursor: 'pointer',
          }}>{'\u2715'}</button>
      </div>
    </div>
  )
}
