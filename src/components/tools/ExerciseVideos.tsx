/**
 * ExerciseVideos.tsx
 *
 * Maps exercise IDs to YouTube video IDs for technique demonstrations.
 * Provides the <ExerciseVideoLink> component used next to exercise names
 * in workout views to link out to a reference video.
 */

// ---------------------------------------------------------------------------
// Video database  (exerciseId -> YouTube videoId)
// ---------------------------------------------------------------------------

const EXERCISE_VIDEOS: Record<string, string> = {
  // --- Chest ---------------------------------------------------------------
  barbell_bench_press: 'rT7DgCr-3pg',
  incline_barbell_bench: 'SrqOu55lrYU',
  dumbbell_bench_press: 'VmB1G1K7v94',
  incline_dumbbell_press: '8iPEnn-ltC8',
  dips: 'wjUmnZH528Y',
  cable_flyes: 'Iwe6AmxVf7o',
  pec_deck: 'Z57CtFmRMxA',

  // --- Back ----------------------------------------------------------------
  deadlift: 'op9kVnSso6Q',
  barbell_row: 'FWJR5Ve8bnQ',
  pull_ups: 'eGo4IYlbE5g',
  lat_pulldown_wide: '43VFn-CNGOQ',
  lat_pulldown_close: 'an1BMInTXLk',
  seated_cable_row: 'GZbfZ033f74',
  dumbbell_row: 'pYcpY20QaE8',
  t_bar_row: 'j3Igk5nyZE4',
  face_pulls: 'rep-qVOkqgk',

  // --- Legs ----------------------------------------------------------------
  back_squat: 'bEv6CCg2BC8',
  front_squat: 'wyDbagKS7Rg',
  leg_press: 'IZxyjW7MPJQ',
  romanian_deadlift: 'jEy_czb3RKA',
  leg_curl: '1Tq3QdYUuHs',
  leg_extension: 'YyvSfVjQeL0',
  hip_thrust: 'SEdqd1n0cvg',
  walking_lunges: 'D7KaRcUTQeE',
  calf_raises: 'gwLzBJYoWlI',
  bulgarian_split_squat: '2C-uNgKwPLE',

  // --- Shoulders -----------------------------------------------------------
  overhead_press: '_RlRDWO2jfg',
  dumbbell_shoulder_press: 'qEwKCR5JCog',
  lateral_raises: 'v_ZkxWzYnAk',
  front_raises: 'gzDO-IKDlqY',
  rear_delt_flyes: 'EA7u4Q_8HQ0',
  arnold_press: '6Z15_WdXmVw',

  // --- Arms ----------------------------------------------------------------
  barbell_curl: 'LY1V6UbRHo0',
  dumbbell_curl: 'ykJmrZ5v0Oo',
  hammer_curl: 'zC3nLlEvin4',
  preacher_curl: 'fIWP-FRFNU0',
  tricep_pushdown: '2-LAMcpzODU',
  skull_crushers: 'd_KZxkY_0cM',
  overhead_tricep_extension: '_gsUck-7M74',
  close_grip_bench: 'nEF0bv2FW94',

  // --- Core ----------------------------------------------------------------
  plank: 'ASdvN_XEl_c',
  hanging_leg_raises: 'hdng3Nm1x30',
  cable_crunch: 'AV5PmrIVoMY',
  ab_wheel_rollout: 'rqiTPEG0bQM',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExerciseVideoLinkProps {
  exerciseId: string
}

export function ExerciseVideoLink({ exerciseId }: ExerciseVideoLinkProps) {
  const videoId = EXERCISE_VIDEOS[exerciseId]
  if (!videoId) return null

  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'rgba(255,0,0,0.06)',
        color: '#ef4444',
        fontSize: '0.7rem',
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,0,0,0.14)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,0,0,0.06)'
      }}
      aria-label="Voir la technique en video"
    >
      ▶ Technique
    </a>
  )
}

// ---------------------------------------------------------------------------
// Utility: check if we have a video for an exercise
// ---------------------------------------------------------------------------

export function hasVideo(exerciseId: string): boolean {
  return exerciseId in EXERCISE_VIDEOS
}

export default ExerciseVideoLink
