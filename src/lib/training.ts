// ── Training Logic ──────────────────────────────────────────────────────────

import type { AppState, MuscleGroup, SessionFeedback, MuscleVolumeTarget, WorkoutLog, WorkoutDraft, LoggedExercise, ProgramExercise } from '../types'
import { startOfWeekIso } from './dates'
import { getExerciseById } from './utils'
import { allExercises } from '../data/exercises'

// ── Named Constants ─────────────────────────────────────────────────────────
const SECONDARY_MUSCLE_FACTOR = 0.5

/** Epley formula for estimated 1RM. */
export function estimate1Rm(weight: number, reps: number) {
  if (isNaN(weight) || isNaN(reps)) return 0
  if (weight <= 0 || reps <= 0) return 0
  if (reps > 30 || weight > 1000) return 0
  return weight * (1 + reps / 30)
}

/** Volume for a single set (weight x reps). */
export function setVolume(weight: number, reps: number): number {
  if (isNaN(weight) || isNaN(reps)) return 0
  if (weight < 0 || reps <= 0) return 0
  return Math.max(0, weight * reps)
}

/** Total volume for a single workout session. */
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

/** Total volume across an array of workouts. */
export function getTotalVolume(workouts: WorkoutLog[]): number {
  return workouts.reduce((t, w) => t + getWorkoutVolume(w), 0)
}

/** Returns workouts from the current week (Monday-based). */
export function getWeeklyWorkouts(workouts: WorkoutLog[]) {
  const weekStart = startOfWeekIso()
  return workouts.filter((workout) => workout.date >= weekStart)
}

// ── RP Hypertrophy Volume Landmarks ─────────────────────────────────────────

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

/** Counts working sets per muscle group for the current week. */
export function getWeeklySetsByMuscle(state: AppState): MuscleVolumeTarget[] {
  const weekWorkouts = getWeeklyWorkouts(state.workouts)
  const setCount = new Map<string, number>()

  weekWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      if (!exercise) return
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

/** French-language volume recommendation string for a muscle group. */
export function getVolumeRecommendation(muscle: MuscleGroup, currentSets: number): string {
  const landmarks = VOLUME_LANDMARKS[muscle]
  if (!landmarks) return 'Maintenir'

  if (currentSets === 0) return 'Aucun travail cette semaine'
  if (currentSets < landmarks.mev) return 'Sous le MEV — Augmenter'
  if (currentSets < landmarks.mav) return 'Zone productive'
  if (currentSets < landmarks.mrv) return 'Volume élevé — Surveiller'
  return 'Au-dessus du MRV — Réduire'
}

/** Returns a volume status category. */
export function getVolumeStatus(currentSets: number, mev: number, mav: number, mrv: number): 'none' | 'below_mev' | 'productive' | 'high' | 'above_mrv' {
  if (currentSets === 0) return 'none'
  if (currentSets < mev) return 'below_mev'
  if (currentSets < mav) return 'productive'
  if (currentSets < mrv) return 'high'
  return 'above_mrv'
}

/** Volume by muscle group across a set of workouts. */
export function getVolumeByMuscle(workouts: WorkoutLog[]) {
  const volumeMap = new Map<string, number>()

  workouts.forEach((workout) => {
    workout.exercises.forEach((exerciseLog) => {
      const exercise = getExerciseById(exerciseLog.exerciseId)
      if (!exercise) return
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


// ── FEAT-F5: Generation intelligente de seance basee sur la fatigue ──────────

/** Calcule la fatigue par groupe musculaire sur les 7 derniers jours (0-100%). */
export function getFatigueByMuscle(workouts: WorkoutLog[], sessionFeedback?: SessionFeedback[]): Map<string, number> {
  const now = Date.now()
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const recentWorkouts = workouts.filter(w => {
    const wDate = new Date(w.date + 'T12:00:00').getTime()
    return (now - wDate) < SEVEN_DAYS
  })

  const fatigue = new Map<string, number>()
  const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core']
  MUSCLES.forEach(m => fatigue.set(m, 0))

  recentWorkouts.forEach(w => {
    // Plus la seance est recente, plus la fatigue est haute
    const daysSince = (now - new Date(w.date + 'T12:00:00').getTime()) / 86400000
    const recencyFactor = Math.max(0, 1 - daysSince / 7)

    w.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exerciseId)
      if (!exercise) return
      const workingSets = ex.sets.filter(s => s.setType !== 'warmup').length
      const setFatigue = workingSets * 8 * recencyFactor // 8% par serie ponderate

      exercise.primaryMuscles.forEach(m => {
        fatigue.set(m, Math.min(100, (fatigue.get(m) ?? 0) + setFatigue))
      })
      exercise.secondaryMuscles.forEach(m => {
        fatigue.set(m, Math.min(100, (fatigue.get(m) ?? 0) + setFatigue * SECONDARY_MUSCLE_FACTOR))
      })
    })
  })


  // FEAT-F4: Boost fatigue from session feedback (soreness/pain/performance)
  if (sessionFeedback && sessionFeedback.length > 0) {
    const recent = sessionFeedback.slice(-3)
    recent.forEach(fb => {
      fb.muscleGroups.forEach(mg => {
        const key = mg.muscle
        if (mg.soreness > 3) {
          const boost = (mg.soreness - 3) * 8
          fatigue.set(key, Math.min(100, (fatigue.get(key) ?? 0) + boost))
        }
        if (mg.performance === 'worse') {
          fatigue.set(key, Math.min(100, (fatigue.get(key) ?? 0) + 10))
        }
        if (mg.jointPain) {
          fatigue.set(key, Math.min(100, (fatigue.get(key) ?? 0) + 20))
        }
      })
    })
  }

  return fatigue
}

/** Genere une seance intelligente en evitant les muscles fatigues (>70%). */
export function generateSmartWorkout(state: { workouts: WorkoutLog[]; profile?: { experienceLevel?: string } }): WorkoutDraft {
  const fatigue = getFatigueByMuscle(state.workouts)

  // Muscles disponibles (fatigue < 70%)
  const availableMuscles = Array.from(fatigue.entries())
    .filter(([_, f]) => f < 70)
    .sort((a, b) => a[1] - b[1]) // Les moins fatigues d'abord
    .map(([m]) => m)

  // Selectionner 4-6 exercices qui ciblent les muscles disponibles
  const selectedExercises: { exercise: typeof allExercises[0]; target: ProgramExercise }[] = []
  const usedMuscles = new Set<string>()
  const usedExerciseIds = new Set<string>()
  const targetCount = state.profile?.experienceLevel === 'advanced' ? 6 : state.profile?.experienceLevel === 'beginner' ? 4 : 5

  // Trier les exercices par stimulus/fatigue ratio
  const sortedExercises = [...allExercises].sort((a, b) => b.stimulusFatigue - a.stimulusFatigue)

  for (const ex of sortedExercises) {
    if (selectedExercises.length >= targetCount) break
    if (usedExerciseIds.has(ex.id)) continue

    // Verifier que l'exercice cible au moins un muscle disponible non encore travaille
    const targetsMuscle = ex.primaryMuscles.some(m =>
      availableMuscles.includes(m) && !usedMuscles.has(m)
    )
    if (!targetsMuscle) continue

    // Determiner sets/reps selon la difficulte
    const isCompound = ex.primaryMuscles.length > 0 && ex.secondaryMuscles.length > 0
    const sets = isCompound ? 4 : 3
    const repMin = isCompound ? 6 : 10
    const repMax = isCompound ? 10 : 15
    const targetRir = isCompound ? 2 : 1
    const restSeconds = isCompound ? 120 : 60

    selectedExercises.push({
      exercise: ex,
      target: {
        exerciseId: ex.id,
        sets,
        repMin,
        repMax,
        targetRir,
        restSeconds,
      },
    })

    usedExerciseIds.add(ex.id)
    ex.primaryMuscles.forEach(m => usedMuscles.add(m))
  }

  // Construire le WorkoutDraft
  const exercises: LoggedExercise[] = selectedExercises.map(({ exercise, target }) => ({
    exerciseId: exercise.id,
    target,
    sets: [],
  }))

  return {
    programId: 'custom',
    sessionId: 'smart_' + Date.now(),
    startedAt: new Date().toISOString(),
    sessionName: 'Seance intelligente',
    exercises,
  }
}
