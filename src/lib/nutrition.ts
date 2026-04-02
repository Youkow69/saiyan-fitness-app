// ── Nutrition Calculations ───────────────────────────────────────────────────

import { recipes } from '../data'
import type { ActivityLevel, AppState, Goal, GoalTargets, UserProfile } from '../types'
import { todayIso, daysAgoIso } from './dates'

// ── Named Constants ─────────────────────────────────────────────────────────
const KCAL_PER_KG_BODY_MASS = 7700
const ADAPTIVE_TDEE_MIN     = 1200
const ADAPTIVE_TDEE_MAX     = 5000
const ADAPTIVE_WINDOW_DAYS  = 14

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
}

/** Mifflin-St Jeor BMR estimation. */
export function mifflinStJeor(profile: UserProfile) {
  const base =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age
  return profile.sex === 'male' ? base + 5 : base - 161
}

function goalCalorieAdjustment(goal: Goal, tdee: number) {
  switch (goal) {
    case 'muscle_gain':
      return Math.round(tdee * 0.1)
    case 'fat_loss':
      return -Math.round(tdee * 0.17)
    case 'recomp':
      return -Math.round(tdee * 0.05)
    case 'strength':
      return Math.round(tdee * 0.04)
    case 'endurance':
      return Math.round(tdee * 0.06)
  }
}

/** Calculates full macro targets from a user profile. */
export function calculateTargets(profile: UserProfile): GoalTargets {
  const bmr = Math.round(mifflinStJeor(profile))
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel])
  const calories = tdee + goalCalorieAdjustment(profile.goal, tdee)
  const protein = Math.max(50, Math.round(profile.weightKg * (profile.goal === 'fat_loss' ? 2.2 : 1.9)))
  const fats = Math.round(profile.weightKg * 0.75)
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4))
  return { bmr, tdee, calories, protein, carbs, fats }
}

/** Sums nutrition entries for a given date. */
export function getDailyNutrition(
  foodEntries: AppState['foodEntries'],
  date = todayIso(),
) {
  return foodEntries
    .filter((entry) => entry.date === date)
    .reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        protein: totals.protein + entry.protein,
        carbs: totals.carbs + entry.carbs,
        fats: totals.fats + entry.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    )
}

/** MacroFactor-style adaptive TDEE from weight + calorie history. */
export function calculateAdaptiveTDEE(state: AppState): number {
  const entries = state.bodyweightEntries ?? []
  const foodEntries = state.foodEntries ?? []

  if (entries.length < 7 || foodEntries.length < 7) {
    return state.targets?.tdee ?? 2500
  }

  const last14Days = [...Array(ADAPTIVE_WINDOW_DAYS)].map((_, i) => daysAgoIso(i))

  const avgCalories = last14Days.reduce((sum, date) => {
    const dayCal = foodEntries.filter(f => f.date === date).reduce((s, f) => s + f.calories, 0)
    return sum + dayCal
  }, 0) / ADAPTIVE_WINDOW_DAYS

  const recentWeights = entries.slice(-14).map(e => e.weightKg)
  if (recentWeights.length < 2) return state.targets?.tdee ?? 2500

  const weightChange = recentWeights[recentWeights.length - 1] - recentWeights[0]
  const weeklyChange = weightChange / (recentWeights.length / 7)
  const dailySurplus = (weeklyChange * KCAL_PER_KG_BODY_MASS) / 7
  const estimatedTDEE = Math.round(avgCalories - dailySurplus)

  return Math.max(ADAPTIVE_TDEE_MIN, Math.min(ADAPTIVE_TDEE_MAX, estimatedTDEE))
}

/** Returns adaptive TDEE status with surplus/deficit info. */
export function getAdaptiveTDEEStatus(state: AppState): { tdee: number; dailyDelta: number; status: 'surplus' | 'deficit' | 'maintenance'; hasEnoughData: boolean } {
  const hasEnoughData = (state.bodyweightEntries ?? []).length >= 7 && (state.foodEntries ?? []).length >= 7
  const tdee = calculateAdaptiveTDEE(state)
  const todayNutrition = getDailyNutrition(state.foodEntries)
  const dailyDelta = todayNutrition.calories - tdee
  const status = dailyDelta > 100 ? 'surplus' : dailyDelta < -100 ? 'deficit' : 'maintenance'
  return { tdee, dailyDelta, status, hasEnoughData }
}

/** Recommends recipes based on remaining macro budget. */
export function getRecommendedRecipes(state: AppState) {
  const totals = getDailyNutrition(state.foodEntries)
  const targets = state.targets
  if (!targets) return recipes.slice(0, 4)

  return [...recipes]
    .map((recipe) => {
      const calorieGap = Math.abs(targets.calories - totals.calories - recipe.calories)
      const proteinGap = Math.abs(targets.protein - totals.protein - recipe.protein)
      return { recipe, score: calorieGap + proteinGap * 4 }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((item) => item.recipe)
}


export function getLowCarbWarning(carbsG: number): string | null {
  if (carbsG < 50) {
    return '\u26A0\uFE0F Tes glucides sont tr\u00e8s bas (' + Math.round(carbsG) + 'g). Consulte un nutritionniste.'
  }
  return null
}
