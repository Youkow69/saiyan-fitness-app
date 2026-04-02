// ── Progression Tracking ────────────────────────────────────────────────────

import type { AppState } from '../types'

import { getDailyNutrition } from './nutrition'
import { estimate1Rm, getWorkoutVolume, getWeeklyWorkouts } from './training'

// ── Named Constants ─────────────────────────────────────────────────────────
const BASE_POWER            = 1200
const POWER_PER_WORKOUT     = 180
const POWER_PER_VOLUME      = 0.22
const POWER_PER_BODYWEIGHT  = 30
const POWER_PROTEIN_BONUS   = 150
const PROTEIN_HIT_THRESHOLD = 0.9

const DELOAD_WORSE_THRESHOLD   = 1.5
const DELOAD_SORENESS_THRESHOLD = 3.5
const DELOAD_MIN_SESSIONS       = 3

/** Counts personal records across workout history. */
export function countPRs(state: AppState): number {
  const bestByExercise = new Map<string, number>()
  let prCount = 0
  const sorted = [...state.workouts].sort((a, b) => a.date.localeCompare(b.date))
  sorted.forEach(w => {
    w.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        const e1rm = estimate1Rm(set.weightKg, set.reps)
        const prev = bestByExercise.get(ex.exerciseId) ?? 0
        if (e1rm > prev && prev > 0) prCount++
        if (e1rm > prev) bestByExercise.set(ex.exerciseId, e1rm)
      })
    })
  })
  return prCount
}

/** Returns the current workout streak (consecutive days, tolerates 1 rest day gap). */
export function getStreak(state: AppState): number {
  if (state.workouts.length === 0) return 0
  const dates = [...new Set(state.workouts.map(w => w.date))].sort().reverse()
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i] + 'T12:00:00')
    const d2 = new Date(dates[i + 1] + 'T12:00:00')
    const diff = (d1.getTime() - d2.getTime()) / 86400000
    if (diff <= 1) streak++
    else break
  }
  return streak
}

/** Calculates gamified power level from workouts, volume, bodyweight entries, and nutrition. */
export function getPowerLevel(state: AppState) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const volume = weeklyWorkouts.reduce(
    (total, workout) => total + getWorkoutVolume(workout),
    0,
  )
  const nutrition = getDailyNutrition(state.foodEntries)
  const proteinHits =
    state.targets && nutrition.protein >= state.targets.protein * PROTEIN_HIT_THRESHOLD ? 1 : 0

  return Math.round(
    BASE_POWER +
      state.workouts.length * POWER_PER_WORKOUT +
      volume * POWER_PER_VOLUME +
      state.bodyweightEntries.length * POWER_PER_BODYWEIGHT +
      proteinHits * POWER_PROTEIN_BONUS,
  )
}

/** RP-style auto-deload detection from session feedback. */
export function shouldDeload(state: AppState): boolean {
  const recentFeedback = (state.sessionFeedback ?? []).slice(-4)
  if (recentFeedback.length < DELOAD_MIN_SESSIONS) return false

  const avgWorseCount = recentFeedback.reduce((sum, fb) => {
    const worse = fb.muscleGroups.filter(m => m.performance === 'worse').length
    return sum + worse
  }, 0) / recentFeedback.length

  const avgSoreness = recentFeedback.reduce((sum, fb) => {
    const total = fb.muscleGroups.reduce((s, m) => s + m.soreness, 0)
    return sum + total / Math.max(1, fb.muscleGroups.length)
  }, 0) / recentFeedback.length

  return avgWorseCount > DELOAD_WORSE_THRESHOLD || avgSoreness > DELOAD_SORENESS_THRESHOLD
}

/** Mesocycle status derived from workout history + feedback. */
export function getMesocycleStatus(state: AppState): { label: string; detail: string; color: string; weekNumber: number } {
  const totalWorkouts = state.workouts.length
  const deload = shouldDeload(state)
  const streak = getStreak(state)

  if (deload) {
    return { label: 'Deload recommandé', detail: 'Performances en baisse — réduis le volume cette semaine', color: 'var(--accent-red)', weekNumber: 0 }
  }

  if (totalWorkouts === 0) {
    return { label: 'Début du cycle', detail: 'Commence ta première séance pour lancer le mesocycle', color: 'var(--muted)', weekNumber: 0 }
  }

  const firstWorkoutDate = new Date(state.workouts[0].date)
  const daysSinceStart = Math.floor((Date.now() - firstWorkoutDate.getTime()) / 86400000)
  const weekNumber = Math.floor(daysSinceStart / 7) + 1

  const recentFeedback = (state.sessionFeedback ?? []).slice(-3)
  const avgSoreness = recentFeedback.length > 0
    ? recentFeedback.reduce((s, fb) => s + fb.muscleGroups.reduce((a, m) => a + m.soreness, 0) / Math.max(1, fb.muscleGroups.length), 0) / recentFeedback.length
    : 2

  if (avgSoreness > 3 || streak < 3) {
    return { label: 'Fatigue montante', detail: 'Surveille ta récupération — un deload approche peut-etre', color: 'var(--accent-gold)', weekNumber }
  }

  return { label: 'Semaine productive', detail: `Semaine ${weekNumber} — continue sur cette lancée`, color: '#4fffb0', weekNumber }
}
