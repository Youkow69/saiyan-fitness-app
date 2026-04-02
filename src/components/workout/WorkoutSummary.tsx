// ── WorkoutSummary.tsx ───────────────────────────────────────────────────────
// Post-workout celebration screen with DBZ-themed gold/orange animations.
// Shows duration, volume, sets, power level gain, and personal records.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import { getWorkoutVolume, estimate1Rm, getExerciseById, getPowerLevel } from '../../lib'
import type { WorkoutLog } from '../../types'

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  workout: WorkoutLog
  previousPowerLevel: number
  onClose: () => void
}

// ── Styles (injected once) ───────────────────────────────────────────────────

const STYLE_ID = 'workout-summary-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes ws-goldFlash {
      0%   { opacity: 1; }
      50%  { opacity: 0.6; }
      100% { opacity: 0; }
    }
    @keyframes ws-fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ws-scaleIn {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes ws-countUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ws-pulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.05); }
    }
    @keyframes ws-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes ws-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes ws-prBounce {
      0%   { transform: scale(0.5) rotate(-5deg); opacity: 0; }
      60%  { transform: scale(1.15) rotate(2deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .ws-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,0.92);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-y: auto;
    }
    .ws-gold-flash {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      background: radial-gradient(ellipse at center, rgba(255,200,0,0.5) 0%, rgba(255,140,0,0.3) 40%, transparent 80%);
      animation: ws-goldFlash 1.8s ease-out forwards;
    }
    .ws-content {
      max-width: 420px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: ws-fadeInUp 0.6s ease-out 0.3s both;
    }
    .ws-title {
      font-size: 1.6rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 3px;
      text-align: center;
      background: linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ws-shimmer 3s linear infinite, ws-scaleIn 0.5s ease-out 0.5s both;
    }
    .ws-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary, #888);
      text-align: center;
      margin-top: -8px;
      animation: ws-fadeInUp 0.5s ease-out 0.8s both;
    }
    .ws-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
      animation: ws-fadeInUp 0.5s ease-out 1s both;
    }
    .ws-stat-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,140,0,0.15);
      border-radius: 14px;
      padding: 14px 10px;
      text-align: center;
      transition: transform 0.2s;
    }
    .ws-stat-card:hover {
      transform: translateY(-2px);
    }
    .ws-stat-value {
      font-size: 1.4rem;
      font-weight: 900;
      color: #ffd700;
      font-variant-numeric: tabular-nums;
    }
    .ws-stat-label {
      font-size: 0.62rem;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .ws-power-section {
      width: 100%;
      text-align: center;
      animation: ws-fadeInUp 0.5s ease-out 1.3s both;
    }
    .ws-power-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary, #888);
      font-weight: 600;
      margin-bottom: 8px;
    }
    .ws-power-number {
      font-size: 3rem;
      font-weight: 900;
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .ws-power-gain {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      background: rgba(34,197,94,0.12);
      color: #22c55e;
      font-weight: 700;
      font-size: 0.85rem;
      margin-top: 8px;
      animation: ws-pulse 1.5s ease-in-out infinite;
    }
    .ws-power-bar {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      margin-top: 12px;
      overflow: hidden;
    }
    .ws-power-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, #ff8c00, #ffd700);
      transition: width 1.5s ease-out;
    }
    .ws-prs-section {
      width: 100%;
      animation: ws-fadeInUp 0.5s ease-out 1.8s both;
    }
    .ws-prs-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #ffd700;
      margin-bottom: 10px;
    }
    .ws-pr-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: rgba(255,215,0,0.04);
      border: 1px solid rgba(255,215,0,0.15);
      border-radius: 12px;
      margin-bottom: 8px;
      animation: ws-prBounce 0.4s ease-out both;
    }
    .ws-pr-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ffd700, #ff8c00);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .ws-pr-info {
      flex: 1;
      min-width: 0;
    }
    .ws-pr-exercise {
      font-size: 0.82rem;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ws-pr-detail {
      font-size: 0.7rem;
      color: var(--text-secondary, #888);
      margin-top: 2px;
    }
    .ws-close-btn {
      width: 100%;
      max-width: 420px;
      padding: 16px;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #ff8c00, #ffd700);
      color: #000;
      font-weight: 800;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: transform 0.1s;
      animation: ws-fadeInUp 0.5s ease-out 2.2s both;
    }
    .ws-close-btn:active {
      transform: scale(0.97);
    }
    .ws-aura-ring {
      position: absolute;
      width: 200px;
      height: 200px;
      border: 2px solid rgba(255,140,0,0.08);
      border-radius: 50%;
      animation: ws-rotate 12s linear infinite;
      pointer-events: none;
    }
    .ws-exercises-summary {
      width: 100%;
      animation: ws-fadeInUp 0.5s ease-out 1.6s both;
    }
    .ws-exercise-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.78rem;
    }
    .ws-exercise-row:last-child { border-bottom: none; }
  `
  document.head.appendChild(style)
}

// ── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1500, delay: number = 1000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const step = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(target * eased))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])

  return value
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`
  return `${vol} kg`
}

// ── Main Component ───────────────────────────────────────────────────────────

export function WorkoutSummary({ workout, previousPowerLevel, onClose }: Props) {
  const { state } = useAppState()
  const [showFlash, setShowFlash] = useState(true)

  // Inject styles
  useEffect(() => { injectStyles() }, [])

  // Gold flash timing
  useEffect(() => {
    const timer = setTimeout(() => setShowFlash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  // ── Compute stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const volume = getWorkoutVolume(workout)
    const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)
    const totalReps = workout.exercises.reduce(
      (s, e) => s + e.sets.reduce((r, set) => r + set.reps, 0), 0,
    )
    const newPowerLevel = getPowerLevel(state)
    const powerGain = newPowerLevel - previousPowerLevel

    // Detect PRs: compare each exercise's best e1RM in this workout
    // against historical best from all previous workouts
    const prs: { exercise: string; weight: number; reps: number; e1rm: number; prevBest: number }[] = []

    workout.exercises.forEach(ex => {
      // Find historical best e1RM for this exercise (excluding current workout)
      let historicalBest = 0
      state.workouts.forEach(w => {
        if (w.id === workout.id) return
        const wEx = w.exercises.find(e => e.exerciseId === ex.exerciseId)
        if (!wEx) return
        wEx.sets.forEach(set => {
          const e1rm = estimate1Rm(set.weightKg, set.reps)
          if (e1rm > historicalBest) historicalBest = e1rm
        })
      })

      // Find best e1RM in current workout for this exercise
      let bestSet = { weightKg: 0, reps: 0, e1rm: 0 }
      ex.sets.forEach(set => {
        const e1rm = estimate1Rm(set.weightKg, set.reps)
        if (e1rm > bestSet.e1rm) {
          bestSet = { weightKg: set.weightKg, reps: set.reps, e1rm }
        }
      })

      // Is it a PR?
      if (bestSet.e1rm > historicalBest && historicalBest > 0) {
        const exerciseData = getExerciseById(ex.exerciseId)
        prs.push({
          exercise: exerciseData?.name ?? ex.exerciseId.replace(/_/g, ' '),
          weight: bestSet.weightKg,
          reps: bestSet.reps,
          e1rm: Math.round(bestSet.e1rm),
          prevBest: Math.round(historicalBest),
        })
      }
    })

    // Exercise summaries
    const exerciseSummaries = workout.exercises.map(ex => {
      const exerciseData = getExerciseById(ex.exerciseId)
      const bestWeight = Math.max(...ex.sets.map(s => s.weightKg), 0)
      const bestReps = Math.max(...ex.sets.map(s => s.reps), 0)
      return {
        name: exerciseData?.name ?? ex.exerciseId.replace(/_/g, ' '),
        setsCount: ex.sets.length,
        bestWeight,
        bestReps,
      }
    })

    return {
      volume,
      totalSets,
      totalReps,
      powerGain,
      newPowerLevel,
      prs,
      duration: workout.durationMinutes || 0,
      exerciseSummaries,
    }
  }, [workout, state, previousPowerLevel])

  // Animated counters
  const animatedPower = useAnimatedCounter(stats.newPowerLevel, 1800, 1300)
  const animatedVolume = useAnimatedCounter(stats.volume, 1200, 1000)
  const animatedSets = useAnimatedCounter(stats.totalSets, 800, 1000)

  // Power bar fill percentage (relative to next transformation threshold)
  const powerBarFill = useMemo(() => {
    // Simple percentage, capped at 100
    const thresholds = [0, 2000, 8000, 20000, 50000, 100000]
    const nextThreshold = thresholds.find(t => t > stats.newPowerLevel) ?? thresholds[thresholds.length - 1]
    const prevThreshold = [...thresholds].reverse().find(t => t <= stats.newPowerLevel) ?? 0
    const range = nextThreshold - prevThreshold
    if (range <= 0) return 100
    return Math.min(((stats.newPowerLevel - prevThreshold) / range) * 100, 100)
  }, [stats.newPowerLevel])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="ws-overlay">
      {/* Gold flash overlay */}
      {showFlash && <div className="ws-gold-flash" />}

      {/* Decorative aura rings */}
      <div className="ws-aura-ring" style={{ opacity: 0.4 }} />
      <div className="ws-aura-ring" style={{ width: 300, height: 300, opacity: 0.2, animationDirection: 'reverse', animationDuration: '18s' }} />

      <div className="ws-content">
        {/* ── Title ───────────────────────────────────────────────────── */}
        <div className="ws-title">
          SÉANCE TERMINÉE
        </div>
        <div className="ws-subtitle">
          {workout.sessionName || 'Entraînement'} — {formatDuration(stats.duration)}
        </div>

        {/* ── Stats grid ──────────────────────────────────────────────── */}
        <div className="ws-stats-grid">
          <div className="ws-stat-card">
            <div className="ws-stat-value">{formatDuration(stats.duration)}</div>
            <div className="ws-stat-label">Durée</div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-value">{formatVolume(animatedVolume)}</div>
            <div className="ws-stat-label">Volume</div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-value">{animatedSets}</div>
            <div className="ws-stat-label">Séries</div>
          </div>
        </div>

        {/* ── Power Level section ─────────────────────────────────────── */}
        <div className="ws-power-section">
          <div className="ws-power-label">Niveau de Puissance</div>
          <div className="ws-power-number">{animatedPower.toLocaleString('fr-FR')}</div>
          {stats.powerGain > 0 && (
            <div className="ws-power-gain">
              ▲ +{stats.powerGain.toLocaleString('fr-FR')}
            </div>
          )}
          {stats.powerGain === 0 && (
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-secondary, #888)' }}>
              Niveau stable
            </div>
          )}
          <div className="ws-power-bar">
            <div
              className="ws-power-fill"
              style={{ width: `${powerBarFill}%` }}
            />
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', marginTop: 4 }}>
            Progression vers la prochaine transformation
          </div>
        </div>

        {/* ── Personal Records ────────────────────────────────────────── */}
        {stats.prs.length > 0 && (
          <div className="ws-prs-section">
            <div className="ws-prs-title">
              <span>🏆</span>
              <span>Records Personnels ({stats.prs.length})</span>
            </div>
            {stats.prs.map((pr, idx) => (
              <div
                key={idx}
                className="ws-pr-item"
                style={{ animationDelay: `${2 + idx * 0.2}s` }}
              >
                <div className="ws-pr-badge">PR</div>
                <div className="ws-pr-info">
                  <div className="ws-pr-exercise">{pr.exercise}</div>
                  <div className="ws-pr-detail">
                    {pr.weight} kg × {pr.reps} reps — e1RM: {pr.e1rm} kg
                    <span style={{ color: '#22c55e', marginLeft: 6 }}>
                      (+{pr.e1rm - pr.prevBest} kg)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Exercise breakdown ──────────────────────────────────────── */}
        <div className="ws-exercises-summary">
          <div style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-secondary, #888)',
            fontWeight: 600,
            marginBottom: 8,
          }}>
            Détail des exercices
          </div>
          {stats.exerciseSummaries.map((ex, idx) => (
            <div key={idx} className="ws-exercise-row">
              <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ex.name}
              </span>
              <span style={{ color: 'var(--text-secondary, #888)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                {ex.setsCount} séries — {ex.bestWeight} kg max
              </span>
            </div>
          ))}
        </div>

        {/* ── Motivational quote ──────────────────────────────────────── */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.78rem',
          fontStyle: 'italic',
          color: 'var(--text-secondary, #888)',
          padding: '0 20px',
          animation: 'ws-fadeInUp 0.5s ease-out 2s both',
        }}>
          {stats.prs.length > 0
            ? 'Tu as d\u00e9pass\u00e9 tes limites. Le pouvoir du Super Saiyan coule en toi.'
            : 'Chaque s\u00e9ance te rapproche de ta transformation ultime.'
          }
        </div>

        {/* ── Close button ────────────────────────────────────────────── */}
        <button
          className="ws-close-btn"
          onClick={onClose}
          type="button"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

export default WorkoutSummary
