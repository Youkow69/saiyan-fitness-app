import { useMemo } from 'react'

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const
const BAR = 20

const COLORS: Record<number, string> = {
  25: '#e53e3e', 20: '#3182ce', 15: '#ecc94b', 10: '#38a169',
  5: 'var(--text)', 2.5: '#c53030', 1.25: '#888',
}

function calcPlates(totalWeight: number): number[] {
  let perSide = (totalWeight - BAR) / 2
  if (perSide <= 0) return []
  const plates: number[] = []
  for (const p of PLATES) {
    while (perSide >= p - 0.001) {
      plates.push(p)
      perSide -= p
    }
  }
  return plates
}

export function MiniPlateCalc({ weight }: { weight: number }) {
  const plates = useMemo(() => calcPlates(weight), [weight])

  if (weight <= BAR || plates.length === 0) {
    return <div style={{ fontSize: '0.68rem', color: 'var(--muted)', padding: '4px 0' }}>Barre seule ({BAR}kg)</div>
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 3 }}>
        Barre {BAR}kg + par cote :
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {plates.map((p, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: '0.7rem',
              fontWeight: 700,
              background: COLORS[p] || '#666',
              color: p === 15 ? '#000' : '#fff',
              minWidth: 28,
              textAlign: 'center',
            }}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
