import { useEffect, useMemo, useState } from 'react'
import { exercises, foods, programs, savedMeals } from './data'
import {
  calculateTargets,
  formatNumber,
  generateMainObjectives,
  getAdaptiveTDEEStatus,
  getDailyNutrition,
  getDailyQuestStatus,
  getExerciseById,
  getCurrentTransformationFull,
  getMesocycleStatus,
  getPowerLevel,
  getPrimaryRecommendation,
  getProgramById,
  getRecommendedRecipes,
  getStreak,
  getTransformation,
  getVolumeByMuscle,
  getVolumeStatus,
  getWeeklySetsByMuscle,
  getWeeklyWorkouts,
  getWorkoutVolume,
  makeId,
  recommendProgram,
  todayIso,
} from './lib'
import { loadState, debouncedSave } from './storage'
import type {
  AppState,
  BodyweightEntry,
  CustomRoutine,
  FoodEntry,
  Goal,
  MeasurementEntry,
  MuscleGroup,
  OnboardingAnswers,
  ProgramSession,
  SessionFeedback,
  SetType,
  TabId,
  UserProfile,
  WorkoutDraft,
} from './types'

const defaultProfile: UserProfile = {
  name: 'Guerrier',
  age: 28,
  sex: 'male',
  weightKg: 78,
  heightCm: 178,
  activityLevel: 'moderate',
  goal: 'muscle_gain',
  experienceLevel: 'intermediate',
  trainingDaysPerWeek: 4,
  equipmentAccess: 'full_gym',
  dietaryPreference: 'omnivore',
  injuryNotes: '',
}

const defaultOnboardingAnswers: OnboardingAnswers = {
  primaryGoalDetail: '',
  targetBodyfat: '',
  weakPoints: [],
  currentCardio: 'none',
  sleepHours: 7,
  stressLevel: 'moderate',
  mealPrepWillingness: 'moderate',
  supplementsUsed: [],
  pastInjuries: [],
  motivationStyle: 'data',
  dailyStepGoal: 10000,
  waterGoalLiters: 2,
}

const defaultState: AppState = {
  profile: null,
  targets: null,
  selectedProgramId: null,
  workouts: [],
  activeWorkout: null,
  programCursor: {},
  foodEntries: [],
  savedMeals,
  bodyweightEntries: [],
  measurementEntries: [],
  dailyQuestProgress: [],
  onboardingAnswers: null,
  completedDailyQuests: {},
  unlockedTransformations: [],
  sessionFeedback: [],
  mesocycle: null,
  adaptiveTDEE: [],
  weeklyMuscleVolume: {},
  customRoutines: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countPRsFromWorkouts(workouts: AppState['workouts']): number {
  const bestByExercise = new Map<string, number>()
  let prCount = 0
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  sorted.forEach(w => {
    w.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        const e1rm = set.weightKg * (1 + set.reps / 30)
        const prev = bestByExercise.get(ex.exerciseId) ?? 0
        if (e1rm > prev && prev > 0) prCount++
        if (e1rm > prev) bestByExercise.set(ex.exerciseId, e1rm)
      })
    })
  })
  return prCount
}

function getLastSet(workouts: AppState['workouts'], exerciseId: string) {
  for (let index = workouts.length - 1; index >= 0; index -= 1) {
    const exerciseLog = workouts[index].exercises.find(
      (entry) => entry.exerciseId === exerciseId && entry.sets.length > 0,
    )
    if (exerciseLog) return exerciseLog.sets[exerciseLog.sets.length - 1]
  }
  return null
}

// ── Reusable components ───────────────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <article className="metric-card">
      <span className="eyebrow">{label}</span>
      <strong style={{ color: accent }}>{value}</strong>
    </article>
  )
}

function ProgressBar({ label, value, target, accent }: { label: string; value: number; target: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, (value / target) * 100))
  return (
    <div className="progress-block">
      <div className="progress-meta">
        <span>{label}</span>
        <strong>{Math.round(value)} / {Math.round(target)}</strong>
      </div>
      <div className="progress-shell">
        <div className="progress-fill" style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="section-title-row">
      <span className="section-title-icon">{icon}</span>
      <h3 className="section-title-text">{label}</h3>
    </div>
  )
}

// ── Post-workout Feedback Modal ───────────────────────────────────────────────

function FeedbackModal({
  muscles,
  workoutId,
  onSave,
  onSkip,
}: {
  muscles: MuscleGroup[]
  workoutId: string
  onSave: (feedback: SessionFeedback) => void
  onSkip: () => void
}) {
  type FeedbackEntry = { pump: 1|2|3|4|5; soreness: 1|2|3|4|5; performance: 'worse'|'same'|'better'; jointPain: boolean }
  const initEntries: Record<string, FeedbackEntry> = {}
  muscles.forEach(m => { initEntries[m] = { pump: 3, soreness: 2, performance: 'same', jointPain: false } })
  const [entries, setEntries] = useState<Record<string, FeedbackEntry>>(initEntries)

  const set = (muscle: string, key: keyof FeedbackEntry, val: unknown) => {
    setEntries(prev => ({ ...prev, [muscle]: { ...prev[muscle], [key]: val } }))
  }

  const ratingCircles = (muscle: string, key: 'pump' | 'soreness') => (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => set(muscle, key, n as 1|2|3|4|5)}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: '1px solid',
            borderColor: entries[muscle][key] >= n ? 'var(--accent-gold)' : 'var(--stroke)',
            background: entries[muscle][key] >= n ? 'rgba(255,200,61,0.2)' : 'transparent',
            color: entries[muscle][key] >= n ? 'var(--accent-gold)' : 'var(--muted)',
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
          }}
        >{n}</button>
      ))}
    </div>
  )

  const handleSave = () => {
    const feedback: SessionFeedback = {
      date: todayIso(),
      workoutId,
      muscleGroups: muscles.map(m => ({ muscle: m, ...entries[m] })),
    }
    onSave(feedback)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', padding: 0,
    }}>
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: 'var(--bg-elev)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--stroke)', borderBottom: 'none',
        maxHeight: '80vh', overflow: 'auto', padding: '20px 16px 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span className="eyebrow">Feedback post-seance</span>
            <h3 style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem' }}>Ressenti RP</h3>
          </div>
          <button className="ghost-btn" style={{ minHeight: 36, padding: '4px 12px' }} onClick={onSkip} type="button">Passer</button>
        </div>
        <div className="stack-md">
          {muscles.map(muscle => (
            <div key={muscle} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px', border: '1px solid var(--stroke)' }}>
              <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 10 }}>{muscle}</strong>
              <div className="stack-md" style={{ gap: 10 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>PUMP (1=aucun, 5=extreme)</span>
                  {ratingCircles(muscle, 'pump')}
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>COURBATURES (1=aucune, 5=intense)</span>
                  {ratingCircles(muscle, 'soreness')}
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>PERFORMANCE VS DERNIERE FOIS</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['worse', 'same', 'better'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set(muscle, 'performance', p)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid',
                          borderColor: entries[muscle].performance === p ? 'var(--accent-gold)' : 'var(--stroke)',
                          background: entries[muscle].performance === p ? 'rgba(255,200,61,0.15)' : 'transparent',
                          color: entries[muscle].performance === p ? 'var(--accent-gold)' : 'var(--muted)',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {p === 'worse' ? 'Moins bien' : p === 'same' ? 'Pareil' : 'Mieux'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', flex: 1 }}>Douleur articulaire ?</span>
                  <button
                    type="button"
                    onClick={() => set(muscle, 'jointPain', !entries[muscle].jointPain)}
                    style={{
                      padding: '6px 14px', borderRadius: 10, border: '1px solid',
                      borderColor: entries[muscle].jointPain ? 'var(--accent-red)' : 'var(--stroke)',
                      background: entries[muscle].jointPain ? 'rgba(255,95,118,0.15)' : 'transparent',
                      color: entries[muscle].jointPain ? 'var(--accent-red)' : 'var(--muted)',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {entries[muscle].jointPain ? 'Oui' : 'Non'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="primary-btn" style={{ width: '100%', marginTop: 16 }} onClick={handleSave} type="button">
          Sauvegarder le feedback
        </button>
      </div>
    </div>
  )
}

// ── Onboarding ────────────────────────────────────────────────────────────────

function OnboardingView({ onComplete }: { onComplete: (profile: UserProfile, answers: OnboardingAnswers) => void }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<UserProfile>(defaultProfile)
  const [answers, setAnswers] = useState<OnboardingAnswers>(defaultOnboardingAnswers)

  const weakPointOptions = ['Epaules', 'Bras', 'Jambes', 'Dos', 'Poitrine', 'Abdominaux', 'Mollets', 'Fessiers']
  const supplementOptions = ['Creatine', 'Whey', 'Cafeine', 'Omega-3', 'Vitamine D', 'BCAA', 'Pre-workout', 'Aucun']
  const injuryOptions = ['Epaule', 'Genou', 'Dos', 'Poignet', 'Cheville', 'Hanche', 'Coude', 'Aucune']
  const toggle = (arr: string[], item: string) => arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  const stepTitles = ['Profil de base', 'Entrainement', 'Objectifs profonds', 'Cibles quotidiennes']

  return (
    <div className="page onboarding-shell">
      <section className="hero-card hero-card--scan">
        <span className="eyebrow">Scouter Scan — Etape {step}/4</span>
        <h1>Saiyan Fitness</h1>
        <p style={{ marginBottom: 0 }}>{stepTitles[step - 1]}</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }} />
          ))}
        </div>
      </section>

      {step === 1 && (
        <section className="panel stack-lg">
          <div className="field-grid">
            <label><span>Nom</span><input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
            <label><span>Age</span><input type="number" value={draft.age} onChange={e => setDraft({ ...draft, age: Number(e.target.value) })} /></label>
            <label><span>Poids (kg)</span><input type="number" value={draft.weightKg} onChange={e => setDraft({ ...draft, weightKg: Number(e.target.value) })} /></label>
            <label><span>Taille (cm)</span><input type="number" value={draft.heightCm} onChange={e => setDraft({ ...draft, heightCm: Number(e.target.value) })} /></label>
          </div>
          <div className="choice-group">
            <span className="field-title">Sexe</span>
            <div className="chip-row">
              {[['male', 'Homme'], ['female', 'Femme']].map(([v, l]) => (
                <button key={v} className={`chip ${draft.sex === v ? 'chip--active' : ''}`} onClick={() => setDraft({ ...draft, sex: v as UserProfile['sex'] })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Objectif principal</span>
            <div className="chip-row">
              {[['muscle_gain', 'Prise de masse'], ['fat_loss', 'Perte de gras'], ['recomp', 'Recomposition'], ['strength', 'Force'], ['endurance', 'Endurance']].map(([v, l]) => (
                <button key={v} className={`chip ${draft.goal === v ? 'chip--active' : ''}`} onClick={() => setDraft({ ...draft, goal: v as Goal })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <button className="primary-btn" onClick={() => setStep(2)} type="button" disabled={draft.name.trim().length < 2 || draft.age < 13 || draft.age > 120 || draft.weightKg < 20 || draft.weightKg > 300 || draft.heightCm < 100 || draft.heightCm > 250}>Suivant</button>
        </section>
      )}
      {step === 2 && (
        <section className="panel stack-lg">
          <div className="choice-group">
            <span className="field-title">Niveau d'activite</span>
            <div className="chip-row">
              {[['sedentary', 'Sedentaire'], ['light', 'Legere'], ['moderate', 'Moderee'], ['high', 'Elevee'], ['athlete', 'Athlete']].map(([v, l]) => (
                <button key={v} className={`chip ${draft.activityLevel === v ? 'chip--active' : ''}`} onClick={() => setDraft({ ...draft, activityLevel: v as UserProfile['activityLevel'] })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Niveau d'experience</span>
            <div className="chip-row">
              {[['beginner', 'Debutant'], ['intermediate', 'Intermediaire'], ['advanced', 'Avance']].map(([v, l]) => (
                <button key={v} className={`chip ${draft.experienceLevel === v ? 'chip--active' : ''}`} onClick={() => setDraft({ ...draft, experienceLevel: v as UserProfile['experienceLevel'] })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Materiel disponible</span>
            <div className="chip-row">
              {[['full_gym', 'Full gym'], ['basic_gym', 'Basic gym'], ['home_gym', 'Home gym']].map(([v, l]) => (
                <button key={v} className={`chip ${draft.equipmentAccess === v ? 'chip--active' : ''}`} onClick={() => setDraft({ ...draft, equipmentAccess: v as UserProfile['equipmentAccess'] })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="field-grid">
            <label><span>Jours par semaine</span><input type="number" min={2} max={6} value={draft.trainingDaysPerWeek} onChange={e => setDraft({ ...draft, trainingDaysPerWeek: Number(e.target.value) })} /></label>
            <label><span>Preference alimentaire</span><input value={draft.dietaryPreference} onChange={e => setDraft({ ...draft, dietaryPreference: e.target.value })} /></label>
            <label className="field-span-2"><span>Contraintes / blessures</span><input value={draft.injuryNotes} onChange={e => setDraft({ ...draft, injuryNotes: e.target.value })} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ghost-btn" style={{ flex: 1 }} onClick={() => setStep(1)} type="button">Retour</button>
            <button className="primary-btn" style={{ flex: 2 }} onClick={() => setStep(3)} type="button">Suivant</button>
          </div>
        </section>
      )}
      {step === 3 && (
        <section className="panel stack-lg">
          <div className="choice-group">
            <span className="field-title">Points faibles a cibler</span>
            <div className="chip-row">
              {weakPointOptions.map(item => (
                <button key={item} className={`chip ${answers.weakPoints.includes(item) ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, weakPoints: toggle(answers.weakPoints, item) })} type="button">{item}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Cardio actuel</span>
            <div className="chip-row">
              {[['none', 'Aucun'], ['light', 'Leger'], ['moderate', 'Modere'], ['intense', 'Intense']].map(([v, l]) => (
                <button key={v} className={`chip ${answers.currentCardio === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, currentCardio: v })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Style de motivation</span>
            <div className="chip-row">
              {[['data', 'Data/Stats'], ['community', 'Communaute'], ['aesthetics', 'Esthetique'], ['performance', 'Performance'], ['health', 'Sante']].map(([v, l]) => (
                <button key={v} className={`chip ${answers.motivationStyle === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, motivationStyle: v })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Supplements utilises</span>
            <div className="chip-row">
              {supplementOptions.map(item => (
                <button key={item} className={`chip ${answers.supplementsUsed.includes(item) ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, supplementsUsed: toggle(answers.supplementsUsed, item) })} type="button">{item}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Blessures passees</span>
            <div className="chip-row">
              {injuryOptions.map(item => (
                <button key={item} className={`chip ${answers.pastInjuries.includes(item) ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, pastInjuries: toggle(answers.pastInjuries, item) })} type="button">{item}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Niveau de stress</span>
            <div className="chip-row">
              {[['low', 'Faible'], ['moderate', 'Modere'], ['high', 'Eleve'], ['very_high', 'Tres eleve']].map(([v, l]) => (
                <button key={v} className={`chip ${answers.stressLevel === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, stressLevel: v })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ghost-btn" style={{ flex: 1 }} onClick={() => setStep(2)} type="button">Retour</button>
            <button className="primary-btn" style={{ flex: 2 }} onClick={() => setStep(4)} type="button">Suivant</button>
          </div>
        </section>
      )}
      {step === 4 && (
        <section className="panel stack-lg">
          <div className="choice-group">
            <span className="field-title">Objectif de pas quotidien</span>
            <div className="chip-row">
              {[[8000, '8 000 pas'], [10000, '10 000 pas'], [12000, '12 000 pas'], [15000, '15 000 pas']].map(([v, l]) => (
                <button key={String(v)} className={`chip ${answers.dailyStepGoal === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, dailyStepGoal: v as number })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Objectif d'hydratation</span>
            <div className="chip-row">
              {[[1.5, '1.5 L'], [2, '2 L'], [2.5, '2.5 L'], [3, '3 L']].map(([v, l]) => (
                <button key={String(v)} className={`chip ${answers.waterGoalLiters === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, waterGoalLiters: v as number })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Heures de sommeil cible</span>
            <div className="chip-row">
              {[[6, '6h'], [7, '7h'], [8, '8h'], [9, '9h+']].map(([v, l]) => (
                <button key={String(v)} className={`chip ${answers.sleepHours === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, sleepHours: v as number })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div className="choice-group">
            <span className="field-title">Meal prep</span>
            <div className="chip-row">
              {[['none', 'Aucun'], ['light', 'Leger'], ['moderate', 'Modere'], ['heavy', 'Full prep']].map(([v, l]) => (
                <button key={v} className={`chip ${answers.mealPrepWillingness === v ? 'chip--active' : ''}`} onClick={() => setAnswers({ ...answers, mealPrepWillingness: v })} type="button">{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ghost-btn" style={{ flex: 1 }} onClick={() => setStep(3)} type="button">Retour</button>
            <button className="primary-btn" style={{ flex: 2 }} onClick={() => onComplete(draft, answers)} type="button">Demarrer la premiere Saga</button>
          </div>
        </section>
      )}
    </div>
  )
}

// ── Transformation Timeline ───────────────────────────────────────────────────

function TransformationTimeline({ state }: { state: AppState }) {
  const tf = getCurrentTransformationFull(state)
  return (
    <div className="transformation-timeline">
      {tf.allTransformations.map((t, i) => {
        const isActive = i === tf.currentIndex
        const isLocked = i > tf.currentIndex
        return (
          <div key={t.level} className={`timeline-node ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
            <div className="timeline-img-wrap">
              <img src={t.image} alt={t.name} />
            </div>
            <span className="timeline-label">{t.name.replace('Super Saiyan', 'SSJ').replace('Mastered Ultra Instinct', 'MUI').replace('Ultra Instinct Sign', 'UI Sign')}</span>
          </div>
        )
      })}
    </div>
  )
}

function QuestSection({ state }: { state: AppState }) {
  const tf = getCurrentTransformationFull(state)
  const next = tf.nextTransformation
  if (!next || next.quests.length === 0) return null
  const allDone = next.quests.every(q => q.requirement(state) >= q.target)
  return (
    <section className="hevy-card stack-md">
      <div className="section-head">
        <div>
          <SectionTitle icon="⚔️" label={`Quetes vers ${next.name}`} />
        </div>
        <img src={next.image} alt={next.name} className={`transformation-image ${allDone ? 'aura-glow' : ''}`} style={{ width: 60, height: 60, filter: `drop-shadow(0 0 12px ${next.accent}88)` }} />
      </div>
      <div className="stack-md">
        {next.quests.map(q => {
          const current = q.requirement(state)
          const done = current >= q.target
          const pct = Math.min(100, Math.round((current / q.target) * 100))
          return (
            <div key={q.id} className={`quest-card ${done ? 'completed' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {done && <span style={{ color: '#ffd700' }}>✓</span>}
                    <strong style={{ fontSize: '0.88rem', color: done ? '#ffd700' : 'var(--text)' }}>{q.name}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{q.description}</p>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: done ? '#ffd700' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {Math.min(current, q.target).toLocaleString()} / {q.target.toLocaleString()}
                </span>
              </div>
              <div className="quest-progress-bar">
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: done ? 'linear-gradient(90deg,#ffd700,#ffaa00)' : `linear-gradient(90deg,${next.accent},${next.accent}88)` }} />
              </div>
            </div>
          )
        })}
      </div>
      {allDone && (
        <div className="transformation-available-banner" style={{ borderColor: next.accent, color: next.accent, background: `${next.accent}12` }}>
          TRANSFORMATION DISPONIBLE : {next.name.toUpperCase()}
        </div>
      )}
    </section>
  )
}

// ── Daily Quests ──────────────────────────────────────────────────────────────

function DailyQuestsPanel({ state, onUpdateQuestProgress, onCompleteQuest }: {
  state: AppState
  onUpdateQuestProgress: (questId: string, delta: number) => void
  onCompleteQuest: (questId: string) => void
}) {
  const questStatuses = getDailyQuestStatus(state)
  const completedCount = questStatuses.filter(q => q.isComplete).length
  const today = todayIso()
  const completedToday = (state.completedDailyQuests ?? {})[today] ?? []

  return (
    <section className="hevy-card stack-md">
      <div className="section-head">
        <SectionTitle icon="🗓️" label="Quetes quotidiennes" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{completedCount}/8</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {questStatuses.map(q => (
          <div key={q.id} style={{ flex: 1, height: 4, borderRadius: 2, background: q.isComplete ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div className="stack-md">
        {questStatuses.map(q => {
          const isManual = ['steps', 'water', 'sleep', 'stretch', 'no_junk'].includes(q.id)
          const isAutoCalc = ['protein', 'calories', 'training'].includes(q.id)
          const pct = Math.min(100, Math.round((q.current / q.target) * 100))
          const alreadyCompleted = completedToday.includes(q.id)
          const categoryClass = `quest-card-${q.category ?? 'activity'}`
          return (
            <div key={q.id} className={`quest-card ${categoryClass} ${q.isComplete ? 'completed' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' as const }}>{q.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {q.isComplete && <span style={{ color: '#ffd700', fontSize: '0.8rem' }}>✓</span>}
                      <strong style={{ fontSize: '0.85rem', color: q.isComplete ? '#ffd700' : 'var(--text)' }}>{q.name}</strong>
                      {isAutoCalc && <span className="auto-badge">AUTO</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)' }}>{q.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isManual && !q.isComplete && q.id !== 'no_junk' && (
                    <>
                      <button type="button" className="ghost-btn" style={{ minHeight: 30, padding: '2px 10px', borderRadius: 8, fontSize: '1rem' }} onClick={() => onUpdateQuestProgress(q.id, -1)}>-</button>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 44, textAlign: 'center' as const }}>{q.current}/{q.target}</span>
                      <button type="button" className="ghost-btn" style={{ minHeight: 30, padding: '2px 10px', borderRadius: 8, fontSize: '1rem' }} onClick={() => onUpdateQuestProgress(q.id, 1)}>+</button>
                    </>
                  )}
                  {(q.id === 'no_junk' || isAutoCalc) && !q.isComplete && !alreadyCompleted && (
                    <button type="button" className="ghost-btn" style={{ minHeight: 30, padding: '2px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }} onClick={() => onCompleteQuest(q.id)}>OK</button>
                  )}
                  {isAutoCalc && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: q.isComplete ? '#ffd700' : 'var(--muted)', minWidth: 40, textAlign: 'right' as const }}>{pct}%</span>
                  )}
                </div>
              </div>
              <div className="quest-progress-bar">
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: q.isComplete ? 'linear-gradient(90deg,#ffd700,#ffaa00)' : 'linear-gradient(90deg,#ff8c00,#ffd700)' }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Main Objectives ───────────────────────────────────────────────────────────

function MainObjectivesPanel({ state }: { state: AppState }) {
  const objectives = useMemo(() => generateMainObjectives(state), [state])
  if (objectives.length === 0) return null
  return (
    <section className="hevy-card stack-md">
      <SectionTitle icon="🎯" label="Objectifs principaux" />
      <div className="stack-md">
        {objectives.map(obj => {
          const totalM = obj.milestones.length
          const doneM = obj.milestones.filter(m => m.check(state) >= m.target).length
          const pct = Math.round((doneM / totalM) * 100)
          return (
            <div key={obj.id} className={`quest-card ${obj.completed ? 'completed' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>{obj.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.9rem', color: obj.completed ? '#ffd700' : 'var(--text)' }}>{obj.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{doneM}/{totalM}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{obj.description}</p>
                </div>
              </div>
              <div className="quest-progress-bar" style={{ marginBottom: 8 }}>
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: obj.completed ? 'linear-gradient(90deg,#ffd700,#ffaa00)' : 'linear-gradient(90deg,#37b7ff,#4fffb0)' }} />
              </div>
              <div className="stack-md" style={{ gap: 5 }}>
                {obj.milestones.map((m, idx) => {
                  const cur = m.check(state)
                  const done = cur >= m.target
                  const mp = Math.min(100, Math.round((cur / m.target) * 100))
                  return (
                    <div key={idx} style={{ opacity: done ? 1 : 0.65 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', color: done ? '#ffd700' : 'var(--muted)' }}>{done ? '✓ ' : ''}{m.description}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{Math.min(cur, m.target).toLocaleString()}/{m.target.toLocaleString()} {m.unit}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${mp}%`, background: done ? '#ffd700' : 'rgba(55,183,255,0.6)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── RP Volume Dashboard ───────────────────────────────────────────────────────

function VolumeDashboard({ state }: { state: AppState }) {
  const volumeTargets = useMemo(() => getWeeklySetsByMuscle(state), [state])
  const statusColors = { none: 'var(--muted)', below_mev: 'var(--accent-red)', productive: '#4fffb0', high: 'var(--accent-gold)', above_mrv: 'var(--accent-red)' }
  const statusLabels = { none: 'Aucun', below_mev: 'Sous MEV', productive: 'Productif', high: 'Eleve', above_mrv: 'Au-dessus MRV' }
  return (
    <section className="hevy-card stack-md">
      <div>
        <SectionTitle icon="📈" label="Volume RP — Landmarks" />
        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--muted)' }}>MEV · MAV · MRV</p>
      </div>
      <div className="stack-md">
        {volumeTargets.map(vt => {
          const status = getVolumeStatus(vt.currentSets, vt.mev, vt.mav, vt.mrv)
          const color = statusColors[status]
          const mrvPct = Math.min(100, Math.round((vt.currentSets / vt.mrv) * 100))
          return (
            <div key={vt.muscle} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.82rem' }}>{vt.muscle}</strong>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color, background: `${color}18`, padding: '1px 6px', borderRadius: 5, textTransform: 'uppercase' as const }}>{statusLabels[status]}</span>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{vt.currentSets} series</span>
              </div>
              <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'visible', marginBottom: 4 }}>
                <div style={{ position: 'absolute', left: `${Math.round((vt.mev / vt.mrv) * 100)}%`, top: -2, bottom: -2, width: 2, background: 'rgba(255,95,118,0.6)', borderRadius: 1 }} />
                <div style={{ position: 'absolute', left: `${Math.round((vt.mav / vt.mrv) * 100)}%`, top: -2, bottom: -2, width: 2, background: 'rgba(255,200,61,0.6)', borderRadius: 1 }} />
                <div style={{ height: '100%', borderRadius: 4, width: `${mrvPct}%`, background: color, transition: 'width 0.5s ease', opacity: 0.85 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--muted)' }}>
                <span>MEV {vt.mev}</span><span>MAV {vt.mav}</span><span>MRV {vt.mrv}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Adaptive TDEE Card ────────────────────────────────────────────────────────

function AdaptiveTDEECard({ state }: { state: AppState }) {
  const { tdee, dailyDelta, status, hasEnoughData } = useMemo(() => getAdaptiveTDEEStatus(state), [state])
  const todayNutrition = getDailyNutrition(state.foodEntries)
  const statusColor = status === 'surplus' ? 'var(--accent-orange)' : status === 'deficit' ? 'var(--accent-blue)' : '#4fffb0'
  const statusLabel = status === 'surplus' ? 'Surplus' : status === 'deficit' ? 'Deficit' : 'Maintenance'
  const deltaLabel = Math.abs(dailyDelta) > 0 ? `${dailyDelta > 0 ? '+' : ''}${Math.round(dailyDelta)} kcal` : 'Maintenu'
  return (
    <section className="hevy-card stack-md">
      <SectionTitle icon="🔥" label="TDEE Adaptatif" />
      <div className="metrics-grid">
        <article className="metric-card">
          <span className="eyebrow">TDEE estime</span>
          <strong style={{ color: 'var(--accent-gold)' }}>{formatNumber(tdee)}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>kcal/j</span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Balance</span>
          <strong style={{ color: statusColor }}>{statusLabel}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{deltaLabel}</span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Auj. logue</span>
          <strong style={{ color: 'var(--accent-blue)' }}>{formatNumber(todayNutrition.calories)}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>kcal</span>
        </article>
      </div>
      {!hasEnoughData && (
        <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10 }}>
          Logue 7+ jours pour activer le TDEE adaptatif style MacroFactor.
        </p>
      )}
    </section>
  )
}

// ── HOME VIEW ─────────────────────────────────────────────────────────────────

function HomeView({ state, nextSession, powerLevel, recommendation, onStartWorkout, onUpdateQuestProgress, onCompleteQuest, onNavigate }: {
  state: AppState
  nextSession: ProgramSession | null
  powerLevel: number
  recommendation: string
  onStartWorkout: () => void
  onUpdateQuestProgress: (questId: string, delta: number) => void
  onCompleteQuest: (questId: string) => void
  onNavigate: (tab: TabId) => void
}) {
  const targets = state.targets!
  const nutrition = getDailyNutrition(state.foodEntries)
  const tf = getCurrentTransformationFull(state)
  const transformation = tf.current
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const lastWorkout = state.workouts.length > 0 ? state.workouts[state.workouts.length - 1] : null
  const prCount = countPRsFromWorkouts(state.workouts)
  const mesocycle = getMesocycleStatus(state)
  const streak = getStreak(state)

  return (
    <div className="page">
      {/* Hero power level card */}
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

      {/* Big CTA */}
      <button className="cta-button" onClick={onStartWorkout} type="button">
        {state.activeWorkout ? "REPRENDRE L'ENTRAINEMENT" : "COMMENCER L'ENTRAINEMENT"}
      </button>

      {/* Quick action 2×2 grid */}
      <div className="quick-grid">
        <button className="quick-card" onClick={() => onNavigate('scouter')} type="button">
          <span className="quick-card-icon">📊</span>
          <span className="quick-card-label">Statistiques</span>
        </button>
        <button className="quick-card" onClick={() => onNavigate('train')} type="button">
          <span className="quick-card-icon">💪</span>
          <span className="quick-card-label">Exercices</span>
        </button>
        <button className="quick-card" onClick={() => onNavigate('profile')} type="button">
          <span className="quick-card-icon">📏</span>
          <span className="quick-card-label">Mesures</span>
        </button>
        <button className="quick-card" onClick={() => onNavigate('nutrition')} type="button">
          <span className="quick-card-icon">🍽️</span>
          <span className="quick-card-label">Nutrition</span>
        </button>
      </div>

      {/* Mesocycle status */}
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

      {/* Transformation saga */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="✨" label="Saga des transformations" />
        <TransformationTimeline state={state} />
      </section>

      {/* Transformation quests */}
      <QuestSection state={state} />

      {/* Daily quests */}
      <DailyQuestsPanel state={state} onUpdateQuestProgress={onUpdateQuestProgress} onCompleteQuest={onCompleteQuest} />

      {/* Main objectives */}
      <MainObjectivesPanel state={state} />

      {/* Mission du jour */}
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

      {/* Last workout — Hevy-style summary */}
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

      {/* Nutrition bar */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="🍽️" label="Nutrition aujourd'hui" />
        <ProgressBar label="Calories" value={nutrition.calories} target={targets.calories} accent="linear-gradient(90deg,#ffb400,#ff6a00)" />
        <ProgressBar label="Proteines" value={nutrition.protein} target={targets.protein} accent="linear-gradient(90deg,#00d4ff,#4fffb0)" />
      </section>

      {/* Scouter insight */}
      <section className="hevy-card">
        <SectionTitle icon="🔍" label="Analyse Scouter" />
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{recommendation}</p>
      </section>
    </div>
  )
}

// ── TRAIN VIEW ────────────────────────────────────────────────────────────────

function TrainView({ state, customRoutines, onStartWorkout, onStartSession, onStartCustomRoutine, onAddCustomRoutine, onDeleteCustomRoutine, onAddSet, onFinishWorkout, restTimer, onSkipTimer }: {
  state: AppState
  customRoutines: CustomRoutine[]
  onStartWorkout: () => void
  onStartSession: (sessionIndex: number) => void
  onStartCustomRoutine: (routine: CustomRoutine) => void
  onAddCustomRoutine: (routine: CustomRoutine) => void
  onDeleteCustomRoutine: (id: string) => void
  onAddSet: (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => void
  onFinishWorkout: () => void
  restTimer: number
  onSkipTimer: () => void
}) {
  const [draftInputs, setDraftInputs] = useState<Record<string, { weight: string; reps: string; rir: string; setType: SetType }>>({})
  const [creatingRoutine, setCreatingRoutine] = useState(false)
  const [routineName, setRoutineName] = useState('')
  const [routineExercises, setRoutineExercises] = useState<Array<{exerciseId: string; sets: number; repMin: number; repMax: number; restSeconds: number}>>([])
  const [exerciseSearch, setExerciseSearch] = useState('')
  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
  const activeWorkout = state.activeWorkout

  if (!selectedProgram) {
    return (
      <div className="page">
        <section className="hevy-card">
          <div className="empty-state">
            <div className="empty-icon">🏋️</div>
            <p>Choisis un programme depuis le profil pour commencer ta Saga.</p>
          </div>
        </section>
      </div>
    )
  }

  if (activeWorkout && nextSession) {
    return (
      <div className="page">
        {restTimer > 0 && (
          <section className="hevy-card timer-panel">
            <div>
              <SectionTitle icon="⏱️" label="Repos" />
              <h3 style={{ fontSize: '3.2rem', margin: '4px 0 0', color: 'var(--accent-gold)' }}>{restTimer}s</h3>
            </div>
            <button className="ghost-btn" onClick={onSkipTimer} type="button">Passer</button>
          </section>
        )}
        <section className="hevy-card stack-md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <SectionTitle icon="🏋️" label="Seance en cours" />
              <h3 style={{ margin: '4px 0 0' }}>{nextSession.name}</h3>
            </div>
            <button className="primary-btn" onClick={onFinishWorkout} type="button">Terminer</button>
          </div>
        </section>
        {activeWorkout.exercises.map(exerciseLog => {
          const exercise = getExerciseById(exerciseLog.exerciseId)
          const target = exerciseLog.target
          const previous = getLastSet(state.workouts, exercise.id)
          const currentInput = draftInputs[exercise.id] ?? {
            weight: previous?.weightKg?.toString() ?? '',
            reps: previous?.reps?.toString() ?? `${target.repMin}`,
            rir: String(target.targetRir),
            setType: 'normal' as SetType,
          }
          return (
            <section className="hevy-card stack-md" key={exercise.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{exercise.name}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>{target.sets}×{target.repMin}-{target.repMax} — RIR {target.targetRir} — Repos {target.restSeconds}s</p>
                </div>
                {previous && <span className="badge" style={{ fontSize: '0.72rem' }}>Dernier: {previous.weightKg}×{previous.reps}</span>}
              </div>
              <div className="field-grid compact-grid">
                <label><span>Poids (kg)</span><input value={currentInput.weight} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, weight: e.target.value } })} /></label>
                <label><span>Reps</span><input value={currentInput.reps} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, reps: e.target.value } })} /></label>
                <label><span>RIR</span><input value={currentInput.rir} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, rir: e.target.value } })} /></label>
                <label>
                  <span>Type</span>
                  <select value={currentInput.setType} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, setType: e.target.value as SetType } })}>
                    <option value="warmup">Echauffement</option>
                    <option value="normal">Normal</option>
                    <option value="top">Top set</option>
                    <option value="backoff">Back-off</option>
                    <option value="drop">Drop set</option>
                    <option value="amrap">AMRAP</option>
                  </select>
                </label>
              </div>
              <button className="secondary-btn" type="button" onClick={() => onAddSet(exercise.id, Number(currentInput.weight || 0), Number(currentInput.reps || 0), Number(currentInput.rir || target.targetRir), currentInput.setType)}>
                + Ajouter la serie
              </button>
              <div className="set-list">
                {exerciseLog.sets.length === 0
                  ? <div className="empty-state" style={{ padding: '10px 0' }}><p style={{ margin: 0, fontSize: '0.83rem' }}>Commence avec la charge precedente.</p></div>
                  : exerciseLog.sets.map(set => (
                      <div className="set-row" key={set.id}>
                        <span>S{set.setIndex}</span>
                        <strong>{set.weightKg} kg × {set.reps}</strong>
                        <span>RIR {set.rir}</span>
                        <span>{set.setType}</span>
                      </div>
                    ))
                }
              </div>
              {exercise.alternatives.length > 0 && (
                <div className="chip-row">
                  {exercise.alternatives.map(altId => (
                    <span className="chip chip--static" key={altId} style={{ fontSize: '0.72rem' }}>{getExerciseById(altId).name}</span>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  // Hevy-style: show all sessions as cards with exercise preview + CTA
  return (
    <div className="page">
      {/* Program header */}
      <section className="hevy-hero">
        <div style={{ flex: 1 }}>
          <span className="eyebrow">{selectedProgram.saga}</span>
          <h2 style={{ margin: '4px 0' }}>{selectedProgram.name}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem' }}>{selectedProgram.split} — {selectedProgram.daysPerWeek} jours/semaine</p>
        </div>
        <div className="hero-badge" style={{ alignSelf: 'flex-start' }}>{selectedProgram.daysPerWeek} j/sem</div>
      </section>

      {/* Libre session */}
      <button className="libre-btn" onClick={onStartWorkout} type="button">
        <span style={{ fontSize: '1.2rem' }}>+</span>
        <span>Demarrer un Entrainement Libre</span>
      </button>

      {/* Créer ma routine button */}
      <button className="libre-btn" onClick={() => setCreatingRoutine(true)} type="button">
        <span style={{ fontSize: '1.2rem' }}>➕</span>
        <span>Créer ma routine</span>
      </button>

      {/* Custom routine creation panel */}
      {creatingRoutine && (
        <section className="hevy-card stack-md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle icon="✏️" label="Nouvelle routine" />
            <button className="ghost-btn" style={{ minHeight: 34, padding: '4px 12px' }} onClick={() => { setCreatingRoutine(false); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('') }} type="button">✕</button>
          </div>
          <label><span>Nom de la routine</span><input value={routineName} onChange={e => setRoutineName(e.target.value)} placeholder="Ex: Full Body A" /></label>
          <div>
            <span className="eyebrow">Ajouter des exercices</span>
            <input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} placeholder="Chercher un exercice..." style={{ marginBottom: 8 }} />
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 6 }}>
              {exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).slice(0, 12).map(ex => (
                <button key={ex.id} className="ghost-btn" style={{ minHeight: 36, padding: '6px 12px', textAlign: 'left', fontSize: '0.82rem' }} type="button"
                  onClick={() => { if (!routineExercises.find(e => e.exerciseId === ex.id)) { setRoutineExercises(prev => [...prev, { exerciseId: ex.id, sets: 3, repMin: 8, repMax: 12, restSeconds: 90 }]) } }}>
                  {ex.name} <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>— {ex.primaryMuscles.join(', ')}</span>
                </button>
              ))}
            </div>
          </div>
          {routineExercises.length > 0 && (
            <div className="stack-md">
              <span className="eyebrow">Exercices ajoutés ({routineExercises.length})</span>
              {routineExercises.map((re, idx) => {
                const ex = getExerciseById(re.exerciseId)
                return (
                  <div key={re.exerciseId} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--stroke)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ fontSize: '0.85rem' }}>{ex.name}</strong>
                      <button type="button" onClick={() => setRoutineExercises(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                      <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Séries</span><input type="number" value={re.sets} min={1} max={10} onChange={e => setRoutineExercises(prev => prev.map((x, i) => i === idx ? { ...x, sets: Number(e.target.value) } : x))} /></label>
                      <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Reps min</span><input type="number" value={re.repMin} min={1} max={50} onChange={e => setRoutineExercises(prev => prev.map((x, i) => i === idx ? { ...x, repMin: Number(e.target.value) } : x))} /></label>
                      <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Reps max</span><input type="number" value={re.repMax} min={1} max={50} onChange={e => setRoutineExercises(prev => prev.map((x, i) => i === idx ? { ...x, repMax: Number(e.target.value) } : x))} /></label>
                      <label style={{ gap: 4 }}><span style={{ fontSize: '0.65rem' }}>Repos(s)</span><input type="number" value={re.restSeconds} min={30} max={600} step={15} onChange={e => setRoutineExercises(prev => prev.map((x, i) => i === idx ? { ...x, restSeconds: Number(e.target.value) } : x))} /></label>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <button className="primary-btn" type="button" disabled={!routineName.trim() || routineExercises.length === 0}
            onClick={() => {
              onAddCustomRoutine({ id: makeId('cr'), name: routineName.trim(), exercises: routineExercises })
              setCreatingRoutine(false); setRoutineName(''); setRoutineExercises([]); setExerciseSearch('')
            }}>
            Sauvegarder la routine
          </button>
        </section>
      )}

      <SectionTitle icon="📋" label="Seances du programme" />

      {/* All sessions as Hevy-style routine cards */}
      {selectedProgram.sessions.map((session, idx) => {
        const isNext = idx === nextIndex % selectedProgram.sessions.length
        const exerciseNames = session.exercises.slice(0, 3).map(e => getExerciseById(e.exerciseId).name).join(', ')
        const moreCount = session.exercises.length - 3
        return (
          <section key={session.id} className={`routine-card ${isNext ? 'routine-card--next' : ''}`}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>{session.name}</h3>
                {isNext && <span className="next-badge">PROCHAINE</span>}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{session.focus}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                {exerciseNames}{moreCount > 0 ? ` +${moreCount} exercices` : ''}
              </p>
            </div>
            <button
              className="cta-button"
              style={{ fontSize: '1.1rem', padding: '0.9rem' }}
              onClick={() => onStartSession(idx)}
              type="button"
            >
              COMMENCER LA SEANCE
            </button>
          </section>
        )
      })}

      {/* Custom routines section */}
      {customRoutines.length > 0 && (
        <>
          <SectionTitle icon="⭐" label="Mes routines perso" />
          {customRoutines.map(routine => (
            <section key={routine.id} className="routine-card">
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ margin: 0 }}>{routine.name}</h3>
                  <span className="next-badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>PERSO</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {routine.exercises.slice(0, 3).map(e => getExerciseById(e.exerciseId).name).join(', ')}
                  {routine.exercises.length > 3 ? ` +${routine.exercises.length - 3} exercices` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cta-button" style={{ fontSize: '1.1rem', padding: '0.9rem', flex: 1 }} onClick={() => onStartCustomRoutine(routine)} type="button">
                  COMMENCER
                </button>
                <button className="ghost-btn" style={{ minHeight: 48, padding: '8px 14px', borderRadius: 12 }} onClick={() => onDeleteCustomRoutine(routine.id)} type="button">🗑️</button>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

// ── NUTRITION VIEW ────────────────────────────────────────────────────────────

function NutritionView({ state, onAddFood }: { state: AppState; onAddFood: (entry: FoodEntry) => void }) {
  const [selectedFood, setSelectedFood] = useState(foods[0])
  const [grams, setGrams] = useState('100')
  const [category, setCategory] = useState<FoodEntry['category']>('lunch')
  const totals = getDailyNutrition(state.foodEntries)
  const suggestions = getRecommendedRecipes(state)

  return (
    <div className="page">
      <AdaptiveTDEECard state={state} />
      <section className="hevy-card stack-md">
        <SectionTitle icon="🍽️" label="Nutrition aujourd'hui" />
        <ProgressBar label="Calories" value={totals.calories} target={state.targets?.calories ?? 1} accent="linear-gradient(90deg,#ffb400,#ff6a00)" />
        <ProgressBar label="Proteines" value={totals.protein} target={state.targets?.protein ?? 1} accent="linear-gradient(90deg,#00d4ff,#4fffb0)" />
        <ProgressBar label="Glucides" value={totals.carbs} target={state.targets?.carbs ?? 1} accent="linear-gradient(90deg,#a855f7,#6366f1)" />
        <ProgressBar label="Lipides" value={totals.fats} target={state.targets?.fats ?? 1} accent="linear-gradient(90deg,#f59e0b,#ef4444)" />
      </section>
      <section className="hevy-card stack-md">
        <SectionTitle icon="➕" label="Ajouter un aliment" />
        <div className="field-grid compact-grid">
          <label>
            <span>Aliment</span>
            <select value={selectedFood.id} onChange={e => setSelectedFood(foods.find(f => f.id === e.target.value) ?? foods[0])}>
              {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label><span>Grammes</span><input value={grams} onChange={e => setGrams(e.target.value)} /></label>
          <label>
            <span>Categorie</span>
            <select value={category} onChange={e => setCategory(e.target.value as FoodEntry['category'])}>
              <option value="breakfast">Petit-dejeuner</option>
              <option value="lunch">Dejeuner</option>
              <option value="dinner">Diner</option>
              <option value="snack">Collation</option>
              <option value="pre_workout">Pre-seance</option>
              <option value="post_workout">Post-seance</option>
            </select>
          </label>
        </div>
        <button className="secondary-btn" type="button" onClick={() => {
          const g = Number(grams || 0)
          if (isNaN(g) || g <= 0) return
          const ratio = g / selectedFood.servingGrams
          onAddFood({ id: makeId('food'), date: todayIso(), name: selectedFood.name, category, grams: g, calories: Math.round(selectedFood.calories * ratio), protein: Number((selectedFood.protein * ratio).toFixed(1)), carbs: Number((selectedFood.carbs * ratio).toFixed(1)), fats: Number((selectedFood.fats * ratio).toFixed(1)) })
        }}>Ajouter</button>
      </section>
      <section className="hevy-card stack-md">
        <SectionTitle icon="🥡" label="Repas sauvegardes" />
        {state.savedMeals.length === 0
          ? <div className="empty-state"><div className="empty-icon">🥡</div><p>Aucun repas sauvegarde.</p></div>
          : <div className="card-list">
              {state.savedMeals.map(meal => (
                <button className="mini-card mini-card--button" key={meal.id} type="button" onClick={() => onAddFood({ id: makeId('meal'), date: todayIso(), name: meal.name, category: meal.category, grams: 1, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats })}>
                  <strong>{meal.name}</strong>
                  <span>{meal.calories} kcal — {meal.protein}P</span>
                </button>
              ))}
            </div>
        }
      </section>
      <section className="hevy-card stack-md">
        <SectionTitle icon="🍳" label="Recettes suggerees" />
        <div className="card-list">
          {suggestions.map(recipe => (
            <button className="mini-card mini-card--button" key={recipe.id} type="button" onClick={() => onAddFood({ id: makeId('recipe'), date: todayIso(), name: recipe.name, category: recipe.category, grams: 1, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats })}>
              <strong>{recipe.name}</strong>
              <span>{recipe.prepMinutes} min — {recipe.calories} kcal — {recipe.protein}P</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── SCOUTER VIEW ──────────────────────────────────────────────────────────────

function ScouterView({ state }: { state: AppState }) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const volumeByMuscle = getVolumeByMuscle(weeklyWorkouts)
  const totalVolume = state.workouts.reduce((s, w) => s + getWorkoutVolume(w), 0)
  const prCount = countPRsFromWorkouts(state.workouts)

  return (
    <div className="page">
      <section className="hevy-card stack-md">
        <SectionTitle icon="🔬" label="Statistiques" />
        <div className="metrics-grid">
          <MetricCard label="Seances total" value={String(state.workouts.length)} accent="var(--accent-gold)" />
          <MetricCard label="Volume total" value={`${formatNumber(totalVolume)} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Records" value={String(prCount)} accent="var(--accent-orange)" />
        </div>
        <div className="metrics-grid">
          <MetricCard label="Cette semaine" value={String(weeklyWorkouts.length)} accent="var(--accent-gold)" />
          <MetricCard label="Vol. semaine" value={`${formatNumber(weeklyWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0))} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Poids actuel" value={`${state.bodyweightEntries.at(-1)?.weightKg ?? state.profile?.weightKg ?? 0} kg`} accent="#4fffb0" />
        </div>
      </section>

      <VolumeDashboard state={state} />

      <section className="hevy-card stack-md">
        <SectionTitle icon="📊" label="Tonnage par muscle" />
        {volumeByMuscle.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📊</div><p>Complete ta premiere semaine pour voir la map musculaire.</p></div>
        ) : (
          volumeByMuscle.map(([muscle, volume]) => (
            <ProgressBar key={muscle} label={muscle} value={volume} target={Math.max(volumeByMuscle[0][1], 1)} accent="linear-gradient(90deg,#4fffb0,#00d4ff)" />
          ))
        )}
      </section>

      <section className="hevy-card stack-md">
        <SectionTitle icon="💪" label="1RM estimes" />
        {['bench_press', 'back_squat', 'romanian_deadlift', 'pull_up'].map(exerciseId => {
          let best = 0
          state.workouts.forEach(w => w.exercises.filter(e => e.exerciseId === exerciseId).forEach(e => e.sets.forEach(s => { const e1rm = s.weightKg * (1 + s.reps / 30); if (e1rm > best) best = e1rm })))
          const ex = getExerciseById(exerciseId)
          return (
            <div key={exerciseId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--stroke)' }}>
              <span style={{ fontSize: '0.85rem' }}>{ex.name}</span>
              <strong style={{ color: best > 0 ? 'var(--accent-gold)' : 'var(--muted)', fontSize: '0.9rem' }}>
                {best > 0 ? `~${Math.round(best)} kg` : '—'}
              </strong>
            </div>
          )
        })}
      </section>
    </div>
  )
}

// ── PROFILE VIEW ──────────────────────────────────────────────────────────────

function ProfileView({ state, powerLevel, onLogBodyweight, onLogMeasurement, onChooseProgram, onToggleTheme, theme, onNavigate }: {
  state: AppState
  powerLevel: number
  onLogBodyweight: (entry: BodyweightEntry) => void
  onLogMeasurement: (entry: MeasurementEntry) => void
  onChooseProgram: (programId: string) => void
  onToggleTheme: () => void
  theme: 'dark' | 'light'
  onNavigate: (tab: TabId) => void
}) {
  const [bodyweight, setBodyweight] = useState(String(state.profile?.weightKg ?? 0))
  const [measurements, setMeasurements] = useState({ waist: '', chest: '', arm: '', thigh: '' })
  const transformation = getTransformation(powerLevel)
  const streak = getStreak(state)
  const totalVolume = state.workouts.reduce((s, w) => s + getWorkoutVolume(w), 0)
  const prCount = countPRsFromWorkouts(state.workouts)
  const tf = getCurrentTransformationFull(state)

  return (
    <div className="page">
      {/* Hevy-style profile hero */}
      <section className="profile-hero">
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
          <img src={tf.current.image} alt={tf.current.name} style={{ width: 88, height: 88, objectFit: 'contain', filter: `drop-shadow(0 0 16px ${transformation.accent}88)`, animation: 'float 3s ease-in-out infinite' }} />
          <div style={{ textAlign: 'center' as const }}>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{state.profile?.name?.toUpperCase()}</h2>
            <p style={{ margin: '4px 0 0', color: transformation.accent, fontSize: '0.85rem', fontWeight: 700 }}>{transformation.name}</p>
          </div>
        </div>
        {/* Stats row */}
        <div className="profile-stats-row">
          <div className="profile-stat">
            <span className="profile-stat-value">{state.workouts.length}</span>
            <span className="profile-stat-label">Seances</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{formatNumber(totalVolume)}</span>
            <span className="profile-stat-label">Volume kg</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{prCount}</span>
            <span className="profile-stat-label">Records</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{streak}</span>
            <span className="profile-stat-label">Série 🔥</span>
          </div>
        </div>
      </section>

      {/* Dashboard 2×2 */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="🗂️" label="Tableau de bord" />
        <div className="quick-grid">
          <button className="quick-card" onClick={() => onNavigate('scouter')} type="button">
            <span className="quick-card-icon">📊</span>
            <span className="quick-card-label">Statistiques</span>
          </button>
          <button className="quick-card" onClick={() => onNavigate('train')} type="button">
            <span className="quick-card-icon">💪</span>
            <span className="quick-card-label">Exercices</span>
          </button>
          <button className="quick-card" type="button" onClick={() => onNavigate('scouter')}>
            <span className="quick-card-icon">📏</span>
            <span className="quick-card-label">Mesures</span>
          </button>
          <button className="quick-card" onClick={() => onNavigate('nutrition')} type="button">
            <span className="quick-card-icon">🍽️</span>
            <span className="quick-card-label">Nutrition</span>
          </button>
        </div>
      </section>

      {/* Bodyweight */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="⚖️" label="Poids corporel" />
        <div className="inline-form">
          <input value={bodyweight} onChange={e => setBodyweight(e.target.value)} placeholder="kg" />
          <button className="secondary-btn" type="button" onClick={() => onLogBodyweight({ id: makeId('bw'), date: todayIso(), weightKg: Number(bodyweight) })}>Journal</button>
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
          <label><span>Tour de taille (cm)</span><input value={measurements.waist} onChange={e => setMeasurements({ ...measurements, waist: e.target.value })} /></label>
          <label><span>Poitrine</span><input value={measurements.chest} onChange={e => setMeasurements({ ...measurements, chest: e.target.value })} /></label>
          <label><span>Bras</span><input value={measurements.arm} onChange={e => setMeasurements({ ...measurements, arm: e.target.value })} /></label>
          <label><span>Cuisse</span><input value={measurements.thigh} onChange={e => setMeasurements({ ...measurements, thigh: e.target.value })} /></label>
        </div>
        <button className="secondary-btn" type="button" onClick={() => {
          const w = Number(measurements.waist), c = Number(measurements.chest), a = Number(measurements.arm), t = Number(measurements.thigh)
          if (w <= 0 && c <= 0 && a <= 0 && t <= 0) return
          onLogMeasurement({ id: makeId('measure'), date: todayIso(), waistCm: w, chestCm: c, armCm: a, thighCm: t })
        }}>Sauvegarder</button>
      </section>

      {/* Programs */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="📋" label="Programmes" />
        {programs.length === 0
          ? <div className="empty-state"><div className="empty-icon">📋</div><p>Aucun programme disponible.</p></div>
          : <div className="card-list">
              {programs.map(program => (
                <button className={`mini-card mini-card--button ${state.selectedProgramId === program.id ? 'mini-card--selected' : ''}`} key={program.id} type="button" onClick={() => onChooseProgram(program.id)}>
                  <strong>{program.name}</strong>
                  <span>{program.saga} — {program.daysPerWeek} jours — {program.split}</span>
                </button>
              ))}
            </div>
        }
      </section>

      {/* Settings */}
      <section className="hevy-card stack-md">
        <SectionTitle icon="⚙️" label="Parametres" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--stroke)' }}>
          <span style={{ fontSize: '0.9rem' }}>{theme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair'}</span>
          <button type="button" onClick={onToggleTheme} className="theme-toggle" aria-label="Changer le theme">
            <span className="theme-toggle-knob" style={{ transform: theme === 'light' ? 'translateX(24px)' : 'translateX(0)' }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: '0.9rem' }}>Profil: {state.profile?.name}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{state.profile?.goal?.replace('_', ' ')}</span>
        </div>
      </section>

      <p className="profile-footer">Propulse par Katrava ⚡</p>
    </div>
  )
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

function BottomNav({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  const items: Array<{ id: TabId; icon: string; label: string; ariaLabel: string }> = [
    { id: 'home',      icon: '🏠', label: 'Accueil',   ariaLabel: 'Accueil'        },
    { id: 'train',     icon: '💪', label: 'Training',  ariaLabel: 'Entrainement'   },
    { id: 'nutrition', icon: '🍽️', label: 'Nutrition', ariaLabel: 'Nutrition'      },
    { id: 'scouter',   icon: '📊', label: 'Stats',     ariaLabel: 'Statistiques'   },
    { id: 'profile',   icon: '👤', label: 'Profil',    ariaLabel: 'Profil'         },
  ]
  return (
    <nav className="bottom-nav" role="tablist" aria-label="Navigation principale">
      {items.map(({ id, icon, label, ariaLabel }) => (
        <button key={id} className={`nav-item ${tab === id ? 'nav-item--active' : ''}`} onClick={() => onChange(id)} type="button" role="tab" aria-selected={tab === id} aria-label={ariaLabel}>
          <span className="nav-icon" aria-hidden="true">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState()
    if (!loaded) return defaultState
    return {
      ...defaultState,
      ...loaded,
      dailyQuestProgress: loaded.dailyQuestProgress ?? [],
      onboardingAnswers: loaded.onboardingAnswers ?? null,
      completedDailyQuests: loaded.completedDailyQuests ?? {},
      unlockedTransformations: loaded.unlockedTransformations ?? [],
      sessionFeedback: loaded.sessionFeedback ?? [],
      mesocycle: loaded.mesocycle ?? null,
      adaptiveTDEE: loaded.adaptiveTDEE ?? [],
      weeklyMuscleVolume: loaded.weeklyMuscleVolume ?? {},
      customRoutines: loaded.customRoutines ?? [],
    }
  })
  const [tab, setTab] = useState<TabId>('home')
  const [restTimer, setRestTimer] = useState(0)
  const [pendingFeedback, setPendingFeedback] = useState<{ workoutId: string; muscles: MuscleGroup[] } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('sf_theme') as 'dark' | 'light') || 'dark')

  useEffect(() => debouncedSave(state), [state])
  useEffect(() => {
    if (restTimer <= 0) return
    if (restTimer === 3) {
      try { navigator.vibrate?.(100) } catch {}
    }
    const timer = window.setTimeout(() => {
      if (restTimer === 1) {
        try {
          navigator.vibrate?.([200, 100, 200, 100, 200])
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = 880
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.5)
        } catch {}
      }
      setRestTimer(c => c - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [restTimer])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
  const powerLevel = useMemo(() => getPowerLevel(state), [state])
  const recommendation = useMemo(() => getPrimaryRecommendation(state), [state])

  const completeOnboarding = (profile: UserProfile, answers: OnboardingAnswers) => {
    const targets = calculateTargets(profile)
    const recommendedProgram = recommendProgram(profile)
    setState({ ...defaultState, profile, targets, selectedProgramId: recommendedProgram.id, savedMeals, bodyweightEntries: [{ id: makeId('bw'), date: todayIso(), weightKg: profile.weightKg }], onboardingAnswers: answers })
  }

  const startWorkout = () => {
    if (!selectedProgram || !nextSession) return
    const draft: WorkoutDraft = {
      programId: selectedProgram.id,
      sessionId: nextSession.id,
      startedAt: new Date().toISOString(),
      exercises: nextSession.exercises.map(entry => ({ exerciseId: entry.exerciseId, target: entry, sets: [] })),
    }
    setState(c => ({ ...c, activeWorkout: draft }))
    setTab('train')
  }

  const startSession = (sessionIndex: number) => {
    if (!selectedProgram) return
    const session = selectedProgram.sessions[sessionIndex]
    if (!session) return
    const draft: WorkoutDraft = {
      programId: selectedProgram.id,
      sessionId: session.id,
      startedAt: new Date().toISOString(),
      exercises: session.exercises.map(entry => ({ exerciseId: entry.exerciseId, target: entry, sets: [] })),
    }
    setState(c => ({ ...c, activeWorkout: draft }))
  }

  const startCustomRoutine = (routine: CustomRoutine) => {
    const draft: WorkoutDraft = {
      programId: 'custom',
      sessionId: routine.id,
      sessionName: routine.name,
      startedAt: new Date().toISOString(),
      exercises: routine.exercises.map(entry => ({
        exerciseId: entry.exerciseId,
        target: { exerciseId: entry.exerciseId, sets: entry.sets, repMin: entry.repMin, repMax: entry.repMax, targetRir: 2, restSeconds: entry.restSeconds },
        sets: [],
      })),
    }
    setState(c => ({ ...c, activeWorkout: draft }))
    setTab('train')
  }

  const addSet = (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => {
    if (!state.activeWorkout || reps <= 0 || weightKg < 0) return
    const exerciseTarget = state.activeWorkout.exercises.find(e => e.exerciseId === exerciseId)?.target
    setState(c => ({
      ...c,
      activeWorkout: c.activeWorkout ? {
        ...c.activeWorkout,
        exercises: c.activeWorkout.exercises.map(e =>
          e.exerciseId === exerciseId
            ? { ...e, sets: [...e.sets, { id: makeId('set'), exerciseId, setIndex: e.sets.length + 1, setType, weightKg, reps, rir, timestamp: new Date().toISOString() }] }
            : e,
        ),
      } : null,
    }))
    setRestTimer(exerciseTarget?.restSeconds ?? 90)
  }

  const finishWorkout = () => {
    if (!state.activeWorkout) return
    const isCustom = state.activeWorkout.programId === 'custom'
    let sessionName: string
    let programId: string

    if (isCustom) {
      const cr = state.customRoutines.find(r => r.id === state.activeWorkout!.sessionId)
      sessionName = cr?.name ?? state.activeWorkout.sessionName ?? 'Seance libre'
      programId = 'custom'
    } else {
      if (!selectedProgram) return
      const activeSession = selectedProgram.sessions.find(s => s.id === state.activeWorkout!.sessionId) ?? nextSession
      if (!activeSession) return
      sessionName = activeSession.name
      programId = selectedProgram.id
    }

    const musclesWorked = new Set<MuscleGroup>()
    state.activeWorkout.exercises.forEach(ex => {
      if (ex.sets.filter(s => s.setType !== 'warmup').length > 0) {
        getExerciseById(ex.exerciseId).primaryMuscles.forEach(m => musclesWorked.add(m))
      }
    })

    const workout = {
      id: makeId('workout'),
      date: todayIso(),
      programId,
      sessionId: state.activeWorkout.sessionId,
      sessionName,
      exercises: state.activeWorkout.exercises.filter(e => e.sets.length > 0),
      durationMinutes: Math.max(25, Math.round((Date.now() - new Date(state.activeWorkout.startedAt).getTime()) / 60000)),
    }

    setState(c => ({
      ...c,
      workouts: [...c.workouts, workout],
      activeWorkout: null,
      programCursor: isCustom ? c.programCursor : { ...c.programCursor, [programId]: (c.programCursor[programId] ?? 0) + 1 },
    }))
    setRestTimer(0)

    if (musclesWorked.size > 0) {
      setPendingFeedback({ workoutId: workout.id, muscles: Array.from(musclesWorked) })
    } else {
      setTab('home')
    }
  }

  const saveFeedback = (feedback: SessionFeedback) => {
    setState(c => ({ ...c, sessionFeedback: [...(c.sessionFeedback ?? []), feedback] }))
    setPendingFeedback(null)
    setTab('home')
  }

  const addFood = (entry: FoodEntry) => setState(c => ({ ...c, foodEntries: [...c.foodEntries, entry] }))
  const logBodyweight = (entry: BodyweightEntry) => {
    const today = todayIso()
    setState(c => {
      const existingIndex = c.bodyweightEntries.findIndex(e => e.date.slice(0, 10) === today)
      const updatedEntries = existingIndex >= 0
        ? c.bodyweightEntries.map((e, i) => i === existingIndex ? { ...e, weightKg: entry.weightKg } : e)
        : [...c.bodyweightEntries, entry]
      return { ...c, bodyweightEntries: updatedEntries, profile: c.profile ? { ...c.profile, weightKg: entry.weightKg } : null }
    })
  }
  const logMeasurement = (entry: MeasurementEntry) => setState(c => ({ ...c, measurementEntries: [...c.measurementEntries, entry] }))
  const chooseProgram = (programId: string) => setState(c => ({ ...c, selectedProgramId: programId }))

  const updateQuestProgress = (questId: string, delta: number) => {
    const today = todayIso()
    setState(c => {
      const existing = (c.dailyQuestProgress ?? []).find(d => d.date === today)
      const currentVal = existing?.quests[questId] ?? 0
      const newVal = Math.max(0, currentVal + delta)
      const updated = existing
        ? (c.dailyQuestProgress ?? []).map(d => d.date === today ? { ...d, quests: { ...d.quests, [questId]: newVal } } : d)
        : [...(c.dailyQuestProgress ?? []), { date: today, quests: { [questId]: newVal } }]
      return { ...c, dailyQuestProgress: updated }
    })
  }

  const completeQuest = (questId: string) => {
    const today = todayIso()
    setState(c => {
      const alreadyDone = ((c.completedDailyQuests ?? {})[today] ?? []).includes(questId)
      if (alreadyDone) return c
      return { ...c, completedDailyQuests: { ...(c.completedDailyQuests ?? {}), [today]: [...((c.completedDailyQuests ?? {})[today] ?? []), questId] } }
    })
  }

  const addCustomRoutine = (routine: CustomRoutine) => {
    setState(c => ({ ...c, customRoutines: [...c.customRoutines, routine] }))
  }

  const deleteCustomRoutine = (id: string) => {
    setState(c => ({ ...c, customRoutines: c.customRoutines.filter(r => r.id !== id) }))
  }

  if (!state.profile || !state.targets) {
    return <OnboardingView onComplete={completeOnboarding} />
  }

  return (
    <div className="app-shell">
      {pendingFeedback && (
        <FeedbackModal
          muscles={pendingFeedback.muscles}
          workoutId={pendingFeedback.workoutId}
          onSave={saveFeedback}
          onSkip={() => { setPendingFeedback(null); setTab('home') }}
        />
      )}
      {tab === 'home' && <HomeView state={state} nextSession={nextSession} powerLevel={powerLevel} recommendation={recommendation} onStartWorkout={startWorkout} onUpdateQuestProgress={updateQuestProgress} onCompleteQuest={completeQuest} onNavigate={setTab} />}
      {tab === 'train' && (
        <TrainView
          state={state}
          customRoutines={state.customRoutines}
          onStartWorkout={startWorkout}
          onStartSession={startSession}
          onStartCustomRoutine={startCustomRoutine}
          onAddCustomRoutine={addCustomRoutine}
          onDeleteCustomRoutine={deleteCustomRoutine}
          onAddSet={addSet}
          onFinishWorkout={finishWorkout}
          restTimer={restTimer}
          onSkipTimer={() => setRestTimer(0)}
        />
      )}
      {tab === 'nutrition' && <NutritionView state={state} onAddFood={addFood} />}
      {tab === 'scouter' && <ScouterView state={state} />}
      {tab === 'profile' && <ProfileView state={state} powerLevel={powerLevel} onLogBodyweight={logBodyweight} onLogMeasurement={logMeasurement} onChooseProgram={chooseProgram} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} theme={theme} onNavigate={setTab} />}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
