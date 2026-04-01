import { useCallback, useRef } from 'react'
import { supabase } from './supabase'
import type { AppState } from '../types'
import type { User } from '@supabase/supabase-js'

export function useCloudSync(user: User | null) {
  const syncingRef = useRef(false)

  // Upload local state to cloud
  const pushToCloud = useCallback(async (state: AppState) => {
    if (!user || syncingRef.current) return
    syncingRef.current = true
    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({
          user_id: user.id,
          state_data: state,
          app_version: '1.0',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (error) console.warn('[Saiyan Cloud] Push error:', error.message)
    } catch (e) {
      console.warn('[Saiyan Cloud] Push failed:', e)
    } finally {
      syncingRef.current = false
    }
  }, [user])

  // Pull cloud state
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
    } catch (e) {
      console.warn('[Saiyan Cloud] Steps sync failed:', e)
    }
  }, [user])

  return { pushToCloud, pullFromCloud, syncSteps }
}
