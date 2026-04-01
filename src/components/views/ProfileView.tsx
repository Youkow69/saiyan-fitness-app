import React, { useState, useMemo } from 'react'
import type { BodyweightEntry, MeasurementEntry, TabId } from '../../types'
import { useAppState } from '../../context/AppContext'
import { programs } from '../../data'
import {
  formatNumber,
  getCurrentTransformationFull,
  getPowerLevel,
  getStreak,
  getTransformation,
  getWorkoutVolume,
  makeId,
  todayIso,
} from '../../lib'
import { showToast } from '../ui/Toast'
import { SectionTitle } from '../ui/Shared'
import { ProgressPhotos } from '../tools/ProgressPhotos'
import type { AppState } from '../../types'

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

interface ProfileViewProps {
  onToggleTheme: () => void
  theme: 'dark' | 'light'
  onNavigate: (tab: TabId) => void
  cloudUser?: any
  cloudStatus?: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncedAt?: string | null
  onSignOut?: () => Promise<void>
  onSyncNow?: () => Promise<void>
}


const GOAL_FR: Record<string, string> = {
  muscle_gain: 'Prise de muscle',
  fat_loss: 'Perte de gras',
  recomp: 'Recomposition',
  strength: 'Force',
  endurance: 'Endurance',
}

export const ProfileView: React.FC<ProfileViewProps> = React.memo(
  function ProfileView({ onToggleTheme, theme, onNavigate, cloudUser, cloudStatus, lastSyncedAt, onSignOut, onSyncNow }) {
    const { state, dispatch } = useAppState()
    const [bodyweight, setBodyweight] = useState(String(state.profile?.weightKg ?? 0))
    const [measurements, setMeasurements] = useState({ waist: '', chest: '', arm: '', thigh: '' })
    const [editingProfile, setEditingProfile] = useState(false)
    const [profileDraft, setProfileDraft] = useState(state.profile!)

    const powerLevel = useMemo(() => getPowerLevel(state), [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries])
    const transformation = getTransformation(powerLevel)
    const streak = useMemo(() => getStreak(state), [state.workouts])
    const totalVolume = useMemo(() => state.workouts.reduce((s, w) => s + getWorkoutVolume(w), 0), [state.workouts])
    const prCount = useMemo(() => countPRsFromWorkouts(state.workouts), [state.workouts])
    const tf = useMemo(() => getCurrentTransformationFull(state), [state.workouts, state.bodyweightEntries, state.targets, state.foodEntries])

    return (
      <div className="page">
        {/* Profile hero */}
        <section className="profile-hero">
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
            <img src={tf.current.image} alt={tf.current.name} style={{ width: 88, height: 88, objectFit: 'contain', filter: `drop-shadow(0 0 16px ${transformation.accent}88)`, animation: 'float 3s ease-in-out infinite' }} />
            <div style={{ textAlign: 'center' as const }}>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{state.profile?.name?.toUpperCase()}</h2>
              <p style={{ margin: '4px 0 0', color: transformation.accent, fontSize: '0.85rem', fontWeight: 700 }}>{transformation.name}</p>
            </div>
          </div>
          <div className="profile-stats-row">
            <div className="profile-stat"><span className="profile-stat-value">{state.workouts.length}</span><span className="profile-stat-label">Séances</span></div>
            <div className="profile-stat-divider" />
            <div className="profile-stat"><span className="profile-stat-value">{formatNumber(totalVolume)}</span><span className="profile-stat-label">Volume kg</span></div>
            <div className="profile-stat-divider" />
            <div className="profile-stat"><span className="profile-stat-value">{prCount}</span><span className="profile-stat-label">Records</span></div>
            <div className="profile-stat-divider" />
            <div className="profile-stat"><span className="profile-stat-value">{streak}</span><span className="profile-stat-label">Série 🔥</span></div>
          </div>
        </section>

        {/* Dashboard grid */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="🗂️" label="Tableau de bord" />
          <div className="quick-grid">
            <button className="quick-card" onClick={() => onNavigate('scouter')} type="button"><span className="quick-card-icon">📊</span><span className="quick-card-label">Statistiques</span></button>
            <button className="quick-card" onClick={() => onNavigate('train')} type="button"><span className="quick-card-icon">💪</span><span className="quick-card-label">Exercices</span></button>
            <button className="quick-card" type="button" onClick={() => onNavigate('scouter')}><span className="quick-card-icon">📏</span><span className="quick-card-label">Mesures</span></button>
            <button className="quick-card" onClick={() => onNavigate('nutrition')} type="button"><span className="quick-card-icon">🍽️</span><span className="quick-card-label">Nutrition</span></button>
          </div>
        </section>

        {/* Bodyweight */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="⚖️" label="Poids corporel" />
          <div className="inline-form">
            <input value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} placeholder="kg" />
            <button className="secondary-btn" type="button" onClick={() => {
              const entry: BodyweightEntry = { id: makeId('bw'), date: todayIso(), weightKg: Number(bodyweight) }
              dispatch({ type: 'LOG_BODYWEIGHT', payload: entry })
              showToast(`Poids enregistré : ${bodyweight} kg`, 'success')
            }}>Journal</button>
          </div>
          {state.bodyweightEntries.length >= 2 && (
            <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span>Debut: <strong style={{ color: 'var(--text)' }}>{state.bodyweightEntries[0].weightKg} kg</strong></span>
              <span>Actuel: <strong style={{ color: 'var(--text)' }}>{state.bodyweightEntries.at(-1)?.weightKg} kg</strong></span>
              <span>Delta: <strong style={{ color: ((state.bodyweightEntries.at(-1)?.weightKg ?? 0) - state.bodyweightEntries[0].weightKg) >= 0 ? 'var(--accent-orange)' : 'var(--accent-blue)' }}>{((state.bodyweightEntries.at(-1)?.weightKg ?? 0) - state.bodyweightEntries[0].weightKg).toFixed(1)} kg</strong></span>
            </div>
          )}
        </section>

        {/* Measurements */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="📏" label="Mensurations" />
          <div className="field-grid compact-grid">
            <label><span>Tour de taille (cm)</span><input value={measurements.waist} onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })} /></label>
            <label><span>Poitrine</span><input value={measurements.chest} onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })} /></label>
            <label><span>Bras</span><input value={measurements.arm} onChange={(e) => setMeasurements({ ...measurements, arm: e.target.value })} /></label>
            <label><span>Cuisse</span><input value={measurements.thigh} onChange={(e) => setMeasurements({ ...measurements, thigh: e.target.value })} /></label>
          </div>
          <button className="secondary-btn" type="button" onClick={() => {
            const w = Number(measurements.waist), c = Number(measurements.chest), a = Number(measurements.arm), t = Number(measurements.thigh)
            if (w <= 0 && c <= 0 && a <= 0 && t <= 0) return
            const entry: MeasurementEntry = { id: makeId('measure'), date: todayIso(), waistCm: w, chestCm: c, armCm: a, thighCm: t }
            dispatch({ type: 'LOG_MEASUREMENT', payload: entry })
            showToast('Mensurations sauvegardées', 'success')
            setMeasurements({ waist: '', chest: '', arm: '', thigh: '' })
          }}>Sauvegarder</button>
        </section>

        {/* Programs */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="📋" label="Programmes" />
          {programs.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><p>Aucun programme disponible.</p></div>
            : <div className="card-list">
                {programs.map((program) => (
                  <button className={`mini-card mini-card--button ${state.selectedProgramId === program.id ? 'mini-card--selected' : ''}`} key={program.id} type="button" onClick={() => {
                    dispatch({ type: 'CHOOSE_PROGRAM', payload: program.id })
                    showToast(`Programme: ${program.name}`, 'info')
                  }}>
                    <strong>{program.name}</strong>
                    <span>{program.saga} — {program.daysPerWeek} jours — {program.split}</span>
                  </button>
                ))}
              </div>
          }
        </section>

        {/* Profile edit mode */}
        <section className="hevy-card stack-md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle icon="👤" label="Modifier le profil" />
            <button className="ghost-btn" style={{ minHeight: 36, padding: '4px 14px', fontSize: '0.8rem' }} type="button"
              onClick={() => {
                if (editingProfile) {
                  dispatch({ type: 'UPDATE_PROFILE', payload: profileDraft })
                  showToast('Profil mis à jour', 'success')
                } else {
                  setProfileDraft(state.profile!)
                }
                setEditingProfile(!editingProfile)
              }}>
              {editingProfile ? 'Sauvegarder' : 'Modifier'}
            </button>
          </div>
          {editingProfile ? (
            <div className="field-grid">
              <label><span>Nom</span><input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} /></label>
              <label><span>Age</span><input type="number" value={profileDraft.age} onChange={(e) => setProfileDraft({ ...profileDraft, age: Number(e.target.value) })} /></label>
              <label><span>Poids (kg)</span><input type="number" value={profileDraft.weightKg} onChange={(e) => setProfileDraft({ ...profileDraft, weightKg: Number(e.target.value) })} /></label>
              <label><span>Taille (cm)</span><input type="number" value={profileDraft.heightCm} onChange={(e) => setProfileDraft({ ...profileDraft, heightCm: Number(e.target.value) })} /></label>
              <label><span>Jours/sem</span><input type="number" min={2} max={6} value={profileDraft.trainingDaysPerWeek} onChange={(e) => setProfileDraft({ ...profileDraft, trainingDaysPerWeek: Number(e.target.value) })} /></label>
              <label><span>Blessures</span><input value={profileDraft.injuryNotes} onChange={(e) => setProfileDraft({ ...profileDraft, injuryNotes: e.target.value })} /></label>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--stroke)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nom</span>
                <strong style={{ fontSize: '0.85rem' }}>{state.profile?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--stroke)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Age</span>
                <strong style={{ fontSize: '0.85rem' }}>{state.profile?.age} ans</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--stroke)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Objectif</span>
                <strong style={{ fontSize: '0.85rem' }}>{GOAL_FR[state.profile?.goal ?? ''] ?? state.profile?.goal?.replace('_', ' ')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Jours/semaine</span>
                <strong style={{ fontSize: '0.85rem' }}>{state.profile?.trainingDaysPerWeek}</strong>
              </div>
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="hevy-card stack-md">
          <SectionTitle icon="⚙️" label="Paramètres" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: '0.9rem' }}>{theme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair'}</span>
            <button type="button" onClick={onToggleTheme} className="theme-toggle" aria-label="Changer le thème">
              <span className="theme-toggle-knob" style={{ transform: theme === 'light' ? 'translateX(24px)' : 'translateX(0)' }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </section>

        <section className="hevy-card stack-md" style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 16 }}>
          <ProgressPhotos />
        </section>

        
      {/* Cloud sync */}
      {cloudUser && (
        <section style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: 16 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 12px' }}>
            Cloud Sync
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem' }}>{cloudUser.email}</span>
            <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 8, background: cloudStatus === 'synced' ? 'rgba(34,197,94,0.1)' : 'rgba(255,140,0,0.1)', color: cloudStatus === 'synced' ? '#22c55e' : 'var(--accent)', fontWeight: 600 }}>
              {cloudStatus === 'synced' ? 'Synchronise' : cloudStatus === 'syncing' ? 'Sync...' : cloudStatus === 'error' ? 'Erreur' : 'En attente'}
            </span>
          </div>
          {lastSyncedAt && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Derniere sync : {new Date(lastSyncedAt).toLocaleString('fr-FR')}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            {onSyncNow && <button type="button" onClick={onSyncNow} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--accent)', background: 'rgba(255,140,0,0.08)', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Synchroniser</button>}
            {onSignOut && <button type="button" onClick={onSignOut} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Deconnexion</button>}
          </div>
        </section>
      )}

      <p className="profile-footer">Propulsé par Katrava ⚡</p>
      </div>
    )
  }
)
