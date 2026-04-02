import React, { useState, useMemo } from 'react'
import type { WorkoutLog } from '../../types'
import { getExerciseById, getWorkoutVolume, formatNumber } from '../../lib'

interface WorkoutHistoryProps {
  workouts: WorkoutLog[]
}

export function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [workouts],
  )

  if (sorted.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
        Aucune séance enregistrée
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((w) => {
        const volume = getWorkoutVolume(w)
        const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0)
        const isExpanded = expandedId === w.id

        return (
          <div key={w.id} style={{
            background: 'var(--bg-card)', borderRadius: 12,
            border: '1px solid var(--stroke)', overflow: 'hidden',
          }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : w.id)}
              type="button"
              style={{
                width: '100%', padding: '10px 14px', background: 'transparent',
                border: 'none', color: 'var(--text)', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  {w.date}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  {w.exercises.length} exercice{w.exercises.length > 1 ? 's' : ''} · {totalSets} séries · {formatNumber(volume)} kg
                </div>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>

            {isExpanded && (
              <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--stroke)' }}>
                {w.exercises.map((ex, i) => {
                  const exercise = getExerciseById(ex.exerciseId)
                  return (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < w.exercises.length - 1 ? '1px solid var(--stroke)' : 'none' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>
                        {exercise?.name || ex.exerciseId}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {ex.sets.map((set, j) => (
                          <div key={j} style={{
                            display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--muted)',
                          }}>
                            <span style={{ color: 'var(--text-secondary)', minWidth: 30 }}>#{j + 1}</span>
                            <span>{set.weightKg} kg</span>
                            <span>x {set.reps}</span>
                            {set.rir !== undefined && <span style={{ color: 'var(--accent-orange)' }}>RIR {set.rir}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
