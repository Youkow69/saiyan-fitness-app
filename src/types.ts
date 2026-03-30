export type Sex = 'male' | 'female'

export type Goal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'recomp'
  | 'strength'
  | 'endurance'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'athlete'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type EquipmentAccess = 'full_gym' | 'basic_gym' | 'home_gym'

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'

export type SetType =
  | 'warmup'
  | 'normal'
  | 'top'
  | 'backoff'
  | 'drop'
  | 'amrap'

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'

export type TabId = 'home' | 'train' | 'nutrition' | 'scouter' | 'profile'

export interface UserProfile {
  name: string
  age: number
  sex: Sex
  weightKg: number
  heightCm: number
  activityLevel: ActivityLevel
  goal: Goal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: number
  equipmentAccess: EquipmentAccess
  dietaryPreference: string
  injuryNotes: string
}

export interface GoalTargets {
  bmr: number
  tdee: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface Exercise {
  id: string
  name: string
  equipment: string
  pattern: string
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  difficulty: 1 | 2 | 3
  stimulusFatigue: number
  setupCues: string[]
  executionCues: string[]
  alternatives: string[]
}

export interface ProgramExercise {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  targetRir: number
  restSeconds: number
  note?: string
}

export interface ProgramSession {
  id: string
  name: string
  focus: string
  exercises: ProgramExercise[]
}

export interface ProgramTemplate {
  id: string
  name: string
  saga: string
  split: string
  goalTags: Goal[]
  levelTags: ExperienceLevel[]
  equipmentTags: EquipmentAccess[]
  daysPerWeek: number
  description: string
  sessions: ProgramSession[]
}

export interface SetLog {
  id: string
  exerciseId: string
  setIndex: number
  setType: SetType
  weightKg: number
  reps: number
  rir: number
  timestamp: string
}

export interface LoggedExercise {
  exerciseId: string
  target: ProgramExercise
  sets: SetLog[]
}

export interface WorkoutLog {
  id: string
  date: string
  programId: string
  sessionId: string
  sessionName: string
  exercises: LoggedExercise[]
  durationMinutes: number
}

export interface WorkoutDraft {
  programId: string
  sessionId: string
  startedAt: string
  exercises: LoggedExercise[]
}

export interface Food {
  id: string
  name: string
  servingGrams: number
  calories: number
  protein: number
  carbs: number
  fats: number
  tags: string[]
}

export interface Recipe {
  id: string
  name: string
  category: MealCategory
  prepMinutes: number
  calories: number
  protein: number
  carbs: number
  fats: number
  servings: number
  ingredients: string[]
  steps: string[]
  goalTags: Goal[]
}

export interface FoodEntry {
  id: string
  date: string
  name: string
  category: MealCategory
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface SavedMeal {
  id: string
  name: string
  category: MealCategory
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface BodyweightEntry {
  id: string
  date: string
  weightKg: number
}

export interface MeasurementEntry {
  id: string
  date: string
  waistCm: number
  chestCm: number
  armCm: number
  thighCm: number
}

export interface AppState {
  profile: UserProfile | null
  targets: GoalTargets | null
  selectedProgramId: string | null
  workouts: WorkoutLog[]
  activeWorkout: WorkoutDraft | null
  programCursor: Record<string, number>
  foodEntries: FoodEntry[]
  savedMeals: SavedMeal[]
  bodyweightEntries: BodyweightEntry[]
  measurementEntries: MeasurementEntry[]
}
