// src/components/tools/AdaptiveMacroReport.tsx
// Weekly macro adaptation report - "Rapport de Bulma"

import { useState } from 'react'
import { useAppState } from '../../context/AppContext'
import { getAdaptiveTDEEStatus } from '../../lib'

export function AdaptiveMacroReport() {
  const { state, dispatch } = useAppState()
  const [show, setShow] = useState(false)

  const tdeeStatus = getAdaptiveTDEEStatus(state)
  if (!tdeeStatus.hasEnoughData) return null

  const profile = state.profile
  if (!profile) return null

  // Calculate last 7 days average weight
  const recent7 = (state.bodyweightEntries || []).slice(-7)
  const prev7 = (state.bodyweightEntries || []).slice(-14, -7)

  const avgRecent = recent7.length > 0
    ? recent7.reduce((s, e) => s + e.weightKg, 0) / recent7.length
    : profile.weightKg
  const avgPrev = prev7.length > 0
    ? prev7.reduce((s, e) => s + e.weightKg, 0) / prev7.length
    : avgRecent

  const weeklyChange = avgRecent - avgPrev

  // Calculate adjustment
  let calorieAdjust = 0
  let adjustReason = ''
  if (profile.goal === 'fat_loss') {
    if (weeklyChange > -0.2) { calorieAdjust = -150; adjustReason = 'Stagnation en perte - r\u00e9duction' }
    else if (weeklyChange < -0.8) { calorieAdjust = 150; adjustReason = 'Perte trop rapide - augmentation' }
    else { adjustReason = 'Progression id\u00e9ale !' }
  } else if (profile.goal === 'muscle_gain') {
    if (weeklyChange < 0.1) { calorieAdjust = 150; adjustReason = 'Stagnation en prise - augmentation' }
    else if (weeklyChange > 0.5) { calorieAdjust = -150; adjustReason = 'Prise trop rapide - r\u00e9duction' }
    else { adjustReason = 'Progression id\u00e9ale !' }
  }

  const newTdee = Math.round(tdeeStatus.tdee + calorieAdjust)
  const newProtein = Math.round(avgRecent * 2.0)
  const newFat = Math.round(avgRecent * 0.75)
  const newCarbs = Math.round(Math.max(0, (newTdee - newProtein * 4 - newFat * 9) / 4))

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        style={{
          width: '100%', padding: '12px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))',
          border: '1px solid rgba(59,130,246,0.3)',
          color: '#93c5fd', fontWeight: 700, fontSize: '0.82rem',
          cursor: 'pointer',
        }}
      >
        {'\U0001f4ca'} Rapport de Bulma - Macros adaptatifs
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card, #1a1a2e)', borderRadius: 16,
      border: '1px solid rgba(59,130,246,0.3)', padding: 16, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#93c5fd' }}>
          {'\U0001f4ca'} Rapport de Bulma
        </h3>
        <button type="button" onClick={() => setShow(false)} style={{
          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '1.1rem',
        }}>{'\u2715'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Poids moyen</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{avgRecent.toFixed(1)} kg</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Variation /sem</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: weeklyChange > 0 ? '#22c55e' : weeklyChange < 0 ? '#ef4444' : '#f0f0f5' }}>
            {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(2)} kg
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TDEE adaptatif</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{Math.round(tdeeStatus.tdee)} kcal</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ajustement</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: calorieAdjust !== 0 ? '#f59e0b' : '#22c55e' }}>
            {calorieAdjust > 0 ? '+' : ''}{calorieAdjust} kcal
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,215,0,0.08)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFD700', marginBottom: 4 }}>
          {adjustReason}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          Nouveaux macros : {newProtein}g P / {newCarbs}g G / {newFat}g L = {newTdee} kcal
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (state.targets) {
            dispatch({ type: 'UPDATE_PROFILE', payload: { weightKg: Math.round(avgRecent * 10) / 10 } })
            // Update targets with new macros
            const newTargets = { ...state.targets, calories: newTdee, protein: newProtein, carbs: newCarbs, fats: newFat }
            try { localStorage.setItem('sf_targets_override', JSON.stringify(newTargets)) } catch {}
          }
          setShow(false)
        }}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}
      >
        Appliquer les nouveaux macros
      </button>
    </div>
  )
}
