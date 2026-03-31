import { useEffect, useMemo, useState } from 'react'
import { foods, programs, savedMeals } from './data'
import {
  calculateTargets,
  countCompletedDailyQuests,
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
import { loadState, saveState } from './storage'
import type {
  AppState,
  BodyweightEntry,
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
  name: 'Warrior',
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

function SectionEyebrow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="section-eyebrow">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
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

  const ratingCircles = (muscle: string, key: 'pump' | 'soreness', _labels: string[]) => (
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
            <span className="eyebrow">Post-seance</span>
            <h3 style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem' }}>Feedback RP</h3>
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
                  {ratingCircles(muscle, 'pump', [])}
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>COURBATURES PREVUES (1=aucune, 5=intense)</span>
                  {ratingCircles(muscle, 'soreness', [])}
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
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', flex: 1 }}>Douleur articulaire?</span>
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

  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

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
          <button className="primary-btn" onClick={() => setStep(2)} type="button">Suivant</button>
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

// ── Transformation UI ─────────────────────────────────────────────────────────

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
    <section className="panel stack-md">
      <div className="section-head">
        <div>
          <SectionEyebrow icon="[Q]" label="Quetes de transformation" />
          <h3 style={{ color: next.accent }}>Vers {next.name}</h3>
        </div>
        <img src={next.image} alt={next.name} className={`transformation-image ${allDone ? 'aura-glow' : ''}`} style={{ width: 72, height: 72, filter: `drop-shadow(0 0 16px ${next.accent}88)` }} />
      </div>

      <div className="stack-md">
        {next.quests.map(q => {
          const current = q.requirement(state)
          const done = current >= q.target
          const pct = Math.min(100, Math.round((current / q.target) * 100))
          return (
            <div key={q.id} className={`quest-card ${done ? 'completed' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {done && <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>+</span>}
                    <strong style={{ fontSize: '0.88rem', color: done ? '#ffd700' : 'var(--text)' }}>{q.name}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{q.description}</p>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: done ? '#ffd700' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {Math.min(current, q.target).toLocaleString()} / {q.target.toLocaleString()}
                </span>
              </div>
              <div className="quest-progress-bar">
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: done ? 'linear-gradient(90deg, #ffd700, #ffaa00)' : `linear-gradient(90deg, ${next.accent}, ${next.accent}88)` }} />
              </div>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="transformation-available-banner" style={{ borderColor: next.accent, color: next.accent, background: `${next.accent}12` }}>
          TRANSFORMATION DISPONIBLE: {next.name.toUpperCase()}
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
    <section className="panel stack-md">
      <div className="section-head">
        <div>
          <SectionEyebrow icon="[D]" label="Quetes quotidiennes" />
          <h3>{completedCount}/8 completees</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>total</span>
          <strong style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{countCompletedDailyQuests(state)}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {questStatuses.map(q => (
          <div key={q.id} style={{ flex: 1, height: 4, borderRadius: 2, background: q.isComplete ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      <div className="stack-md">
        {questStatuses.map(q => {
          const isManual = ['steps', 'water', 'sleep', 'stretch', 'no_junk'].includes(q.id)
          const isAutoCalc = ['protein', 'calories', 'training'].includes(q.id)
          const pct = Math.min(100, Math.round((q.current / q.target) * 100))
          const alreadyCompleted = completedToday.includes(q.id)

          return (
            <div key={q.id} className={`quest-card ${q.isComplete ? 'completed' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' as const }}>{q.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {q.isComplete && <span style={{ color: '#ffd700', fontSize: '0.8rem' }}>+</span>}
                      <strong style={{ fontSize: '0.85rem', color: q.isComplete ? '#ffd700' : 'var(--text)' }}>{q.name}</strong>
                      {isAutoCalc && <span style={{ fontSize: '0.6rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: 'rgba(55,183,255,0.12)', padding: '1px 5px', borderRadius: 4 }}>AUTO</span>}
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
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: q.isComplete ? 'linear-gradient(90deg, #ffd700, #ffaa00)' : 'linear-gradient(90deg, #ff8c00, #ffd700)' }} />
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
    <section className="panel stack-md">
      <SectionEyebrow icon="[O]" label="Objectifs principaux" />
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: obj.completed ? '#ffd700' : 'var(--text)' }}>{obj.name}</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>{doneM}/{totalM}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{obj.description}</p>
                </div>
              </div>
              <div className="quest-progress-bar" style={{ marginBottom: 8 }}>
                <div className="quest-progress-fill" style={{ width: `${pct}%`, background: obj.completed ? 'linear-gradient(90deg, #ffd700, #ffaa00)' : 'linear-gradient(90deg, #37b7ff, #4fffb0)' }} />
              </div>
              <div className="stack-md" style={{ gap: 5 }}>
                {obj.milestones.map((m, idx) => {
                  const cur = m.check(state)
                  const done = cur >= m.target
                  const mp = Math.min(100, Math.round((cur / m.target) * 100))
                  return (
                    <div key={idx} style={{ opacity: done ? 1 : 0.65 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', color: done ? '#ffd700' : 'var(--muted)' }}>{done ? 'ok ' : ''}{m.description}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{Math.min(cur, m.target).toLocaleString()}/{m.target.toLocaleString()} {m.unit}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${mp}%`, background: done ? '#ffd700' : 'rgba(55,183,255,0.6)', transition: 'width 0.6s ease' }} />
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

// ── Mesocycle Status Card ─────────────────────────────────────────────────────

function MesocycleCard({ state }: { state: AppState }) {
  const status = getMesocycleStatus(state)
  const streak = getStreak(state)

  return (
    <section className="panel" style={{ borderColor: `${status.color}33`, background: `linear-gradient(135deg, rgba(20,28,43,0.95), rgba(8,12,20,0.98))` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <SectionEyebrow icon="[M]" label="Mesocycle" />
          <h3 style={{ margin: '4px 0 2px', color: status.color }}>{status.label}</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{status.detail}</p>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: '2rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--accent-gold)', lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>jours streak</div>
        </div>
      </div>
    </section>
  )
}

// ── RP Volume Dashboard (Scouter) ─────────────────────────────────────────────

function VolumeDashboard({ state }: { state: AppState }) {
  const volumeTargets = useMemo(() => getWeeklySetsByMuscle(state), [state])

  const statusColors = {
    none: 'var(--muted)',
    below_mev: 'var(--accent-red)',
    productive: '#4fffb0',
    high: 'var(--accent-gold)',
    above_mrv: 'var(--accent-red)',
  }

  const statusLabels = {
    none: 'Aucun travail',
    below_mev: 'Sous MEV',
    productive: 'Zone productive',
    high: 'Volume eleve',
    above_mrv: 'Au-dessus MRV',
  }

  return (
    <section className="panel stack-md">
      <div>
        <SectionEyebrow icon="[V]" label="Volume RP — Landmarks" />
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>MEV = Minimum Effectif | MAV = Maximum Adaptatif | MRV = Maximum Recuperable</p>
      </div>

      <div className="stack-md">
        {volumeTargets.map(vt => {
          const status = getVolumeStatus(vt.currentSets, vt.mev, vt.mav, vt.mrv)
          const color = statusColors[status]
          const mrvPct = Math.min(100, Math.round((vt.currentSets / vt.mrv) * 100))

          return (
            <div key={vt.muscle} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px', border: `1px solid ${color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.85rem' }}>{vt.muscle}</strong>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color, background: `${color}18`, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    {statusLabels[status]}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{vt.currentSets} series</span>
              </div>

              {/* MEV/MAV/MRV bar */}
              <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'visible', marginBottom: 6 }}>
                {/* MEV marker */}
                <div style={{ position: 'absolute', left: `${Math.round((vt.mev / vt.mrv) * 100)}%`, top: -2, bottom: -2, width: 2, background: 'rgba(255,95,118,0.6)', borderRadius: 1 }} />
                {/* MAV marker */}
                <div style={{ position: 'absolute', left: `${Math.round((vt.mav / vt.mrv) * 100)}%`, top: -2, bottom: -2, width: 2, background: 'rgba(255,200,61,0.6)', borderRadius: 1 }} />
                {/* Fill */}
                <div style={{ height: '100%', borderRadius: 5, width: `${mrvPct}%`, background: color, transition: 'width 0.5s ease', opacity: 0.85 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)' }}>
                <span>MEV: {vt.mev}</span>
                <span>MAV: {vt.mav}</span>
                <span>MRV: {vt.mrv}</span>
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
  const deltaLabel = Math.abs(dailyDelta) > 0 ? `${dailyDelta > 0 ? '+' : ''}${Math.round(dailyDelta)} kcal vs TDEE` : 'En maintenance'

  return (
    <section className="panel stack-md">
      <SectionEyebrow icon="[T]" label="TDEE Adaptatif" />
      <div className="metrics-grid">
        <article className="metric-card">
          <span className="eyebrow">TDEE estimé</span>
          <strong style={{ color: 'var(--accent-gold)' }}>{formatNumber(tdee)}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>kcal/jour</span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Balance</span>
          <strong style={{ color: statusColor }}>{statusLabel}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{deltaLabel}</span>
        </article>
        <article className="metric-card">
          <span className="eyebrow">Auj. logge</span>
          <strong style={{ color: 'var(--accent-blue)' }}>{formatNumber(todayNutrition.calories)}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>kcal</span>
        </article>
      </div>

      {!hasEnoughData && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10 }}>
          Logue 7+ jours de nutrition et de pesees pour activer le TDEE adaptatif (style MacroFactor).
        </p>
      )}
      {hasEnoughData && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
          Base sur tes 14 derniers jours de nutrition et de pesees.
        </p>
      )}
    </section>
  )
}

// ── Home view ─────────────────────────────────────────────────────────────────

function HomeView({ state, nextSession, powerLevel, recommendation, onStartWorkout, onUpdateQuestProgress, onCompleteQuest }: {
  state: AppState
  nextSession: ProgramSession | null
  powerLevel: number
  recommendation: string
  onStartWorkout: () => void
  onUpdateQuestProgress: (questId: string, delta: number) => void
  onCompleteQuest: (questId: string) => void
}) {
  const targets = state.targets!
  const nutrition = getDailyNutrition(state.foodEntries)
  const tf = getCurrentTransformationFull(state)
  const transformation = tf.current
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const weeklyVolume = weeklyWorkouts.reduce((sum, w) => sum + getWorkoutVolume(w), 0)
  const lastWorkout = state.workouts.length > 0 ? state.workouts[state.workouts.length - 1] : null

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero-card" style={{ borderColor: `${transformation.accent}33` }}>
        <div className="hero-copy" style={{ flex: 1 }}>
          <span className="eyebrow">Power Level</span>
          <h2 style={{ color: transformation.accent }}>{formatNumber(powerLevel)}</h2>
          <p>{transformation.name} — Continue ta progression.</p>
          <div className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent, display: 'inline-block', marginTop: 8 }}>
            {transformation.name}
          </div>
        </div>
        <div className="transformation-hero">
          <img src={transformation.image} alt={transformation.name} className="transformation-image" style={{ filter: `drop-shadow(0 0 24px ${transformation.accent}88)` }} />
        </div>
      </section>

      {/* Mesocycle status */}
      <MesocycleCard state={state} />

      {/* Transformation timeline */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[S]" label="Saga des formes" />
        <TransformationTimeline state={state} />
      </section>

      {/* Transformation quests */}
      <QuestSection state={state} />

      {/* Daily quests */}
      <DailyQuestsPanel state={state} onUpdateQuestProgress={onUpdateQuestProgress} onCompleteQuest={onCompleteQuest} />

      {/* Main objectives */}
      <MainObjectivesPanel state={state} />

      {/* Mission du jour */}
      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <SectionEyebrow icon="[X]" label="Mission du jour" />
            <h3>{nextSession?.name ?? 'Aucune seance programmee'}</h3>
          </div>
          <button className="primary-btn" onClick={onStartWorkout} type="button">
            {state.activeWorkout ? 'Reprendre' : 'Lancer'}
          </button>
        </div>
        {nextSession
          ? <p>{nextSession.focus}</p>
          : <div className="empty-state"><div className="empty-icon">[?]</div><p>Choisis un programme depuis le profil.</p></div>
        }
        <div className="metrics-grid">
          <MetricCard label="Seances" value={`${weeklyWorkouts.length}/${state.profile?.trainingDaysPerWeek ?? 0}`} accent="var(--accent-gold)" />
          <MetricCard label="Volume" value={`${formatNumber(weeklyVolume)} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Kcal rest." value={`${Math.max(0, Math.round(targets.calories - nutrition.calories))}`} accent="var(--accent-orange)" />
        </div>
      </section>

      {/* Last workout summary */}
      {lastWorkout && (
        <section className="panel stack-md" style={{ borderColor: 'rgba(55,183,255,0.15)' }}>
          <SectionEyebrow icon="[L]" label="Derniere seance" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{lastWorkout.sessionName}</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{lastWorkout.date} — {lastWorkout.durationMinutes} min</p>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <strong style={{ color: 'var(--accent-blue)' }}>{formatNumber(getWorkoutVolume(lastWorkout))} kg</strong>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)' }}>volume total</p>
            </div>
          </div>
          <div className="chip-row">
            {lastWorkout.exercises.slice(0, 4).map(ex => (
              <span key={ex.exerciseId} className="chip chip--static" style={{ fontSize: '0.72rem' }}>
                {getExerciseById(ex.exerciseId).name} {ex.sets.length > 0 && `— ${ex.sets[ex.sets.length - 1].weightKg}kg`}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Nutrition */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[N]" label="Nutrition cible" />
        <ProgressBar label="Calories" value={nutrition.calories} target={targets.calories} accent="linear-gradient(90deg, #ffb400, #ff6a00)" />
        <ProgressBar label="Proteines" value={nutrition.protein} target={targets.protein} accent="linear-gradient(90deg, #00d4ff, #4fffb0)" />
      </section>

      {/* Scouter insight */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[I]" label="Scouter insight" />
        <p>{recommendation}</p>
      </section>

      {/* Recipe suggestions */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[R]" label="Recettes suggerees" />
        {getRecommendedRecipes(state).length === 0
          ? <div className="empty-state"><div className="empty-icon">[c]</div><p>Ajoute des repas pour des suggestions.</p></div>
          : <div className="card-list">
              {getRecommendedRecipes(state).map(recipe => (
                <article className="mini-card" key={recipe.id}>
                  <strong>{recipe.name}</strong>
                  <span>{recipe.calories} kcal - {recipe.protein}P - {recipe.carbs}G - {recipe.fats}L</span>
                </article>
              ))}
            </div>
        }
      </section>
    </div>
  )
}

// ── Train view ────────────────────────────────────────────────────────────────

function TrainView({ state, onStartWorkout, onAddSet, onFinishWorkout, restTimer, onSkipTimer }: {
  state: AppState
  onStartWorkout: () => void
  onAddSet: (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => void
  onFinishWorkout: () => void
  restTimer: number
  onSkipTimer: () => void
}) {
  const [draftInputs, setDraftInputs] = useState<Record<string, { weight: string; reps: string; rir: string; setType: SetType }>>({})
  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
  const activeWorkout = state.activeWorkout

  if (!selectedProgram || !nextSession) {
    return (
      <div className="page">
        <section className="panel">
          <div className="empty-state">
            <div className="empty-icon">[gym]</div>
            <p>Choisis un programme depuis le profil pour commencer ta Saga.</p>
          </div>
        </section>
      </div>
    )
  }

  if (!activeWorkout) {
    return (
      <div className="page">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">{selectedProgram.saga}</span>
            <h2>{selectedProgram.name}</h2>
            <p>{selectedProgram.description}</p>
          </div>
          <div className="hero-badge">{selectedProgram.daysPerWeek} j/sem</div>
        </section>

        <section className="panel stack-md">
          <div className="section-head">
            <div>
              <SectionEyebrow icon="[P]" label="Prochaine seance" />
              <h3>{nextSession.name}</h3>
            </div>
            <button className="primary-btn" onClick={onStartWorkout} type="button">Start</button>
          </div>
          <p>{nextSession.focus}</p>
          <div className="card-list">
            {nextSession.exercises.map(entry => {
              const exercise = getExerciseById(entry.exerciseId)
              return (
                <article className="mini-card" key={entry.exerciseId}>
                  <strong>{exercise.name}</strong>
                  <span>{entry.sets} x {entry.repMin}-{entry.repMax} - RIR {entry.targetRir}</span>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      {restTimer > 0 && (
        <section className="panel timer-panel">
          <div>
            <SectionEyebrow icon="[T]" label="Rest timer" />
            <h3 style={{ fontSize: '3.2rem', margin: 0 }}>{restTimer}s</h3>
          </div>
          <button className="ghost-btn" onClick={onSkipTimer} type="button">Skip</button>
        </section>
      )}

      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <SectionEyebrow icon="[A]" label="Seance active" />
            <h3>{nextSession.name}</h3>
          </div>
          <button className="primary-btn" onClick={onFinishWorkout} type="button">Finish</button>
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
          <section className="panel stack-md" key={exercise.id}>
            <div className="section-head section-head--tight">
              <div>
                <h3>{exercise.name}</h3>
                <p style={{ margin: 0 }}>{target.sets} x {target.repMin}-{target.repMax} - RIR {target.targetRir} - Rest {target.restSeconds}s</p>
              </div>
              {previous && <span className="badge">Last {previous.weightKg} x {previous.reps}</span>}
            </div>

            <div className="field-grid compact-grid">
              <label><span>Poids</span><input value={currentInput.weight} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, weight: e.target.value } })} /></label>
              <label><span>Reps</span><input value={currentInput.reps} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, reps: e.target.value } })} /></label>
              <label><span>RIR</span><input value={currentInput.rir} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, rir: e.target.value } })} /></label>
              <label>
                <span>Type</span>
                <select value={currentInput.setType} onChange={e => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, setType: e.target.value as SetType } })}>
                  <option value="warmup">Warm-up</option>
                  <option value="normal">Normal</option>
                  <option value="top">Top set</option>
                  <option value="backoff">Back-off</option>
                  <option value="drop">Drop</option>
                  <option value="amrap">AMRAP</option>
                </select>
              </label>
            </div>

            <button className="secondary-btn" type="button" onClick={() => onAddSet(exercise.id, Number(currentInput.weight || 0), Number(currentInput.reps || 0), Number(currentInput.rir || target.targetRir), currentInput.setType)}>
              + Ajouter la serie
            </button>

            <div className="set-list">
              {exerciseLog.sets.length === 0
                ? <div className="empty-state" style={{ padding: '10px 0' }}><p style={{ margin: 0, fontSize: '0.83rem' }}>Demarre avec la charge precedente et progresse.</p></div>
                : exerciseLog.sets.map(set => (
                    <div className="set-row" key={set.id}>
                      <span>S{set.setIndex}</span>
                      <strong>{set.weightKg} kg x {set.reps}</strong>
                      <span>RIR {set.rir}</span>
                      <span>{set.setType}</span>
                    </div>
                  ))
              }
            </div>

            {exercise.alternatives.length > 0 && (
              <div className="chip-row">
                {exercise.alternatives.map(altId => (
                  <span className="chip chip--static" key={altId}>{getExerciseById(altId).name}</span>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ── Nutrition view ────────────────────────────────────────────────────────────

function NutritionView({ state, onAddFood }: { state: AppState; onAddFood: (entry: FoodEntry) => void }) {
  const [selectedFood, setSelectedFood] = useState(foods[0])
  const [grams, setGrams] = useState('100')
  const [category, setCategory] = useState<FoodEntry['category']>('lunch')
  const totals = getDailyNutrition(state.foodEntries)
  const suggestions = getRecommendedRecipes(state)

  return (
    <div className="page">
      {/* Adaptive TDEE */}
      <AdaptiveTDEECard state={state} />

      {/* Today's nutrition */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[N]" label="Nutrition aujourd'hui" />
        <ProgressBar label="Calories" value={totals.calories} target={state.targets?.calories ?? 1} accent="linear-gradient(90deg, #ffb400, #ff6a00)" />
        <ProgressBar label="Proteines" value={totals.protein} target={state.targets?.protein ?? 1} accent="linear-gradient(90deg, #00d4ff, #4fffb0)" />
        <ProgressBar label="Glucides" value={totals.carbs} target={state.targets?.carbs ?? 1} accent="linear-gradient(90deg, #a855f7, #6366f1)" />
        <ProgressBar label="Lipides" value={totals.fats} target={state.targets?.fats ?? 1} accent="linear-gradient(90deg, #f59e0b, #ef4444)" />
      </section>

      {/* Add food */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[+]" label="Ajouter un aliment" />
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
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="pre_workout">Pre</option>
              <option value="post_workout">Post</option>
            </select>
          </label>
        </div>
        <button className="secondary-btn" type="button" onClick={() => {
          const ratio = Number(grams || 0) / selectedFood.servingGrams
          onAddFood({ id: makeId('food'), date: todayIso(), name: selectedFood.name, category, grams: Number(grams || 0), calories: Math.round(selectedFood.calories * ratio), protein: Number((selectedFood.protein * ratio).toFixed(1)), carbs: Number((selectedFood.carbs * ratio).toFixed(1)), fats: Number((selectedFood.fats * ratio).toFixed(1)) })
        }}>Ajouter</button>
      </section>

      {/* Saved meals */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[S]" label="Repas sauvegardes" />
        {state.savedMeals.length === 0
          ? <div className="empty-state"><div className="empty-icon">[p]</div><p>Aucun repas sauvegarde.</p></div>
          : <div className="card-list">
              {state.savedMeals.map(meal => (
                <button className="mini-card mini-card--button" key={meal.id} type="button" onClick={() => onAddFood({ id: makeId('meal'), date: todayIso(), name: meal.name, category: meal.category, grams: 1, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats })}>
                  <strong>{meal.name}</strong>
                  <span>{meal.calories} kcal - {meal.protein}P</span>
                </button>
              ))}
            </div>
        }
      </section>

      {/* Recipes */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[B]" label="Recettes suggerees" />
        <div className="card-list">
          {suggestions.map(recipe => (
            <button className="mini-card mini-card--button" key={recipe.id} type="button" onClick={() => onAddFood({ id: makeId('recipe'), date: todayIso(), name: recipe.name, category: recipe.category, grams: 1, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats })}>
              <strong>{recipe.name}</strong>
              <span>{recipe.prepMinutes} min - {recipe.calories} kcal - {recipe.protein}P</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Scouter view ──────────────────────────────────────────────────────────────

function ScouterView({ state }: { state: AppState }) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const volumeByMuscle = getVolumeByMuscle(weeklyWorkouts)

  return (
    <div className="page">
      <section className="panel stack-md">
        <SectionEyebrow icon="[SC]" label="Scouter analytics" />
        <div className="metrics-grid">
          <MetricCard label="Seances" value={String(weeklyWorkouts.length)} accent="var(--accent-gold)" />
          <MetricCard label="Volume" value={`${formatNumber(weeklyWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0))} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Poids" value={`${state.bodyweightEntries.at(-1)?.weightKg ?? state.profile?.weightKg ?? 0} kg`} accent="var(--accent-orange)" />
        </div>
      </section>

      {/* RP Volume Landmarks */}
      <VolumeDashboard state={state} />

      {/* Volume by muscle (tonnage) */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[W]" label="Tonnage par muscle" />
        {volumeByMuscle.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">[ch]</div>
            <p>Complete ta premiere semaine pour voir la map musculaire.</p>
          </div>
        ) : (
          volumeByMuscle.map(([muscle, volume]) => (
            <ProgressBar key={muscle} label={muscle} value={volume} target={Math.max(volumeByMuscle[0][1], 1)} accent="linear-gradient(90deg, #4fffb0, #00d4ff)" />
          ))
        )}
      </section>

      {/* Top lifts */}
      <section className="panel stack-md">
        <SectionEyebrow icon="[1RM]" label="1RM estimes" />
        {['bench_press', 'back_squat', 'romanian_deadlift', 'pull_up'].map(exerciseId => {
          let best = 0
          state.workouts.forEach(w => w.exercises.filter(e => e.exerciseId === exerciseId).forEach(e => e.sets.forEach(s => { const e1rm = s.weightKg * (1 + s.reps / 30); if (e1rm > best) best = e1rm })))
          const ex = getExerciseById(exerciseId)
          return (
            <div key={exerciseId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>{ex.name}</span>
              <strong style={{ color: best > 0 ? 'var(--accent-gold)' : 'var(--muted)', fontSize: '0.9rem' }}>
                {best > 0 ? `~${Math.round(best)} kg` : 'Pas de donnees'}
              </strong>
            </div>
          )
        })}
      </section>
    </div>
  )
}

// ── Profile view ──────────────────────────────────────────────────────────────

function ProfileView({ state, powerLevel, onLogBodyweight, onLogMeasurement, onChooseProgram }: {
  state: AppState
  powerLevel: number
  onLogBodyweight: (entry: BodyweightEntry) => void
  onLogMeasurement: (entry: MeasurementEntry) => void
  onChooseProgram: (programId: string) => void
}) {
  const [bodyweight, setBodyweight] = useState(String(state.profile?.weightKg ?? 0))
  const [measurements, setMeasurements] = useState({ waist: '', chest: '', arm: '', thigh: '' })
  const transformation = getTransformation(powerLevel)
  const dragonBalls = Math.min(7, Math.floor((state.workouts.length + state.bodyweightEntries.length) / 2))
  const streak = getStreak(state)

  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Profil</span>
          <h2>{state.profile?.name}</h2>
          <p>{transformation.name} - {state.profile?.goal.replace('_', ' ')}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent }}>{dragonBalls}/7 DBZ</span>
            {streak > 0 && <span className="hero-badge" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}>{streak}j streak</span>}
          </div>
        </div>
      </section>

      <section className="panel stack-md">
        <SectionEyebrow icon="[W]" label="Poids corporel" />
        <div className="inline-form">
          <input value={bodyweight} onChange={e => setBodyweight(e.target.value)} />
          <button className="secondary-btn" type="button" onClick={() => onLogBodyweight({ id: makeId('bw'), date: todayIso(), weightKg: Number(bodyweight) })}>Log</button>
        </div>
        {state.bodyweightEntries.length >= 2 && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
            Debut: {state.bodyweightEntries[0].weightKg} kg |
            Maintenant: {state.bodyweightEntries.at(-1)?.weightKg} kg |
            Delta: {((state.bodyweightEntries.at(-1)?.weightKg ?? 0) - state.bodyweightEntries[0].weightKg).toFixed(1)} kg
          </p>
        )}
      </section>

      <section className="panel stack-md">
        <SectionEyebrow icon="[R]" label="Mensurations" />
        <div className="field-grid compact-grid">
          <label><span>Taille (cm)</span><input value={measurements.waist} onChange={e => setMeasurements({ ...measurements, waist: e.target.value })} /></label>
          <label><span>Poitrine</span><input value={measurements.chest} onChange={e => setMeasurements({ ...measurements, chest: e.target.value })} /></label>
          <label><span>Bras</span><input value={measurements.arm} onChange={e => setMeasurements({ ...measurements, arm: e.target.value })} /></label>
          <label><span>Cuisse</span><input value={measurements.thigh} onChange={e => setMeasurements({ ...measurements, thigh: e.target.value })} /></label>
        </div>
        <button className="secondary-btn" type="button" onClick={() => onLogMeasurement({ id: makeId('measure'), date: todayIso(), waistCm: Number(measurements.waist), chestCm: Number(measurements.chest), armCm: Number(measurements.arm), thighCm: Number(measurements.thigh) })}>Sauvegarder</button>
      </section>

      <section className="panel stack-md">
        <SectionEyebrow icon="[PR]" label="Programmes" />
        {programs.length === 0
          ? <div className="empty-state"><div className="empty-icon">[bk]</div><p>Aucun programme disponible.</p></div>
          : <div className="card-list">
              {programs.map(program => (
                <button className={`mini-card mini-card--button ${state.selectedProgramId === program.id ? 'mini-card--selected' : ''}`} key={program.id} type="button" onClick={() => onChooseProgram(program.id)}>
                  <strong>{program.name}</strong>
                  <span>{program.saga} - {program.daysPerWeek} jours - {program.split}</span>
                </button>
              ))}
            </div>
        }
      </section>

      <p className="profile-footer">Propulse par Katrava</p>
    </div>
  )
}

// ── Bottom nav ────────────────────────────────────────────────────────────────

function BottomNav({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  const items: Array<[TabId, string, string]> = [
    ['home', 'H', 'Home'],
    ['train', 'T', 'Train'],
    ['nutrition', 'N', 'Fuel'],
    ['scouter', 'SC', 'Scouter'],
    ['profile', 'P', 'Profile'],
  ]
  return (
    <nav className="bottom-nav">
      {items.map(([id, icon, label]) => (
        <button key={id} className={`nav-item ${tab === id ? 'nav-item--active' : ''}`} onClick={() => onChange(id)} type="button">
          <div style={{ fontSize: '0.9rem', lineHeight: 1, fontWeight: 800, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>{icon}</div>
          <div>{label}</div>
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
    }
  })
  const [tab, setTab] = useState<TabId>('home')
  const [restTimer, setRestTimer] = useState(0)
  const [pendingFeedback, setPendingFeedback] = useState<{ workoutId: string; muscles: MuscleGroup[] } | null>(null)

  useEffect(() => saveState(state), [state])
  useEffect(() => {
    if (restTimer <= 0) return
    const timer = window.setTimeout(() => setRestTimer(c => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [restTimer])

  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
  const powerLevel = useMemo(() => getPowerLevel(state), [state])
  const recommendation = useMemo(() => getPrimaryRecommendation(state), [state])

  const completeOnboarding = (profile: UserProfile, answers: OnboardingAnswers) => {
    const targets = calculateTargets(profile)
    const recommendedProgram = recommendProgram(profile)
    setState({
      ...defaultState,
      profile,
      targets,
      selectedProgramId: recommendedProgram.id,
      savedMeals,
      bodyweightEntries: [{ id: makeId('bw'), date: todayIso(), weightKg: profile.weightKg }],
      onboardingAnswers: answers,
    })
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

  const addSet = (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => {
    if (!state.activeWorkout || reps <= 0) return
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
    if (!state.activeWorkout || !selectedProgram || !nextSession) return

    // Collect unique primary muscles from this workout for feedback
    const musclesWorked = new Set<MuscleGroup>()
    state.activeWorkout.exercises.forEach(ex => {
      if (ex.sets.filter(s => s.setType !== 'warmup').length > 0) {
        getExerciseById(ex.exerciseId).primaryMuscles.forEach(m => musclesWorked.add(m))
      }
    })

    const workout = {
      id: makeId('workout'),
      date: todayIso(),
      programId: selectedProgram.id,
      sessionId: nextSession.id,
      sessionName: nextSession.name,
      exercises: state.activeWorkout.exercises.filter(e => e.sets.length > 0),
      durationMinutes: Math.max(25, Math.round((Date.now() - new Date(state.activeWorkout.startedAt).getTime()) / 60000)),
    }

    setState(c => ({
      ...c,
      workouts: [...c.workouts, workout],
      activeWorkout: null,
      programCursor: { ...c.programCursor, [selectedProgram.id]: (c.programCursor[selectedProgram.id] ?? 0) + 1 },
    }))
    setRestTimer(0)

    // Show feedback modal if muscles were worked
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

  const skipFeedback = () => {
    setPendingFeedback(null)
    setTab('home')
  }

  const addFood = (entry: FoodEntry) => setState(c => ({ ...c, foodEntries: [...c.foodEntries, entry] }))
  const logBodyweight = (entry: BodyweightEntry) => setState(c => ({ ...c, bodyweightEntries: [...c.bodyweightEntries, entry], profile: c.profile ? { ...c.profile, weightKg: entry.weightKg } : null }))
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
      return {
        ...c,
        completedDailyQuests: {
          ...(c.completedDailyQuests ?? {}),
          [today]: [...((c.completedDailyQuests ?? {})[today] ?? []), questId],
        },
      }
    })
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
          onSkip={skipFeedback}
        />
      )}
      {tab === 'home' && <HomeView state={state} nextSession={nextSession} powerLevel={powerLevel} recommendation={recommendation} onStartWorkout={startWorkout} onUpdateQuestProgress={updateQuestProgress} onCompleteQuest={completeQuest} />}
      {tab === 'train' && <TrainView state={state} onStartWorkout={startWorkout} onAddSet={addSet} onFinishWorkout={finishWorkout} restTimer={restTimer} onSkipTimer={() => setRestTimer(0)} />}
      {tab === 'nutrition' && <NutritionView state={state} onAddFood={addFood} />}
      {tab === 'scouter' && <ScouterView state={state} />}
      {tab === 'profile' && <ProfileView state={state} powerLevel={powerLevel} onLogBodyweight={logBodyweight} onLogMeasurement={logMeasurement} onChooseProgram={chooseProgram} />}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
