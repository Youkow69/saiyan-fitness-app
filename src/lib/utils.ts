// ── Generic Utilities ────────────────────────────────────────────────────────

import { exercises } from '../data'
import type { Exercise } from '../types'

/** Generates a unique ID, optionally prefixed. */
export function makeId(prefix?: string): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  return prefix ? `${prefix}_${id}` : id
}

/** Formats a number with French locale (space-separated thousands). */
export function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

/** Looks up an exercise by ID from the exercises data. */
export function getExerciseById(id: string): Exercise | null {
  const found = exercises.find((exercise) => exercise.id === id)
  if (!found) {
    console.warn(`[Saiyan] Exercise not found: ${id}`)
    return null
  }
  return found
}
