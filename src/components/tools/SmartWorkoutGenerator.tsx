// ── SmartWorkoutGenerator.tsx ──────────────────────────────────────────────
// Generates workout suggestions using Gemini AI based on fatigue & history.
// Theme: "Whis analyse ton ki et programme ton entra\u00eenement"
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getExerciseById } from '../../lib'
import { showToast } from '../ui/Toast'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase'

interface GeneratedExercise {
  exerciseId: string
  name: string
  sets: number
  repMin: number
  repMax: number
  restSeconds: number
  targetRir: number
  reason: string
}

interface GeneratedWorkout {
  name: string
  focus: string
  exercises: GeneratedExercise[]
  explanation: string
}

export function SmartWorkoutGenerator({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppState()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedWorkout | null>(null)
  const [error, setError] = useState('')
  const [preferences, setPreferences] = useState({
    duration: '45',
    focus: 'auto',
    intensity: 'moderate',
  })

  const generateWorkout = async () => {
    setLoading(true)
    setError('')

    // Build context from user data
    const recentWorkouts = state.workouts.slice(-5).map(w => ({
      date: w.date,
      exercises: w.exercises.map(ex => ({
        name: getExerciseById(ex.exerciseId)?.name || ex.exerciseId,
        muscles: getExerciseById(ex.exerciseId)?.primaryMuscles || [],
        sets: ex.sets.length,
        avgRir: ex.sets.length > 0
          ? (ex.sets.reduce((s, set) => s + set.rir, 0) / ex.sets.length).toFixed(1)
          : 'N/A',
      })),
    }))

    const profile = state.profile || { goal: 'muscle_gain', experienceLevel: 'intermediate' }
    const prompt = `Tu es Whis, le coach d'entra\u00eenement de l'univers Dragon Ball.
Analyse l'historique d'entra\u00eenement et g\u00e9n\u00e8re une s\u00e9ance optimale.

Profil: ${profile.goal || 'muscle_gain'}, exp\u00e9rience: ${profile.experienceLevel || 'intermediate'}
Dur\u00e9e souhait\u00e9e: ${preferences.duration} min
Focus: ${preferences.focus === 'auto' ? 'automatique (selon la fatigue)' : preferences.focus}
Intensit\u00e9: ${preferences.intensity}

Derniers entra\u00eenements:
${JSON.stringify(recentWorkouts, null, 2)}

R\u00e9ponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "name": "Nom de la s\u00e9ance (th\u00e8me DBZ)",
  "focus": "muscles cibl\u00e9s",
  "exercises": [
    {
      "exerciseId": "id_exercice_existant",
      "name": "Nom de l'exercice",
      "sets": 3,
      "repMin": 8,
      "repMax": 12,
      "restSeconds": 90,
      "targetRir": 2,
      "reason": "Courte raison du choix"
    }
  ],
  "explanation": "Explication g\u00e9n\u00e9rale de la s\u00e9ance en 2-3 phrases, style Whis"
}

Utilise uniquement des exercices parmi: bench_press, squat, deadlift, overhead_press, barbell_row, pull_up, chin_up, dip, lat_pulldown, cable_row, leg_press, leg_curl, leg_extension, calf_raise, lateral_raise, face_pull, bicep_curl, tricep_pushdown, hammer_curl, incline_bench, cable_fly, romanian_deadlift, hip_thrust, front_squat, bulgarian_split_squat, plank, hanging_leg_raise, cable_crunch.
Limite-toi \u00e0 5-8 exercices.`

    try {
      const session = await supabase.auth.getSession()
      const authToken = session?.data?.session?.access_token || ''

      const resp = await fetch(SUPABASE_URL + '/functions/v1/coach-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (authToken || SUPABASE_ANON_KEY),
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!resp.ok) {
        throw new Error('Erreur ' + resp.status)
      }

      const data = await resp.json()
      const text = data.reply || data.choices?.[0]?.message?.content || ''

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('R\u00e9ponse IA invalide')

      const parsed: GeneratedWorkout = JSON.parse(jsonMatch[0])
      setResult(parsed)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const startGeneratedWorkout = () => {
    if (!result) return
    const exercises = result.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      target: {
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        repMin: ex.repMin,
        repMax: ex.repMax,
        targetRir: ex.targetRir,
        restSeconds: ex.restSeconds,
      },
      sets: [],
    }))

    dispatch({
      type: 'START_WORKOUT',
      payload: {
        programId: 'ai_generated',
        sessionId: 'ai_' + Date.now(),
        sessionName: result.name,
        exercises,
        startedAt: new Date().toISOString(),
      },
    })
    showToast('S\u00e9ance IA lanc\u00e9e !', 'success')
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card, #1a1a1a)', borderRadius: 20,
        border: '1px solid var(--border, #333)', maxWidth: 500,
        width: '100%', maxHeight: '85vh', overflow: 'auto', padding: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            {'\u2728'} G\u00e9n\u00e9rateur IA - Whis
          </h2>
          <button type="button" onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            fontSize: '1.2rem', cursor: 'pointer', padding: 4,
          }}>{'\u2715'}</button>
        </div>

        {!result ? (
          <>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #888)', margin: '0 0 16px' }}>
              Whis analyse ton ki et programme ton entra\u00eenement optimal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Dur\u00e9e (min)</span>
                <select value={preferences.duration} onChange={e => setPreferences(p => ({ ...p, duration: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="75">75 min</option>
                  <option value="90">90 min</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Focus musculaire</span>
                <select value={preferences.focus} onChange={e => setPreferences(p => ({ ...p, focus: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}>
                  <option value="auto">Auto (selon fatigue)</option>
                  <option value="chest_triceps">Pecs / Triceps</option>
                  <option value="back_biceps">Dos / Biceps</option>
                  <option value="legs">Jambes</option>
                  <option value="shoulders">Epaules</option>
                  <option value="full_body">Full Body</option>
                  <option value="upper">Haut du corps</option>
                  <option value="lower">Bas du corps</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Intensit\u00e9</span>
                <select value={preferences.intensity} onChange={e => setPreferences(p => ({ ...p, intensity: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}>
                  <option value="light">L\u00e9g\u00e8re (deload)</option>
                  <option value="moderate">Mod\u00e9r\u00e9e</option>
                  <option value="hard">Intense</option>
                  <option value="max">Maximale</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={generateWorkout}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? 'var(--border)' : 'linear-gradient(135deg, #ff8c00, #ffd700)',
                color: '#000', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Whis analyse ton ki...' : '\u2728 G\u00e9n\u00e9rer ma s\u00e9ance'}
            </button>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 8 }}>{error}</p>
            )}
          </>
        ) : (
          <>
            <div style={{
              background: 'rgba(255,215,0,0.08)', borderRadius: 12, padding: 12,
              border: '1px solid rgba(255,215,0,0.2)', marginBottom: 12,
            }}>
              <h3 style={{ margin: '0 0 4px', color: 'var(--accent-gold, #ffd700)', fontSize: '0.95rem' }}>
                {result.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Focus: {result.focus}
              </p>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 12px' }}>
              {result.explanation}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {result.exercises.map((ex, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  padding: '10px 12px', border: '1px solid var(--border, #333)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{ex.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
                      {ex.sets}x{ex.repMin}-{ex.repMax}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {ex.reason} | Repos {ex.restSeconds}s | RIR {ex.targetRir}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setResult(null)} style={{
                flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text)', fontWeight: 600,
                fontSize: '0.85rem', cursor: 'pointer',
              }}>
                Reg\u00e9n\u00e9rer
              </button>
              <button type="button" onClick={startGeneratedWorkout} style={{
                flex: 2, padding: 12, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #ff8c00, #ffd700)',
                color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
              }}>
                Commencer cette s\u00e9ance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
