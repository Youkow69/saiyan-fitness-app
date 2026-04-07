// ── DailySummaryWidget.tsx ─────────────────────────────────────────────────
// Compact mini-dashboard for quick daily overview.
// Shows: last workout, streak, next scheduled workout, daily macros.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getPowerLevel, todayIso, getDailyNutrition } from '../../lib'

export function DailySummaryWidget() {
  const { state } = useAppState()

  const summary = useMemo(() => {
    const today = todayIso()
    const workouts = state.workouts
    const lastWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null
    const todayWorkout = workouts.find(w => w.date === today)

    // Streak calc
    let streak = 0
    const dates = [...new Set(workouts.map(w => w.date))].sort().reverse()
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date()
      expected.setDate(expected.getDate() - i)
      const exp = expected.toISOString().slice(0, 10)
      if (dates[i] === exp || (i > 0 && dates.includes(exp))) streak++
      else break
    }

    // Today's nutrition
    const todayFood = state.foodEntries.filter(e => e.date === today)
    const nutrition = getDailyNutrition(todayFood)

    const powerLevel = getPowerLevel(state)

    return {
      lastWorkout,
      todayWorkout,
      streak,
      nutrition,
      powerLevel,
      totalWorkouts: workouts.length,
    }
  }, [state])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
      marginBottom: 12,
    }}>
      {/* Power Level */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,140,0,0.05))',
        borderRadius: 12, padding: '10px 12px',
        border: '1px solid rgba(255,215,0,0.15)',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{'⚡'} Power Level</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold, #ffd700)' }}>
          {summary.powerLevel.toLocaleString()}
        </div>
      </div>

      {/* Streak */}
      <div style={{
        background: 'rgba(255,140,0,0.06)', borderRadius: 12, padding: '10px 12px',
        border: '1px solid rgba(255,140,0,0.12)',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{'🔥'} Streak</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>
          {summary.streak} jour{summary.streak !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Today's Calories */}
      <div style={{
        background: 'rgba(34,197,94,0.06)', borderRadius: 12, padding: '10px 12px',
        border: '1px solid rgba(34,197,94,0.12)',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{'🍕'} Calories</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>
          {summary.nutrition.calories}
        </div>
        <div style={{ fontSize: 'max(0.75rem, 0.6rem)', color: 'var(--text-secondary)' }}>
          P: {summary.nutrition.protein}g
        </div>
      </div>

      {/* Last Workout */}
      <div style={{
        background: 'rgba(59,130,246,0.06)', borderRadius: 12, padding: '10px 12px',
        border: '1px solid rgba(59,130,246,0.12)',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{'🏋'} Dernier</div>
        {summary.lastWorkout ? (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {summary.lastWorkout.sessionName || 'Séance'}
            </div>
            <div style={{ fontSize: 'max(0.75rem, 0.6rem)', color: 'var(--text-secondary)' }}>
              {summary.lastWorkout.date}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Aucune</div>
        )}
      </div>
    </div>
  )
}
