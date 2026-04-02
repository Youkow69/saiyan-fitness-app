import React, { useEffect, useRef } from 'react'
import { showToast } from '../ui/Toast'

// ── Feature levels ──────────────────────────────────────────────────
//
// Level 0  (0-4 workouts)  : Basic logging only
// Level 1  (5+)            : RIR, set types, timer
// Level 2  (15+)           : Volume landmarks, charts, OpenFoodFacts
// Level 3  (30+)           : Adaptive TDEE, mesocycle, auto-deload
// Level 4  (50+)           : Program builder, saga cards

export function getFeatureLevel(totalWorkouts: number): number {
  if (totalWorkouts >= 50) return 4
  if (totalWorkouts >= 30) return 3
  if (totalWorkouts >= 15) return 2
  if (totalWorkouts >= 5) return 1
  return 0
}

// ── Level metadata ──────────────────────────────────────────────────
interface LevelInfo {
  level: number
  threshold: number
  title: string
  features: string[]
}

export const LEVEL_INFO: LevelInfo[] = [
  {
    level: 0,
    threshold: 0,
    title: 'Recrue',
    features: ['Enregistrement des seances', 'Suivi des exercices de base'],
  },
  {
    level: 1,
    threshold: 5,
    title: 'Apprenti',
    features: ['RIR (Reps In Reserve)', 'Types de series avances', 'Timer de repos'],
  },
  {
    level: 2,
    threshold: 15,
    title: 'Combattant',
    features: ['Reperes de volume', 'Graphiques de progression', 'OpenFoodFacts'],
  },
  {
    level: 3,
    threshold: 30,
    title: 'Elite',
    features: ['TDEE adaptatif', 'Gestion des mesocycles', 'Auto-deload'],
  },
  {
    level: 4,
    threshold: 50,
    title: 'Legende',
    features: ['Constructeur de programmes', 'Saga Cards', 'Classement guerriers'],
  },
]

export function getLevelInfo(level: number): LevelInfo {
  return LEVEL_INFO[Math.min(level, LEVEL_INFO.length - 1)]
}

export function getNextUnlock(totalWorkouts: number): { workoutsLeft: number; info: LevelInfo } | null {
  const currentLevel = getFeatureLevel(totalWorkouts)
  const next = LEVEL_INFO.find((l) => l.level === currentLevel + 1)
  if (!next) return null
  return { workoutsLeft: next.threshold - totalWorkouts, info: next }
}

// ── FeatureGate component ───────────────────────────────────────────
interface FeatureGateProps {
  level: number
  current: number
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ level, current, children, fallback }: FeatureGateProps) {
  if (current < level) {
    return fallback ? <>{fallback}</> : null
  }
  return <>{children}</>
}

// ── Locked feature placeholder ──────────────────────────────────────
interface LockedFeatureProps {
  level: number
  current: number
  featureName: string
}

export function LockedFeature({ level, current, featureName }: LockedFeatureProps) {
  if (current >= level) return null

  const info = getLevelInfo(level)
  const workoutsNeeded = LEVEL_INFO[level].threshold - current

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px dashed var(--border)',
        padding: 16,
        textAlign: 'center',
        opacity: 0.6,
      }}
    >
      <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>?</div>
      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {featureName}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
        Debloque au niveau {info.title} ({workoutsNeeded} seance{workoutsNeeded > 1 ? 's' : ''} restante{workoutsNeeded > 1 ? 's' : ''})
      </p>
    </div>
  )
}

// ── Unlock toast watcher ────────────────────────────────────────────
const UNLOCK_STORAGE_KEY = 'sf_last_unlocked_level'

export function FeatureUnlockWatcher({ totalWorkouts }: { totalWorkouts: number }) {
  const currentLevel = getFeatureLevel(totalWorkouts)
  const prevLevelRef = useRef<number | null>(null)

  useEffect(() => {
    // Read previously stored level
    const stored = localStorage.getItem(UNLOCK_STORAGE_KEY)
    const storedLevel = stored !== null ? parseInt(stored, 10) : 0
    prevLevelRef.current = storedLevel

    if (currentLevel > storedLevel) {
      const info = getLevelInfo(currentLevel)
      showToast(
        `Niveau ${info.title} debloque ! Nouvelles fonctionnalites : ${info.features.join(', ')}`,
        'success',
      )
      localStorage.setItem(UNLOCK_STORAGE_KEY, String(currentLevel))
      prevLevelRef.current = currentLevel
    }
  }, [currentLevel])

  return null
}

// ── Progress bar toward next level ──────────────────────────────────
export function LevelProgressBar({ totalWorkouts }: { totalWorkouts: number }) {
  const currentLevel = getFeatureLevel(totalWorkouts)
  const currentInfo = getLevelInfo(currentLevel)
  const nextUnlock = getNextUnlock(totalWorkouts)

  if (!nextUnlock) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>
          Niveau max atteint : {currentInfo.title}
        </span>
      </div>
    )
  }

  const prevThreshold = LEVEL_INFO[currentLevel].threshold
  const nextThreshold = nextUnlock.info.threshold
  const progress = ((totalWorkouts - prevThreshold) / (nextThreshold - prevThreshold)) * 100

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {currentInfo.title}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {nextUnlock.info.title} dans {nextUnlock.workoutsLeft} seance{nextUnlock.workoutsLeft > 1 ? 's' : ''}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          background: '#ffffff0a',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 4,
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #FF8C00, #FF6B00)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}
