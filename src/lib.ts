import { exercises, programs, recipes } from './data'
import type {
  ActivityLevel,
  AppState,
  DailyQuest,
  Exercise,
  Goal,
  GoalTargets,
  MainObjective,
  MuscleGroup,
  MuscleVolumeTarget,
  ProgramTemplate,
  UserProfile,
  WorkoutLog,
} from './types'

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

const KCAL_PER_KG_BODY_MASS = 7700
const ADAPTIVE_TDEE_MIN     = 1200
const ADAPTIVE_TDEE_MAX     = 5000
const ADAPTIVE_WINDOW_DAYS  = 14
const SECONDARY_MUSCLE_FACTOR = 0.5

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysAgoIso(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function makeId(prefix?: string): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  return prefix ? `${prefix}_${id}` : id
}

export function startOfWeekIso() {
  const date = new Date()
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

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

export function calculateTargets(profile: UserProfile): GoalTargets {
  const bmr = Math.round(mifflinStJeor(profile))
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel])
  const calories = tdee + goalCalorieAdjustment(profile.goal, tdee)
  const protein = Math.max(50, Math.round(profile.weightKg * (profile.goal === 'fat_loss' ? 2.2 : 1.9)))
  const fats = Math.round(profile.weightKg * 0.75)
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fats * 9) / 4))
  return { bmr, tdee, calories, protein, carbs, fats }
}

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

export function getProgramById(id: string | null) {
  return programs.find((program) => program.id === id) ?? null
}

export function getExerciseById(id: string): Exercise | null {
  return exercises.find(e => e.id === id) ?? null
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

export function estimate1Rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0 || isNaN(weight) || isNaN(reps)) return 0
  if (weight > 1000) return 0
  const effectiveReps = Math.min(reps, 20)
  return weight * (1 + effectiveReps / 30)
}

export function setVolume(weight: number, reps: number): number {
  if (isNaN(weight) || isNaN(reps)) return 0
  if (weight < 0 || reps <= 0) return 0
  return Math.max(0, weight * reps)
}

export function getWorkoutVolume(workout: WorkoutLog) {
  return workout.exercises.reduce(
    (sessionTotal, exercise) =>
      sessionTotal +
      exercise.sets.reduce(
        (setTotal, set) => setTotal + setVolume(set.weightKg, set.reps),
        0,
      ),
    0,
  )
}

export function getTotalVolume(workouts: WorkoutLog[]): number {
  return workouts.reduce((t, w) => t + getWorkoutVolume(w), 0)
}

export function getEffectiveWeight(weightKg: number, exerciseId: string, bodyweightKg: number): number {
  if (weightKg > 0) return weightKg
  const bwExercises = ['pull_ups', 'chin_ups', 'dips', 'push_ups', 'bodyweight_squat', 'pike_push_ups', 'inverted_rows', 'lunges']
  if (bwExercises.includes(exerciseId) && bodyweightKg > 0) return bodyweightKg
  return weightKg
}

export function getWeeklyWorkouts(workouts: WorkoutLog[]) {
  const weekStart = startOfWeekIso()
  return workouts.filter((workout) => workout.date >= weekStart)
}

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

export type TransformationLevel = 'goku_base' | 'ssj' | 'ssj2' | 'ssj3' | 'god' | 'blue' | 'kaioken' | 'ui_sign' | 'mui'

export interface Quest {
  id: string
  name: string
  description: string
  requirement: (state: AppState) => number
  target: number
}

export interface Transformation {
  level: TransformationLevel
  name: string
  accent: string
  image: string
  powerThreshold: number
  quests: Quest[]
}

export const TRANSFORMATIONS: Transformation[] = [
  {
    level: 'goku_base',
    name: 'Goku',
    accent: 'var(--accent-calm)',
    image: 'images/goku.png',
    powerThreshold: 0,
    quests: [],
  },
  {
    level: 'ssj',
    name: 'Super Saiyan',
    accent: 'var(--accent-gold)',
    image: 'images/goku_ssj.png',
    powerThreshold: 2000,
    quests: [
      { id: 'ssj_q1', name: "L'Eveil de la Rage", description: 'Complete 5 seances', requirement: (s) => s.workouts.length, target: 5 },
      { id: 'ssj_q2', name: 'Depasse tes Limites', description: 'Souleve 1 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 1000 },
      { id: 'ssj_q3', name: 'Premier Sang', description: 'Bats 1 record personnel', requirement: (s) => countPRs(s), target: 1 },
      { id: 'ssj_daily', name: 'Discipline Saiyan', description: 'Complete 20 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 20 },
    ],
  },
  {
    level: 'ssj2',
    name: 'Super Saiyan 2',
    accent: 'var(--accent-blue)',
    image: 'images/goku_ssj2.png',
    powerThreshold: 8000,
    quests: [
      { id: 'ssj2_q1', name: 'Depasse ton Pere', description: 'Complete 15 seances', requirement: (s) => s.workouts.length, target: 15 },
      { id: 'ssj2_q2', name: 'Entrainement des Cell Games', description: 'Souleve 5 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 5000 },
      { id: 'ssj2_q3', name: 'Coups de Foudre', description: 'Bats 5 records personnels', requirement: (s) => countPRs(s), target: 5 },
      { id: 'ssj2_q4', name: 'Guerrier 7 Jours', description: 'Atteins une serie de 7 jours', requirement: (s) => getStreak(s), target: 7 },
      { id: 'ssj2_daily', name: 'Habitude de Champion', description: 'Complete 60 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 60 },
    ],
  },
  {
    level: 'ssj3',
    name: 'Super Saiyan 3',
    accent: 'var(--accent-orange)',
    image: 'images/goku_ssj3.png',
    powerThreshold: 25000,
    quests: [
      { id: 'ssj3_q1', name: 'Au-dela de la Limite', description: 'Complete 30 seances', requirement: (s) => s.workouts.length, target: 30 },
      { id: 'ssj3_q2', name: 'Puissance du Genkidama', description: 'Souleve 15 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 15000 },
      { id: 'ssj3_q3', name: 'Briseur de Records', description: 'Bats 15 records personnels', requirement: (s) => countPRs(s), target: 15 },
      { id: 'ssj3_q4', name: 'Roi de la Regularite', description: 'Serie de 14 jours', requirement: (s) => getStreak(s), target: 14 },
      { id: 'ssj3_daily', name: 'Regularite Absolue', description: 'Complete 150 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 150 },
    ],
  },
  {
    level: 'god',
    name: 'Super Saiyan God',
    accent: 'var(--accent-red)',
    image: 'images/goku_god.png',
    powerThreshold: 60000,
    quests: [
      { id: 'god_q1', name: 'Rituel des Saiyans', description: 'Complete 50 seances', requirement: (s) => s.workouts.length, target: 50 },
      { id: 'god_q2', name: 'Entrainement Divin', description: 'Souleve 40 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 40000 },
      { id: 'god_q3', name: 'Records Divins', description: 'Bats 30 records personnels', requirement: (s) => countPRs(s), target: 30 },
      { id: 'god_q4', name: 'Volonte de Fer', description: 'Serie de 30 jours', requirement: (s) => getStreak(s), target: 30 },
      { id: 'god_daily', name: 'Rituel Divin', description: 'Complete 300 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 300 },
    ],
  },
  {
    level: 'blue',
    name: 'Super Saiyan Blue',
    accent: 'var(--accent-blue)',
    image: 'images/goku_ssj_blue.png',
    powerThreshold: 150000,
    quests: [
      { id: 'blue_q1', name: "Camp d'Entrainement de Whis", description: 'Complete 100 seances', requirement: (s) => s.workouts.length, target: 100 },
      { id: 'blue_q2', name: 'Puissance Universelle', description: 'Souleve 100 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 100000 },
      { id: 'blue_q3', name: 'Inarretable', description: 'Bats 50 records personnels', requirement: (s) => countPRs(s), target: 50 },
      { id: 'blue_q4', name: '60 Jours de Combat', description: 'Serie de 60 jours', requirement: (s) => getStreak(s), target: 60 },
      { id: 'blue_daily', name: 'Ki Divin Maitrise', description: 'Complete 500 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 500 },
    ],
  },
  {
    level: 'kaioken',
    name: 'Kaioken Divin',
    accent: '#ff2222',
    image: 'images/goku_kaioken.png',
    powerThreshold: 350000,
    quests: [
      { id: 'kk_q1', name: 'Maitrise du Kaioken', description: 'Complete 80 seances', requirement: (s) => s.workouts.length, target: 80 },
      { id: 'kk_q2', name: 'Surcharge Totale', description: 'Souleve 80 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 80000 },
      { id: 'kk_q3', name: 'Depassement x20', description: 'Bats 40 records personnels', requirement: (s) => countPRs(s), target: 40 },
      { id: 'kk_q4', name: 'Endurance Kaioken', description: 'Serie de 45 jours', requirement: (s) => getStreak(s), target: 45 },
      { id: 'kk_daily', name: 'Corps en Feu', description: 'Complete 400 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 400 },
    ],
  },
  {
    level: 'ui_sign',
    name: 'Ultra Instinct Sign',
    accent: '#c0c0c0',
    image: 'images/goku_ui_sign.png',
    powerThreshold: 650000,
    quests: [
      { id: 'ui_q1', name: 'Tournoi du Pouvoir', description: 'Complete 200 seances', requirement: (s) => s.workouts.length, target: 200 },
      { id: 'ui_q2', name: 'Mouvement Autonome', description: 'Souleve 250 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 250000 },
      { id: 'ui_q3', name: 'Statut Legendaire', description: 'Bats 100 records personnels', requirement: (s) => countPRs(s), target: 100 },
      { id: 'ui_q4', name: '90 Jours Sans Faille', description: 'Serie de 90 jours', requirement: (s) => getStreak(s), target: 90 },
      { id: 'ui_daily', name: 'Instinct Pur', description: 'Complete 1,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 1000 },
    ],
  },
  {
    level: 'mui',
    name: 'Mastered Ultra Instinct',
    accent: '#e8e8ff',
    image: 'images/goku_mui.png',
    powerThreshold: 1500000,
    quests: [
      { id: 'mui_q1', name: 'Maitre de Soi', description: 'Complete 365 seances', requirement: (s) => s.workouts.length, target: 365 },
      { id: 'mui_q2', name: 'Au-dela des Dieux', description: 'Souleve 500 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 500000 },
      { id: 'mui_q3', name: 'Transcendance', description: 'Bats 200 records personnels', requirement: (s) => countPRs(s), target: 200 },
      { id: 'mui_q4', name: 'Guerrier 1 An', description: 'Serie de 365 jours', requirement: (s) => getStreak(s), target: 365 },
      { id: 'mui_daily', name: 'Maitrise Totale', description: 'Complete 2,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 2000 },
    ],
  },
]

export function countPRs(state: AppState): number {
  const workouts = state.workouts
  if (workouts.length === 0) return 0
  const sorted = [...workouts].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const bestByExercise: Record<string, number> = {}
  let prCount = 0
  for (const workout of sorted) {
    const workoutBests: Record<string, number> = {}
    for (const ex of workout.exercises) {
      let bestInWorkout = 0
      for (const set of ex.sets) {
        const e1rm = estimate1Rm(set.weightKg, set.reps)
        if (e1rm > bestInWorkout) bestInWorkout = e1rm
      }
      if (bestInWorkout > 0) workoutBests[ex.exerciseId] = bestInWorkout
    }
    for (const [exId, best] of Object.entries(workoutBests)) {
      const prev = bestByExercise[exId] ?? 0
      if (prev > 0 && best > prev) prCount++
      if (best > (bestByExercise[exId] ?? 0)) bestByExercise[exId] = best
    }
  }
  return prCount
}

export function getStreak(state: AppState): number {
  const dates = [...new Set(state.workouts.map(w => w.date?.slice(0, 10)).filter(Boolean))].sort().reverse()
  if (dates.length === 0) return 0
  const today = todayIso()
  const yesterday = daysAgoIso(1)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i - 1] + 'T12:00:00')
    const d2 = new Date(dates[i] + 'T12:00:00')
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / 86400000)
    if (diffDays <= 2) streak++
    else break
  }
  return streak
}

export function getTransformation(powerLevel: number) {
  let current = TRANSFORMATIONS[0]
  for (const t of TRANSFORMATIONS) {
    if (powerLevel >= t.powerThreshold) current = t
    else break
  }
  return { name: current.name, accent: current.accent }
}

export function getCurrentTransformationFull(state: AppState) {
  const powerLevel = getPowerLevel(state)
  let currentIndex = 0
  for (let i = 0; i < TRANSFORMATIONS.length; i++) {
    if (powerLevel >= TRANSFORMATIONS[i].powerThreshold) currentIndex = i
    else break
  }

  let unlockedIndex = 0
  for (let i = 1; i < TRANSFORMATIONS.length; i++) {
    const t = TRANSFORMATIONS[i]
    const allQuestsComplete = t.quests.every(q => q.requirement(state) >= q.target)
    if (allQuestsComplete && powerLevel >= t.powerThreshold) unlockedIndex = i
    else break
  }

  return {
    current: TRANSFORMATIONS[Math.min(currentIndex, unlockedIndex)],
    currentIndex: Math.min(currentIndex, unlockedIndex),
    nextTransformation: TRANSFORMATIONS[Math.min(currentIndex, unlockedIndex) + 1] ?? null,
    powerLevel,
    allTransformations: TRANSFORMATIONS,
  }
}

// ── RP Hypertrophy Volume Landmarks ──────────────────────────────────────────

export const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  Chest:      { mev: 8,  mav: 14, mrv: 20 },
  Back:       { mev: 8,  mav: 16, mrv: 22 },
  Shoulders:  { mev: 6,  mav: 12, mrv: 18 },
  Biceps:     { mev: 4,  mav: 10, mrv: 16 },
  Triceps:    { mev: 4,  mav: 10, mrv: 16 },
  Quads:      { mev: 6,  mav: 14, mrv: 20 },
  Hamstrings: { mev: 4,  mav: 10, mrv: 16 },
  Glutes:     { mev: 4,  mav: 12, mrv: 18 },
  Calves:     { mev: 6,  mav: 10, mrv: 16 },
  Core:       { mev: 4,  mav: 8,  mrv: 14 },
}

export function getWeeklySetsByMuscle(state: AppState): MuscleVolumeTarget[] {
  const weekWorkouts = getWeeklyWorkouts(state.workouts)
  const setCount = new Map<string, number>()

  weekWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      const workingSets = ex.sets.filter(s => s.setType !== 'warmup').length
      exercise.primaryMuscles.forEach(m => {
        setCount.set(m, (setCount.get(m) ?? 0) + workingSets)
      })
      exercise.secondaryMuscles.forEach(m => {
        setCount.set(m, (setCount.get(m) ?? 0) + Math.round(workingSets * SECONDARY_MUSCLE_FACTOR))
      })
    })
  })

  return Object.entries(VOLUME_LANDMARKS).map(([muscle, landmarks]) => ({
    muscle: muscle as MuscleGroup,
    mev: landmarks.mev,
    mav: landmarks.mav,
    mrv: landmarks.mrv,
    currentSets: setCount.get(muscle) ?? 0,
  }))
}

export function getVolumeRecommendation(muscle: MuscleGroup, currentSets: number): string {
  const landmarks = VOLUME_LANDMARKS[muscle]
  if (!landmarks) return 'Maintenir'

  if (currentSets === 0) return 'Aucun travail cette semaine'
  if (currentSets < landmarks.mev) return 'Sous le MEV — Augmenter'
  if (currentSets < landmarks.mav) return 'Zone productive'
  if (currentSets < landmarks.mrv) return 'Volume eleve — Surveiller'
  return 'Au-dessus du MRV — Reduire'
}

export function getVolumeStatus(currentSets: number, mev: number, mav: number, mrv: number): 'none' | 'below_mev' | 'productive' | 'high' | 'above_mrv' {
  if (currentSets === 0) return 'none'
  if (currentSets < mev) return 'below_mev'
  if (currentSets < mav) return 'productive'
  if (currentSets < mrv) return 'high'
  return 'above_mrv'
}

// RP-style auto-deload detection from session feedback
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

// MacroFactor-style adaptive TDEE from weight + calorie history
export function calculateAdaptiveTDEE(state: AppState): number {
  const entries = state.bodyweightEntries ?? []
  const foodEntries = state.foodEntries ?? []

  if (entries.length < 7 || foodEntries.length < 7) {
    return state.targets?.tdee ?? 2500
  }

  const last14Days = [...Array(ADAPTIVE_WINDOW_DAYS)].map((_, i) => daysAgoIso(i))

  let totalCalories = 0
  let daysWithFood = 0
  for (const date of last14Days) {
    const dayCal = foodEntries.filter(f => f.date === date).reduce((s, f) => s + f.calories, 0)
    if (dayCal > 0) {
      totalCalories += dayCal
      daysWithFood++
    }
  }
  if (daysWithFood === 0) return state.targets?.tdee ?? 2500
  const avgCalories = totalCalories / daysWithFood

  const recentWeights = entries.slice(-14).map(e => e.weightKg)
  if (recentWeights.length < 2) return state.targets?.tdee ?? 2500

  const firstDate = entries[Math.max(0, entries.length - 14)].date
  const lastDate = entries[entries.length - 1].date
  const spanMs = new Date(lastDate).getTime() - new Date(firstDate).getTime()
  const spanDays = Math.max(1, spanMs / 86400000)

  const weightChange = recentWeights[recentWeights.length - 1] - recentWeights[0]
  const weeklyChange = weightChange / (spanDays / 7)
  // 1 kg body mass ~= 7700 kcal
  const dailySurplus = (weeklyChange * KCAL_PER_KG_BODY_MASS) / 7
  const estimatedTDEE = Math.round(avgCalories - dailySurplus)

  return Math.max(ADAPTIVE_TDEE_MIN, Math.min(ADAPTIVE_TDEE_MAX, estimatedTDEE))
}

export function getAdaptiveTDEEStatus(state: AppState): { tdee: number; dailyDelta: number; status: 'surplus' | 'deficit' | 'maintenance'; hasEnoughData: boolean } {
  const hasEnoughData = (state.bodyweightEntries ?? []).length >= 7 && (state.foodEntries ?? []).length >= 7
  const tdee = calculateAdaptiveTDEE(state)
  const todayNutrition = getDailyNutrition(state.foodEntries)
  const dailyDelta = todayNutrition.calories - tdee
  const status = dailyDelta > 100 ? 'surplus' : dailyDelta < -100 ? 'deficit' : 'maintenance'
  return { tdee, dailyDelta, status, hasEnoughData }
}

// Mesocycle status derived from workout history + feedback
export function getMesocycleStatus(state: AppState): { label: string; detail: string; color: string; weekNumber: number } {
  const totalWorkouts = state.workouts.length
  const deload = shouldDeload(state)
  const streak = getStreak(state)

  if (deload) {
    return { label: 'Deload recommande', detail: 'Performances en baisse — reduis le volume cette semaine', color: 'var(--accent-red)', weekNumber: 0 }
  }

  if (totalWorkouts === 0) {
    return { label: 'Debut du cycle', detail: 'Commence ta premiere seance pour lancer le mesocycle', color: 'var(--muted)', weekNumber: 0 }
  }

  const firstWorkoutDate = new Date(state.workouts[0].date)
  const daysSinceStart = Math.floor((Date.now() - firstWorkoutDate.getTime()) / 86400000)
  const weekNumber = Math.floor(daysSinceStart / 7) + 1

  const recentFeedback = (state.sessionFeedback ?? []).slice(-3)
  const avgSoreness = recentFeedback.length > 0
    ? recentFeedback.reduce((s, fb) => s + fb.muscleGroups.reduce((a, m) => a + m.soreness, 0) / Math.max(1, fb.muscleGroups.length), 0) / recentFeedback.length
    : 2

  if (avgSoreness > 3 || streak < 3) {
    return { label: 'Fatigue montante', detail: 'Surveille ta recuperation — un deload approche peut-etre', color: 'var(--accent-gold)', weekNumber }
  }

  return { label: 'Semaine productive', detail: `Semaine ${weekNumber} — continue sur cette lancee`, color: '#4fffb0', weekNumber }
}

// ── Daily Quest System ────────────────────────────────────────────────────────

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'steps',    name: '10 000 pas',        description: "Marche 10 000 pas aujourd'hui",        icon: '|>', target: 10000, unit: 'pas',    category: 'activity'  },
  { id: 'water',    name: 'Hydratation',        description: "Bois 2L d'eau",                        icon: 'H2O', target: 8,     unit: 'verres', category: 'nutrition' },
  { id: 'protein',  name: 'Proteines',          description: 'Atteins ton objectif proteines',       icon: 'P',  target: 100,   unit: '%',      category: 'nutrition' },
  { id: 'calories', name: 'Calories',           description: 'Reste dans ta cible calorique (±10%)', icon: 'C',  target: 100,   unit: '%',      category: 'nutrition' },
  { id: 'training', name: 'Entrainement',       description: 'Complete ta seance programmee',        icon: 'T',  target: 1,     unit: 'seance', category: 'training'  },
  { id: 'sleep',    name: 'Sommeil 7h+',        description: 'Dors au moins 7 heures',               icon: 'Z',  target: 7,     unit: 'heures', category: 'recovery'  },
  { id: 'stretch',  name: 'Etirements',         description: '10 min d\'etirements ou mobilite',     icon: 'S',  target: 10,    unit: 'min',    category: 'recovery'  },
  { id: 'no_junk',  name: 'Clean Eating',       description: "Pas de junk food aujourd'hui",         icon: 'OK', target: 1,     unit: 'jour',   category: 'nutrition' },
]

export function countCompletedDailyQuests(state: AppState): number {
  if (!state.completedDailyQuests) return 0
  return Object.values(state.completedDailyQuests).reduce((total, quests) => total + quests.length, 0)
}

export function getDailyQuestStatus(state: AppState) {
  const targets = state.targets ?? { calories: 2000, protein: 100, carbs: 250, fats: 60, bmr: 1800, tdee: 2500 }
  const today = todayIso()
  const progress = (state.dailyQuestProgress ?? []).find(d => d.date === today)
  const completed = (state.completedDailyQuests ?? {})[today] ?? []
  const nutrition = getDailyNutrition(state.foodEntries)
  const todayWorkouts = state.workouts.filter(w => w.date === today)

  return DAILY_QUESTS.map(quest => {
    let current = progress?.quests[quest.id] ?? 0

    if (quest.id === 'protein') {
      current = targets.protein > 0 ? Math.round((nutrition.protein / targets.protein) * 100) : 0
    } else if (quest.id === 'calories') {
      const ratio = targets.calories > 0 ? nutrition.calories / targets.calories : 0
      current = (ratio >= 0.9 && ratio <= 1.1) ? 100 : Math.round(ratio * 100)
    } else if (quest.id === 'training') {
      current = todayWorkouts.length > 0 ? 1 : 0
    }

    const isComplete = completed.includes(quest.id) || current >= quest.target
    return { ...quest, current, isComplete }
  })
}

// ── Main Objectives ───────────────────────────────────────────────────────────

export function generateMainObjectives(state: AppState): MainObjective[] {
  const answers = state.onboardingAnswers
  const objectives: MainObjective[] = []

  objectives.push({
    id: 'first_month', name: '30 Jours de Feu', description: 'Enchaine les entrainements pendant 30 jours',
    icon: 'F', completed: false,
    milestones: [
      { description: '7 jours', target: 7, unit: 'jours', check: s => getStreak(s) },
      { description: '14 jours', target: 14, unit: 'jours', check: s => getStreak(s) },
      { description: '30 jours', target: 30, unit: 'jours', check: s => getStreak(s) },
    ],
  })

  objectives.push({
    id: 'volume_master', name: 'Maitre du Volume', description: 'Accumule du volume total a la barre',
    icon: 'V', completed: false,
    milestones: [
      { description: '10 000 kg', target: 10000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '50 000 kg', target: 50000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '100 000 kg', target: 100000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
    ],
  })

  if (!answers) return objectives

  if (answers.weakPoints && answers.weakPoints.length > 0) {
    objectives.push({
      id: 'weak_points', name: 'Corriger les Faiblesses', description: `Focus: ${answers.weakPoints.join(', ')}`,
      icon: 'W', completed: false,
      milestones: [
        { description: '20 seances avec focus', target: 20, unit: 'seances', check: s => s.workouts.length },
        { description: '40 seances avec focus', target: 40, unit: 'seances', check: s => s.workouts.length },
      ],
    })
  }

  if (answers.currentCardio === 'none' || answers.currentCardio === 'light') {
    objectives.push({
      id: 'cardio_boost', name: 'Cardio Warrior', description: 'Ameliore ton cardio avec des pas quotidiens',
      icon: 'C', completed: false,
      milestones: [
        { description: '7 jours a 10K pas', target: 7, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
        { description: '30 jours a 10K pas', target: 30, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
      ],
    })
  }

  objectives.push({
    id: 'pr_hunter', name: 'Chasseur de PRs', description: 'Bats tes records sur les mouvements de base',
    icon: 'R', completed: false,
    milestones: [
      { description: '5 PRs battus', target: 5, unit: 'PRs', check: s => countPRs(s) },
      { description: '15 PRs battus', target: 15, unit: 'PRs', check: s => countPRs(s) },
      { description: '30 PRs battus', target: 30, unit: 'PRs', check: s => countPRs(s) },
    ],
  })

  return objectives
}

// ── Existing helpers ──────────────────────────────────────────────────────────

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

export function getVolumeByMuscle(workouts: WorkoutLog[]) {
  const volumeMap = new Map<string, number>()

  workouts.forEach((workout) => {
    workout.exercises.forEach((exerciseLog) => {
      const exercise = getExerciseById(exerciseLog.exerciseId)
      const rawVolume = exerciseLog.sets.reduce(
        (total, set) => total + setVolume(set.weightKg, set.reps),
        0,
      )

      exercise.primaryMuscles.forEach((muscle) => {
        volumeMap.set(muscle, (volumeMap.get(muscle) ?? 0) + rawVolume)
      })
      exercise.secondaryMuscles.forEach((muscle) => {
        volumeMap.set(muscle, (volumeMap.get(muscle) ?? 0) + rawVolume * SECONDARY_MUSCLE_FACTOR)
      })
    })
  })

  return Array.from(volumeMap.entries()).sort((a, b) => b[1] - a[1])
}


export function getPrimaryRecommendation(state: AppState) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const nutrition = getDailyNutrition(state.foodEntries)

  if (shouldDeload(state)) {
    return 'Tes indicateurs de recuperation suggerent un deload. Reduis le volume de 40-50% cette semaine.'
  }

  if (state.profile && weeklyWorkouts.length < state.profile.trainingDaysPerWeek) {
    return `Complete ${state.profile.trainingDaysPerWeek - weeklyWorkouts.length} seance(s) de plus cette semaine pour rester dans ta Saga.`
  }

  if (state.targets && nutrition.protein < state.targets.protein * 0.85) {
    return 'Les proteines sont en retard aujourd\'hui. Ajoute un repas proteine ou un shake post-seance.'
  }

  const weeklyVolume = weeklyWorkouts.reduce(
    (total, workout) => total + getWorkoutVolume(workout),
    0,
  )
  if (weeklyVolume < 4000) {
    return 'Volume d\'entrainement hebdomadaire faible. Pousse tes mouvements principaux et finis tes accessoires.'
  }

  return 'Recuperation et regularite au top. Continue la progression lente, propre et repeatable.'
}

