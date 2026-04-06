import React, { useMemo, useState } from 'react'
import type { AppState } from '../../types'
import { MonthlyRecap } from '../stats/MonthlyRecap'
import { RPETrendChart } from '../tools/RPETrendChart'
import { useAppState } from '../../context/AppContext'
import { exercises } from '../../data'
import {
  formatNumber,
  getExerciseById,
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
import { MetricCard, SectionTitle } from '../ui/Shared'
import { StrengthStandards } from '../tools/StrengthStandards'
import { FeedView } from './FeedView'
import { Leaderboard } from '../stats/Leaderboard'



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
    const [modal, setModal] = useState<string | null>(null)

    const weeklyWorkouts = useMemo(() => getWeeklyWorkouts(state.workouts), [state.workouts])
    const totalVolume = useMemo(
      () => state.workouts.reduce((s, w) => s + getWorkoutVolume(w), 0),
      [state.workouts],
    )
    const prCount = useMemo(() => countPRsFromWorkouts(state.workouts), [state.workouts])

    const chartBWEntries = useMemo(
      () => state.bodyweightEntries.map((e) => ({ date: e.date, weight: e.weightKg })) as ChartBWEntry[],
      [state.bodyweightEntries],
    )

    const chartWorkouts = useMemo(
      () => state.workouts.map((w) => ({
        id: w.id, date: w.date,
        exercises: w.exercises.flatMap((ex) =>
          ex.sets.map((s) => ({ exerciseId: ex.exerciseId, weight: s.weightKg, reps: s.reps })),
        ),
      })) as ChartWorkoutLog[],
      [state.workouts],
    )

    const calendarWorkouts = useMemo(
      () => state.workouts.map((w) => ({
        id: w.id, date: w.date,
        exercises: w.exercises.flatMap((ex) =>
          ex.sets.map((s) => ({ weight: s.weightKg, reps: s.reps })),
        ),
      })) as CalendarWorkoutLog[],
      [state.workouts],
    )

    const prWorkouts = useMemo(
      () => state.workouts.map((w) => ({
        id: w.id, date: w.date,
        exercises: w.exercises.flatMap((ex) =>
          ex.sets.map((s) => ({ exerciseId: ex.exerciseId, weight: s.weightKg, reps: s.reps })),
        ),
      })) as PRWorkoutLog[],
      [state.workouts],
    )

    const prExercises = useMemo(
      () => exercises.map((e) => ({ id: e.id, name: e.name })) as PRExercise[],
      [],
    )

    const modalTitle: Record<string, string> = {
      calendar: "Calendrier d'activité",
      records: 'Records personnels',
      recap: 'Récap mensuel',
      volume: 'Volume par muscle',
      charts: 'Graphiques',
    }

    return (
      <div className="page">
        {/* Basic stats - always visible */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="📊" label="Vue d'ensemble" />
          <div className="metrics-grid">
            <MetricCard label="Séances total" value={String(state.workouts.length)} accent="var(--accent-gold)" />
            <MetricCard label="Volume total" value={`${formatNumber(totalVolume)} kg`} accent="var(--accent-blue)" />
            <MetricCard label="Records" value={String(prCount)} accent="var(--accent-orange)" />
          </div>
          <div className="metrics-grid">
            <MetricCard label="Cette semaine" value={String(weeklyWorkouts.length)} accent="var(--accent-gold)" />
            <MetricCard
              label="Vol. semaine"
              value={`${formatNumber(weeklyWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0))} kg`}
              accent="var(--accent-blue)"
            />
            <MetricCard
              label="Poids actuel"
              value={`${state.bodyweightEntries.at(-1)?.weightKg ?? state.profile?.weightKg ?? 0} kg`}
              accent="var(--accent-green, #4fffb0)"
            />
          </div>
        </section>

        {/* 1RM board - always visible */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="🏋" label="1RM estimés" />
          {['bench_press', 'back_squat', 'romanian_deadlift', 'pull_up'].map((exerciseId) => {
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
              <div key={exerciseId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--stroke)',
              }}>
                <span style={{ fontSize: '0.85rem' }}>{ex?.name ?? exerciseId.replace(/_/g, ' ')}</span>
                <strong style={{
                  color: best > 0 ? 'var(--accent-gold)' : 'var(--muted)',
                  fontSize: '0.9rem',
                }}>
                  {best > 0 ? `~${Math.round(best)} kg` : '—'}
                </strong>
              </div>
            )
          })}
        </section>

        {/* Strength standards - always visible */}
        <StrengthStandards />

        {/* Button row for modals */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {['calendar', 'records', 'recap', 'volume', 'charts'].map((id) => (
            <button
              key={id}
              onClick={() => setModal(id)}
              type="button"
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {id === 'calendar' ? 'Calendrier' : id === 'records' ? 'Records' : id === 'recap' ? 'Récap' : id === 'volume' ? 'Volume' : 'Charts'}
            </button>
          ))}
        
              <button
                onClick={() => setModal(modal === 'feed' ? null : 'feed')}
                type="button"
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: modal === 'feed' ? 'var(--accent)' : 'var(--bg-card)',
                  color: modal === 'feed' ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontWeight: 600,
                  fontSize: '0.78rem', cursor: 'pointer',
                }}>
                {'🔥'} Feed
              </button>
              <button
                onClick={() => setModal(modal === 'leaderboard' ? null : 'leaderboard')}
                type="button"
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: modal === 'leaderboard' ? 'var(--accent)' : 'var(--bg-card)',
                  color: modal === 'leaderboard' ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontWeight: 600,
                  fontSize: '0.78rem', cursor: 'pointer',
                }}>
                {'🏆'} Classement
              </button>
            </div>

        {/* Modal overlay */}
        {modal && (
          <div role="dialog" aria-modal="true" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            zIndex: 1000, overflowY: 'auto', padding: 16,
          }}>
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'var(--text)' }}>
                  {modalTitle[modal] ?? modal}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              {modal === 'calendar' && <WorkoutCalendar workouts={calendarWorkouts} />}
              {modal === 'records' && <PersonalRecords workouts={prWorkouts} exercises={prExercises} />}
              {modal === 'recap' && <MonthlyRecap />}
              {modal === 'volume' && <VolumeDashboard state={state} />}
              {modal === 'volume' && <RPETrendChart />}
              {modal === 'feed' && <FeedView />}
              {modal === 'leaderboard' && <Leaderboard />}
              {modal === 'charts' && (
                <>
                  <WeightChart entries={chartBWEntries} />
                  <VolumeChart workouts={chartWorkouts} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)
