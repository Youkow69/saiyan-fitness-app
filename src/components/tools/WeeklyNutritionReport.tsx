import { useMemo, useState } from 'react'
import type { AppState } from '../../types'

interface Props {
  state: AppState
}

function getWeekDates(weeksAgo: number): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1 - weeksAgo * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

function avgWeight(entries: { date: string; weightKg: number }[], start: string, end: string): number | null {
  const filtered = entries.filter(e => e.date >= start && e.date <= end)
  if (filtered.length === 0) return null
  return filtered.reduce((s, e) => s + e.weightKg, 0) / filtered.length
}

export function WeeklyNutritionReport({ state }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const report = useMemo(() => {
    const thisWeek = getWeekDates(0)
    const lastWeek = getWeekDates(1)

    const thisAvg = avgWeight(state.bodyweightEntries, thisWeek.start, thisWeek.end)
    const lastAvg = avgWeight(state.bodyweightEntries, lastWeek.start, lastWeek.end)

    if (!thisAvg || !lastAvg || !state.targets) return null

    const weightChange = thisAvg - lastAvg
    const goal = state.profile?.goal

    let adjustment = 0
    let message = ''
    let emoji = ''

    if (goal === 'fat_loss') {
      if (weightChange > 0.1) {
        adjustment = -100
        message = 'Poids en hausse cette semaine. On reduit les rations de 100 kcal.'
        emoji = '📉'
      } else if (weightChange < -1) {
        adjustment = 100
        message = 'Perte trop rapide ! On augmente de 100 kcal pour preserver le muscle.'
        emoji = '⚠️'
      } else {
        message = 'Rythme parfait. On garde le cap, guerrier !'
        emoji = '✅'
      }
    } else if (goal === 'muscle_gain') {
      if (weightChange < -0.1) {
        adjustment = 150
        message = 'Pas assez de surplus. On ajoute 150 kcal pour alimenter la croissance.'
        emoji = '📈'
      } else if (weightChange > 0.5) {
        adjustment = -100
        message = 'Surplus trop eleve. On reduit de 100 kcal pour limiter le gras.'
        emoji = '⚠️'
      } else {
        message = 'Prise de masse parfaite. Continue comme ca !'
        emoji = '✅'
      }
    } else {
      message = 'Poids stable. Bonne recomposition en cours !'
      emoji = '✅'
    }

    return {
      thisAvg: Math.round(thisAvg * 10) / 10,
      lastAvg: Math.round(lastAvg * 10) / 10,
      weightChange: Math.round(weightChange * 100) / 100,
      adjustment,
      message,
      emoji,
      currentCalories: state.targets.calories,
      newCalories: state.targets.calories + adjustment,
    }
  }, [state.bodyweightEntries, state.targets, state.profile])

  if (!report || dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,140,0,0.05))',
      border: '1px solid var(--accent-gold, #FFD700)',
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
          {'📊'} Rapport de Bulma
        </strong>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
        >
          {'✕'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
          Semaine derniere : <strong>{report.lastAvg}kg</strong>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
          Cette semaine : <strong>{report.thisAvg}kg</strong>
        </div>
        <div style={{
          fontSize: '0.75rem', fontWeight: 700,
          color: report.weightChange > 0 ? 'var(--accent-red)' : report.weightChange < 0 ? 'var(--success)' : 'var(--text)',
        }}>
          {report.weightChange > 0 ? '+' : ''}{report.weightChange}kg
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text)', margin: '0 0 6px' }}>
        {report.emoji} {report.message}
      </p>
      {report.adjustment !== 0 && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 8, padding: '6px 10px',
          fontSize: '0.75rem', color: 'var(--accent)',
        }}>
          Objectif ajuste : {report.currentCalories} {'→'} <strong>{report.newCalories} kcal/j</strong>
        </div>
      )}
    </div>
  )
}
