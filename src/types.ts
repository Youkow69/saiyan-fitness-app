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
  | 'superset'

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

export type TabId = 'home' | 'train' | 'nutrition' | 'scouter' | 'feed' | 'coach' | 'profile'

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
  notes?: string
}

export interface WorkoutLog {
  id: string
  date: string
  programId: string
  sessionId: string
  sessionName: string
  exercises: LoggedExercise[]
  durationMinutes: number
  notes?: string
}

export interface WorkoutDraft {
  programId: string
  sessionId: string
  startedAt: string
  sessionName?: string
  exercises: LoggedExercise[]
  notes?: string
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
  servings?: { name: string; grams: number }[]
  isCustom?: boolean
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

export type QuestType = 'daily' | 'main' | 'transformation'

export interface DailyQuest {
  id: string
  name: string
  description: string
  icon: string
  target: number
  unit: string
  category: 'activity' | 'nutrition' | 'training' | 'recovery'
}

export interface DailyQuestProgress {
  date: string
  quests: Record<string, number>
}

export interface OnboardingAnswers {
  primaryGoalDetail: string
  targetBodyfat: string
  weakPoints: string[]
  currentCardio: string
  sleepHours: number
  stressLevel: string
  mealPrepWillingness: string
  supplementsUsed: string[]
  pastInjuries: string[]
  motivationStyle: string
  dailyStepGoal: number
  waterGoalLiters: number
}

export interface MainObjective {
  id: string
  name: string
  description: string
  icon: string
  milestones: {
    description: string
    target: number
    unit: string
    check: (state: AppState) => number
  }[]
  completed: boolean
}

// RP Hypertrophy-style volume tracking
export interface MuscleVolumeTarget {
  muscle: MuscleGroup
  mev: number
  mav: number
  mrv: number
  currentSets: number
}

// Post-workout session feedback (RP style)
export interface SessionFeedback {
  date: string
  workoutId: string
  muscleGroups: {
    muscle: MuscleGroup
    pump: 1 | 2 | 3 | 4 | 5
    soreness: 1 | 2 | 3 | 4 | 5
    performance: 'worse' | 'same' | 'better'
    jointPain: boolean
  }[]
}

// Mesocycle / block tracking
export interface MesocycleState {
  id: string
  name: string
  startDate: string
  weekNumber: number
  totalWeeks: number
  phase: 'accumulation' | 'intensification' | 'deload'
  volumeMultiplier: number
}

// MacroFactor-style adaptive TDEE
export interface AdaptiveTDEE {
  date: string
  estimatedTDEE: number
  caloriesIn: number
  weightTrend: number
  adjustment: number
}

export interface CustomRoutine {
  id: string
  name: string
  exercises: {
    exerciseId: string
    sets: number
    repMin: number
    repMax: number
    restSeconds: number
  }[]
}

export interface AppState {
  schemaVersion?: number
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
  dailyQuestProgress: DailyQuestProgress[]
  onboardingAnswers: OnboardingAnswers | null
  completedDailyQuests: Record<string, string[]>
  unlockedTransformations: string[]
  sessionFeedback: SessionFeedback[]
  mesocycle: MesocycleState | null
  adaptiveTDEE: AdaptiveTDEE[]
  weeklyMuscleVolume: Record<string, number>
  customRoutines: CustomRoutine[]
  customFoods: Food[]
}
