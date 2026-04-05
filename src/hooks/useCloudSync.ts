import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import type { AppState } from '../types'

interface SyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncedAt: string | null
  error: string | null
  retryCount: number
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [5000, 15000, 30000] // exponential backoff

export function useCloudSync(user: any) {
  const syncingRef = useRef(false)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'idle', lastSyncedAt: null, error: null, retryCount: 0 as number,
  })

  // BUG-F3: cleanup retry timeout on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = undefined
      }
    }
  }, [])

  // Upload local state to cloud with retry logic
  const pushToCloud = useCallback(async (state: AppState) => {
    if (!user || syncingRef.current) return
    syncingRef.current = true
    setSyncStatus(s => ({ ...s, state: 'syncing', error: null }))
    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({
          user_id: user.id,
          state_data: state,
          app_version: '2.0',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (error) throw error
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = undefined
      }
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null, retryCount: 0 })
    } catch (e: any) {
      const msg = e?.message?.includes('fetch') ? 'Pas de connexion' : (e?.message || 'Erreur sync')
      setSyncStatus(s => {
        const retries = s.retryCount + 1
        if (retries <= MAX_RETRIES) {
          retryTimeoutRef.current = setTimeout(() => pushToCloud(state), RETRY_DELAYS[retries - 1] || 30000)
        }
        return { state: 'error', lastSyncedAt: s.lastSyncedAt, error: msg, retryCount: retries }
      })
    } finally {
      syncingRef.current = false
    }
  }, [user])

  // Timestamp-based pull + merge to prevent data loss
  const pullAndMerge = useCallback(async (localState: AppState): Promise<AppState | null> => {
    if (!user || syncingRef.current) return null
    syncingRef.current = true
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state_data, updated_at')
        .eq('user_id', user.id)
        .single()
      if (error || !data) return null

      const cloudState = data.state_data as AppState
      const cloudTime = new Date(data.updated_at).getTime()

      // Merge workouts by ID to prevent data loss
      const localIds = new Set(localState.workouts.map(w => w.id))
      const cloudOnly = (cloudState.workouts || []).filter(w => !localIds.has(w.id))

      const merged: AppState = {
        ...localState,
        // Merge workouts: keep all local + add cloud-only
        workouts: [...localState.workouts, ...cloudOnly],
        // For profile: use whichever was updated more recently (within last minute = cloud)
        profile: cloudTime > Date.now() - 60000 ? (cloudState.profile || localState.profile) : localState.profile,
        targets: cloudTime > Date.now() - 60000 ? (cloudState.targets || localState.targets) : localState.targets,
      }

      return merged
    } catch {
      return null // Network error - stay with local
    } finally {
      syncingRef.current = false
    }
  }, [user])

  // Legacy pullFromCloud for backward compatibility
  const pullFromCloud = useCallback(async (): Promise<AppState | null> => {
    if (!user) return null
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state_data, updated_at')
        .eq('user_id', user.id)
        .single()
      if (error || !data) return null
      return data.state_data as AppState
    } catch {
      return null
    }
  }, [user])

  // Sync steps data to cloud
  const syncSteps = useCallback(async (date: string, steps: number, sleepHours: number, waterGlasses: number) => {
    if (!user) return
    try {
      await supabase
        .from('steps_sync')
        .upsert({
          user_id: user.id,
          date,
          steps,
          sleep_hours: sleepHours,
          water_glasses: waterGlasses,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,date' })
    } catch { /* silently fail */ }
  }, [user])

  return { pushToCloud, pullFromCloud, pullAndMerge, syncSteps, syncStatus }
}
