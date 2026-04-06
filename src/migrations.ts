// src/migrations.ts — Schema migration system for localStorage state
// Each migration transforms state from version N to N+1

import type { AppState } from './types'

export const CURRENT_SCHEMA_VERSION = 2

type Migration = {
  version: number
  migrate: (state: any) => any
}

const migrations: Migration[] = [
  {
    // v1 -> v2: Add measurements array, schemaVersion, customFoods defaults
    version: 2,
    migrate: (state: any) => {
      const migrated = { ...state }
      if (!Array.isArray(migrated.measurementEntries)) {
        const existing = migrated.measurementEntries
        migrated.measurementEntries = existing ? [{ ...existing, date: new Date().toISOString().slice(0, 10) }] : []
      }
      if (!Array.isArray(migrated.customFoods)) {
        migrated.customFoods = []
      }
      if (!Array.isArray(migrated.dailyQuestProgress)) {
        migrated.dailyQuestProgress = []
      }
      migrated.schemaVersion = 2
      return migrated
    },
  },
]

export function migrateState(state: any): AppState {
  if (!state) return state
  let current = { ...state }
  const currentVersion = current.schemaVersion || 1

  for (const m of migrations) {
    if (m.version > currentVersion) {
      console.log(`[Migration] Applying v${m.version}...`)
      current = m.migrate(current)
    }
  }

  current.schemaVersion = CURRENT_SCHEMA_VERSION
  return current as AppState
}
