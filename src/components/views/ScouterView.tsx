import React, { useMemo } from 'react'
import type { AppState } from '../../types'
import { useAppState } from '../../context/AppContext'
import { exercises } from '../../data'
import {
  formatNumber,
  getExerciseById,
  getVolumeByMuscle,
  getWeeklyWorkouts,
  getWorkoutVolume,
} from '../../lib'
import { VolumeDashboard } from '../workout/VolumeDashboard'
import { WeightChart, VolumeChart } from '../stats/ProgressCharts'
import type {
  BodyweightEntry as ChartBWEntry,
  WorkoutLog as ChartWorkoutLog,
} from '../stats/ProgressCharts'
import { WorkoutCalendar } from '../stats/WorkoutCalendar'
import type { CalendarWorkoutLog } from '../stats/WorkoutCalendar'
import { PersonalRecords } from '../stats/PersonalRecords'
import type { PRWorkoutLog, PRExercise } from '../stats/PersonalRecords'
import { MetricCard, ProgressBar, SectionTitle } from '../ui/Shared'

const MUSCLE_FR: Record<string, string> = {
  Chest: 'Pectoraux',
  Back: 'Dos',
  Shoulders: '\u00C9paules',
  Quads: 'Quadriceps',
  Hamstrings: 'Ischio-jambiers',
  Glutes: 'Fessiers',
  Calves: 'Mollets',
  Core: 'Abdominaux',
  Biceps: 'Biceps',
  Triceps: 'Triceps',
}

function translateMuscle(name: string): string {
  return MUSCLE_FR[name] ?? name
}

function countPRsFromWorkouts(workouts: AppState['workouts']): number {
  const bestByExercise = new Map<string, number>()
  let prCount = 0
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  sorted.forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        const e1rm = set.weightKg * (1 + set.reps / 30)
        const prev = bestByExercise.get(ex.exerciseId) ?? 0
        if (e1rm > prev && prev > 0) prCount++
        if (e1rm > prev) bestByExercise.set(ex.exerciseId, e1rm)
      })
    })
  })
  return prCount
}

export const ScouterView: React.FC = React.memo(
  function ScouterView() {
    const { state } = useAppState()
    const weeklyWorkouts = useMemo(
      () => getWeeklyWorkouts(state.workouts),
      [state.workouts],
    )
    const volumeByMuscle = useMemo(
      () => getVolumeByMuscle(weeklyWorkouts),
      [weeklyWorkouts],
    )
    const totalVolume = useMemo(
      () => state.workouts.reduce((s, w) => s + getWorkoutVolume(w), 0),
      [state.workouts],
    )
    const prCount = useMemo(
      () => countPRsFromWorkouts(state.workouts),
      [state.workouts],
    )

    const chartBWEntries = useMemo(
      () =>
        state.bodyweightEntries.map((e) => ({
          date: e.date,
          weight: e.weightKg,
        })) as ChartBWEntry[],
      [state.bodyweightEntries],
    )

    const chartWorkouts = useMemo(
      () =>
        state.workouts.map((w) => ({
          id: w.id,
          date: w.date,
          exercises: w.exercises.flatMap((ex) =>
            ex.sets.map((s) => ({
              exerciseId: ex.exerciseId,
              weight: s.weightKg,
              reps: s.reps,
            })),
          ),
        })) as ChartWorkoutLog[],
      [state.workouts],
    )

    const calendarWorkouts = useMemo(
      () =>
        state.workouts.map((w) => ({
          id: w.id,
          date: w.date,
          exercises: w.exercises.flatMap((ex) =>
            ex.sets.map((s) => ({ weight: s.weightKg, reps: s.reps })),
          ),
        })) as CalendarWorkoutLog[],
      [state.workouts],
    )

    const prWorkouts = useMemo(
      () =>
        state.workouts.map((w) => ({
          id: w.id,
          date: w.date,
          exercises: w.exercises.flatMap((ex) =>
            ex.sets.map((s) => ({
              exerciseId: ex.exerciseId,
              weight: s.weightKg,
              reps: s.reps,
            })),
          ),
        })) as PRWorkoutLog[],
      [state.workouts],
    )

    const prExercises = useMemo(
      () => exercises.map((e) => ({ id: e.id, name: e.name })) as PRExercise[],
      [],
    )

    return (
      <div className="page">
        {/* Weight chart at top */}
        <WeightChart entries={chartBWEntries} />

        {/* Volume chart */}
        <VolumeChart workouts={chartWorkouts} />

        {/* Activity calendar (12 weeks grid) */}
        <WorkoutCalendar workouts={calendarWorkouts} />

        {/* 1RM board */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="" label="1RM estim\u00E9s" />
          {['bench_press', 'back_squat', 'romanian_deadlift', 'pull_up'].map(
            (exerciseId) => {
              let best = 0
              state.workouts.forEach((w) =>
                w.exercises
                  .filter((e) => e.exerciseId === exerciseId)
                  .forEach((e) =>
                    e.sets.forEach((s) => {
                      const e1rm = s.weightKg * (1 + s.reps / 30)
                      if (e1rm > best) best = e1rm
                    }),
                  ),
              )
              const ex = getExerciseById(exerciseId)
              return (
                <div
                  key={exerciseId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--stroke)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{ex?.name ?? exerciseId.replace(/_/g, ' ')}</span>
                  <strong
                    style={{
                      color: best > 0 ? 'var(--accent-gold)' : 'var(--muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {best > 0 ? `~${Math.round(best)} kg` : '\u2014'}
                  </strong>
                </div>
              )
            },
          )}
        </section>

        {/* Muscle volume dashboard - translated to French */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="" label="Tonnage par muscle" />
          {volumeByMuscle.length === 0 ? (
            <div className="empty-state">
              <p>Compl\u00E8te ta premi\u00E8re semaine pour voir la map musculaire.</p>
            </div>
          ) : (
            volumeByMuscle.map(([muscle, volume]) => (
              <ProgressBar
                key={muscle}
                label={translateMuscle(muscle)}
                value={volume}
                target={Math.max(volumeByMuscle[0][1], 1)}
                accent="linear-gradient(90deg,#4fffb0,#00d4ff)"
              />
            ))
          )}
        </section>

        <VolumeDashboard state={state} />

        {/* Overview metrics */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="" label="Vue d'ensemble" />
          <div className="metrics-grid">
            <MetricCard
              label="S\u00E9ances total"
              value={String(state.workouts.length)}
              accent="var(--accent-gold)"
            />
            <MetricCard
              label="Volume total"
              value={`${formatNumber(totalVolume)} kg`}
              accent="var(--accent-blue)"
            />
            <MetricCard
              label="Records"
              value={String(prCount)}
              accent="var(--accent-orange)"
            />
          </div>
          <div className="metrics-grid">
            <MetricCard
              label="Cette semaine"
              value={String(weeklyWorkouts.length)}
              accent="var(--accent-gold)"
            />
            <MetricCard
              label="Vol. semaine"
              value={`${formatNumber(
                weeklyWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0),
              )} kg`}
              accent="var(--accent-blue)"
            />
            <MetricCard
              label="Poids actuel"
              value={`${
                state.bodyweightEntries.at(-1)?.weightKg ??
                state.profile?.weightKg ??
                0
              } kg`}
              accent="#4fffb0"
            />
          </div>
        </section>

        {/* Personal records table */}
        <PersonalRecords workouts={prWorkouts} exercises={prExercises} />
      </div>
    )
  },
)
