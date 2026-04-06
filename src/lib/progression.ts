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
        if (prev > 0 && e1rm > prev) prCount++
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

/** BUG-F9: Thin wrapper - unified deload detection via evaluateFatigueStatus. */
export function shouldDeload(state: AppState): boolean {
  const feedbacks = (state.sessionFeedback ?? []).map(fb => ({
    soreness: fb.muscleGroups.reduce((s, m) => s + m.soreness, 0) / Math.max(1, fb.muscleGroups.length),
    performance: fb.muscleGroups.filter(m => m.performance === 'worse').length >= 2 ? 2 : 3,
    pump: fb.muscleGroups.reduce((s, m) => s + m.pump, 0) / Math.max(1, fb.muscleGroups.length),
  }))
  return evaluateFatigueStatus({ workouts: state.workouts, feedbacks }).shouldDeload
}

/** BUG-F9: Thin wrapper - unified deload advice via evaluateFatigueStatus. */
export function getDeloadAdvice(state: AppState): { needed: boolean; reason: string; suggestion: string } | null {
  const feedbacks = (state.sessionFeedback ?? []).map(fb => ({
    soreness: fb.muscleGroups.reduce((s, m) => s + m.soreness, 0) / Math.max(1, fb.muscleGroups.length),
    performance: fb.muscleGroups.filter(m => m.performance === 'worse').length >= 2 ? 2 : 3,
    pump: fb.muscleGroups.reduce((s, m) => s + m.pump, 0) / Math.max(1, fb.muscleGroups.length),
  }))
  const fatigue = evaluateFatigueStatus({ workouts: state.workouts, feedbacks })
  if (!fatigue.shouldDeload) return null
  const suggestion = fatigue.severity === 'high'
    ? 'Reduis le volume de 40% cette semaine. Senzu Bean obligatoire !'
    : 'Reduis le volume de 20-30% cette semaine. Un deload strategique accelerera ta progression.'
  return { needed: true, reason: fatigue.reason || 'Signaux de fatigue detectes', suggestion }
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


// BUG-F6: Unified fatigue evaluation (replaces inconsistent shouldDeload/getDeloadAdvice)
export function evaluateFatigueStatus(state: { workouts: any[]; feedbacks?: any[] }): {
  shouldDeload: boolean
  reason: string
  severity: 'low' | 'medium' | 'high'
} {
  const feedbacks = (state as any).sessionFeedback || []
  const recentFb = feedbacks.slice(-5)
  const recentWorkouts = state.workouts.slice(-5)

  if (recentFb.length < 3 && recentWorkouts.length < 3) {
    return { shouldDeload: false, reason: '', severity: 'low' }
  }

  const reasons: string[] = []
  let severityScore = 0

  if (recentFb.length >= 3) {
    const avgSoreness = recentFb.reduce((s: number, f: any) => s + (f.soreness || 0), 0) / recentFb.length
    const avgPerf = recentFb.reduce((s: number, f: any) => s + (f.performance || 3), 0) / recentFb.length
    const avgPump = recentFb.reduce((s: number, f: any) => s + (f.pump || 3), 0) / recentFb.length

    if (avgSoreness >= 3.5) {
      reasons.push('Courbatures persistantes (moyenne ' + avgSoreness.toFixed(1) + '/5)')
      severityScore += 2
    }
    if (avgPerf <= 2) {
      reasons.push('Performance en baisse')
      severityScore += 2
    }
    if (avgPump < 2 && avgSoreness > 3) {
      reasons.push('Mauvais pump + forte fatigue')
      severityScore += 1
    }
  }

  if (recentWorkouts.length >= 3) {
    let totalRir = 0
    let rirCount = 0
    recentWorkouts.forEach((w: any) => {
      w.exercises.forEach((ex: any) => {
        ex.sets.forEach((s: any) => {
          if (s.setType !== 'warmup' && typeof s.rir === 'number') {
            totalRir += s.rir
            rirCount++
          }
        })
      })
    })
    if (rirCount > 0) {
      const avgRir = totalRir / rirCount
      if (avgRir <= 0.5) {
        reasons.push('RIR moyen trop bas (' + avgRir.toFixed(1) + ') - tu forces trop')
        severityScore += 2
      }
    }

    const exerciseMaxes: Record<string, number[]> = {}
    recentWorkouts.forEach((w: any) => {
      w.exercises.forEach((ex: any) => {
        if (!exerciseMaxes[ex.exerciseId]) exerciseMaxes[ex.exerciseId] = []
        let maxE1rm = 0
        ex.sets.forEach((s: any) => {
          if (s.setType !== 'warmup') {
            const e1rm = s.weightKg * (1 + s.reps / 30)
            if (e1rm > maxE1rm) maxE1rm = e1rm
          }
        })
        if (maxE1rm > 0) exerciseMaxes[ex.exerciseId].push(maxE1rm)
      })
    })
    let anyImproved = false
    for (const vals of Object.values(exerciseMaxes)) {
      if (vals.length >= 3 && vals[vals.length - 1] > vals[0]) anyImproved = true
    }
    if (!anyImproved && Object.keys(exerciseMaxes).length > 0) {
      reasons.push('Aucune progression depuis 5 sessions')
      severityScore += 1
    }
  }

  const severity: 'low' | 'medium' | 'high' = severityScore >= 4 ? 'high' : severityScore >= 2 ? 'medium' : 'low'
  return {
    shouldDeload: severityScore >= 2,
    reason: reasons.length > 0 ? reasons.join('. ') + '.' : '',
    severity,
  }
}


// ── FEAT-F6: Periodisation mesocycle ────────────────────────────────────────

// ── FEAT-F6: Periodisation mesocycle ────────────────────────────────────────

/** Retourne la semaine actuelle du mesocycle (1-4). Cycle de 4 semaines. */
export function getMesocycleWeek(state: AppState): number {
  if (state.workouts.length === 0) return 1
  const firstDate = new Date(state.workouts[0].date)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - firstDate.getTime()) / 86400000)
  const weekNumber = (Math.floor(daysSince / 7) % 4) + 1
  return weekNumber
}

/** Multiplicateur de volume selon la semaine du mesocycle.
 *  Semaines 1-3 : montee progressive (1.0 -> 1.15 -> 1.3)
 *  Semaine 4 : deload (0.6)
 */
export function getVolumeMultiplier(week: number): number {
  switch (week) {
    case 1: return 1.0
    case 2: return 1.15
    case 3: return 1.3
    case 4: return 0.6
    default: return 1.0
  }
}

interface SessionFeedbackInput {
  pump: number    // 1-5
  soreness: number // 1-5
}

/** Ajuste le nombre de series selon le feedback de la seance.
 *  - pump >= 4 et soreness <= 2 : +1 serie (bonne recuperation, bon stimulus)
 *  - soreness >= 4 : -1 serie (trop de fatigue)
 *  - sinon : pas de changement
 */
export function adjustVolumeFromFeedback(feedback: SessionFeedbackInput, currentSets: number): number {
  const minSets = 2
  const maxSets = 8

  if (feedback.pump >= 4 && feedback.soreness <= 2) {
    // Bon pump, peu de courbatures -> on peut augmenter
    return Math.min(maxSets, currentSets + 1)
  }

  if (feedback.soreness >= 4) {
    // Trop de courbatures -> reduire
    return Math.max(minSets, currentSets - 1)
  }

  // Neutre
  return currentSets
}

