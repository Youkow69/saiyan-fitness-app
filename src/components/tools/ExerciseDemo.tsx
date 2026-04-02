// ── ExerciseDemo.tsx ───────────────────────────────────────────────────────
// Displays exercise GIF/video demonstration.
// Uses musclewiki.com GIFs as a free source.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { getExerciseById } from '../../lib'

// Map exercise IDs to musclewiki.com GIF URLs (free, no API key needed)
// Format: https://musclewiki.com/media/uploads/videos/branded/{muscle}/{exercise}.mp4
const VIDEO_MAP: Record<string, string> = {
  // Compound lifts
  bench_press: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4',
  squat: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-squat-front.mp4',
  deadlift: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-deadlift-front.mp4',
  overhead_press: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-overhead-press-front.mp4',
  barbell_row: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-bent-over-row-front.mp4',

  // Upper body
  incline_bench: 'https://musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-bench-press-front.mp4',
  dip: 'https://musclewiki.com/media/uploads/videos/branded/male-bodyweight-dips-front.mp4',
  pull_up: 'https://musclewiki.com/media/uploads/videos/branded/male-bodyweight-pull-up-front.mp4',
  chin_up: 'https://musclewiki.com/media/uploads/videos/branded/male-bodyweight-chin-up-front.mp4',
  lat_pulldown: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-lat-pulldown-front.mp4',
  cable_row: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-seated-row-front.mp4',
  cable_fly: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-fly-front.mp4',
  lateral_raise: 'https://musclewiki.com/media/uploads/videos/branded/male-dumbbell-lateral-raise-front.mp4',
  face_pull: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-face-pull-front.mp4',
  bicep_curl: 'https://musclewiki.com/media/uploads/videos/branded/male-dumbbell-bicep-curl-front.mp4',
  hammer_curl: 'https://musclewiki.com/media/uploads/videos/branded/male-dumbbell-hammer-curl-front.mp4',
  tricep_pushdown: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-pushdown-front.mp4',

  // Lower body
  leg_press: 'https://musclewiki.com/media/uploads/videos/branded/male-machine-leg-press-front.mp4',
  leg_curl: 'https://musclewiki.com/media/uploads/videos/branded/male-machine-leg-curl-front.mp4',
  leg_extension: 'https://musclewiki.com/media/uploads/videos/branded/male-machine-leg-extension-front.mp4',
  calf_raise: 'https://musclewiki.com/media/uploads/videos/branded/male-machine-calf-raise-front.mp4',
  romanian_deadlift: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-romanian-deadlift-front.mp4',
  hip_thrust: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-hip-thrust-front.mp4',
  front_squat: 'https://musclewiki.com/media/uploads/videos/branded/male-barbell-front-squat-front.mp4',
  bulgarian_split_squat: 'https://musclewiki.com/media/uploads/videos/branded/male-dumbbell-bulgarian-split-squat-front.mp4',

  // Core
  plank: 'https://musclewiki.com/media/uploads/videos/branded/male-bodyweight-plank-front.mp4',
  hanging_leg_raise: 'https://musclewiki.com/media/uploads/videos/branded/male-bodyweight-hanging-leg-raise-front.mp4',
  cable_crunch: 'https://musclewiki.com/media/uploads/videos/branded/male-cable-crunch-front.mp4',
}

interface Props {
  exerciseId: string
  compact?: boolean
}

export function ExerciseDemo({ exerciseId, compact }: Props) {
  const [showVideo, setShowVideo] = useState(false)
  const [error, setError] = useState(false)
  const exercise = getExerciseById(exerciseId)
  const videoUrl = VIDEO_MAP[exerciseId]

  if (!videoUrl) {
    if (compact) return null
    return (
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        fontSize: '0.75rem', color: 'var(--text-secondary, #888)',
        textAlign: 'center',
      }}>
        {'\U0001f3ac'} D\u00e9mo non disponible
      </div>
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setShowVideo(!showVideo)}
        style={{
          background: showVideo ? 'rgba(59,130,246,0.12)' : 'transparent',
          border: 'none', cursor: 'pointer', fontSize: '0.7rem',
          padding: '2px 6px', borderRadius: 4,
          color: showVideo ? '#3b82f6' : 'var(--text-secondary, #888)',
        }}
        title="Voir la d\u00e9mo"
      >
        {'\U0001f3ac'}
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowVideo(!showVideo)}
        style={{
          width: '100%', padding: '8px', borderRadius: 10, marginBottom: 8,
          border: '1px solid var(--border, #333)',
          background: showVideo ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
          color: showVideo ? '#3b82f6' : 'var(--text-secondary)',
          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        {'\U0001f3ac'} {showVideo ? 'Masquer la d\u00e9mo' : 'Voir la d\u00e9mo'}
      </button>

      {showVideo && !error && (
        <div style={{
          borderRadius: 12, overflow: 'hidden', marginBottom: 8,
          border: '1px solid var(--border, #333)',
        }}>
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setError(true)}
            style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'contain', background: '#000' }}
          />
          <div style={{
            padding: '6px 10px', background: 'var(--bg-card)',
            fontSize: '0.72rem', color: 'var(--text-secondary)',
          }}>
            {exercise?.name} - {exercise?.primaryMuscles?.join(', ')}
          </div>
        </div>
      )}
      {error && showVideo && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Vid\u00e9o non disponible
        </p>
      )}
    </div>
  )
}
