import React, { useMemo, useCallback, useState } from 'react'
import { useAppState } from '../../context/AppContext'
import {
  formatNumber,
  getDailyNutrition,
  getCurrentTransformationFull,
  getDailyQuestStatus,
  getMesocycleStatus,
  getPowerLevel,
  getStreak,
  todayIso,
} from '../../lib'
import { getDeloadAdvice, evaluateFatigueStatus } from '../../lib/progression'
import { showToast } from '../ui/Toast'
import { WeeklyReport } from '../stats/WeeklyReport'
import { MonthlyRecap } from '../stats/MonthlyRecap'
import { DailyQuote } from '../gamification/MotivationalQuotes'
import { DailyQuestsPanel } from '../gamification/QuestSection'
import { RecoveryMap } from '../tools/RecoveryMap'
import { ReadinessScore } from '../tools/ReadinessScore'
import { WeeklyNutritionReport } from '../tools/WeeklyNutritionReport'
import { DailySummaryWidget } from '../tools/DailySummaryWidget'

interface HomeViewProps {
  onStartWorkout: () => void
}

export const HomeView: React.FC<HomeViewProps> = React.memo(
  function HomeView({ onStartWorkout }) {
    const { state, dispatch } = useAppState()
    const [activePanel, setActivePanel] = useState<string | null>(null)
    const deloadAdvice = useMemo(() => getDeloadAdvice(state), [state.workouts, state.sessionFeedback])
    const [deloadActive, setDeloadActive] = useState(false)
    const [deloadDismissed, setDeloadDismissed] = useState(false)
    const fatigueStatus = useMemo(
      () => evaluateFatigueStatus({ workouts: state.workouts, feedbacks: state.sessionFeedback }),
      [state.workouts, state.sessionFeedback],
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

    const nutrition = useMemo(
      () => getDailyNutrition(state.foodEntries),
      [state.foodEntries],
    )
    const targets = state.targets

    const hasWorkoutToday = state.workouts.some(w => w.date === todayIso())

    const questsDone = useMemo(() => {
      const statuses = getDailyQuestStatus(state)
      return statuses.filter((q) => q.isComplete).length
    }, [state.foodEntries, state.workouts, state.targets, state.completedDailyQuests, state.dailyQuestProgress])

    const updateQuestProgress = useCallback(
      (questId: string, delta: number) => {
        dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId, delta } })
      },
      [dispatch],
    )

    const completeQuest = useCallback(
      (questId: string) => {
        dispatch({ type: 'COMPLETE_QUEST', payload: questId })
      },
      [dispatch],
    )

    return (
      <div className="page">
        {/* Floating pills */}
        <div style={{
          position: 'fixed', top: 54, right: 12, zIndex: 50,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[
            { id: 'quests', icon: '🎯', label: questsDone + '/8' },
            { id: 'recovery', icon: '💚', label: '' },
            { id: 'stats', icon: '📊', label: '' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActivePanel(activePanel === pill.id ? null : pill.id)}
              style={{
                padding: '5px 10px', borderRadius: 16,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                color: activePanel === pill.id ? 'var(--accent)' : 'var(--text)',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.2))',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              type="button"
            >
              {pill.icon} {pill.label}
            </button>
          ))}
        </div>

        {/* Slide-in panel */}
        {activePanel && (
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: 400,
            background: 'var(--bg)', zIndex: 100, overflowY: 'auto', padding: 16,
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)', borderLeft: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                {activePanel === 'quests' ? 'Quêtes quotidiennes' : activePanel === 'recovery' ? 'Récupération' : 'Statistiques'}
              </h3>
              <button
                onClick={() => setActivePanel(null)}
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {activePanel === 'quests' && (
              <DailyQuestsPanel state={state} onUpdateQuestProgress={updateQuestProgress} onCompleteQuest={completeQuest} />
            )}
            {activePanel === 'recovery' && (
              <>
                <ReadinessScore />
                <div style={{ marginTop: 12 }}>
                  <RecoveryMap />
                </div>
              </>
            )}
            {activePanel === 'stats' && (
              <>
                <WeeklyReport />
                <div style={{ marginTop: 12 }}>
                  <MonthlyRecap />
                </div>
              </>
            )}
          </div>
        )}
        {activePanel && (
          <div
            onClick={() => setActivePanel(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          />
        )}

        {/* 1. Daily quote */}
        <p style={{ margin: '0 0 8px', fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
          <DailyQuote />
        </p>

        {/* 2. Power Level hero card */}
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
                  <span className="streak-fire">{'🔥'}</span> {streak}j
                </span>
              )}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div
              className="aura-ring"
              style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                background: `radial-gradient(circle, ${transformation.accent}33, transparent 70%)`,
                animation: 'aura-pulse 2.5s ease-in-out infinite',
              }}
            />
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

        {/* Weekly nutrition report */}
        <WeeklyNutritionReport state={state} />

        {/* Deload warning */}
        {deloadAdvice && deloadAdvice.needed && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,140,0,0.1))',
            border: '1px solid var(--accent-red)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.2rem' }}>{'⚠️'}</span>
              <strong style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>Senzu Bean recommandé !</strong>
            </div>
            <p style={{ color: 'var(--text)', fontSize: '0.78rem', margin: '0 0 4px' }}>{deloadAdvice.reason}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>{deloadAdvice.suggestion}</p>
          </div>
        )}

              {/* Daily Summary Widget */}
      <DailySummaryWidget />

      {/* 3. CTA button */}
        <button
          className={`cta-button ${!hasWorkoutToday && !state.activeWorkout ? 'cta-button--pulse' : ''}`}
          onClick={onStartWorkout}
          type="button"
          style={{ fontFamily: "'Manrope', sans-serif", textTransform: 'none' as const, fontWeight: 700 }}
        >
          {state.activeWorkout ? "Reprendre l'entraînement" : "Commencer l'entraînement"}
        </button>

        {/* 4. Mesocycle compact line */}
        <section className="hevy-card" style={{ padding: '8px 14px', borderColor: `${mesocycle.color}33` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: mesocycle.color }}>
                Mésocycle: {mesocycle.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{mesocycle.detail}</span>
            </div>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
              color: 'var(--accent-gold)', lineHeight: 1,
            }}>
              {streak}j
            </span>
          </div>
        </section>

        {/* 5. Compact calories today */}
        {targets && (
          <section className="hevy-card" style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>Calories</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {nutrition.calories} / {targets.calories} kcal
              </span>
            </div>
            <div style={{
              height: 6, borderRadius: 3, background: 'var(--stroke)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, (nutrition.calories / targets.calories) * 100)}%`,
                background: nutrition.calories > targets.calories
                  ? 'var(--accent-red)'
                  : 'var(--accent-orange)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </section>
        )}

        {/* 6. Saiyan Steps promo */}
        <a
          href="https://youkow69.github.io/saiyan-steps/"
          target="_blank"
          rel="noopener noreferrer"
          className="hevy-card"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', textDecoration: 'none', color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>{'📱'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Saiyan Steps</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              Suis tes pas, ton sommeil et ton hydratation
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--accent)' }}>{'→'}</span>
        </a>
      </div>
    )
  },
)
