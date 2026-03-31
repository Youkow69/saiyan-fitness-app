import { exercises, programs, recipes } from './data'
import type {
  ActivityLevel,
  AppState,
  DailyQuest,
  Exercise,
  Goal,
  GoalTargets,
  MainObjective,
  OnboardingAnswers,
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
      { id: 'ssj_daily', name: 'Discipline Saiyan', description: 'Complete 20 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 20 },
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
      { id: 'ssj2_daily', name: 'Habitude de Champion', description: 'Complete 60 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 60 },
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
      { id: 'ssj3_daily', name: 'Régularité Absolue', description: 'Complete 150 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 150 },
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
      { id: 'blue_q1', name: 'Whis Training Camp', description: 'Complete 100 workouts', requirement: (s) => s.workouts.length, target: 100 },
      { id: 'blue_q2', name: 'Universal Power', description: 'Log 100,000 kg volume', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 100000 },
      { id: 'blue_q3', name: 'Unstoppable', description: 'Beat 50 PRs', requirement: (s) => countPRs(s), target: 50 },
      { id: 'blue_q4', name: '60 Days of War', description: '60-day streak', requirement: (s) => getStreak(s), target: 60 },
      { id: 'blue_daily', name: 'Ki Divin Maîtrisé', description: 'Complete 500 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 500 },
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
      { id: 'ui_daily', name: 'Instinct Pur', description: 'Complete 1,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 1000 },
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
      { id: 'mui_daily', name: 'Maîtrise Totale', description: 'Complete 2,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 2000 },
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

// ── Daily Quest System ────────────────────────────────────────────────────────

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'steps',    name: '10 000 pas',          description: "Marche 10 000 pas aujourd'hui",         icon: '🚶', target: 10000, unit: 'pas',    category: 'activity'  },
  { id: 'water',    name: 'Hydratation',          description: "Bois 2L d'eau",                         icon: '💧', target: 8,     unit: 'verres', category: 'nutrition' },
  { id: 'protein',  name: 'Objectif Protéines',   description: 'Atteins ton objectif protéines',        icon: '🥩', target: 100,   unit: '%',      category: 'nutrition' },
  { id: 'calories', name: 'Objectif Calories',    description: 'Reste dans ta cible calorique (±10%)',  icon: '🔥', target: 100,   unit: '%',      category: 'nutrition' },
  { id: 'training', name: "Entraînement du jour", description: 'Complète ta séance programmée',         icon: '💪', target: 1,     unit: 'séance', category: 'training'  },
  { id: 'sleep',    name: 'Sommeil 7h+',          description: 'Dors au moins 7 heures',                icon: '😴', target: 7,     unit: 'heures', category: 'recovery'  },
  { id: 'stretch',  name: 'Étirements',           description: '10 min d\'étirements ou mobilité',      icon: '🧘', target: 10,    unit: 'min',    category: 'recovery'  },
  { id: 'no_junk',  name: 'Clean Eating',         description: "Pas de junk food aujourd'hui",          icon: '🥗', target: 1,     unit: 'jour',   category: 'nutrition' },
]

export function countCompletedDailyQuests(state: AppState): number {
  if (!state.completedDailyQuests) return 0
  return Object.values(state.completedDailyQuests).reduce((total, quests) => total + quests.length, 0)
}

export function getDailyQuestStatus(state: AppState) {
  const today = todayIso()
  const progress = (state.dailyQuestProgress ?? []).find(d => d.date === today)
  const completed = (state.completedDailyQuests ?? {})[today] ?? []
  const nutrition = getDailyNutrition(state.foodEntries)
  const todayWorkouts = state.workouts.filter(w => w.date === today)

  return DAILY_QUESTS.map(quest => {
    let current = progress?.quests[quest.id] ?? 0

    // Auto-calculate from app data where possible
    if (quest.id === 'protein' && state.targets) {
      current = state.targets.protein > 0 ? Math.round((nutrition.protein / state.targets.protein) * 100) : 0
    } else if (quest.id === 'calories' && state.targets) {
      const ratio = state.targets.calories > 0 ? nutrition.calories / state.targets.calories : 0
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
    id: 'first_month', name: '30 Jours de Feu', description: 'Enchaîne les entraînements pendant 30 jours',
    icon: '🔥', completed: false,
    milestones: [
      { description: '7 jours', target: 7, unit: 'jours', check: s => getStreak(s) },
      { description: '14 jours', target: 14, unit: 'jours', check: s => getStreak(s) },
      { description: '30 jours', target: 30, unit: 'jours', check: s => getStreak(s) },
    ],
  })

  objectives.push({
    id: 'volume_master', name: 'Maître du Volume', description: 'Accumule du volume total à la barre',
    icon: '🏋️', completed: false,
    milestones: [
      { description: '10 000 kg', target: 10000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '50 000 kg', target: 50000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '100 000 kg', target: 100000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
    ],
  })

  if (!answers) return objectives

  if (answers.primaryGoalDetail === 'aesthetics' || answers.primaryGoalDetail === 'bodybuilding_competition') {
    objectives.push({
      id: 'physique', name: 'Sculpteur de Physique', description: 'Travaille tous les groupes musculaires',
      icon: '💎', completed: false,
      milestones: [
        { description: 'Log tes mensurations', target: 3, unit: 'entrées', check: s => s.measurementEntries.length },
        { description: '50 séances complètes', target: 50, unit: 'séances', check: s => s.workouts.length },
        { description: 'Cohérence 3 mois', target: 90, unit: 'jours', check: s => getStreak(s) },
      ],
    })
  }

  if (answers.primaryGoalDetail === 'strength' || answers.primaryGoalDetail === 'powerlifting') {
    objectives.push({
      id: 'strength_master', name: 'Force Brute', description: 'Bats tes records sur les mouvements de base',
      icon: '⚡', completed: false,
      milestones: [
        { description: '10 PRs battus', target: 10, unit: 'PRs', check: s => countPRs(s) },
        { description: '25 PRs battus', target: 25, unit: 'PRs', check: s => countPRs(s) },
        { description: '50 PRs battus', target: 50, unit: 'PRs', check: s => countPRs(s) },
      ],
    })
  }

  if (answers.primaryGoalDetail === 'weight_loss' || answers.primaryGoalDetail === 'health') {
    objectives.push({
      id: 'weight_goal', name: 'Transformation Physique', description: 'Suis ton poids et atteins ton objectif',
      icon: '📉', completed: false,
      milestones: [
        { description: '10 pesées enregistrées', target: 10, unit: 'pesées', check: s => s.bodyweightEntries.length },
        { description: '30 pesées enregistrées', target: 30, unit: 'pesées', check: s => s.bodyweightEntries.length },
        { description: '4 semaines de régularité', target: 28, unit: 'jours', check: s => getStreak(s) },
      ],
    })
  }

  if (answers.weakPoints && answers.weakPoints.length > 0) {
    objectives.push({
      id: 'weak_points', name: 'Corriger les Faiblesses', description: `Focus sur : ${answers.weakPoints.join(', ')}`,
      icon: '🎯', completed: false,
      milestones: [
        { description: '20 séances avec focus', target: 20, unit: 'séances', check: s => s.workouts.length },
        { description: '40 séances avec focus', target: 40, unit: 'séances', check: s => s.workouts.length },
      ],
    })
  }

  if (answers.currentCardio === 'none' || answers.currentCardio === 'light') {
    objectives.push({
      id: 'cardio_boost', name: 'Cardio Warrior', description: 'Améliore ton cardio avec des pas quotidiens',
      icon: '❤️', completed: false,
      milestones: [
        { description: '7 jours à 10K pas', target: 7, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
        { description: '30 jours à 10K pas', target: 30, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
      ],
    })
  }

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
