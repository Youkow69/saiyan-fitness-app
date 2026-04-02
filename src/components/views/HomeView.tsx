import React, { useMemo, useCallback, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import {
  formatNumber,
  getCurrentTransformationFull,
  getDailyNutrition,
  getMesocycleStatus,
  getPowerLevel,
  getStreak,
} from '../../lib'
import { WeeklyReport } from '../stats/WeeklyReport'
import { DailyQuote } from '../gamification/MotivationalQuotes'
import { DailyQuestsPanel } from '../gamification/QuestSection'
import { SectionTitle } from '../ui/Shared'
import MacroBar from '../ui/MacroBar'
import { RecoveryMap } from '../tools/RecoveryMap'
import { ReadinessScore } from '../tools/ReadinessScore'

interface HomeViewProps {
  onStartWorkout: () => void
}

const pillStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)',
  background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.75rem',
  fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  display: 'flex', alignItems: 'center', gap: 4,
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
  display: 'flex', justifyContent: 'flex-end',
}

const panelStyle: React.CSSProperties = {
  width: '92vw', maxWidth: 420, height: '100%', overflowY: 'auto',
  background: 'var(--bg)', padding: 16, boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text)',
  fontSize: '1.4rem', cursor: 'pointer', padding: 4,
}

export const HomeView: React.FC<HomeViewProps> = React.memo(
  function HomeView({ onStartWorkout }) {
    const { state, dispatch } = useAppState()
    const targets = state.targets!
    const [showQuests, setShowQuests] = useState(false)
    const [showRecovery, setShowRecovery] = useState(false)
    const [showWeekly, setShowWeekly] = useState(false)

    const nutrition = useMemo(() => getDailyNutrition(state.foodEntries), [state.foodEntries])
    const tf = useMemo(
      () => getCurrentTransformationFull(state),
      [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries],
    )
    const transformation = tf.current
    const mesocycle = useMemo(() => getMesocycleStatus(state), [state.workouts, state.sessionFeedback])
    const streak = useMemo(() => getStreak(state), [state.workouts])
    const powerLevel = useMemo(
      () => getPowerLevel(state),
      [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries],
    )

    const questCount = useMemo(() => {
      const quests = state.dailyQuests ?? []
      return quests.filter((q: any) => q.completed).length
    }, [state.dailyQuests])

    const recoveryScore = useMemo(() => {
      const bw = state.bodyweightEntries
      return bw.length > 0 ? Math.round((bw.at(-1)?.weightKg ?? 0)) : '--'
    }, [state.bodyweightEntries])

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
        {/* Floating action pills */}
        <div style={{ position: 'fixed', top: 50, right: 12, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setShowQuests(!showQuests)} style={pillStyle} type="button">
            {'\uD83C\uDFAF'} {questCount}/8
          </button>
          <button onClick={() => setShowRecovery(!showRecovery)} style={pillStyle} type="button">
            {'\uD83D\uDC9A'} {recoveryScore}
          </button>
          <button onClick={() => setShowWeekly(!showWeekly)} style={pillStyle} type="button">
            {'\uD83D\uDCCA'}
          </button>
        </div>

        {/* Slide-in panel: Quests */}
        {showQuests && (
          <div style={overlayStyle} onClick={() => setShowQuests(false)}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>Quêtes du jour</h3>
                <button onClick={() => setShowQuests(false)} style={closeBtnStyle} type="button">{'\u2715'}</button>
              </div>
              <DailyQuestsPanel
                state={state}
                onUpdateQuestProgress={handleUpdateQuest}
                onCompleteQuest={handleCompleteQuest}
              />
            </div>
          </div>
        )}

        {/* Slide-in panel: Recovery */}
        {showRecovery && (
          <div style={overlayStyle} onClick={() => setShowRecovery(false)}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>Récupération</h3>
                <button onClick={() => setShowRecovery(false)} style={closeBtnStyle} type="button">{'\u2715'}</button>
              </div>
              <ReadinessScore />
              <RecoveryMap />
            </div>
          </div>
        )}

        {/* Slide-in panel: Weekly / Monthly */}
        {showWeekly && (
          <div style={overlayStyle} onClick={() => setShowWeekly(false)}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>Rapport</h3>
                <button onClick={() => setShowWeekly(false)} style={closeBtnStyle} type="button">{'\u2715'}</button>
              </div>
              <WeeklyReport />
            </div>
          </div>
        )}

        {/* Daily quote — compact 1-line */}
        <div style={{ padding: '6px 0', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--muted)', textAlign: 'center' }}>
          <DailyQuote />
        </div>

        {/* Power Level hero card with aura */}
        <section
          className="power-card"
          style={{ '--aura': transformation.accent } as React.CSSProperties}
        >
          <div style={{ flex: 1 }}>
            <span className="eyebrow">Niveau de puissance</span>
            <div style={{
              fontSize: 'clamp(2.8rem, 8vw, 4rem)',
              fontFamily: 'Bebas Neue, sans-serif',
              color: transformation.accent,
              lineHeight: 1,
            }}>
              {formatNumber(powerLevel)}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {transformation.name} — Continue ta progression
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent }}>
                {transformation.name}
              </span>
              {streak > 0 && (
                <span className="hero-badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}>
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
                width: 100, height: 100,
                filter: `drop-shadow(0 0 20px ${transformation.accent}99)`,
                position: 'relative',
              }}
            />
          </div>
        </section>

        {/* CTA button */}
        <button className="cta-button" onClick={onStartWorkout} type="button" style={{ fontFamily: "'Manrope', sans-serif", textTransform: 'none' as const, fontWeight: 700 }}>
          {state.activeWorkout ? "Reprendre l'entra\u00EEnement" : "Commencer l'entra\u00EEnement"}
        </button>

        {/* Mesocycle — compact 1-line */}
        <section className="hevy-card" style={{ borderColor: `${mesocycle.color}33`, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontWeight: 700, color: mesocycle.color, fontSize: '0.85rem' }}>
                {mesocycle.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {mesocycle.detail}
              </span>
            </div>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'var(--accent-gold)' }}>
              {streak}j
            </span>
          </div>
        </section>

        {/* Nutrition compact */}
        <section className="hevy-card stack-md" style={{ padding: '10px 14px' }}>
          <MacroBar label="Calories" current={nutrition.calories} target={targets.calories} unit="kcal" color="calories" />
          <MacroBar label="Prot\u00E9ines" current={nutrition.protein} target={targets.protein} unit="g" color="protein" />
          <MacroBar label="Glucides" current={nutrition.carbs} target={targets.carbs} unit="g" color="carbs" />
          <MacroBar label="Lipides" current={nutrition.fats} target={targets.fats} unit="g" color="fat" />
        </section>
      </div>
    )
  },
)
