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

export function getTransformation(powerLevel: number) {
  if (powerLevel < 2000) {
    return { name: 'Human mode', accent: 'var(--accent-calm)' }
  }
  if (powerLevel < 5000) {
    return { name: 'Saiyan', accent: 'var(--accent-gold)' }
  }
  if (powerLevel < 9500) {
    return { name: 'Super Saiyan', accent: 'var(--accent-orange)' }
  }
  if (powerLevel < 15000) {
    return { name: 'Super Saiyan 2', accent: 'var(--accent-blue)' }
  }
  return { name: 'God Mode', accent: 'var(--accent-red)' }
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
