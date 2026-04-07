import { useState } from 'react'

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const
const BAR_WEIGHTS = [
  { name: 'Barre olympique', weight: 20 },
  { name: 'Barre EZ', weight: 10 },
  { name: 'Barre courte', weight: 5 },
]

const PLATE_COLORS: Record<number, string> = {
  25: '#e53e3e',
  20: '#3182ce',
  15: '#ecc94b',
  10: '#38a169',
  5: 'var(--text)',
  2.5: '#c53030',
  1.25: 'var(--text-secondary)',
}

const PLATE_HEIGHTS: Record<number, number> = {
  25: 120,
  20: 110,
  15: 100,
  10: 90,
  5: 70,
  2.5: 55,
  1.25: 45,
}

const PLATE_WIDTHS: Record<number, number> = {
  25: 18,
  20: 16,
  15: 14,
  10: 12,
  5: 10,
  2.5: 8,
  1.25: 6,
}

function calculatePlates(perSide: number): number[] {
  const plates: number[] = []
  let remaining = perSide
  if (remaining > 0) {
    for (const plate of PLATES) {
      while (remaining >= plate - 0.001) {
        plates.push(plate)
        remaining -= plate
      }
    }
  }
  return plates
}

function BarbellVisual({ plates, barName }: { plates: number[]; barName: string }) {
  const totalPlateWidth = plates.reduce((sum, p) => sum + PLATE_WIDTHS[p], 0)
  const barWidth = 300
  const svgWidth = barWidth + totalPlateWidth * 2 + 60
  const svgHeight = 160
  const centerY = svgHeight / 2

  return (
    <div style={{ overflowX: 'auto', padding: '16px 0' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* Bar */}
        <rect
          x={20}
          y={centerY - 4}
          width={svgWidth - 40}
          height={8}
          rx={2}
          fill="#a0aec0"
        />
        {/* Left collar */}
        <rect
          x={20 + totalPlateWidth + 10}
          y={centerY - 8}
          width={10}
          height={16}
          rx={2}
          fill="#718096"
        />
        {/* Right collar */}
        <rect
          x={svgWidth - 20 - totalPlateWidth - 20}
          y={centerY - 8}
          width={10}
          height={16}
          rx={2}
          fill="#718096"
        />
        {/* Left plates */}
        {plates.map((plate, i) => {
          const xOffset = 20 + plates.slice(0, i).reduce((s, p) => s + PLATE_WIDTHS[p], 0)
          const h = PLATE_HEIGHTS[plate]
          const w = PLATE_WIDTHS[plate]
          return (
            <g key={`left-${i}`}>
              <rect
                x={xOffset}
                y={centerY - h / 2}
                width={w}
                height={h}
                rx={3}
                fill={PLATE_COLORS[plate]}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              <text
                x={xOffset + w / 2}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={plate === 5 ? 'var(--text)' : 'var(--text)'}
                fontSize={w > 10 ? 9 : 7}
                fontWeight="bold"
                transform={`rotate(-90, ${xOffset + w / 2}, ${centerY})`}
              >
                {plate}
              </text>
            </g>
          )
        })}
        {/* Right plates (mirrored) */}
        {[...plates].reverse().map((plate, i) => {
          const reversedSlice = [...plates].reverse().slice(0, i)
          const xOffset =
            svgWidth - 20 - reversedSlice.reduce((s, p) => s + PLATE_WIDTHS[p], 0) - PLATE_WIDTHS[plate]
          const h = PLATE_HEIGHTS[plate]
          const w = PLATE_WIDTHS[plate]
          return (
            <g key={`right-${i}`}>
              <rect
                x={xOffset}
                y={centerY - h / 2}
                width={w}
                height={h}
                rx={3}
                fill={PLATE_COLORS[plate]}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              <text
                x={xOffset + w / 2}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={plate === 5 ? 'var(--text)' : 'var(--text)'}
                fontSize={w > 10 ? 9 : 7}
                fontWeight="bold"
                transform={`rotate(-90, ${xOffset + w / 2}, ${centerY})`}
              >
                {plate}
              </text>
            </g>
          )
        })}
        {/* Bar name label */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 8}
          textAnchor="middle"
          fill="#a0aec0"
          fontSize={11}
        >
          {barName}
        </text>
      </svg>
    </div>
  )
}

export function PlateCalculator() {
  const [targetWeight, setTargetWeight] = useState('')
  const [barIndex, setBarIndex] = useState(0)

  const bar = BAR_WEIGHTS[barIndex]
  const target = Number(targetWeight)
  const isValid = !isNaN(target) && target >= bar.weight
  const perSide = isValid ? (target - bar.weight) / 2 : 0
  const plates = isValid ? calculatePlates(perSide) : []
  const achievable = isValid ? bar.weight + plates.reduce((s, p) => s + p, 0) * 2 : bar.weight
  const hasRemainder = isValid && Math.abs(achievable - target) > 0.01

  const plateCounts: Record<number, number> = {}
  plates.forEach((p) => {
    plateCounts[p] = (plateCounts[p] || 0) + 1
  })

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 600,
        margin: '0 auto',
        color: 'var(--text)',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          margin: '0 0 20px',
          fontSize: 22,
          background: 'linear-gradient(135deg, var(--accent-orange), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Calculateur de Disques
      </h2>

      {/* Bar selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {BAR_WEIGHTS.map((b, i) => (
          <button
            key={b.name}
            onClick={() => setBarIndex(i)}
            style={{
              flex: 1,
              minWidth: 100,
              padding: '10px 8px',
              borderRadius: 10,
              border: barIndex === i ? '2px solid #ed8936' : '2px solid #2d3748',
              background: barIndex === i ? 'rgba(237,137,54,0.15)' : 'var(--border)',
              color: barIndex === i ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: barIndex === i ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {b.name}
            <br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>{b.weight} kg</span>
          </button>
        ))}
      </div>

      {/* Weight input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
          Poids cible (kg)
        </label>
        <input
          type="number"
          step="0.5"
          min={bar.weight}
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          placeholder={`Min. ${bar.weight} kg (poids de la barre)`}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: '2px solid #2d3748',
            background: 'var(--border)',
            color: 'var(--text)',
            fontSize: 18,
            fontWeight: 700,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Quick weight buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {[40, 50, 60, 70, 80, 90, 100, 110, 120, 140, 160, 180].map((w) => (
          <button
            key={w}
            onClick={() => setTargetWeight(String(w))}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: Number(targetWeight) === w ? 'var(--accent)' : 'var(--border)',
              color: Number(targetWeight) === w ? 'var(--text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {w}
          </button>
        ))}
      </div>

      {isValid && target > bar.weight && (
        <>
          {/* Barbell visual */}
          <BarbellVisual plates={plates} barName={bar.name} />

          {/* Plate breakdown */}
          <div
            style={{
              background: 'var(--border)',
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--accent)' }}>
              Disques par cote
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PLATES.filter((p) => plateCounts[p]).map((plate) => (
                <div
                  key={plate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    borderLeft: `4px solid ${PLATE_COLORS[plate]}`,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 18, color: PLATE_COLORS[plate] }}>
                    {plateCounts[plate]}x
                  </span>
                  <span style={{ fontSize: 14 }}>{plate} kg</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(237,137,54,0.1)',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Barre: <strong style={{ color: 'var(--text)' }}>{bar.weight} kg</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Par cote: <strong style={{ color: 'var(--text)' }}>{perSide} kg</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Total:{' '}
                <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{achievable} kg</strong>
              </span>
            </div>

            {/* Breakdown text */}
            {plates.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(49,130,206,0.08)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: 'var(--text)',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Chaque côté : {plates.join(' + ')} kg
              </div>
            )}

            {hasRemainder && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  background: 'rgba(229,62,62,0.15)',
                  borderRadius: 8,
                  color: 'var(--danger)',
                  fontSize: 12,
                }}
              >
                Poids exact impossible avec les disques disponibles. Le plus proche :{' '}
                {achievable} kg
              </div>
            )}
          </div>
        </>
      )}

      {isValid && target === bar.weight && (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          Barre vide uniquement - aucun disque necessaire.
        </div>
      )}

      {targetWeight !== '' && !isValid && (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            color: 'var(--danger)',
            fontSize: 14,
          }}
        >
          Le poids cible doit etre superieur ou egal au poids de la barre ({bar.weight} kg).
        </div>
      )}
    </div>
  )
}
