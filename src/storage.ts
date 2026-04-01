import type { AppState } from './types'

const STORAGE_KEY = 'saiyan-fitness-v1'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.workouts)) parsed.workouts = []
    if (!Array.isArray(parsed.foodEntries)) parsed.foodEntries = []
    if (!Array.isArray(parsed.bodyweightEntries)) parsed.bodyweightEntries = []
    if (!Array.isArray(parsed.customRoutines)) parsed.customRoutines = []
    if (!Array.isArray(parsed.savedMeals)) parsed.savedMeals = []
    if (typeof parsed.completedDailyQuests !== 'object' || parsed.completedDailyQuests === null) parsed.completedDailyQuests = {}
    if (typeof parsed.programCursor !== 'object' || parsed.programCursor === null) parsed.programCursor = {}
    return parsed as AppState
  } catch (e) {
    console.warn('[Saiyan] Failed to load state:', e)
    return null
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('[Saiyan] localStorage FULL!')
    }
    return false
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export const debouncedSave = debounce(saveState, 300)
