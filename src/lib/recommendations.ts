// ── Recommendations ─────────────────────────────────────────────────────────

import { programs } from '../data'
import type { AppState, ProgramTemplate, UserProfile } from '../types'
import { getDailyNutrition } from './nutrition'
import { shouldDeload } from './progression'
import { getWeeklyWorkouts, getWorkoutVolume } from './training'

/** Finds the best matching program template for a user profile. */
export function recommendProgram(profile: UserProfile): ProgramTemplate {
  const pool = programs.filter(
    (program) =>
      program.goalTags.includes(profile.goal) &&
      program.levelTags.includes(profile.experienceLevel) &&
      program.equipmentTags.includes(profile.equipmentAccess),
  )

  const exact = pool.find((program) => program.daysPerWeek === profile.trainingDaysPerWeek)
  if (exact) return exact

  const closest = [...pool].sort(
    (a, b) =>
      Math.abs(a.daysPerWeek - profile.trainingDaysPerWeek) -
      Math.abs(b.daysPerWeek - profile.trainingDaysPerWeek),
  )[0]

  return closest ?? programs[0]
}

/** Looks up a program template by ID. */
export function getProgramById(id: string | null) {
  return programs.find((program) => program.id === id) ?? null
}

/** Returns the single most important recommendation for the user right now. */
export function getPrimaryRecommendation(state: AppState) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const nutrition = getDailyNutrition(state.foodEntries)

  if (shouldDeload(state)) {
    return 'Tes indicateurs de récupération suggèrent un deload. Réduis le volume de 40-50% cette semaine.'
  }

  if (state.profile && weeklyWorkouts.length < state.profile.trainingDaysPerWeek) {
    return `Complete ${state.profile.trainingDaysPerWeek - weeklyWorkouts.length} séance(s) de plus cette semaine pour rester dans ta Saga.`
  }

  if (state.targets && nutrition.protein < state.targets.protein * 0.85) {
    return 'Les protéines sont en retard aujourd\'hui. Ajoute un repas protéiné ou un shake post-séance.'
  }

  const weeklyVolume = weeklyWorkouts.reduce(
    (total, workout) => total + getWorkoutVolume(workout),
    0,
  )
  if (weeklyVolume < 4000) {
    return 'Volume d\'entraînement hebdomadaire faible. Pousse tes mouvements principaux et finis tes accessoires.'
  }

  return 'Recuperation et régularité au top. Continue la progression lente, propre et répétable.'
}
