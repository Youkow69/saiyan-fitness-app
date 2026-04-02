// ── Training Logic ──────────────────────────────────────────────────────────

import type { AppState, MuscleGroup, MuscleVolumeTarget, WorkoutLog } from '../types'
import { startOfWeekIso } from './dates'
import { getExerciseById } from './utils'

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
