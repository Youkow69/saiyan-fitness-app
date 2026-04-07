// ── RPESlider.tsx ─────────────────────────────────────────────────────────────
// Visual RPE slider (6-10) with color gradient from green to red.
// RPE = 10 - RIR, so RIR 0 = RPE 10, RIR 4 = RPE 6
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

interface Props {
  rir: number
  onChange: (rir: number) => void
  compact?: boolean
}

const RPE_COLORS: Record<number, string> = {
  6: '#22c55e',
  7: '#84cc16',
  8: '#eab308',
  9: '#f97316',
  10: '#ef4444',
}

const RPE_LABELS: Record<number, string> = {
  6: 'Facile',
  7: 'Modéré',
  8: 'Dur',
  9: 'Très dur',
  10: 'Max',
}

export function RPESlider({ rir, onChange, compact }: Props) {
  const [dragging, setDragging] = useState(false)
  const rpe = 10 - rir
  const clampedRpe = Math.max(6, Math.min(10, rpe))

  const handleSelect = (selectedRpe: number) => {
    onChange(10 - selectedRpe)
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {[6, 7, 8, 9, 10].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => handleSelect(val)}
            style={{
              width: 28, height: 24, borderRadius: 4,
              border: clampedRpe === val ? `2px solid ${RPE_COLORS[val]}` : '1px solid var(--border, #333)',
              background: clampedRpe === val ? `${RPE_COLORS[val]}22` : 'transparent',
              color: clampedRpe === val ? RPE_COLORS[val] : 'var(--text-secondary, #888)',
              fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
              padding: 0,
            }}
          >
            {val}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #888)', fontWeight: 600 }}>RPE</span>
        <span style={{
          fontSize: '0.85rem', fontWeight: 800,
          color: RPE_COLORS[clampedRpe] || '#888',
        }}>
          {clampedRpe}
        </span>
        <span style={{ fontSize: '0.65rem', color: RPE_COLORS[clampedRpe] || '#888' }}>
          {RPE_LABELS[clampedRpe] || ''}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', marginLeft: 'auto' }}>
          (RIR {rir})
        </span>
      </div>
      <div style={{
        display: 'flex', gap: 4, width: '100%',
      }}>
        {[6, 7, 8, 9, 10].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => handleSelect(val)}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onPointerEnter={() => { if (dragging) handleSelect(val) }}
            style={{
              flex: 1, height: 32, borderRadius: 6,
              border: clampedRpe === val ? `2px solid ${RPE_COLORS[val]}` : '1px solid var(--border, #333)',
              background: clampedRpe >= val
                ? `${RPE_COLORS[val]}${clampedRpe === val ? '44' : '18'}`
                : 'transparent',
              color: clampedRpe >= val ? RPE_COLORS[val] : 'var(--text-secondary, #888)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.1s ease',
              transform: clampedRpe === val ? 'scale(1.05)' : 'scale(1)',
              padding: 0,
            }}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  )
}
