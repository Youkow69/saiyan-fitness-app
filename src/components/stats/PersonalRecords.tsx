import { useMemo, useState } from 'react'

export interface PRWorkoutSet {
  exerciseId: string
  weight: number
  reps: number
}

export interface PRWorkoutLog {
  id: string
  date: string
  exercises: PRWorkoutSet[]
}

export interface PRExercise {
  id: string
  name: string
}

interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  bestWeight: number
  bestWeightDate: string
  bestReps: number
  bestRepsWeight: number
  bestRepsDate: string
  estimated1RM: number
  best1RMDate: string
  isRecentPR: boolean
}

type SortField = 'name' | 'weight' | 'reps' | '1rm'
type SortDir = 'asc' | 'desc'

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

function formatPowerLevel(value: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return diff < days * 24 * 60 * 60 * 1000 && diff >= 0
}

export function PersonalRecords({
  workouts,
  exercises,
}: {
  workouts: PRWorkoutLog[]
  exercises: PRExercise[]
}) {
  const [sortField, setSortField] = useState<SortField>('1rm')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState('')

  const records = useMemo(() => {
    const exerciseMap = new Map<string, string>()
    exercises.forEach((ex) => exerciseMap.set(ex.id, ex.name))

    const prMap = new Map<
      string,
      {
        bestWeight: number
        bestWeightDate: string
        bestReps: number
        bestRepsWeight: number
        bestRepsDate: string
        best1RM: number
        best1RMDate: string
      }
    >()

    workouts.forEach((w) => {
      w.exercises.forEach((set) => {
        const current = prMap.get(set.exerciseId) || {
          bestWeight: 0,
          bestWeightDate: '',
          bestReps: 0,
          bestRepsWeight: 0,
          bestRepsDate: '',
          best1RM: 0,
          best1RMDate: '',
        }

        if (set.weight > current.bestWeight) {
          current.bestWeight = set.weight
          current.bestWeightDate = w.date
        }

        if (set.reps > current.bestReps || (set.reps === current.bestReps && set.weight > current.bestRepsWeight)) {
          current.bestReps = set.reps
          current.bestRepsWeight = set.weight
          current.bestRepsDate = w.date
        }

        const e1rm = estimate1RM(set.weight, set.reps)
        if (e1rm > current.best1RM) {
          current.best1RM = e1rm
          current.best1RMDate = w.date
        }

        prMap.set(set.exerciseId, current)
      })
    })

    const result: PersonalRecord[] = []
    prMap.forEach((data, exerciseId) => {
      const isRecentPR =
        isWithinDays(data.bestWeightDate, 7) ||
        isWithinDays(data.bestRepsDate, 7) ||
        isWithinDays(data.best1RMDate, 7)

      result.push({
        exerciseId,
        exerciseName: exerciseMap.get(exerciseId) || exerciseId,
        bestWeight: data.bestWeight,
        bestWeightDate: data.bestWeightDate,
        bestReps: data.bestReps,
        bestRepsWeight: data.bestRepsWeight,
        bestRepsDate: data.bestRepsDate,
        estimated1RM: data.best1RM,
        best1RMDate: data.best1RMDate,
        isRecentPR,
      })
    })

    return result
  }, [workouts, exercises])

  const sorted = useMemo(() => {
    const filtered = records.filter((r) =>
      filter === '' || r.exerciseName.toLowerCase().includes(filter.toLowerCase())
    )

    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.exerciseName.localeCompare(b.exerciseName)
          break
        case 'weight':
          cmp = a.bestWeight - b.bestWeight
          break
        case 'reps':
          cmp = a.bestReps - b.bestReps
          break
        case '1rm':
          cmp = a.estimated1RM - b.estimated1RM
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [records, sortField, sortDir, filter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const totalPowerLevel = useMemo(
    () => Math.round(records.reduce((s, r) => s + r.estimated1RM, 0)),
    [records]
  )

  const headerStyle = (field: SortField): React.CSSProperties => ({
    padding: '10px 12px',
    textAlign: field === 'name' ? 'left' : 'right',
    fontSize: 11,
    color: sortField === field ? '#ed8936' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: sortField === field ? 700 : 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '2px solid #2d3748',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  })

  const sortArrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ^' : ' v') : ''

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 700,
        margin: '0 auto',
        color: 'var(--text)',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <h2
        style={{
          textAlign: 'center',
          margin: '0 0 8px',
          fontSize: 22,
          background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Records Personnels
      </h2>

      {/* Power Level total */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          NIVEAU DE PUISSANCE TOTAL
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ecc94b, #ed8936, #e53e3e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            letterSpacing: 2,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
          }}
        >
          {formatPowerLevel(totalPowerLevel)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Somme estimee de tous les 1RM (kg)
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par exercice..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '2px solid #2d3748',
            background: 'var(--border)',
            color: 'var(--text)',
            fontSize: 13,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle('name')} onClick={() => handleSort('name')}>
                Exercice{sortArrow('name')}
              </th>
              <th style={headerStyle('weight')} onClick={() => handleSort('weight')}>
                Meilleur Poids{sortArrow('weight')}
              </th>
              <th style={headerStyle('reps')} onClick={() => handleSort('reps')}>
                Meilleures Reps{sortArrow('reps')}
              </th>
              <th style={headerStyle('1rm')} onClick={() => handleSort('1rm')}>
                1RM estime{sortArrow('1rm')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pr) => (
              <tr
                key={pr.exerciseId}
                style={{
                  background: pr.isRecentPR
                    ? 'linear-gradient(90deg, rgba(236,201,75,0.08), rgba(237,137,54,0.08))'
                    : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!pr.isRecentPR) {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pr.isRecentPR) {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }
                }}
              >
                <td
                  style={{
                    padding: '12px 12px',
                    borderBottom: '1px solid #2d3748',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pr.isRecentPR && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ecc94b, #ed8936)',
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                        title="Record recent (7 jours)"
                      >
                        ★
                      </span>
                    )}
                    <span>{pr.exerciseName}</span>
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 12px',
                    borderBottom: '1px solid #2d3748',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {pr.bestWeight} kg
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {new Date(pr.bestWeightDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 12px',
                    borderBottom: '1px solid #2d3748',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {pr.bestReps} reps
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    @ {pr.bestRepsWeight} kg
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 12px',
                    borderBottom: '1px solid #2d3748',
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 18,
                      fontFamily: "'Impact', 'Arial Black', sans-serif",
                      letterSpacing: 1,
                      background: pr.isRecentPR
                        ? 'linear-gradient(135deg, #ecc94b, #ed8936)'
                        : 'linear-gradient(135deg, var(--text-secondary), var(--text))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatPowerLevel(pr.estimated1RM)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {new Date(pr.best1RMDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 13 }}>
          {filter
            ? 'Aucun exercice ne correspond a votre recherche.'
            : 'Aucun record enregistre. Commencez a vous entrainer !'}
        </div>
      )}

      {/* Footer legend */}
      {sorted.some((r) => r.isRecentPR) && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ecc94b, #ed8936)',
              fontSize: 8,
            }}
          >
            ★
          </span>
          Record battu dans les 7 derniers jours
        </div>
      )}
    </div>
  )
}
