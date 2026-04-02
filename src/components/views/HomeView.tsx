import React, { useMemo, useCallback } from 'react'
import { useAppState } from '../../context/AppContext'
import {
  formatNumber,
  getCurrentTransformationFull,
  getDailyNutrition,
  getMesocycleStatus,
  getPowerLevel,
  getStreak,
} , getDailyQuestStatus} from '../../lib'
import { WeeklyReport } from '../stats/WeeklyReport'
import { DailyQuote } from '../gamification/MotivationalQuotes'
import { DailyQuestsPanel } from '../gamification/QuestSection'
import MacroBar from '../ui/MacroBar'
import { RecoveryMap } from '../tools/RecoveryMap'
import { ReadinessScore } from '../tools/ReadinessScore'

interface HomeViewProps {
  onStartWorkout: () => void
}

export const HomeView: React.FC<HomeViewProps> = React.memo(
  function HomeView({ onStartWorkout }) {
    const { state, dispatch } = useAppState()
    const targets = state.targets!
    const nutrition = useMemo(
      () => getDailyNutrition(state.foodEntries),
      [state.foodEntries],
    )
    const tf = useMemo(
      () => getCurrentTransformationFull(state),
      [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries],
    )
    const transformation = tf.current
    const mesocycle = useMemo(
      () => getMesocycleStatus(state),
      [state.workouts, state.sessionFeedback],
    )
    const streak = useMemo(() => getStreak(state), [state.workouts])
    const powerLevel = useMemo(
      () => getPowerLevel(state),
      [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries],
    )

    const handleUpdateQuest = useCallback(
      (questId: string, delta: number) => {
        dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId, delta } })
      },
      [dispatch],
    )

    const handleCompleteQuest = useCallback(
      (questId: string) => {
        dispatch({ type: 'COMPLETE_QUEST', payload: questId })
      },
      [dispatch],
    )

    return (
      <div className="page">
        <DailyQuote />

        {/* Power Level hero card with aura */}
        <section
          className="power-card"
          style={{ '--aura': transformation.accent } as React.CSSProperties}
        >
          <div style={{ flex: 1 }}>
            <span className="eyebrow">Niveau de puissance</span>
            <div
              style={{
                fontSize: 'clamp(2.8rem, 8vw, 4rem)',
                fontFamily: 'Bebas Neue, sans-serif',
                color: transformation.accent,
                lineHeight: 1,
              }}
            >
              {formatNumber(powerLevel)}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {transformation.name} — Continue ta progression
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span
                className="hero-badge"
                style={{ borderColor: transformation.accent, color: transformation.accent }}
              >
                {transformation.name}
              </span>
              {streak > 0 && (
                <span
                  className="hero-badge"
                  style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}
                >
                  {streak}j
                </span>
              )}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="aura-ring" style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              background: `radial-gradient(circle, ${transformation.accent}33, transparent 70%)`,
              animation: 'aura-pulse 2.5s ease-in-out infinite',
            }} />
            <img
              src={transformation.image}
              alt={transformation.name}
              className="transformation-image"
              style={{
                width: 100,
                height: 100,
                filter: `drop-shadow(0 0 20px ${transformation.accent}99)`,
                position: 'relative',
              }}
            />
          </div>
        </section>

        {/* CTA button in sentence case */}
        <button className="cta-button" onClick={onStartWorkout} type="button" style={{ fontFamily: "'Manrope', sans-serif", textTransform: 'none' as const, fontWeight: 700 }}>
          {state.activeWorkout ? "Reprendre l'entraînement" : "Commencer l'entraînement"}
        </button>

        {/* Daily quests */}
        <DailyQuestsPanel
          state={state}
          onUpdateQuestProgress={handleUpdateQuest}
          onCompleteQuest={handleCompleteQuest}
        />

        {/* Mesocycle compact card */}
        <section className="hevy-card" style={{ borderColor: `${mesocycle.color}33` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <SectionTitle icon="" label="Mésocycle" />
              <p style={{ margin: '2px 0 0', fontWeight: 700, color: mesocycle.color, fontSize: '0.9rem' }}>
                {mesocycle.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                {mesocycle.detail}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '2.2rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  color: 'var(--accent-gold)',
                  lineHeight: 1,
                }}
              >
                {streak}
              </div>
              <div
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                jours
              </div>
            </div>
          </div>
        </section>

        {/* Readiness score */}
        <ReadinessScore />

        {/* Weekly report */}
        <WeeklyReport />

        {/* Recovery map */}
        <RecoveryMap />

        {/* Nutrition summary */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="" label="Nutrition aujourd'hui" />
          <MacroBar label="Calories" current={nutrition.calories} target={targets.calories} unit="kcal" color="calories" />
          <MacroBar label="Protéines" current={nutrition.protein} target={targets.protein} unit="g" color="protein" />
          <MacroBar label="Glucides" current={nutrition.carbs} target={targets.carbs} unit="g" color="carbs" />
          <MacroBar label="Lipides" current={nutrition.fats} target={targets.fats} unit="g" color="fat" />
        </section>
      </div>
    )
  },
)
