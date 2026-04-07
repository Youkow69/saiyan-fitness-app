// ── FeedView.tsx ──────────────────────────────────────────────────────────────
// Social feed: share workouts, see other Saiyans' training.
// "Le tournoi des guerriers"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById, getWorkoutVolume } from '../../lib'
import { supabase } from '../../supabase'
import { showToast } from '../ui/Toast'
import type { WorkoutLog } from '../../types'

interface SharedWorkout {
  id: string
  user_id: string
  username: string
  avatar_level: number
  workout_date: string
  session_name: string
  duration_min: number
  total_volume: number
  exercises_summary: string
  prs: string[]
  likes: number
  liked_by_me: boolean
  created_at: string
}

export function FeedView() {
  const { state } = useAppState()
  const [feed, setFeed] = useState<SharedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workout_shares')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      setFeed((data || []).map((d: Record<string, unknown>) => ({
        ...d,
        prs: Array.isArray(d.prs) ? d.prs as string[] : [],
        liked_by_me: false,
      })) as SharedWorkout[])
    } catch (err) {
      console.warn('[Feed] Load error:', err)
      // Show demo data if table doesn't exist yet
      setFeed(getDemoFeed())
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  const shareWorkout = async (workout: WorkoutLog) => {
    setSharing(true)
    try {
      const volume = getWorkoutVolume(workout)
      const exercisesSummary = workout.exercises
        .map(ex => getExerciseById(ex.exerciseId)?.name || ex.exerciseId)
        .join(', ')

      // Detect PRs: check if any set beats previous max for that exercise
      const prs: string[] = []
      workout.exercises.forEach(ex => {
        const name = getExerciseById(ex.exerciseId)?.name || ex.exerciseId
        // Find previous max for this exercise
        let prevMax = 0
        state.workouts.forEach(w => {
          if (w.date >= workout.date) return
          const prevEx = w.exercises.find(e => e.exerciseId === ex.exerciseId)
          if (prevEx) prevEx.sets.forEach(s => { if (s.weightKg > prevMax) prevMax = s.weightKg })
        })
        ex.sets.forEach(s => {
          if (s.weightKg > prevMax && prevMax > 0) {
            prs.push(name + ': ' + s.weightKg + 'kg x ' + s.reps)
            prevMax = s.weightKg // only count once per exercise
          }
        })
      })

      const { error } = await supabase.from('workout_shares').insert({
        username: state.profile?.name || 'Saiyan',
        avatar_level: Math.min(9, Math.floor((state.workouts.length || 0) / 10)),
        workout_date: workout.date,
        session_name: workout.sessionName || 'Entraînement',
        duration_min: workout.durationMinutes,
        total_volume: volume,
        exercises_summary: exercisesSummary,
        prs,
      })

      if (error) throw error
      showToast('Séance partagée !', 'success')
      loadFeed()
    } catch (err) {
      showToast('Erreur de partage', 'error')
      console.warn('[Feed] Share error:', err)
    }
    setSharing(false)
  }

  const toggleLike = async (id: string) => {
    // Capture current state before optimistic update
    const item = feed.find(f => f.id === id)
    if (!item) return
    const newLikes = item.liked_by_me ? item.likes - 1 : item.likes + 1
    setFeed(prev => prev.map(f =>
      f.id === id ? { ...f, likes: newLikes, liked_by_me: !f.liked_by_me } : f
    ))
    try {
      await supabase.from('workout_shares').update({ likes: newLikes }).eq('id', id)
    } catch { /* optimistic update fallback */ }
  }

  const lastWorkout = state.workouts.length > 0 ? state.workouts[state.workouts.length - 1] : null

  return (
    <div className="page">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{
          fontFamily: "'Bebas Neue', 'Orbitron', sans-serif", fontSize: '1.4rem',
          letterSpacing: '0.08em', margin: '0 0 4px',
          background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {'🔥'} Tournoi des Guerriers
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #888)', margin: 0 }}>
          Vois les combats des autres Saiyans !
        </p>
      </div>

      {/* Share last workout button */}
      {lastWorkout && (
        <button
          type="button"
          onClick={() => shareWorkout(lastWorkout)}
          disabled={sharing}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: '1px dashed var(--accent)',
            background: 'rgba(255,140,0,0.06)', color: 'var(--accent)',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: 16,
          }}
        >
          {sharing ? 'Partage en cours...' : `📤 Partager: ${lastWorkout.sessionName || 'Dernière séance'}`}
        </button>
      )}

      {/* Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
          Chargement du tournoi...
        </div>
      ) : feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Aucune séance partagée. Sois le premier !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feed.map(item => (
            <div key={item.id} style={{
              background: 'var(--bg-card, #1a1a1a)', borderRadius: 14,
              border: '1px solid var(--border, #333)', padding: '12px 14px',
            }}>
              {/* User header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${item.avatar_level >= 5 ? '#ffd700' : '#ff8c00'}, ${item.avatar_level >= 7 ? '#ff4500' : '#666'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', color: '#000',
                }}>
                  {item.avatar_level}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.username}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #888)' }}>{item.workout_date}</div>
                </div>
              </div>

              {/* Workout info */}
              <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem' }}>{item.session_name}</h4>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>{'⏱'} {item.duration_min} min</span>
                <span>{'💪'} {Math.round(item.total_volume).toLocaleString()} kg</span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #888)', margin: '0 0 6px' }}>
                {item.exercises_summary}
              </p>

              {/* PRs */}
              {item.prs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {item.prs.map((pr, i) => (
                    <span key={i} style={{
                      padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(255,215,0,0.12)', color: '#ffd700',
                      fontSize: '0.68rem', fontWeight: 600,
                    }}>
                      {'🏆'} {pr}
                    </span>
                  ))}
                </div>
              )}

              {/* Like button */}
              <button type="button" onClick={() => toggleLike(item.id)} style={{
                background: item.liked_by_me ? 'rgba(239,68,68,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                color: item.liked_by_me ? '#ef4444' : 'var(--text-secondary, #888)',
                fontSize: '0.78rem', fontWeight: item.liked_by_me ? 700 : 400,
              }}>
                {item.liked_by_me ? '❤️' : '🤍'} {item.likes || 0}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Demo data when Supabase table doesn't exist yet
function getDemoFeed(): SharedWorkout[] {
  return [
    {
      id: 'demo1', user_id: 'demo', username: 'Goku', avatar_level: 9,
      workout_date: new Date().toISOString().slice(0, 10), session_name: 'Push Day - Salle du temps',
      duration_min: 62, total_volume: 12450, exercises_summary: 'Bench Press, OHP, Dips, Cable Fly',
      prs: ['Bench Press: 120kg x 5'], likes: 7, liked_by_me: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo2', user_id: 'demo2', username: 'Vegeta', avatar_level: 8,
      workout_date: new Date().toISOString().slice(0, 10), session_name: 'Leg Day - Gravité x300',
      duration_min: 75, total_volume: 18200, exercises_summary: 'Squat, RDL, Leg Press, Lunges',
      prs: ['Squat: 180kg x 3', 'RDL: 140kg x 8'], likes: 12, liked_by_me: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo3', user_id: 'demo3', username: 'Gohan', avatar_level: 6,
      workout_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), session_name: 'Pull Day',
      duration_min: 48, total_volume: 9800, exercises_summary: 'Pull-ups, Barbell Row, Curls',
      prs: [], likes: 3, liked_by_me: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}
