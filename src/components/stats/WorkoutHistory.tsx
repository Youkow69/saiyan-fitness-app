import { useState, useMemo } from 'react'
import type { WorkoutLog } from '../../types'
import { getExerciseById, getWorkoutVolume, formatNumber } from '../../lib'

interface WorkoutHistoryProps {
  workouts: WorkoutLog[]
  onDelete?: (id: string) => void
}

const PAGE_SIZE = 15

export function WorkoutHistory({ workouts, onDelete }: WorkoutHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')

  const filtered = useMemo(() => {
    let result = [...workouts].sort((a, b) => b.date.localeCompare(a.date))

    if (filter) {
      const q = filter.toLowerCase()
      result = result.filter(w =>
        w.exercises.some(e => {
          const def = getExerciseById(e.exerciseId)
          return (def?.name || e.exerciseId).toLowerCase().includes(q)
        }) || (w.sessionName || '').toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter(w => w.date >= dateFrom)
    }

    return result
  }, [workouts, filter, dateFrom])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (workouts.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
        Aucune seance enregistree
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          placeholder="Rechercher exercice..."
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0) }}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: '0.78rem',
          }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(0) }}
          style={{
            padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: '0.72rem',
          }}
        />
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 6 }}>
        {filtered.length} seance{filtered.length > 1 ? 's' : ''}
        {totalPages > 1 && ` — page ${page + 1}/${totalPages}`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {paginated.map((w) => {
          const volume = getWorkoutVolume(w)
          const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0)
          const isExpanded = expandedId === w.id

          return (
            <div key={w.id} style={{
              background: 'var(--bg-card)', borderRadius: 12,
              border: '1px solid var(--stroke)', overflow: 'hidden',
            }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
                type="button"
                style={{
                  width: '100%', padding: '10px 14px', background: 'transparent',
                  border: 'none', color: 'var(--text)', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {w.sessionName || w.date}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                    {w.date} · {w.exercises.length} exo{w.exercises.length > 1 ? 's' : ''} · {totalSets} series · {formatNumber(volume)} kg
                  </div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--stroke)' }}>
                  {w.exercises.map((ex, i) => {
                    const exercise = getExerciseById(ex.exerciseId)
                    return (
                      <div key={i} style={{ padding: '8px 0', borderBottom: i < w.exercises.length - 1 ? '1px solid var(--stroke)' : 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>
                          {exercise?.name || ex.exerciseId}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {ex.sets.map((set, j) => (
                            <div key={j} style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--muted)' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: 30 }}>#{j + 1}</span>
                              <span>{set.weightKg} kg</span>
                              <span>x {set.reps}</span>
                              {set.rir !== undefined && <span style={{ color: 'var(--accent-orange)' }}>RIR {set.rir}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => { if (window.confirm('Supprimer cette seance ?')) onDelete(w.id) }}
                      style={{
                        marginTop: 8, padding: '6px 12px', borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                        color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: page === 0 ? 'transparent' : 'var(--bg-card)',
              color: page === 0 ? 'var(--muted)' : 'var(--text)',
              fontSize: '0.78rem', cursor: page === 0 ? 'default' : 'pointer',
            }}
          >
            Precedent
          </button>
          <span style={{ padding: '6px 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
            {page + 1}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: page >= totalPages - 1 ? 'transparent' : 'var(--bg-card)',
              color: page >= totalPages - 1 ? 'var(--muted)' : 'var(--text)',
              fontSize: '0.78rem', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
