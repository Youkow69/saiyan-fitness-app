import React, { useMemo } from 'react'
import type { AppState } from '../../types'
import { getAdaptiveTDEEStatus, getDailyNutrition, formatNumber } from '../../lib'
import { SectionTitle } from '../ui/Shared'

interface AdaptiveTDEECardProps {
  state: AppState
}

export const AdaptiveTDEECard: React.FC<AdaptiveTDEECardProps> = React.memo(
  function AdaptiveTDEECard({ state }) {
    const { tdee, dailyDelta, status, hasEnoughData } = useMemo(
      () => getAdaptiveTDEEStatus(state),
      [state.foodEntries, state.bodyweightEntries, state.profile, state.targets]
    )
    const todayNutrition = getDailyNutrition(state.foodEntries)
    const statusColor =
      status === 'surplus'
        ? 'var(--accent-orange)'
        : status === 'deficit'
          ? 'var(--accent-blue)'
          : '#4fffb0'
    const statusLabel =
      status === 'surplus'
        ? 'Surplus'
        : status === 'deficit'
          ? 'Deficit'
          : 'Maintenance'
    const deltaLabel =
      Math.abs(dailyDelta) > 0
        ? `${dailyDelta > 0 ? '+' : ''}${Math.round(dailyDelta)} kcal`
        : 'Maintenu'
    return (
      <section className="hevy-card stack-md">
        <SectionTitle icon="🔥" label="TDEE Adaptatif" />
        <div className="metrics-grid">
          <article className="metric-card">
            <span className="eyebrow">TDEE estimé</span>
            <strong style={{ color: 'var(--accent-gold)' }}>
              {formatNumber(tdee)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              kcal/j
            </span>
          </article>
          <article className="metric-card">
            <span className="eyebrow">Balance</span>
            <strong style={{ color: statusColor }}>{statusLabel}</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              {deltaLabel}
            </span>
          </article>
          <article className="metric-card">
            <span className="eyebrow">Auj. logue</span>
            <strong style={{ color: 'var(--accent-blue)' }}>
              {formatNumber(todayNutrition.calories)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              kcal
            </span>
          </article>
        </div>
        {!hasEnoughData && (
          <p
            style={{
              margin: 0,
              fontSize: '0.73rem',
              color: 'var(--muted)',
              background: 'rgba(255,255,255,0.03)',
              padding: '10px 12px',
              borderRadius: 10,
            }}
          >
            Logue 7+ jours pour activer le TDEE adaptatif style MacroFactor.
          </p>
        )}
      </section>
    )
  }
)
