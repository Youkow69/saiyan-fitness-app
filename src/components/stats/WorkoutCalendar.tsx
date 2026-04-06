import { useMemo, useState } from 'react'
import { todayIso, getStreak } from '../../lib'

export interface CalendarWorkoutLog {
  id: string
  date: string // ISO date string YYYY-MM-DD
  exercises: { weight: number; reps: number }[]
}

interface DayData {
  date: string
  volume: number
  workoutCount: number
  dayOfWeek: number
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

function getIntensityLevel(volume: number, maxVolume: number): number {
  if (volume === 0) return 0
  const ratio = volume / maxVolume
  if (ratio < 0.2) return 1
  if (ratio < 0.4) return 2
  if (ratio < 0.6) return 3
  if (ratio < 0.8) return 4
  return 5
}

const INTENSITY_COLORS: Record<number, string> = {
  0: 'var(--border)',
  1: 'rgba(237,137,54,0.2)',
  2: 'rgba(237,137,54,0.4)',
  3: 'rgba(237,137,54,0.6)',
  4: 'rgba(237,137,54,0.8)',
  5: 'var(--accent-orange)',
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function WorkoutCalendar({ workouts }: { workouts: CalendarWorkoutLog[] }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const { months, dayMap, maxVolume, workoutDates, totalWorkouts } = useMemo(() => {
    // Build day -> volume map
    const dayMap: Record<string, { volume: number; count: number }> = {}
    const workoutDates = new Set<string>()

    workouts.forEach((w) => {
      const dateKey = w.date.split('T')[0]
      workoutDates.add(dateKey)
      const volume = w.exercises.reduce((s, ex) => s + ex.weight * ex.reps, 0)
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { volume: 0, count: 0 }
      }
      dayMap[dateKey].volume += volume
      dayMap[dateKey].count += 1
    })

    const maxVolume = Math.max(1, ...Object.values(dayMap).map((d) => d.volume))

    // Generate last 3 months of data
    const today = new Date()
    const months: { year: number; month: number; days: DayData[] }[] = []

    for (let m = 2; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m - monthOffset, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const daysInMonth = getDaysInMonth(year, month)
      const days: DayData[] = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1 // Mon=0, Sun=6
        const data = dayMap[dateStr]
        days.push({
          date: dateStr,
          volume: data?.volume || 0,
          workoutCount: data?.count || 0,
          dayOfWeek,
        })
      }

      months.push({ year, month, days })
    }

    return { months, dayMap, maxVolume, workoutDates, totalWorkouts: workouts.length }
  }, [workouts])

  const streak = useMemo(() => getStreak({ workouts } as any), [workoutDates])

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null
  const selectedWorkouts = selectedDay
    ? workouts.filter((w) => w.date.split('T')[0] === selectedDay)
    : []

  const todayStr = todayIso()

  return (<>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button type='button' onClick={() => setMonthOffset(o => o + 3)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }}>
          {'\u25C0'}
        </button>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
          {monthOffset === 0 ? 'Ce trimestre' : `Il y a ${monthOffset} mois`}
        </span>
        <button type='button' onClick={() => setMonthOffset(o => Math.max(0, o - 3))} disabled={monthOffset === 0} style={{ background: 'none', border: 'none', color: monthOffset === 0 ? 'var(--muted)' : 'var(--accent)', fontSize: '1.2rem', cursor: monthOffset === 0 ? 'default' : 'pointer', padding: '4px 8px' }}>
          {'\u25B6'}
        </button>
      </div>
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
      <h2
        style={{
          textAlign: 'center',
          margin: '0 0 16px',
          fontSize: 22,
          background: 'linear-gradient(135deg, var(--accent-orange), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Calendrier d'Entraînement
      </h2>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'var(--border)',
            borderRadius: 10,
            padding: '10px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-orange)' }}>{streak}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Jours de suite</div>
        </div>
        <div
          style={{
            background: 'var(--border)',
            borderRadius: 10,
            padding: '10px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>{totalWorkouts}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Séances (3 mois)</div>
        </div>
        <div
          style={{
            background: 'var(--border)',
            borderRadius: 10,
            padding: '10px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
            {workoutDates.size}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Jours actifs</div>
        </div>
      </div>

      {/* Calendar grid */}
      {months.map(({ year, month, days }) => {
        const firstDayOfWeek = days[0].dayOfWeek
        const emptyCells = firstDayOfWeek

        return (
          <div key={`${year}-${month}`} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'capitalize' }}>
              {formatMonthLabel(year, month)}
            </div>

            {/* Day labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 3,
                marginBottom: 4,
              }}
            >
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    padding: '2px 0',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 3,
              }}
            >
              {/* Empty cells for alignment */}
              {Array.from({ length: emptyCells }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 4 }} />
              ))}

              {days.map((day) => {
                const level = getIntensityLevel(day.volume, maxVolume)
                const isSelected = selectedDay === day.date
                const isToday = day.date === todayStr
                const isFuture = day.date > todayStr

                return (
                  <div
                    key={day.date}
                    onClick={() => {
                      if (!isFuture && day.workoutCount > 0) {
                        setSelectedDay(selectedDay === day.date ? null : day.date)
                      }
                    }}
                    title={
                      day.volume > 0
                        ? `${new Date(day.date).toLocaleDateString('fr-FR')}: ${Math.round(day.volume)} kg volume`
                        : new Date(day.date).toLocaleDateString('fr-FR')
                    }
                    style={{
                      aspectRatio: '1',
                      borderRadius: 4,
                      background: isFuture
                        ? 'rgba(255,255,255,0.02)'
                        : INTENSITY_COLORS[level],
                      border: isSelected
                        ? '2px solid #f6ad55'
                        : isToday
                          ? '2px solid var(--text-secondary)'
                          : '2px solid transparent',
                      cursor: day.workoutCount > 0 && !isFuture ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: isFuture ? 'var(--text-secondary)' : level > 0 ? 'var(--text)' : 'var(--text-secondary)',
                      fontWeight: isToday ? 700 : 400,
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {new Date(day.date).getDate()}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginRight: 4 }}>Moins</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: INTENSITY_COLORS[level],
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 4 }}>Plus</span>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDayData && (
        <div
          style={{
            marginTop: 16,
            background: 'var(--border)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid var(--stroke)',
          }}
        >
          <h4 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--accent-orange)' }}>
            {new Date(selectedDay).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h4>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Séances : <strong style={{ color: 'var(--text)' }}>{selectedDayData.count}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Volume: <strong style={{ color: 'var(--text)' }}>{Math.round(selectedDayData.volume)} kg</strong>
            </span>
          </div>
          {selectedWorkouts.map((w, i) => (
            <div key={w.id} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Séance {i + 1}: {w.exercises.length} serie{w.exercises.length !== 1 ? 's' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}