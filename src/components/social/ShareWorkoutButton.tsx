import React, { useState } from 'react'
import { supabase } from '../../supabase'
import { getExerciseById, getWorkoutVolume } from '../../lib'
import { showToast } from '../ui/Toast'
import type { WorkoutLog } from '../../types'
import { useAppState } from '../../context/AppContext'

interface ShareWorkoutButtonProps {
  workout: WorkoutLog
  onShared?: () => void
}

export const ShareWorkoutButton: React.FC<ShareWorkoutButtonProps> = ({ workout, onShared }) => {
  const { state } = useAppState()
  const [sharing, setSharing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const volume = getWorkoutVolume(workout)
  const exerciseCount = workout.exercises.length
  const exerciseNames = workout.exercises
    .map(ex => getExerciseById(ex.exerciseId)?.name || ex.exerciseId)
    .join(', ')

  const handleShare = async () => {
    setSharing(true)
    try {
      const prs: string[] = []
      workout.exercises.forEach(ex => {
        const name = getExerciseById(ex.exerciseId)?.name || ex.exerciseId
        let prevMax = 0
        state.workouts.forEach(w => {
          if (w.date >= workout.date) return
          const prevEx = w.exercises.find(e => e.exerciseId === ex.exerciseId)
          if (prevEx) prevEx.sets.forEach(s => { if (s.weightKg > prevMax) prevMax = s.weightKg })
        })
        ex.sets.forEach(s => {
          if (s.weightKg > prevMax && prevMax > 0) {
            prs.push(name + ': ' + s.weightKg + 'kg x ' + s.reps)
            prevMax = s.weightKg
          }
        })
      })

      const { error } = await supabase.from('workout_shares').insert({
        username: state.profile?.name || 'Saiyan',
        avatar_level: Math.min(9, Math.floor((state.workouts.length || 0) / 10)),
        workout_date: workout.date,
        session_name: workout.sessionName || 'Entra\u00eenement',
        duration_min: workout.durationMinutes,
        total_volume: volume,
        exercises_summary: exerciseNames,
        prs,
      })

      if (error) throw error
      showToast('S\u00e9ance partag\u00e9e avec succ\u00e8s !', 'success')
      setShowPreview(false)
      onShared?.()
    } catch (err) {
      console.warn('[ShareWorkout] Error:', err)
      showToast('Erreur lors du partage (table non disponible ?)', 'error')
    }
    setSharing(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          border: '1px dashed var(--accent)',
          background: 'rgba(255,140,0,0.06)',
          color: 'var(--accent)', fontWeight: 600,
          fontSize: '0.82rem', cursor: 'pointer',
        }}
      >
        {'\uD83D\uDCE4'} Partager
      </button>

      {showPreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card, #1a1a1a)',
            borderRadius: 16, padding: 20, maxWidth: 360, width: '100%',
            border: '2px solid var(--accent)',
            boxShadow: '0 0 40px rgba(255,140,0,0.2)',
          }}>
            <h3 style={{
              margin: '0 0 12px', textAlign: 'center',
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem',
            }}>
              {'\uD83D\uDD25'} Aper\u00e7u du partage
            </h3>

            <div style={{
              background: 'var(--border, #2d3748)', borderRadius: 12, padding: 14,
              marginBottom: 16,
            }}>
              <h4 style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: '0.95rem' }}>
                {workout.sessionName || 'Entra\u00eenement'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {workout.durationMinutes}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>min</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {exerciseCount}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>exercices</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffd700' }}>
                    {Math.round(volume).toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>volume total</div>
                </div>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {exerciseNames}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: 'none', background: 'var(--accent)',
                  color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                  opacity: sharing ? 0.6 : 1,
                }}
              >
                {sharing ? 'Envoi...' : '\uD83D\uDE80 Partager'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}