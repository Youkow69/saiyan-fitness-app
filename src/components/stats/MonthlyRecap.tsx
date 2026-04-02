import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getTotalVolume, countPRs, getExerciseById } from '../../lib'
import { ShareButton } from '../tools/ShareCard'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(Math.round(v))
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// ── Component ──────────────────────────────────────────────────────────────

export function MonthlyRecap() {
  const { state } = useAppState()

  const recap = useMemo(() => {
    const monthStart = getMonthStart()
    const monthWorkouts = state.workouts.filter(w => (w.date ?? '') >= monthStart)

    // Total volume
    const totalVolume = getTotalVolume(monthWorkouts)

    // Average duration
    const avgDuration = monthWorkouts.length > 0
      ? Math.round(monthWorkouts.reduce((s, w) => s + (w.durationMinutes ?? 0), 0) / monthWorkouts.length)
      : 0

    // Most trained muscles
    const muscleCount: Record<string, number> = {}
    monthWorkouts.forEach(w => w.exercises.forEach(e => {
      const ex = getExerciseById(e.exerciseId)
      if (ex) ex.primaryMuscles.forEach(m => { muscleCount[m] = (muscleCount[m] || 0) + e.sets.length })
    }))
    const topMuscles = Object.entries(muscleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // PRs this month
    const prCount = countPRs({ workouts: monthWorkouts } as any)

    // Weight change (first vs last bodyweight entry this month)
    const monthBW = state.bodyweightEntries.filter(e => (e.date ?? '') >= monthStart)
    const weightChange = monthBW.length >= 2
      ? +(monthBW[monthBW.length - 1].weightKg - monthBW[0].weightKg).toFixed(1)
      : null

    const firstWeight = monthBW.length > 0 ? monthBW[0].weightKg : null
    const lastWeight = monthBW.length > 0 ? monthBW[monthBW.length - 1].weightKg : null

    // Nutrition adherence (days with food entries / days elapsed this month)
    const today = new Date()
    const daysElapsed = today.getDate()
    const daysWithFood = new Set(
      state.foodEntries
        .filter(e => (e.date ?? '') >= monthStart)
        .map(e => e.date)
    ).size
    const nutritionAdherence = daysElapsed > 0 ? Math.round((daysWithFood / daysElapsed) * 100) : 0

    // Streak record this month
    const monthDates = [...new Set(monthWorkouts.map(w => w.date))].sort()
    let maxStreak = 0
    let currentStreak = 0
    for (let i = 0; i < monthDates.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prev = new Date(monthDates[i - 1] + 'T12:00:00')
        const curr = new Date(monthDates[i] + 'T12:00:00')
        const diff = (curr.getTime() - prev.getTime()) / 86400000
        currentStreak = diff <= 1 ? currentStreak + 1 : 1
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak
    }

    return {
      sessions: monthWorkouts.length,
      volume: totalVolume,
      avgDuration,
      topMuscles,
      prCount,
      weightChange,
      firstWeight,
      lastWeight,
      nutritionAdherence,
      maxStreak,
    }
  }, [state.workouts, state.bodyweightEntries, state.foodEntries])

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // ── Share content builder ──────────────────────────────────────────────

  const shareText = useMemo(() => {
    const lines = [
      `Recap ${monthLabel}`,
      `${recap.sessions} seances | Volume: ${formatVolume(recap.volume)} kg`,
      `Duree moy: ${recap.avgDuration} min`,
      recap.prCount > 0 ? `${recap.prCount} PR ce mois` : null,
      recap.weightChange !== null
        ? `Poids: ${recap.weightChange > 0 ? '+' : ''}${recap.weightChange} kg`
        : null,
      `Nutrition: ${recap.nutritionAdherence}%`,
      `Record serie: ${recap.maxStreak} j`,
    ].filter(Boolean)
    return lines.join('\n')
  }, [recap, monthLabel])

  // ── Render ─────────────────────────────────────────────────────────────

  if (recap.sessions === 0) {
    return (
      <section className="hevy-card" style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
          Aucune seance ce mois-ci. Commence a t'entrainer pour voir ton recap mensuel !
        </p>
      </section>
    )
  }

  return (
    <section className="hevy-card stack-md" style={{
      background: 'linear-gradient(135deg, rgba(255,140,0,0.08) 0%, rgba(255,69,0,0.05) 100%)',
      border: '1px solid rgba(255,140,0,0.2)',
      borderRadius: 16,
      padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent)', fontWeight: 700 }}>
            Recap mensuel
          </span>
          <h3 style={{ margin: '2px 0 0', textTransform: 'capitalize', fontSize: '1.1rem' }}>{monthLabel}</h3>
        </div>
        <ShareButton text={shareText} label="Partager" />
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginTop: 8,
      }}>
        <StatTile icon="🏋️" label="Seances" value={String(recap.sessions)} />
        <StatTile icon="📊" label="Volume total" value={`${formatVolume(recap.volume)} kg`} />
        <StatTile icon="⏱️" label="Duree moy." value={`${recap.avgDuration} min`} />
        <StatTile icon="🏆" label="Records (PR)" value={String(recap.prCount)} accent={recap.prCount > 0} />
        <StatTile
          icon="⚖️"
          label="Poids"
          value={
            recap.weightChange !== null
              ? `${recap.weightChange > 0 ? '+' : ''}${recap.weightChange} kg`
              : '—'
          }
          subtitle={
            recap.firstWeight && recap.lastWeight
              ? `${recap.firstWeight} -> ${recap.lastWeight} kg`
              : undefined
          }
        />
        <StatTile icon="🥗" label="Nutrition" value={`${recap.nutritionAdherence}%`} />
        <StatTile icon="🔥" label="Record serie" value={`${recap.maxStreak} j`} accent={recap.maxStreak >= 3} />
      </div>

      {/* Top muscles */}
      {recap.topMuscles.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Muscles les plus travailles</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {recap.topMuscles.map(([muscle, sets]) => (
              <span key={muscle} style={{
                background: 'rgba(255,140,0,0.12)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 600,
              }}>
                {muscle} ({sets} series)
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Sub-component: stat tile ─────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: string
  label: string
  value: string
  subtitle?: string
  accent?: boolean
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: '12px 14px',
      border: '1px solid var(--stroke)',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{
        fontSize: '1.15rem',
        fontWeight: 800,
        color: accent ? 'var(--accent)' : 'var(--text)',
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
