import { exercises, programs, recipes } from './data'
import type {
  ActivityLevel,
  AppState,
  Exercise,
  Goal,
  GoalTargets,
  ProgramTemplate,
  UserProfile,
  WorkoutLog,
} from './types'

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
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
  const protein = Math.round(
    profile.weightKg * (profile.goal === 'fat_loss' ? 2.2 : 1.9),
  )
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

export function getExerciseById(id: string): Exercise {
  return exercises.find((exercise) => exercise.id === id) ?? exercises[0]
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

export function estimate1Rm(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

export function setVolume(weight: number, reps: number) {
  return weight * reps
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
    state.targets && nutrition.protein >= state.targets.protein * 0.9 ? 1 : 0

  return Math.round(
    1200 +
      state.workouts.length * 180 +
      volume * 0.22 +
      state.bodyweightEntries.length * 30 +
      proteinHits * 150,
  )
}

export type TransformationLevel = 'goku_base' | 'ssj' | 'ssj2' | 'ssj3' | 'god' | 'blue' | 'ui_sign' | 'mui'

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
    powerThreshold: 1000,
    quests: [
      { id: 'ssj_q1', name: 'Rage Awakening', description: 'Complete 5 workouts', requirement: (s) => s.workouts.length, target: 5 },
      { id: 'ssj_q2', name: 'Break Your Limits', description: 'Log 1,000 kg total volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 1000 },
      { id: 'ssj_q3', name: 'First Blood', description: 'Beat 1 Personal Record', requirement: (s) => countPRs(s), target: 1 },
    ],
  },
  {
    level: 'ssj2',
    name: 'Super Saiyan 2',
    accent: 'var(--accent-blue)',
    image: 'images/gohan.png',
    powerThreshold: 5000,
    quests: [
      { id: 'ssj2_q1', name: 'Surpass Your Father', description: 'Complete 15 workouts', requirement: (s) => s.workouts.length, target: 15 },
      { id: 'ssj2_q2', name: 'Cell Games Training', description: 'Log 5,000 kg total volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 5000 },
      { id: 'ssj2_q3', name: 'Lightning Strikes', description: 'Beat 5 PRs', requirement: (s) => countPRs(s), target: 5 },
      { id: 'ssj2_q4', name: '7-Day Warrior', description: 'Achieve a 7-day streak', requirement: (s) => getStreak(s), target: 7 },
    ],
  },
  {
    level: 'ssj3',
    name: 'Super Saiyan 3',
    accent: 'var(--accent-orange)',
    image: 'images/goku_ssj.png',
    powerThreshold: 15000,
    quests: [
      { id: 'ssj3_q1', name: 'Beyond the Limit', description: 'Complete 30 workouts', requirement: (s) => s.workouts.length, target: 30 },
      { id: 'ssj3_q2', name: 'Spirit Bomb Power', description: 'Log 15,000 kg total volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 15000 },
      { id: 'ssj3_q3', name: 'Record Breaker', description: 'Beat 15 PRs', requirement: (s) => countPRs(s), target: 15 },
      { id: 'ssj3_q4', name: 'Consistency King', description: '14-day streak', requirement: (s) => getStreak(s), target: 14 },
    ],
  },
  {
    level: 'god',
    name: 'Super Saiyan God',
    accent: 'var(--accent-red)',
    image: 'images/vegeta.png',
    powerThreshold: 50000,
    quests: [
      { id: 'god_q1', name: 'Ritual of the Saiyans', description: 'Complete 60 workouts', requirement: (s) => s.workouts.length, target: 60 },
      { id: 'god_q2', name: 'Divine Training', description: 'Log 50,000 kg volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 50000 },
      { id: 'god_q3', name: 'God-Level Records', description: 'Beat 30 PRs', requirement: (s) => countPRs(s), target: 30 },
      { id: 'god_q4', name: 'Iron Will', description: '30-day streak', requirement: (s) => getStreak(s), target: 30 },
    ],
  },
  {
    level: 'blue',
    name: 'Super Saiyan Blue',
    accent: 'var(--accent-blue)',
    image: 'images/goku_ssj_blue.png',
    powerThreshold: 150000,
    quests: [
      { id: 'blue_q1', name: 'Whis Training Camp', description: 'Complete 100 workouts', requirement: (s) => s.workouts.length, target: 100 },
      { id: 'blue_q2', name: 'Universal Power', description: 'Log 100,000 kg volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 100000 },
      { id: 'blue_q3', name: 'Unstoppable', description: 'Beat 50 PRs', requirement: (s) => countPRs(s), target: 50 },
      { id: 'blue_q4', name: '60 Days of War', description: '60-day streak', requirement: (s) => getStreak(s), target: 60 },
    ],
  },
  {
    level: 'ui_sign',
    name: 'Ultra Instinct Sign',
    accent: '#c0c0c0',
    image: 'images/goku_ssj_blue.png',
    powerThreshold: 500000,
    quests: [
      { id: 'ui_q1', name: 'Tournament of Power', description: 'Complete 200 workouts', requirement: (s) => s.workouts.length, target: 200 },
      { id: 'ui_q2', name: 'Autonomous Movement', description: 'Log 250,000 kg volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 250000 },
      { id: 'ui_q3', name: 'Legend Status', description: 'Beat 100 PRs', requirement: (s) => countPRs(s), target: 100 },
      { id: 'ui_q4', name: '90 Days Unbroken', description: '90-day streak', requirement: (s) => getStreak(s), target: 90 },
    ],
  },
  {
    level: 'mui',
    name: 'Mastered Ultra Instinct',
    accent: '#e8e8ff',
    image: 'images/goku_ssj_blue.png',
    powerThreshold: 1000000,
    quests: [
      { id: 'mui_q1', name: 'Master of Self', description: 'Complete 365 workouts', requirement: (s) => s.workouts.length, target: 365 },
      { id: 'mui_q2', name: 'Beyond Gods', description: 'Log 500,000 kg volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 500000 },
      { id: 'mui_q3', name: 'Transcendence', description: 'Beat 200 PRs', requirement: (s) => countPRs(s), target: 200 },
      { id: 'mui_q4', name: 'One Year Warrior', description: '365-day streak', requirement: (s) => getStreak(s), target: 365 },
    ],
  },
]

function countPRs(state: AppState): number {
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

function getStreak(state: AppState): number {
  if (state.workouts.length === 0) return 0
  const dates = [...new Set(state.workouts.map(w => w.date))].sort().reverse()
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i])
    const d2 = new Date(dates[i + 1])
    const diff = (d1.getTime() - d2.getTime()) / 86400000
    if (diff <= 2) streak++
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

  // Check quest completion for unlocking
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
        volumeMap.set(muscle, (volumeMap.get(muscle) ?? 0) + rawVolume * 0.45)
      })
    })
  })

  return Array.from(volumeMap.entries()).sort((a, b) => b[1] - a[1])
}

export function getRecoveryMap(workouts: WorkoutLog[]) {
  const latestByMuscle = new Map<string, number>()
  const now = Date.now()

  workouts.slice(-8).forEach((workout) => {
    const workoutTime = new Date(workout.date).getTime()
    workout.exercises.forEach((exerciseLog) => {
      const exercise = getExerciseById(exerciseLog.exerciseId)
      ;[...exercise.primaryMuscles, ...exercise.secondaryMuscles].forEach((muscle) => {
        const elapsedHours = (now - workoutTime) / 36e5
        const recovery = Math.max(10, Math.min(100, Math.round(elapsedHours * 5)))
        const current = latestByMuscle.get(muscle)
        latestByMuscle.set(muscle, current === undefined ? recovery : Math.min(current, recovery))
      })
    })
  })

  return Array.from(latestByMuscle.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

export function getPrimaryRecommendation(state: AppState) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const nutrition = getDailyNutrition(state.foodEntries)

  if (state.profile && weeklyWorkouts.length < state.profile.trainingDaysPerWeek) {
    return `Complete ${state.profile.trainingDaysPerWeek - weeklyWorkouts.length} more session(s) this week to stay on your Saga.`
  }

  if (state.targets && nutrition.protein < state.targets.protein * 0.85) {
    return 'Protein is lagging today. Add a high-protein meal or a post-workout shake.'
  }

  const weeklyVolume = weeklyWorkouts.reduce(
    (total, workout) => total + getWorkoutVolume(workout),
    0,
  )
  if (weeklyVolume < 4000) {
    return 'Weekly training volume is light. Push your main lifts and finish your accessories.'
  }

  return 'Recovery and adherence look solid. Keep progression slow, clean and repeatable.'
}

export function getTopLiftState(workouts: WorkoutLog[]) {
  const topLifts = ['bench_press', 'back_squat', 'romanian_deadlift', 'pull_up']
  return topLifts.map((exerciseId) => {
    let best = 0
    workouts.forEach((workout) => {
      workout.exercises
        .filter((exerciseLog) => exerciseLog.exerciseId === exerciseId)
        .forEach((exerciseLog) => {
          exerciseLog.sets.forEach((set) => {
            best = Math.max(best, estimate1Rm(set.weightKg, set.reps))
          })
        })
    })

    return {
      exercise: getExerciseById(exerciseId),
      estimated1Rm: Math.round(best),
    }
  })
}
