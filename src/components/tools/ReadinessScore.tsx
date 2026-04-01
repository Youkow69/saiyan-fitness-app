// =============================================================================
// ReadinessScore.tsx
// Readiness score combining Steps sync data + training history.
// Honest heuristic, French labels, dark theme, ARIA.
// =============================================================================

import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { todayIso, daysAgoIso } from '../../lib'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadinessComponent {
  name: string
  score: number
  maxScore: number
  detail: string
}

interface ReadinessResult {
  score: number
  label: string
  recommendation: 'push' | 'normal' | 'easy' | 'deload' | 'rest'
  explanation: string
  components: ReadinessComponent[]
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function computeReadiness(state: any): ReadinessResult {
  // Read Saiyan Steps sync data from localStorage
  let syncData = { steps: 0, sleepHours: 0, waterGlasses: 0 }
  try {
    const raw = localStorage.getItem('saiyan_tracker_sync')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.date === todayIso()) {
        syncData = {
          steps: parsed.steps || 0,
          sleepHours: parsed.sleepHours || 0,
          waterGlasses: parsed.waterGlasses || 0,
        }
      }
    }
  } catch {
    // localStorage unavailable or corrupt -- default to 0
  }

  const components: ReadinessComponent[] = []

  // ---- 1. Sleep (0-25 pts) ----
  // 7-9h = full, <5h = 0, 5-7h = partial
  let sleepScore: number
  if (syncData.sleepHours >= 7) {
    sleepScore = 25
  } else if (syncData.sleepHours >= 5) {
    sleepScore = Math.round(((syncData.sleepHours - 5) / 2) * 25)
  } else {
    sleepScore = 0
  }
  components.push({
    name: 'Sommeil',
    score: sleepScore,
    maxScore: 25,
    detail:
      syncData.sleepHours > 0
        ? `${syncData.sleepHours}h de sommeil`
        : 'Pas de donnees (connecte Saiyan Steps)',
  })

  // ---- 2. Activity / Steps (0-20 pts) ----
  // 8000+ = full, <3000 = 5 (sedentary penalty), 3000-8000 = partial
  let stepsScore: number
  if (syncData.steps >= 8000) {
    stepsScore = 20
  } else if (syncData.steps >= 3000) {
    stepsScore = Math.round(((syncData.steps - 3000) / 5000) * 20)
  } else {
    stepsScore = syncData.steps > 0 ? 5 : 0
  }
  components.push({
    name: 'Activite',
    score: stepsScore,
    maxScore: 20,
    detail:
      syncData.steps > 0
        ? `${syncData.steps.toLocaleString('fr-FR')} pas`
        : 'Pas de donnees',
  })

  // ---- 3. Hydration (0-15 pts) ----
  // 8+ glasses = full, <4 = 0
  let waterScore: number
  if (syncData.waterGlasses >= 8) {
    waterScore = 15
  } else if (syncData.waterGlasses >= 4) {
    waterScore = Math.round(((syncData.waterGlasses - 4) / 4) * 15)
  } else {
    waterScore = 0
  }
  components.push({
    name: 'Hydratation',
    score: waterScore,
    maxScore: 15,
    detail:
      syncData.waterGlasses > 0
        ? `${syncData.waterGlasses} verres`
        : 'Pas de donnees',
  })

  // ---- 4. Muscle recovery (0-25 pts) ----
  // Hours since last workout
  const workouts = state.workouts || []
  const lastWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null
  let recoveryScore = 25
  let recoveryDetail = "Pas d'entrainement recent"

  if (lastWorkout) {
    const hoursSince =
      (Date.now() - new Date(lastWorkout.date + 'T12:00:00').getTime()) / 3_600_000

    if (hoursSince < 12) recoveryScore = 5
    else if (hoursSince < 24) recoveryScore = 12
    else if (hoursSince < 36) recoveryScore = 18
    else if (hoursSince < 48) recoveryScore = 22
    // else stays 25

    recoveryDetail = `Dernier entrainement : ${lastWorkout.date}`
  }
  components.push({
    name: 'Recuperation musculaire',
    score: recoveryScore,
    maxScore: 25,
    detail: recoveryDetail,
  })

  // ---- 5. Training load (0-15 pts) ----
  // Sessions in last 7 days -- overreaching detection
  const sevenDaysAgo = daysAgoIso(7)
  const last7Workouts = workouts.filter((w: any) => w.date >= sevenDaysAgo).length
  let loadScore: number
  if (last7Workouts <= 2) loadScore = 15
  else if (last7Workouts <= 4) loadScore = 12
  else if (last7Workouts <= 5) loadScore = 8
  else loadScore = 3
  components.push({
    name: "Charge d'entrainement",
    score: loadScore,
    maxScore: 15,
    detail: `${last7Workouts} seance${last7Workouts > 1 ? 's' : ''} cette semaine`,
  })

  // ---- Aggregate ----
  const totalScore = components.reduce((sum, c) => sum + c.score, 0)

  let label: string
  let recommendation: ReadinessResult['recommendation']
  let explanation: string

  if (totalScore >= 80) {
    label = 'Pret a tout donner'
    recommendation = 'push'
    explanation =
      'Tes indicateurs sont bons. Tu peux viser des performances elevees aujourd\'hui.'
  } else if (totalScore >= 60) {
    label = 'Bonne forme'
    recommendation = 'normal'
    explanation =
      'Entrainement normal recommande. Ecoute ton corps pendant la seance.'
  } else if (totalScore >= 40) {
    label = 'Recuperation en cours'
    recommendation = 'easy'
    explanation =
      'Privilegie une seance legere ou technique. La recuperation est aussi de l\'entrainement.'
  } else if (totalScore >= 20) {
    label = 'Fatigue'
    recommendation = 'deload'
    explanation =
      'Un deload ou une seance tres legere serait plus productif qu\'une seance intense.'
  } else {
    label = 'Repos recommande'
    recommendation = 'rest'
    explanation =
      'Ton corps a besoin de repos. Un jour off aujourd\'hui te rendra plus fort demain.'
  }

  // Honesty disclaimer
  explanation +=
    '\n\nNote : Ce score est une estimation heuristique basee sur tes donnees disponibles, pas un diagnostic medical.'

  return { score: totalScore, label, recommendation, explanation, components }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReadinessScore() {
  const { state } = useAppState()
  const readiness = useMemo(() => computeReadiness(state), [state.workouts])

  const scoreColor =
    readiness.score >= 80
      ? '#22c55e'
      : readiness.score >= 60
        ? '#f59e0b'
        : readiness.score >= 40
          ? '#FF8C00'
          : '#ef4444'

  const recommendationLabel: Record<ReadinessResult['recommendation'], string> = {
    push: 'Pousse fort',
    normal: 'Normal',
    easy: 'Seance legere',
    deload: 'Deload',
    rest: 'Repos',
  }

  return (
    <div
      style={{
        background: 'var(--bg-card, #1a1a2e)',
        borderRadius: 16,
        border: '1px solid var(--border, #2a2a40)',
        padding: 16,
      }}
      role="region"
      aria-label="Score de disponibilite"
    >
      {/* Title */}
      <h3
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--accent, #FF6B00)',
          margin: '0 0 12px',
        }}
      >
        Readiness -- Senzu Check
      </h3>

      {/* Big score circle + label */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}
        aria-live="polite"
      >
        {/* SVG circular gauge */}
        <div
          style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}
          role="img"
          aria-label={`Score : ${readiness.score} sur 100`}
        >
          <svg
            viewBox="0 0 36 36"
            style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--border, #2a2a40)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={scoreColor}
              strokeWidth="3"
              strokeDasharray={`${readiness.score} ${100 - readiness.score}`}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: scoreColor,
            }}
          >
            {readiness.score}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e0e0e0)' }}>
            {readiness.label}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary, #888)',
              marginTop: 2,
            }}
          >
            Recommandation :{' '}
            <strong style={{ color: scoreColor }}>
              {recommendationLabel[readiness.recommendation]}
            </strong>
          </div>
        </div>
      </div>

      {/* Component breakdown bars */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        role="list"
        aria-label="Composantes du score"
      >
        {readiness.components.map((c) => {
          const ratio = c.maxScore > 0 ? c.score / c.maxScore : 0
          const barColor =
            ratio >= 0.7 ? '#22c55e' : ratio >= 0.4 ? '#f59e0b' : '#ef4444'

          return (
            <div key={c.name} role="listitem">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  marginBottom: 3,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text, #e0e0e0)' }}>
                  {c.name}
                </span>
                <span style={{ color: 'var(--text-secondary, #888)' }}>
                  {c.score}/{c.maxScore}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: 'var(--border, #2a2a40)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
                role="progressbar"
                aria-valuenow={c.score}
                aria-valuemin={0}
                aria-valuemax={c.maxScore}
                aria-label={`${c.name} : ${c.score} sur ${c.maxScore}`}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${ratio * 100}%`,
                    background: barColor,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary, #888)',
                  marginTop: 2,
                }}
              >
                {c.detail}
              </div>
            </div>
          )
        })}
      </div>

      {/* Explanation */}
      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 10,
          border: '1px solid var(--border, #2a2a40)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--text-secondary, #888)',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
          }}
        >
          {readiness.explanation}
        </p>
      </div>
    </div>
  )
}

export default ReadinessScore
