import React, { useMemo, useCallback } from 'react'
import type { AppState, TabId } from '../../types'
import { useAppState } from '../../context/AppContext'
import {
  formatNumber,
  getCurrentTransformationFull,
  getDailyNutrition,
  getExerciseById,
  getMesocycleStatus,
  getPowerLevel,
  getPrimaryRecommendation,
  getProgramById,
  getStreak,
  getWeeklyWorkouts,
  getWorkoutVolume,
} from '../../lib'
import { DailyQuote } from '../gamification/MotivationalQuotes'
import { TransformationTimeline } from '../gamification/TransformationTimeline'
import { QuestSection, DailyQuestsPanel } from '../gamification/QuestSection'
import { MainObjectivesPanel } from '../gamification/MainObjectives'
import { MetricCard, ProgressBar, SectionTitle } from '../ui/Shared'

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

interface HomeViewProps {
  onStartWorkout: () => void
  onNavigate: (tab: TabId) => void
}

export const HomeView: React.FC<HomeViewProps> = React.memo(
  function HomeView({ onStartWorkout, onNavigate }) {
    const { state, dispatch } = useAppState()
    const targets = state.targets!
    const nutrition = useMemo(() => getDailyNutrition(state.foodEntries), [state.foodEntries])
    const tf = useMemo(() => getCurrentTransformationFull(state), [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries])
    const transformation = tf.current
    const weeklyWorkouts = useMemo(() => getWeeklyWorkouts(state.workouts), [state.workouts])
    const lastWorkout = state.workouts.length > 0 ? state.workouts[state.workouts.length - 1] : null
    const prCount = useMemo(() => countPRsFromWorkouts(state.workouts), [state.workouts])
    const mesocycle = useMemo(() => getMesocycleStatus(state), [state.workouts, state.sessionFeedback])
    const streak = useMemo(() => getStreak(state), [state.workouts])
    const powerLevel = useMemo(() => getPowerLevel(state), [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries])
    const recommendation = useMemo(() => getPrimaryRecommendation(state), [state.workouts, state.foodEntries, state.targets, state.profile, state.sessionFeedback])

    const selectedProgram = getProgramById(state.selectedProgramId)
    const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
    const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null

    const handleUpdateQuest = useCallback((questId: string, delta: number) => {
      dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId, delta } })
    }, [dispatch])

    const handleCompleteQuest = useCallback((questId: string) => {
      dispatch({ type: 'COMPLETE_QUEST', payload: questId })
    }, [dispatch])

    return (
      <div className="page">
        <DailyQuote />

        <section className="hevy-hero" style={{ borderColor: `${transformation.accent}44` }}>
          <div style={{ flex: 1 }}>
            <span className="eyebrow">Niveau de puissance</span>
            <div style={{ fontSize: 'clamp(2.8rem,8vw,4rem)', fontFamily: 'Bebas Neue, sans-serif', color: transformation.accent, lineHeight: 1 }}>
              {formatNumber(powerLevel)}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{transformation.name} — Continue ta progression</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' as const }}>
              <span className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent }}>{transformation.name}</span>
              {streak > 0 && <span className="hero-badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}>{streak}j 🔥</span>}
            </div>
          </div>
          <div>
            <img src={transformation.image} alt={transformation.name} className="transformation-image" style={{ width: 110, height: 110, filter: `drop-shadow(0 0 20px ${transformation.accent}99)` }} />
          </div>
        </section>

        <button className="cta-button" onClick={onStartWorkout} type="button">
          {state.activeWorkout ? "REPRENDRE L'ENTRAINEMENT" : "COMMENCER L'ENTRAINEMENT"}
        </button>

        <div className="quick-grid">
          <button className="quick-card" onClick={() => onNavigate('scouter')} type="button"><span className="quick-card-icon">📊</span><span className="quick-card-label">Statistiques</span></button>
          <button className="quick-card" onClick={() => onNavigate('train')} type="button"><span className="quick-card-icon">💪</span><span className="quick-card-label">Exercices</span></button>
          <button className="quick-card" onClick={() => onNavigate('profile')} type="button"><span className="quick-card-icon">📏</span><span className="quick-card-label">Mesures</span></button>
          <button className="quick-card" onClick={() => onNavigate('nutrition')} type="button"><span className="quick-card-icon">🍽️</span><span className="quick-card-label">Nutrition</span></button>
        </div>

        <section className="hevy-card" style={{ borderColor: `${mesocycle.color}33` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <SectionTitle icon="⚡" label="Mesocycle" />
              <p style={{ margin: '2px 0 0', fontWeight: 700, color: mesocycle.color, fontSize: '0.9rem' }}>{mesocycle.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{mesocycle.detail}</p>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '2.2rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--accent-gold)', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>jours</div>
            </div>
          </div>
        </section>

        <section className="hevy-card stack-md">
          <SectionTitle icon="✨" label="Saga des transformations" />
          <TransformationTimeline state={state} />
        </section>

        <QuestSection state={state} />
        <DailyQuestsPanel state={state} onUpdateQuestProgress={handleUpdateQuest} onCompleteQuest={handleCompleteQuest} />
        <MainObjectivesPanel state={state} />

        <section className="hevy-card stack-md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle icon="💥" label="Mission du jour" />
            <button className="primary-btn" style={{ minHeight: 40, padding: '8px 16px', fontSize: '0.82rem' }} onClick={onStartWorkout} type="button">
              {state.activeWorkout ? 'Reprendre' : 'Demarrer'}
            </button>
          </div>
          {nextSession
            ? <><h3 style={{ margin: '4px 0 2px' }}>{nextSession.name}</h3><p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>{nextSession.focus}</p></>
            : <div className="empty-state"><div className="empty-icon">🏋️</div><p>Choisis un programme depuis le profil.</p></div>
          }
          <div className="metrics-grid">
            <MetricCard label="Seances" value={`${weeklyWorkouts.length}/${state.profile?.trainingDaysPerWeek ?? 0}`} accent="var(--accent-gold)" />
            <MetricCard label="Kcal rest." value={`${Math.max(0, Math.round(targets.calories - nutrition.calories))}`} accent="var(--accent-orange)" />
            <MetricCard label="PRs total" value={String(prCount)} accent="var(--accent-blue)" />
          </div>
        </section>

        {lastWorkout && (
          <section className="hevy-card stack-md">
            <SectionTitle icon="📅" label="Dernier entrainement" />
            <div className="workout-summary-card">
              <div style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: '1rem' }}>{lastWorkout.sessionName}</strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{lastWorkout.date}</p>
              </div>
              <div className="workout-summary-stats">
                <div className="workout-stat"><span>🕐</span><span>{lastWorkout.durationMinutes} min</span></div>
                <div className="workout-stat"><span>📊</span><span>{formatNumber(getWorkoutVolume(lastWorkout))} kg</span></div>
                <div className="workout-stat"><span>⭐</span><span>{lastWorkout.exercises.length} exos</span></div>
              </div>
              <div className="chip-row" style={{ marginTop: 8 }}>
                {lastWorkout.exercises.slice(0, 4).map(ex => (
                  <span key={ex.exerciseId} className="chip chip--static" style={{ fontSize: '0.7rem' }}>
                    {getExerciseById(ex.exerciseId).name}{ex.sets.length > 0 ? ` ${ex.sets[ex.sets.length - 1].weightKg}kg` : ''}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="hevy-card stack-md">
          <SectionTitle icon="🍽️" label="Nutrition aujourd'hui" />
          <ProgressBar label="Calories" value={nutrition.calories} target={targets.calories} accent="linear-gradient(90deg,#ffb400,#ff6a00)" />
          <ProgressBar label="Proteines" value={nutrition.protein} target={targets.protein} accent="linear-gradient(90deg,#00d4ff,#4fffb0)" />
        </section>

        <section className="hevy-card">
          <SectionTitle icon="🔍" label="Analyse Scouter" />
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{recommendation}</p>
        </section>
      </div>
    )
  }
)
