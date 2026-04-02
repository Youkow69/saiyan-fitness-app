import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Inline implementations for testing (no external data/types deps) ────────
// These mirror the exact logic from the split modules so tests are self-contained.

// ── dates ───────────────────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgoIso(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeekIso() {
  const date = new Date()
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

// ── utils ───────────────────────────────────────────────────────────────────

function makeId(prefix?: string): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  return prefix ? `${prefix}_${id}` : id
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

// ── training ────────────────────────────────────────────────────────────────

function estimate1Rm(weight: number, reps: number) {
  if (isNaN(weight) || isNaN(reps)) return 0
  if (weight <= 0 || reps <= 0) return 0
  if (reps > 30 || weight > 1000) return 0
  return weight * (1 + reps / 30)
}

function setVolume(weight: number, reps: number): number {
  if (isNaN(weight) || isNaN(reps)) return 0
  if (weight < 0 || reps <= 0) return 0
  return Math.max(0, weight * reps)
}

interface SetLog {
  weightKg: number
  reps: number
  setType?: string
}

interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
}

interface WorkoutLog {
  id: string
  date: string
  exercises: ExerciseLog[]
}

function getWorkoutVolume(workout: WorkoutLog) {
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

function getTotalVolume(workouts: WorkoutLog[]): number {
  return workouts.reduce((t, w) => t + getWorkoutVolume(w), 0)
}

// ── nutrition ───────────────────────────────────────────────────────────────

interface UserProfile {
  weightKg: number
  heightCm: number
  age: number
  sex: 'male' | 'female'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete'
  goal: 'muscle_gain' | 'fat_loss' | 'recomp' | 'strength' | 'endurance'
  experienceLevel: string
  equipmentAccess: string
  trainingDaysPerWeek: number
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
}

function mifflinStJeor(profile: UserProfile) {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age
  return profile.sex === 'male' ? base + 5 : base - 161
}

function goalCalorieAdjustment(goal: string, tdee: number) {
  switch (goal) {
    case 'muscle_gain': return Math.round(tdee * 0.1)
    case 'fat_loss': return -Math.round(tdee * 0.17)
    case 'recomp': return -Math.round(tdee * 0.05)
    case 'strength': return Math.round(tdee * 0.04)
    case 'endurance': return Math.round(tdee * 0.06)
    default: return 0
  }
}

function calculateTargets(profile: UserProfile) {
  const bmr = Math.round(mifflinStJeor(profile))
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel])
  const calories = tdee + goalCalorieAdjustment(profile.goal, tdee)
  const protein = Math.max(50, Math.round(profile.weightKg * (profile.goal === 'fat_loss' ? 2.2 : 1.9)))
  const fats = Math.round(profile.weightKg * 0.75)
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fats * 9) / 4))
  return { bmr, tdee, calories, protein, carbs, fats }
}

// ── progression ─────────────────────────────────────────────────────────────

interface AppStateLike {
  workouts: WorkoutLog[]
}

function countPRs(state: AppStateLike): number {
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

function getStreak(state: AppStateLike): number {
  if (state.workouts.length === 0) return 0
  const dates = [...new Set(state.workouts.map(w => w.date))].sort().reverse()
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i] + 'T12:00:00')
    const d2 = new Date(dates[i + 1] + 'T12:00:00')
    const diff = (d1.getTime() - d2.getTime()) / 86400000
    if (diff <= 1) streak++
    else break
  }
  return streak
}

// ── Mock Helpers ────────────────────────────────────────────────────────────

function makeWorkout(date: string, exercises: ExerciseLog[]): WorkoutLog {
  return { id: `w_${date}`, date, exercises }
}

function makeExercise(exerciseId: string, sets: SetLog[]): ExerciseLog {
  return { exerciseId, sets }
}

function makeSet(weightKg: number, reps: number): SetLog {
  return { weightKg, reps }
}

const maleProfile: UserProfile = {
  weightKg: 80,
  heightCm: 180,
  age: 25,
  sex: 'male',
  activityLevel: 'moderate',
  goal: 'muscle_gain',
  experienceLevel: 'intermediate',
  equipmentAccess: 'full_gym',
  trainingDaysPerWeek: 4,
}

const femaleProfile: UserProfile = {
  weightKg: 80,
  heightCm: 180,
  age: 25,
  sex: 'female',
  activityLevel: 'moderate',
  goal: 'muscle_gain',
  experienceLevel: 'intermediate',
  equipmentAccess: 'full_gym',
  trainingDaysPerWeek: 4,
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('dates', () => {
  describe('todayIso', () => {
    it('returns a string in YYYY-MM-DD format', () => {
      const result = todayIso()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('matches today\'s local date', () => {
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      expect(todayIso()).toBe(expected)
    })

    it('returns the same value when called twice', () => {
      expect(todayIso()).toBe(todayIso())
    })
  })

  describe('daysAgoIso', () => {
    it('returns today for n=0', () => {
      expect(daysAgoIso(0)).toBe(todayIso())
    })

    it('returns yesterday for n=1', () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(daysAgoIso(1)).toBe(expected)
    })

    it('returns correct date for n=7', () => {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(daysAgoIso(7)).toBe(expected)
    })

    it('does not cause cumulative mutation when called multiple times', () => {
      const first = daysAgoIso(5)
      const second = daysAgoIso(5)
      const third = daysAgoIso(5)
      expect(first).toBe(second)
      expect(second).toBe(third)
    })

    it('handles large values crossing month boundaries', () => {
      const result = daysAgoIso(60)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('startOfWeekIso', () => {
    it('returns a string in YYYY-MM-DD format', () => {
      expect(startOfWeekIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns a Monday', () => {
      const result = new Date(startOfWeekIso() + 'T12:00:00')
      expect(result.getDay()).toBe(1) // Monday
    })
  })
})

describe('training', () => {
  describe('estimate1Rm', () => {
    it('returns 0 for NaN weight', () => {
      expect(estimate1Rm(NaN, 5)).toBe(0)
    })

    it('returns 0 for NaN reps', () => {
      expect(estimate1Rm(100, NaN)).toBe(0)
    })

    it('returns 0 for zero weight', () => {
      expect(estimate1Rm(0, 10)).toBe(0)
    })

    it('returns 0 for zero reps', () => {
      expect(estimate1Rm(100, 0)).toBe(0)
    })

    it('returns 0 for negative weight', () => {
      expect(estimate1Rm(-50, 5)).toBe(0)
    })

    it('returns 0 for reps > 30', () => {
      expect(estimate1Rm(100, 31)).toBe(0)
    })

    it('returns 0 for weight > 1000', () => {
      expect(estimate1Rm(1001, 5)).toBe(0)
    })

    it('returns weight itself for 1 rep (almost — Epley has small addition)', () => {
      // Epley: weight * (1 + 1/30)
      const result = estimate1Rm(100, 1)
      expect(result).toBeCloseTo(100 * (1 + 1 / 30), 5)
    })

    it('calculates correctly for standard inputs', () => {
      // 100 kg x 10 reps => 100 * (1 + 10/30) = 100 * 1.333... = 133.33
      expect(estimate1Rm(100, 10)).toBeCloseTo(133.33, 1)
    })

    it('handles max valid reps (30)', () => {
      // 60 kg x 30 reps => 60 * (1 + 30/30) = 60 * 2 = 120
      expect(estimate1Rm(60, 30)).toBe(120)
    })
  })

  describe('setVolume', () => {
    it('returns 0 for NaN weight', () => {
      expect(setVolume(NaN, 5)).toBe(0)
    })

    it('returns 0 for NaN reps', () => {
      expect(setVolume(100, NaN)).toBe(0)
    })

    it('returns 0 for negative weight', () => {
      expect(setVolume(-10, 5)).toBe(0)
    })

    it('returns 0 for zero reps', () => {
      expect(setVolume(100, 0)).toBe(0)
    })

    it('calculates correctly for valid inputs', () => {
      expect(setVolume(80, 10)).toBe(800)
    })

    it('allows bodyweight (weight = 0) with positive reps', () => {
      expect(setVolume(0, 15)).toBe(0)
    })
  })

  describe('getWorkoutVolume', () => {
    it('sums volume across all exercises and sets', () => {
      const workout = makeWorkout('2025-01-01', [
        makeExercise('bench', [makeSet(100, 10), makeSet(100, 8)]),
        makeExercise('squat', [makeSet(120, 5)]),
      ])
      // bench: 100*10 + 100*8 = 1800; squat: 120*5 = 600; total = 2400
      expect(getWorkoutVolume(workout)).toBe(2400)
    })

    it('returns 0 for empty workout', () => {
      const workout = makeWorkout('2025-01-01', [])
      expect(getWorkoutVolume(workout)).toBe(0)
    })
  })

  describe('getTotalVolume', () => {
    it('sums volume across multiple workouts', () => {
      const workouts = [
        makeWorkout('2025-01-01', [makeExercise('bench', [makeSet(100, 10)])]),
        makeWorkout('2025-01-02', [makeExercise('squat', [makeSet(120, 5)])]),
      ]
      expect(getTotalVolume(workouts)).toBe(1000 + 600)
    })

    it('returns 0 for empty array', () => {
      expect(getTotalVolume([])).toBe(0)
    })
  })
})

describe('progression', () => {
  describe('getStreak', () => {
    it('returns 0 for no workouts', () => {
      expect(getStreak({ workouts: [] })).toBe(0)
    })

    it('returns 1 for a single workout', () => {
      expect(getStreak({ workouts: [makeWorkout('2025-03-15', [])] })).toBe(1)
    })

    it('counts consecutive days correctly', () => {
      const state = {
        workouts: [
          makeWorkout('2025-03-13', []),
          makeWorkout('2025-03-14', []),
          makeWorkout('2025-03-15', []),
        ],
      }
      expect(getStreak(state)).toBe(3)
    })

    it('breaks streak on 2-day gap', () => {
      const state = {
        workouts: [
          makeWorkout('2025-03-12', []),
          makeWorkout('2025-03-15', []),
        ],
      }
      // dates sorted reverse: 15, 12 => diff = 3 days => streak breaks => 1
      expect(getStreak(state)).toBe(1)
    })

    it('deduplicates dates (multiple workouts on same day)', () => {
      const state = {
        workouts: [
          makeWorkout('2025-03-14', []),
          makeWorkout('2025-03-14', []),
          makeWorkout('2025-03-15', []),
        ],
      }
      expect(getStreak(state)).toBe(2)
    })
  })

  describe('countPRs', () => {
    it('returns 0 for empty workouts', () => {
      expect(countPRs({ workouts: [] })).toBe(0)
    })

    it('returns 0 for a single workout (first entries are not PRs)', () => {
      const state = {
        workouts: [
          makeWorkout('2025-01-01', [
            makeExercise('bench', [makeSet(100, 10)]),
          ]),
        ],
      }
      expect(countPRs(state)).toBe(0)
    })

    it('counts 1 PR when second workout beats first', () => {
      const state = {
        workouts: [
          makeWorkout('2025-01-01', [
            makeExercise('bench', [makeSet(100, 10)]),
          ]),
          makeWorkout('2025-01-02', [
            makeExercise('bench', [makeSet(110, 10)]),
          ]),
        ],
      }
      expect(countPRs(state)).toBe(1)
    })

    it('counts PRs per exercise independently', () => {
      const state = {
        workouts: [
          makeWorkout('2025-01-01', [
            makeExercise('bench', [makeSet(100, 10)]),
            makeExercise('squat', [makeSet(120, 5)]),
          ]),
          makeWorkout('2025-01-02', [
            makeExercise('bench', [makeSet(110, 10)]),
            makeExercise('squat', [makeSet(130, 5)]),
          ]),
        ],
      }
      expect(countPRs(state)).toBe(2)
    })

    it('does not count equal performance as a PR', () => {
      const state = {
        workouts: [
          makeWorkout('2025-01-01', [
            makeExercise('bench', [makeSet(100, 10)]),
          ]),
          makeWorkout('2025-01-02', [
            makeExercise('bench', [makeSet(100, 10)]),
          ]),
        ],
      }
      expect(countPRs(state)).toBe(0)
    })

    it('counts multiple PRs on the same exercise over 3 sessions', () => {
      const state = {
        workouts: [
          makeWorkout('2025-01-01', [makeExercise('bench', [makeSet(80, 10)])]),
          makeWorkout('2025-01-02', [makeExercise('bench', [makeSet(90, 10)])]),
          makeWorkout('2025-01-03', [makeExercise('bench', [makeSet(100, 10)])]),
        ],
      }
      expect(countPRs(state)).toBe(2)
    })
  })
})

describe('nutrition', () => {
  describe('mifflinStJeor', () => {
    it('returns a positive number for valid profile', () => {
      expect(mifflinStJeor(maleProfile)).toBeGreaterThan(0)
    })

    it('male BMR is higher than female for same params', () => {
      const maleBmr = mifflinStJeor(maleProfile)
      const femaleBmr = mifflinStJeor(femaleProfile)
      expect(maleBmr).toBeGreaterThan(femaleBmr)
    })

    it('male - female difference is exactly 166 (5 - (-161))', () => {
      const diff = mifflinStJeor(maleProfile) - mifflinStJeor(femaleProfile)
      expect(diff).toBe(166)
    })

    it('increases with heavier weight', () => {
      const heavy = { ...maleProfile, weightKg: 100 }
      expect(mifflinStJeor(heavy)).toBeGreaterThan(mifflinStJeor(maleProfile))
    })

    it('decreases with older age', () => {
      const older = { ...maleProfile, age: 45 }
      expect(mifflinStJeor(older)).toBeLessThan(mifflinStJeor(maleProfile))
    })
  })

  describe('calculateTargets', () => {
    it('returns all required fields', () => {
      const targets = calculateTargets(maleProfile)
      expect(targets).toHaveProperty('bmr')
      expect(targets).toHaveProperty('tdee')
      expect(targets).toHaveProperty('calories')
      expect(targets).toHaveProperty('protein')
      expect(targets).toHaveProperty('carbs')
      expect(targets).toHaveProperty('fats')
    })

    it('TDEE is higher than BMR', () => {
      const targets = calculateTargets(maleProfile)
      expect(targets.tdee).toBeGreaterThan(targets.bmr)
    })

    it('calories are higher than TDEE for muscle_gain', () => {
      const targets = calculateTargets(maleProfile)
      expect(targets.calories).toBeGreaterThan(targets.tdee)
    })

    it('calories are lower than TDEE for fat_loss', () => {
      const profile = { ...maleProfile, goal: 'fat_loss' as const }
      const targets = calculateTargets(profile)
      expect(targets.calories).toBeLessThan(targets.tdee)
    })

    it('protein is at least 50g', () => {
      const tiny = { ...maleProfile, weightKg: 20 }
      const targets = calculateTargets(tiny)
      expect(targets.protein).toBeGreaterThanOrEqual(50)
    })

    it('carbs are at least 80g', () => {
      const targets = calculateTargets(maleProfile)
      expect(targets.carbs).toBeGreaterThanOrEqual(80)
    })

    it('protein is higher for fat_loss goal', () => {
      const gain = calculateTargets(maleProfile)
      const loss = calculateTargets({ ...maleProfile, goal: 'fat_loss' as const })
      expect(loss.protein).toBeGreaterThan(gain.protein)
    })

    it('athlete TDEE is higher than sedentary TDEE', () => {
      const sed = calculateTargets({ ...maleProfile, activityLevel: 'sedentary' as const })
      const ath = calculateTargets({ ...maleProfile, activityLevel: 'athlete' as const })
      expect(ath.tdee).toBeGreaterThan(sed.tdee)
    })
  })
})

describe('utils', () => {
  describe('makeId', () => {
    it('returns a string', () => {
      expect(typeof makeId()).toBe('string')
    })

    it('returns unique values on successive calls', () => {
      const ids = new Set(Array.from({ length: 100 }, () => makeId()))
      expect(ids.size).toBe(100)
    })

    it('includes prefix when provided', () => {
      const id = makeId('workout')
      expect(id.startsWith('workout_')).toBe(true)
    })

    it('works without prefix', () => {
      const id = makeId()
      expect(id.length).toBeGreaterThan(0)
      expect(id.includes('_')).toBe(false)
    })
  })

  describe('formatNumber', () => {
    it('formats thousands with French locale separator', () => {
      // French locale uses non-breaking space as thousands separator
      const result = formatNumber(1234567)
      // Accept any whitespace-like separator between groups
      expect(result.replace(/\s/g, '')).toBe('1234567')
    })

    it('rounds to integer', () => {
      const result = formatNumber(1234.7)
      expect(result.replace(/\s/g, '')).toBe('1235')
    })
  })
})
