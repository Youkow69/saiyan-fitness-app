// src/components/workout/WarmupGenerator.tsx
// Generates 3 progressive warm-up sets based on working weight

interface Props {
  workingWeight: number
  exerciseId: string
  onAddWarmups: (sets: { weight: number; reps: number }[]) => void
}

export function WarmupGenerator({ workingWeight, exerciseId: _exerciseId, onAddWarmups }: Props) {
  if (workingWeight <= 0) return null

  const generateWarmups = () => {
    const barWeight = 20
    const warmups = [
      { weight: barWeight, reps: 10 },
      { weight: Math.round(workingWeight * 0.5 / 2.5) * 2.5, reps: 5 },
      { weight: Math.round(workingWeight * 0.75 / 2.5) * 2.5, reps: 3 },
    ]
    // Filter out duplicates and invalid
    const unique = warmups.filter((w, i) =>
      w.weight >= barWeight && (i === 0 || w.weight !== warmups[i-1].weight)
    )
    onAddWarmups(unique)
  }

  return (
    <button
      type="button"
      onClick={generateWarmups}
      style={{
        padding: '6px 12px', borderRadius: 8,
        border: '1px dashed rgba(255,140,0,0.4)',
        background: 'rgba(255,140,0,0.06)',
        color: '#FF8C00', fontSize: '0.72rem', fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {'\U0001f525'} \u00c9chauffement auto ({Math.round(workingWeight)}kg)
    </button>
  )
}
