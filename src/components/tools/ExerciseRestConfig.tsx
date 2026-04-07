// ── ExerciseRestConfig.tsx ─────────────────────────────────────────────────
// Inline rest timer config per exercise. Shows current rest, allows quick change.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

interface Props {
  currentRest: number
  onChangeRest: (seconds: number) => void
}

const PRESETS = [30, 45, 60, 90, 120, 150, 180, 240]

export function ExerciseRestConfig({ currentRest, onChangeRest }: Props) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary, #888)', fontSize: '0.7rem',
          padding: '2px 6px', borderRadius: 4,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}
        title="Modifier le repos"
      >
        {'⏱'} {currentRest}s
      </button>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
      padding: '8px 10px', marginTop: 4, marginBottom: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Repos entre séries</span>
        <button type="button" onClick={() => setEditing(false)} style={{
          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.8rem',
        }}>{'✕'}</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {PRESETS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => { onChangeRest(s); setEditing(false) }}
            style={{
              padding: '6px 10px', borderRadius: 6,
              border: currentRest === s ? '2px solid var(--accent)' : '1px solid var(--border, #333)',
              background: currentRest === s ? 'rgba(255,140,0,0.15)' : 'transparent',
              color: currentRest === s ? 'var(--accent)' : 'var(--text, #fff)',
              fontSize: '0.78rem', fontWeight: currentRest === s ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`}
          </button>
        ))}
      </div>
    </div>
  )
}
