import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react'
import type {
  AppState,
  BodyweightEntry,
  CustomRoutine,
  FoodEntry,
  MeasurementEntry,
  OnboardingAnswers,
  SessionFeedback,
  SetType,
  UserProfile,
  WorkoutDraft,
  WorkoutLog,
} from '../types'
import { loadState, debouncedSave, saveState } from '../storage'
import { calculateTargets, makeId, todayIso, recommendProgram } from '../lib'
import { savedMeals } from '../data'

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_REPS_PER_SET = 100
const MAX_WEIGHT_KG = 1000

// ── Action types ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: { profile: UserProfile; answers: OnboardingAnswers } }
  | { type: 'START_WORKOUT'; payload: WorkoutDraft }
  | { type: 'ADD_SET'; payload: { exerciseId: string; weightKg: number; reps: number; rir: number; setType: SetType } }
  | { type: 'FINISH_WORKOUT'; payload: { workout: WorkoutLog; isCustom: boolean } }
  | { type: 'ADD_FOOD'; payload: FoodEntry }
  | { type: 'LOG_BODYWEIGHT'; payload: BodyweightEntry }
  | { type: 'LOG_MEASUREMENT'; payload: MeasurementEntry }
  | { type: 'CHOOSE_PROGRAM'; payload: string }
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; delta: number } }
  | { type: 'COMPLETE_QUEST'; payload: string }
  | { type: 'SAVE_FEEDBACK'; payload: SessionFeedback }
  | { type: 'ADD_CUSTOM_ROUTINE'; payload: CustomRoutine }
  | { type: 'DELETE_CUSTOM_ROUTINE'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ABANDON_WORKOUT' }
  | { type: 'RESET_ACCOUNT' }

// ── Default state ─────────────────────────────────────────────────────────────

const defaultState: AppState = {
  profile: null,
  targets: null,
  selectedProgramId: null,
  workouts: [],
  activeWorkout: null,
  programCursor: {},
  foodEntries: [],
  savedMeals,
  bodyweightEntries: [],
  measurementEntries: [],
  dailyQuestProgress: [],
  onboardingAnswers: null,
  completedDailyQuests: {},
  unlockedTransformations: [],
  sessionFeedback: [],
  mesocycle: null,
  adaptiveTDEE: [],
  weeklyMuscleVolume: {},
  customRoutines: [],
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE': {
      const incoming = action.payload
      // Preserve activeWorkout from local state if it exists and incoming doesn't have one
      // This ensures workout persistence survives cloud pulls
      return {
        ...incoming,
        activeWorkout: incoming.activeWorkout ?? state.activeWorkout ?? null,
      }
    }

    case 'COMPLETE_ONBOARDING': {
      const { profile, answers } = action.payload
      const targets = calculateTargets(profile)
      const rec = recommendProgram(profile)
      return {
        ...state,
        profile,
        targets,
        selectedProgramId: rec.id,
        savedMeals: state.savedMeals?.length ? state.savedMeals : savedMeals,
        bodyweightEntries: [
          ...state.bodyweightEntries,
          { id: makeId('bw'), date: todayIso(), weightKg: profile.weightKg },
        ],
        onboardingAnswers: answers,
      }
    }

    case 'START_WORKOUT':
      return { ...state, activeWorkout: action.payload }

    case 'ADD_SET': {
      if (!state.activeWorkout) return state
      const { exerciseId, weightKg, reps, rir, setType } = action.payload
      const w = action.payload.weightKg
      const r = action.payload.reps
      if (typeof w !== 'number' || typeof r !== 'number' || isNaN(w) || isNaN(r) || w < 0 || r <= 0 || r > MAX_REPS_PER_SET || w > MAX_WEIGHT_KG) {
        return state
      }
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((e) =>
            e.exerciseId === exerciseId
              ? {
                  ...e,
                  sets: [
                    ...e.sets,
                    {
                      id: makeId('set'),
                      exerciseId,
                      setIndex: e.sets.length + 1,
                      setType,
                      weightKg,
                      reps,
                      rir,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }
              : e
          ),
        },
      }
    }

    case 'FINISH_WORKOUT': {
      if (!state.activeWorkout) return state
      const hasAnySets = state.activeWorkout.exercises.some(e => e.sets.length > 0)
      if (!hasAnySets) return state
      const { workout, isCustom } = action.payload
      return {
        ...state,
        workouts: [...state.workouts, workout],
        activeWorkout: null,
        programCursor: isCustom
          ? state.programCursor
          : {
              ...state.programCursor,
              [workout.programId]:
                (state.programCursor[workout.programId] ?? 0) + 1,
            },
      }
    }

    case 'RESET_ACCOUNT': {
      // Clear all localStorage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sf_') || key === 'saiyan_fitness_state') {
            localStorage.removeItem(key)
          }
        })
      } catch {}
      return { ...defaultState }
    }

    case 'ABANDON_WORKOUT': {
      if (!state.activeWorkout) return state
      return { ...state, activeWorkout: null }
    }

    case 'ADD_FOOD':
      return { ...state, foodEntries: [...state.foodEntries, action.payload] }

    case 'LOG_BODYWEIGHT': {
      const today = todayIso()
      const existingIndex = state.bodyweightEntries.findIndex(
        (e) => e.date.slice(0, 10) === today
      )
      const updatedEntries =
        existingIndex >= 0
          ? state.bodyweightEntries.map((e, i) =>
              i === existingIndex
                ? { ...e, weightKg: action.payload.weightKg }
                : e
            )
          : [...state.bodyweightEntries, action.payload]
      return {
        ...state,
        bodyweightEntries: updatedEntries,
        profile: state.profile
          ? { ...state.profile, weightKg: action.payload.weightKg }
          : null,
      }
    }

    case 'LOG_MEASUREMENT':
      return {
        ...state,
        measurementEntries: [...state.measurementEntries, action.payload],
      }

    case 'CHOOSE_PROGRAM':
      return { ...state, selectedProgramId: action.payload }

    case 'UPDATE_QUEST_PROGRESS': {
      const today = todayIso()
      const { questId, delta } = action.payload
      const existing = (state.dailyQuestProgress ?? []).find(
        (d) => d.date === today
      )
      const currentVal = existing?.quests[questId] ?? 0
      const newVal = Math.max(0, currentVal + delta)
      const updated = existing
        ? (state.dailyQuestProgress ?? []).map((d) =>
            d.date === today
              ? { ...d, quests: { ...d.quests, [questId]: newVal } }
              : d
          )
        : [
            ...(state.dailyQuestProgress ?? []),
            { date: today, quests: { [questId]: newVal } },
          ]
      return { ...state, dailyQuestProgress: updated }
    }

    case 'COMPLETE_QUEST': {
      const today = todayIso()
      const alreadyDone = (
        (state.completedDailyQuests ?? {})[today] ?? []
      ).includes(action.payload)
      if (alreadyDone) return state
      return {
        ...state,
        completedDailyQuests: {
          ...(state.completedDailyQuests ?? {}),
          [today]: [
            ...((state.completedDailyQuests ?? {})[today] ?? []),
            action.payload,
          ],
        },
      }
    }

    case 'SAVE_FEEDBACK':
      return {
        ...state,
        sessionFeedback: [...(state.sessionFeedback ?? []), action.payload],
      }

    case 'ADD_CUSTOM_ROUTINE':
      return {
        ...state,
        customRoutines: [...state.customRoutines, action.payload],
      }

    case 'DELETE_CUSTOM_ROUTINE':
      return {
        ...state,
        customRoutines: state.customRoutines.filter(
          (r) => r.id !== action.payload
        ),
      }

    case 'UPDATE_PROFILE': {
      if (!state.profile) return state
      const updatedProfile = { ...state.profile, ...action.payload }
      const updatedTargets = calculateTargets(updatedProfile)
      return {
        ...state,
        profile: updatedProfile,
        targets: updatedTargets,
      }
    }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used inside AppProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, () => {
    const loaded = loadState()
    if (!loaded) return defaultState
    // Merge new default savedMeals for existing users
    const existingIds = new Set(loaded.savedMeals?.map((m: { id: string }) => m.id) ?? [])
    const newMeals = savedMeals.filter(m => !existingIds.has(m.id))
    loaded.savedMeals = [...(loaded.savedMeals ?? []), ...newMeals]
    return {
      ...defaultState,
      ...loaded,
      // Preserve activeWorkout from localStorage (workout persistence across reloads)
      activeWorkout: loaded.activeWorkout ?? null,
      dailyQuestProgress: loaded.dailyQuestProgress ?? [],
      onboardingAnswers: loaded.onboardingAnswers ?? null,
      completedDailyQuests: loaded.completedDailyQuests ?? {},
      unlockedTransformations: loaded.unlockedTransformations ?? [],
      sessionFeedback: loaded.sessionFeedback ?? [],
      mesocycle: loaded.mesocycle ?? null,
      adaptiveTDEE: loaded.adaptiveTDEE ?? [],
      weeklyMuscleVolume: loaded.weeklyMuscleVolume ?? {},
      customRoutines: loaded.customRoutines ?? [],
    }
  })

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    debouncedSave(state)
  }, [state])

  useEffect(() => {
    const flush = () => saveState(stateRef.current)
    const handleVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export type { Action }
