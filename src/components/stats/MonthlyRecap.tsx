import { useMemo } from 'react'
import { useAppState } from '../../context/AppContext'
import { getTotalVolume, getExerciseById } from '../../lib'

const MUSCLE_FR: Record<string, string> = {
  Chest: 'Pectoraux', Back: 'Dos', Shoulders: 'Epaules',
  Quads: 'Quadriceps', Hamstrings: 'Ischio-jambiers', Glutes: 'Fessiers',
  Calves: 'Mollets', Core: 'Abdominaux', Biceps: 'Biceps', Triceps: 'Triceps',
}

export function MonthlyRecap() {
  const { state } = useAppState()

  const recap = useMemo(() => {
    const now = new Date()
    const monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'
    const monthWorkouts = state.workouts.filter(w => (w.date ?? '') >= monthStart)
    const volume = getTotalVolume(monthWorkouts)
    const avgDuration = monthWorkouts.length > 0
      ? Math.round(monthWorkouts.reduce((s, w) => s + (w.durationMinutes ?? 0), 0) / monthWorkouts.length)
      : 0
    const muscleCount: Record<string, number> = {}
    monthWorkouts.forEach(w => w.exercises.forEach(e => {
      const ex = getExerciseById(e.exerciseId)
      if (ex) ex.primaryMuscles.forEach(m => { muscleCount[m] = (muscleCount[m] || 0) + e.sets.length })
    }))
    const topMuscles = Object.entries(muscleCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const monthBW = state.bodyweightEntries.filter(e => (e.date ?? '') >= monthStart)
    const weightChange = monthBW.length >= 2
      ? Math.round((monthBW[monthBW.length - 1].weightKg - monthBW[0].weightKg) * 10) / 10
      : 0
    return { sessions: monthWorkouts.length, volume, avgDuration, topMuscles, weightChange }
  }, [state.workouts, state.bodyweightEntries])

  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (recap.sessions === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 16 }}>
      <h3 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 12px' }}>
        Recap {month}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Seances', value: String(recap.sessions), color: 'var(--accent)' },
          { label: 'Volume', value: recap.volume.toLocaleString('fr-FR') + ' kg', color: 'var(--info, #3b82f6)' },
          { label: 'Duree moy.', value: recap.avgDuration + ' min', color: 'var(--success, #22c55e)' },
          { label: 'Poids', value: (recap.weightChange >= 0 ? '+' : '') + recap.weightChange + ' kg', color: recap.weightChange >= 0 ? 'var(--warning)' : 'var(--info)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '10px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {recap.topMuscles.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>MUSCLES LES PLUS TRAVAILLES</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {recap.topMuscles.map(([m, count]) => (
              <span key={m} style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,140,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,140,0,0.15)' }}>
                {MUSCLE_FR[m] || m} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
