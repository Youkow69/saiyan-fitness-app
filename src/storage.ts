import type { AppState } from './types'

const STORAGE_KEY = 'saiyan-fitness-v1'

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Stockage plein ! Les donnees risquent de ne pas etre sauvegardees.')
    }
  }
}

export const debouncedSave = debounce(saveState, 500)
