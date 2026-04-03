import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById, estimate1Rm } from '../../lib'
import type { WorkoutLog, ProgramExercise } from '../../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Suggestion {
  exerciseId: string
  exerciseName: string
  lastWeight: number
  lastReps: number
  lastRir: number
  suggestedWeight: number
  reason: string
  trend: 'up' | 'same' | 'down'
}

interface HistoryEntry {
  weight: number
  reps: number
  rir: number
  date: string
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Round to the nearest plate-friendly increment (0.5 kg steps).
 */
function roundToPlate(kg: number): number {
  return Math.round(kg * 2) / 2
}

/**
 * Analyse the last 3 occurrences of each exercise and produce a weight
 * suggestion for the next session.
 *
 * Rules:
 *  - Hit all target reps AND RIR >= 2  -->  +2.5 kg
 *  - Hit target reps AND RIR 0-1       -->  keep same weight
 *  - Reps below minimum target          -->  deload -5 %
 */
function getSuggestions(
  workouts: WorkoutLog[],
  sessionExercises: ProgramExercise[],
): Suggestion[] {
  return sessionExercises.map((pe) => {
    const ex = getExerciseById(pe.exerciseId)
    const name = ex?.name ?? pe.exerciseId.replace(/_/g, ' ')

    // Collect the last 3 workouts that include this exercise
    const history: HistoryEntry[] = []
    for (let i = workouts.length - 1; i >= 0 && history.length < 3; i--) {
      const wEx = workouts[i].exercises.find(
        (e) => e.exerciseId === pe.exerciseId,
      )
      if (wEx && wEx.sets.length > 0) {
        const bestSet = wEx.sets.reduce((best, s) =>
          estimate1Rm(s.weightKg, s.reps) > estimate1Rm(best.weightKg, best.reps)
            ? s
            : best,
        )
        history.push({
          weight: bestSet.weightKg,
          reps: bestSet.reps,
          rir: bestSet.rir,
          date: workouts[i].date,
        })
      }
    }

    // First time ever -- no data
    if (history.length === 0) {
      return {
        exerciseId: pe.exerciseId,
        exerciseName: name,
        lastWeight: 0,
        lastReps: 0,
        lastRir: 0,
        suggestedWeight: 0,
        reason: 'Premiere seance -- commence leger',
        trend: 'same' as const,
      }
    }

    const last = history[0]
    let suggestedWeight = last.weight
    let reason = ''
    let trend: 'up' | 'same' | 'down' = 'same'

    if (last.reps >= pe.repMax && last.rir >= 2) {
      // Strong performance -- increase
      suggestedWeight = roundToPlate(last.weight + 2.5)
      reason = `${last.reps} reps @ RIR ${last.rir} -- augmente`
      trend = 'up'
    } else if (last.reps >= pe.repMin && last.rir <= 1) {
      // Grinding but hit reps -- hold
      reason = `${last.reps} reps @ RIR ${last.rir} -- maintiens`
      trend = 'same'
    } else if (last.reps < pe.repMin) {
      // Missed reps -- deload 5 %
      suggestedWeight = roundToPlate(last.weight * 0.95)
      reason = `${last.reps} reps sous la cible -- reduis`
      trend = 'down'
    } else {
      reason = `${last.reps} reps @ RIR ${last.rir} \u2014 progresse bien, essaie +1 rep avant d'augmenter le poids`
    }

    return {
      exerciseId: pe.exerciseId,
      exerciseName: name,
      lastWeight: last.weight,
      lastReps: last.reps,
      lastRir: last.rir,
      suggestedWeight,
      reason,
      trend,
    }
  })
}

// ---------------------------------------------------------------------------
// Styles (inline, using CSS custom-properties)
// ---------------------------------------------------------------------------

const styles = {
  container: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    padding: 16,
    marginBottom: 12,
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.1rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent)',
    margin: '0 0 12px',
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  icon: {
    fontSize: '1.2rem',
    width: 28,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  info: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  name: {
    fontSize: '0.85rem',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  reason: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  weight: {
    textAlign: 'right' as const,
    flexShrink: 0,
  } as React.CSSProperties,
  empty: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
}

function trendIcon(trend: Suggestion['trend']): string {
  if (trend === 'up') return '\u2B06\uFE0F'
  if (trend === 'down') return '\u2B07\uFE0F'
  return '\u27A1\uFE0F'
}

function weightColor(trend: Suggestion['trend']): string {
  if (trend === 'up') return 'var(--success, #22c55e)'
  if (trend === 'down') return 'var(--danger, #ef4444)'
  return 'var(--text)'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgressiveOverload({
  sessionExercises,
}: {
  sessionExercises: ProgramExercise[]
}) {
  const { state } = useAppState()

  const suggestions = useMemo(
    () => getSuggestions(state.workouts, sessionExercises),
    [state.workouts, sessionExercises],
  )

  if (suggestions.length === 0) return null

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Progression suggeree</h3>

      <div style={styles.list}>
        {suggestions.map((s) => (
          <div
            key={s.exerciseId}
            style={styles.row}
            role="listitem"
            aria-label={`${s.exerciseName}: ${s.suggestedWeight} kg`}
          >
            {/* Trend arrow */}
            <div style={styles.icon} aria-hidden="true">
              {trendIcon(s.trend)}
            </div>

            {/* Exercise name + reason */}
            <div style={styles.info}>
              <div style={styles.name}>{s.exerciseName}</div>
              <div style={styles.reason}>{s.reason}</div>
            </div>

            {/* Suggested weight */}
            <div style={styles.weight}>
              {s.suggestedWeight > 0 ? (
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: weightColor(s.trend),
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.suggestedWeight} kg
                </div>
              ) : (
                <div style={styles.empty}>—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
