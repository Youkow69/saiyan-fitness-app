import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getTotalVolume, getStreak, daysAgoIso, getExerciseById } from '../../lib'
import { ShareButton } from '../tools/ShareCard'
import type { WorkoutLog } from '../../types'

function getWeekWorkouts(workouts: WorkoutLog[], weeksAgo: number): WorkoutLog[] {
  const today = new Date()
  today.setDate(today.getDate() - weeksAgo * 7)
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const monStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  const sunStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
  return workouts.filter(w => (w.date ?? '') >= monStr && (w.date ?? '') <= sunStr)
}

function getThisWeekWorkouts(workouts: WorkoutLog[]): WorkoutLog[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  return workouts.filter(w => (w.date ?? '') >= mondayStr)
}

export function WeeklyReport() {
  const { state } = useAppState()

  const report = useMemo(() => {
    const weekWorkouts = getThisWeekWorkouts(state.workouts)
    const weekVolume = getTotalVolume(weekWorkouts)
    const totalSets = weekWorkouts.reduce((t, w) => t + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0)
    const totalDuration = weekWorkouts.reduce((t, w) => t + (w.durationMinutes ?? 0), 0)
    const streak = getStreak(state)
    // PRs tracked via lib // total PRs (can't easily filter to this week only)

    // Muscles worked this week
    const musclesWorked = new Set<string>()
    weekWorkouts.forEach(w => w.exercises.forEach(e => {
      const def = getExerciseById(e.exerciseId)
      if (def) {
        def.primaryMuscles.forEach(m => musclesWorked.add(m))
        def.secondaryMuscles.forEach(m => musclesWorked.add(m))
      }
    }))

    // Avg daily calories this week
    let totalCal = 0
    let daysTracked = 0
    for (let i = 0; i < 7; i++) {
      const d = daysAgoIso(i)
      const dayCal = state.foodEntries.filter(f => f.date === d).reduce((s, f) => s + f.calories, 0)
      if (dayCal > 0) { totalCal += dayCal; daysTracked++ }
    }
    const avgCal = daysTracked > 0 ? Math.round(totalCal / daysTracked) : 0

    // S-1 comparison
    const prevWeekWorkouts = getWeekWorkouts(state.workouts, 1)
    const prevVolume = getTotalVolume(prevWeekWorkouts)
    const prevSets = prevWeekWorkouts.reduce((t: number, w: WorkoutLog) => t + w.exercises.reduce((s: number, e) => s + e.sets.length, 0), 0)
    const prevSessions = prevWeekWorkouts.length

    return {
      sessions: weekWorkouts.length,
      volume: weekVolume,
      sets: totalSets,
      duration: totalDuration,
      streak,
      prs: 0,
      muscleCount: musclesWorked.size,
      avgCalories: avgCal,
      prevSessions,
      prevVolume,
      prevSets,
    }
  }, [state.workouts, state.foodEntries])

  const shareData = {
    type: 'weekly' as const,
    title: 'Rapport hebdomadaire',
    stats: [
      { label: 'Séances', value: String(report.sessions) },
      { label: 'Volume total', value: `${report.volume.toLocaleString('fr-FR')} kg` },
      { label: 'Séries', value: String(report.sets) },
      { label: 'Durée totale', value: `${report.duration} min` },
    ],
    accentColor: '#FF8C00',
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>
          Résumé de la semaine
        </h3>
        <ShareButton data={shareData} label="Partager" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { icon: '', label: 'Séances', value: report.sessions, color: 'var(--accent)' },
          { icon: '', label: 'Volume', value: `${report.volume.toLocaleString('fr-FR')} kg`, color: 'var(--info, #3b82f6)' },
          { icon: '', label: 'Séries', value: report.sets, color: 'var(--warning, #f59e0b)' },
          { icon: '', label: 'Durée', value: `${report.duration} min`, color: 'var(--success, #22c55e)' },
          { icon: '', label: 'Streak', value: `${report.streak} jours`, color: '#FF4500' },
          { icon: '', label: 'Cal/jour moy.', value: report.avgCalories > 0 ? `${report.avgCalories} kcal` : '\u2014', color: 'var(--calories, #FF8C00)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* vs Semaine precedente */}
      {report.prevSessions > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>vs Semaine precedente</div>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Seances', curr: report.sessions, prev: report.prevSessions },
              { label: 'Volume', curr: report.volume, prev: report.prevVolume },
              { label: 'Series', curr: report.sets, prev: report.prevSets },
            ].map(d => {
              const pct = d.prev > 0 ? Math.round(((d.curr - d.prev) / d.prev) * 100) : 0
              const color = pct > 0 ? '#22c55e' : pct < 0 ? '#ef4444' : 'var(--muted)'
              const arrow = pct > 0 ? '\u2191' : pct < 0 ? '\u2193' : '='
              return (
                <span key={d.label} style={{ color }}>
                  {arrow} {d.label}: {pct > 0 ? '+' : ''}{pct}%
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
