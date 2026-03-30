import { useEffect, useMemo, useState } from 'react'
import { foods, programs, savedMeals } from './data'
import {
  calculateTargets,
  formatNumber,
  getDailyNutrition,
  getExerciseById,
  getCurrentTransformationFull,
  getPowerLevel,
  getPrimaryRecommendation,
  getProgramById,
  getRecommendedRecipes,
  getTransformation,
  getVolumeByMuscle,
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
  ProgramSession,
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
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <article className="metric-card">
      <span className="eyebrow">{label}</span>
      <strong style={{ color: accent }}>{value}</strong>
    </article>
  )
}

function ProgressBar({
  label,
  value,
  target,
  accent,
}: {
  label: string
  value: number
  target: number
  accent: string
}) {
  const pct = Math.max(0, Math.min(100, (value / target) * 100))
  return (
    <div className="progress-block">
      <div className="progress-meta">
        <span>{label}</span>
        <strong>
          {Math.round(value)} / {Math.round(target)}
        </strong>
      </div>
      <div className="progress-shell">
        <div className="progress-fill" style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  )
}

function getLastSet(workouts: AppState['workouts'], exerciseId: string) {
  for (let index = workouts.length - 1; index >= 0; index -= 1) {
    const exerciseLog = workouts[index].exercises.find(
      (entry) => entry.exerciseId === exerciseId && entry.sets.length > 0,
    )
    if (exerciseLog) {
      return exerciseLog.sets[exerciseLog.sets.length - 1]
    }
  }
  return null
}

function OnboardingView({
  onComplete,
}: {
  onComplete: (profile: UserProfile) => void
}) {
  const [draft, setDraft] = useState<UserProfile>(defaultProfile)

  return (
    <div className="page onboarding-shell">
      <section className="hero-card hero-card--scan">
        <span className="eyebrow">Scouter Scan</span>
        <h1>Saiyan Fitness</h1>
        <p>
          Configure ton profil, calcule ton TDEE automatiquement et recois ta premiere
          Saga sur mesure.
        </p>
      </section>

      <section className="panel stack-lg">
        <div className="field-grid">
          <label>
            <span>Nom</span>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            <span>Age</span>
            <input type="number" value={draft.age} onChange={(event) => setDraft({ ...draft, age: Number(event.target.value) })} />
          </label>
          <label>
            <span>Poids (kg)</span>
            <input type="number" value={draft.weightKg} onChange={(event) => setDraft({ ...draft, weightKg: Number(event.target.value) })} />
          </label>
          <label>
            <span>Taille (cm)</span>
            <input type="number" value={draft.heightCm} onChange={(event) => setDraft({ ...draft, heightCm: Number(event.target.value) })} />
          </label>
        </div>

        <div className="field-grid">
          <label>
            <span>Sexe</span>
            <select value={draft.sex} onChange={(event) => setDraft({ ...draft, sex: event.target.value as UserProfile['sex'] })}>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
            </select>
          </label>
          <label>
            <span>Activite</span>
            <select value={draft.activityLevel} onChange={(event) => setDraft({ ...draft, activityLevel: event.target.value as UserProfile['activityLevel'] })}>
              <option value="sedentary">Sedentaire</option>
              <option value="light">Legere</option>
              <option value="moderate">Moderee</option>
              <option value="high">Elevee</option>
              <option value="athlete">Athlete</option>
            </select>
          </label>
          <label>
            <span>Niveau</span>
            <select value={draft.experienceLevel} onChange={(event) => setDraft({ ...draft, experienceLevel: event.target.value as UserProfile['experienceLevel'] })}>
              <option value="beginner">Debutant</option>
              <option value="intermediate">Intermediaire</option>
              <option value="advanced">Avance</option>
            </select>
          </label>
          <label>
            <span>Jours par semaine</span>
            <input type="number" min={2} max={6} value={draft.trainingDaysPerWeek} onChange={(event) => setDraft({ ...draft, trainingDaysPerWeek: Number(event.target.value) })} />
          </label>
        </div>

        <div className="choice-group">
          <span className="field-title">Objectif principal</span>
          <div className="chip-row">
            {[
              ['muscle_gain', 'Prise de masse'],
              ['fat_loss', 'Perte de gras'],
              ['recomp', 'Recomposition'],
              ['strength', 'Force'],
              ['endurance', 'Endurance'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`chip ${draft.goal === value ? 'chip--active' : ''}`}
                onClick={() => setDraft({ ...draft, goal: value as Goal })}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-grid">
          <label>
            <span>Materiel</span>
            <select value={draft.equipmentAccess} onChange={(event) => setDraft({ ...draft, equipmentAccess: event.target.value as UserProfile['equipmentAccess'] })}>
              <option value="full_gym">Full gym</option>
              <option value="basic_gym">Basic gym</option>
              <option value="home_gym">Home gym</option>
            </select>
          </label>
          <label>
            <span>Preference alimentaire</span>
            <input value={draft.dietaryPreference} onChange={(event) => setDraft({ ...draft, dietaryPreference: event.target.value })} />
          </label>
          <label className="field-span-2">
            <span>Contraintes / blessures</span>
            <input value={draft.injuryNotes} onChange={(event) => setDraft({ ...draft, injuryNotes: event.target.value })} />
          </label>
        </div>

        <button className="primary-btn" onClick={() => onComplete(draft)} type="button">
          Demarrer la premiere Saga
        </button>
      </section>
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
          <span className="eyebrow">QUÊTES</span>
          <h3 style={{ color: next.accent }}>Vers {next.name}</h3>
        </div>
        <img
          src={next.image}
          alt={next.name}
          style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.85 }}
        />
      </div>

      <div className="stack-md">
        {next.quests.map(q => {
          const current = q.requirement(state)
          const done = current >= q.target
          const pct = Math.min(100, Math.round((current / q.target) * 100))
          return (
            <div key={q.id} className="progress-block">
              <div className="progress-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {done && <span style={{ color: '#ffd700', fontSize: '1rem' }}>✦</span>}
                  <strong style={{ color: done ? '#ffd700' : 'inherit' }}>{q.name}</strong>
                </span>
                <strong style={{ color: done ? '#ffd700' : 'var(--accent-calm)' }}>
                  {Math.min(current, q.target).toLocaleString()} / {q.target.toLocaleString()}
                </strong>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.65, margin: '2px 0 4px' }}>{q.description}</p>
              <div className="progress-shell">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: done
                      ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                      : `linear-gradient(90deg, ${next.accent}, ${next.accent}88)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div
          style={{
            marginTop: 8,
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${next.accent}`,
            background: `${next.accent}18`,
            textAlign: 'center',
            fontWeight: 700,
            color: next.accent,
            letterSpacing: '0.05em',
          }}
        >
          ⚡ TRANSFORMATION AVAILABLE: {next.name.toUpperCase()} ⚡
        </div>
      )}
    </section>
  )
}

function HomeView({
  state,
  nextSession,
  powerLevel,
  recommendation,
  onStartWorkout,
}: {
  state: AppState
  nextSession: ProgramSession | null
  powerLevel: number
  recommendation: string
  onStartWorkout: () => void
}) {
  const targets = state.targets!
  const nutrition = getDailyNutrition(state.foodEntries)
  const transformation = getTransformation(powerLevel)
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const weeklyVolume = weeklyWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0)
  const recipeSuggestions = getRecommendedRecipes(state)

  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Power Level</span>
          <h2>{formatNumber(powerLevel)}</h2>
          <p>{transformation.name} active. Continue ta progression sans perdre de vitesse.</p>
        </div>
        <div className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent }}>
          {transformation.name}
        </div>
      </section>

      <QuestSection state={state} />

      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <span className="eyebrow">Mission du jour</span>
            <h3>{nextSession?.name ?? 'Aucune seance programmee'}</h3>
          </div>
          <button className="primary-btn" onClick={onStartWorkout} type="button">
            {state.activeWorkout ? 'Reprendre' : 'Lancer'}
          </button>
        </div>
        <p>{nextSession?.focus ?? 'Choisis un programme pour recevoir une seance guidee.'}</p>
        <div className="metrics-grid">
          <MetricCard label="Seances semaine" value={`${weeklyWorkouts.length}/${state.profile?.trainingDaysPerWeek ?? 0}`} accent="var(--accent-gold)" />
          <MetricCard label="Volume semaine" value={`${formatNumber(weeklyVolume)} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Calories restantes" value={`${Math.max(0, Math.round(targets.calories - nutrition.calories))}`} accent="var(--accent-orange)" />
        </div>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Nutrition cible</span>
        <ProgressBar label="Calories" value={nutrition.calories} target={targets.calories} accent="linear-gradient(90deg, #ffb400, #ff6a00)" />
        <ProgressBar label="Proteines" value={nutrition.protein} target={targets.protein} accent="linear-gradient(90deg, #00d4ff, #4fffb0)" />
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Scouter insight</span>
        <p>{recommendation}</p>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Recipes</span>
        <div className="card-list">
          {recipeSuggestions.map((recipe) => (
            <article className="mini-card" key={recipe.id}>
              <strong>{recipe.name}</strong>
              <span>{recipe.calories} kcal • {recipe.protein}P • {recipe.carbs}G • {recipe.fats}L</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function TrainView({
  state,
  onStartWorkout,
  onAddSet,
  onFinishWorkout,
  restTimer,
  onSkipTimer,
}: {
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
    return <div className="page"><section className="panel"><p>Choisis d abord un programme depuis le profil.</p></section></div>
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
          <div className="hero-badge">{selectedProgram.daysPerWeek} j/semaine</div>
        </section>

        <section className="panel stack-md">
          <div className="section-head">
            <div>
              <span className="eyebrow">Prochaine seance</span>
              <h3>{nextSession.name}</h3>
            </div>
            <button className="primary-btn" onClick={onStartWorkout} type="button">Start</button>
          </div>
          <p>{nextSession.focus}</p>
          <div className="card-list">
            {nextSession.exercises.map((entry) => {
              const exercise = getExerciseById(entry.exerciseId)
              return (
                <article className="mini-card" key={entry.exerciseId}>
                  <strong>{exercise.name}</strong>
                  <span>{entry.sets} x {entry.repMin}-{entry.repMax} • RIR {entry.targetRir}</span>
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
            <span className="eyebrow">Rest timer</span>
            <h3>{restTimer}s</h3>
          </div>
          <button className="ghost-btn" onClick={onSkipTimer} type="button">Skip</button>
        </section>
      )}

      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <span className="eyebrow">Active workout</span>
            <h3>{nextSession.name}</h3>
          </div>
          <button className="primary-btn" onClick={onFinishWorkout} type="button">Finish</button>
        </div>
      </section>

      {activeWorkout.exercises.map((exerciseLog) => {
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
                <p>{target.sets} x {target.repMin}-{target.repMax} • RIR {target.targetRir} • Rest {target.restSeconds}s</p>
              </div>
              {previous && <span className="badge">Last {previous.weightKg} x {previous.reps}</span>}
            </div>

            <div className="field-grid compact-grid">
              <label>
                <span>Poids</span>
                <input value={currentInput.weight} onChange={(event) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, weight: event.target.value } })} />
              </label>
              <label>
                <span>Reps</span>
                <input value={currentInput.reps} onChange={(event) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, reps: event.target.value } })} />
              </label>
              <label>
                <span>RIR</span>
                <input value={currentInput.rir} onChange={(event) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, rir: event.target.value } })} />
              </label>
              <label>
                <span>Type</span>
                <select value={currentInput.setType} onChange={(event) => setDraftInputs({ ...draftInputs, [exercise.id]: { ...currentInput, setType: event.target.value as SetType } })}>
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
              Add set
            </button>

            <div className="set-list">
              {exerciseLog.sets.length === 0 ? (
                <p className="muted">No set yet. Start with the previous load and push one clean rep or a small load jump.</p>
              ) : (
                exerciseLog.sets.map((set) => (
                  <div className="set-row" key={set.id}>
                    <span>S{set.setIndex}</span>
                    <strong>{set.weightKg} kg x {set.reps}</strong>
                    <span>RIR {set.rir}</span>
                    <span>{set.setType}</span>
                  </div>
                ))
              )}
            </div>

            <div className="chip-row">
              {exercise.alternatives.map((alternativeId) => (
                <span className="chip chip--static" key={alternativeId}>{getExerciseById(alternativeId).name}</span>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function NutritionView({ state, onAddFood }: { state: AppState; onAddFood: (entry: FoodEntry) => void }) {
  const [selectedFood, setSelectedFood] = useState(foods[0])
  const [grams, setGrams] = useState('100')
  const [category, setCategory] = useState<FoodEntry['category']>('lunch')
  const totals = getDailyNutrition(state.foodEntries)
  const suggestions = getRecommendedRecipes(state)

  return (
    <div className="page">
      <section className="panel stack-md">
        <span className="eyebrow">Nutrition</span>
        <ProgressBar label="Calories" value={totals.calories} target={state.targets?.calories ?? 1} accent="linear-gradient(90deg, #ffb400, #ff6a00)" />
        <ProgressBar label="Proteines" value={totals.protein} target={state.targets?.protein ?? 1} accent="linear-gradient(90deg, #00d4ff, #4fffb0)" />
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Quick add food</span>
        <div className="field-grid compact-grid">
          <label>
            <span>Food</span>
            <select value={selectedFood.id} onChange={(event) => setSelectedFood(foods.find((food) => food.id === event.target.value) ?? foods[0])}>
              {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
            </select>
          </label>
          <label>
            <span>Grammes</span>
            <input value={grams} onChange={(event) => setGrams(event.target.value)} />
          </label>
          <label>
            <span>Categorie</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as FoodEntry['category'])}>
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

      <section className="panel stack-md">
        <span className="eyebrow">Saved meals</span>
        <div className="card-list">
          {state.savedMeals.map((meal) => (
            <button className="mini-card mini-card--button" key={meal.id} type="button" onClick={() => onAddFood({ id: makeId('meal'), date: todayIso(), name: meal.name, category: meal.category, grams: 1, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats })}>
              <strong>{meal.name}</strong>
              <span>{meal.calories} kcal • {meal.protein}P</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Suggested recipes</span>
        <div className="card-list">
          {suggestions.map((recipe) => (
            <button className="mini-card mini-card--button" key={recipe.id} type="button" onClick={() => onAddFood({ id: makeId('recipe'), date: todayIso(), name: recipe.name, category: recipe.category, grams: 1, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fats: recipe.fats })}>
              <strong>{recipe.name}</strong>
              <span>{recipe.prepMinutes} min • {recipe.calories} kcal • {recipe.protein}P</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function ScouterView({ state }: { state: AppState }) {
  const weeklyWorkouts = getWeeklyWorkouts(state.workouts)
  const volumeByMuscle = getVolumeByMuscle(weeklyWorkouts)

  return (
    <div className="page">
      <section className="panel stack-md">
        <span className="eyebrow">Scouter analytics</span>
        <div className="metrics-grid">
          <MetricCard label="Workouts" value={String(weeklyWorkouts.length)} accent="var(--accent-gold)" />
          <MetricCard label="Volume" value={`${formatNumber(weeklyWorkouts.reduce((sum, workout) => sum + getWorkoutVolume(workout), 0))} kg`} accent="var(--accent-blue)" />
          <MetricCard label="Bodyweight" value={`${state.bodyweightEntries.at(-1)?.weightKg ?? state.profile?.weightKg ?? 0} kg`} accent="var(--accent-orange)" />
        </div>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Volume by muscle</span>
        {volumeByMuscle.length === 0 ? (
          <p className="muted">Complete ta premiere semaine pour voir la map musculaire.</p>
        ) : (
          volumeByMuscle.map(([muscle, volume]) => (
            <ProgressBar key={muscle} label={muscle} value={volume} target={Math.max(volumeByMuscle[0][1], 1)} accent="linear-gradient(90deg, #4fffb0, #00d4ff)" />
          ))
        )}
      </section>
    </div>
  )
}

function ProfileView({
  state,
  powerLevel,
  onLogBodyweight,
  onLogMeasurement,
  onChooseProgram,
}: {
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

  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Profile</span>
          <h2>{state.profile?.name}</h2>
          <p>{transformation.name} • {state.profile?.goal.replace('_', ' ')}</p>
        </div>
        <div className="hero-badge" style={{ borderColor: transformation.accent, color: transformation.accent }}>
          {dragonBalls}/7 DB
        </div>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Bodyweight</span>
        <div className="inline-form">
          <input value={bodyweight} onChange={(event) => setBodyweight(event.target.value)} />
          <button className="secondary-btn" type="button" onClick={() => onLogBodyweight({ id: makeId('bw'), date: todayIso(), weightKg: Number(bodyweight) })}>Log</button>
        </div>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Measurements</span>
        <div className="field-grid compact-grid">
          <label><span>Waist</span><input value={measurements.waist} onChange={(event) => setMeasurements({ ...measurements, waist: event.target.value })} /></label>
          <label><span>Chest</span><input value={measurements.chest} onChange={(event) => setMeasurements({ ...measurements, chest: event.target.value })} /></label>
          <label><span>Arm</span><input value={measurements.arm} onChange={(event) => setMeasurements({ ...measurements, arm: event.target.value })} /></label>
          <label><span>Thigh</span><input value={measurements.thigh} onChange={(event) => setMeasurements({ ...measurements, thigh: event.target.value })} /></label>
        </div>
        <button className="secondary-btn" type="button" onClick={() => onLogMeasurement({ id: makeId('measure'), date: todayIso(), waistCm: Number(measurements.waist), chestCm: Number(measurements.chest), armCm: Number(measurements.arm), thighCm: Number(measurements.thigh) })}>Save measurements</button>
      </section>

      <section className="panel stack-md">
        <span className="eyebrow">Programs</span>
        <div className="card-list">
          {programs.map((program) => (
            <button className={`mini-card mini-card--button ${state.selectedProgramId === program.id ? 'mini-card--selected' : ''}`} key={program.id} type="button" onClick={() => onChooseProgram(program.id)}>
              <strong>{program.name}</strong>
              <span>{program.saga} • {program.daysPerWeek} jours</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function BottomNav({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  const items: Array<[TabId, string]> = [['home', 'Home'], ['train', 'Train'], ['nutrition', 'Fuel'], ['scouter', 'Scouter'], ['profile', 'Profile']]
  return (
    <nav className="bottom-nav">
      {items.map(([id, label]) => (
        <button key={id} className={`nav-item ${tab === id ? 'nav-item--active' : ''}`} onClick={() => onChange(id)} type="button">
          {label}
        </button>
      ))}
    </nav>
  )
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState)
  const [tab, setTab] = useState<TabId>('home')
  const [restTimer, setRestTimer] = useState(0)

  useEffect(() => saveState(state), [state])
  useEffect(() => {
    if (restTimer <= 0) return
    const timer = window.setTimeout(() => setRestTimer((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [restTimer])

  const selectedProgram = getProgramById(state.selectedProgramId)
  const nextIndex = state.programCursor[selectedProgram?.id ?? ''] ?? 0
  const nextSession = selectedProgram?.sessions[nextIndex % (selectedProgram?.sessions.length ?? 1)] ?? null
  const powerLevel = useMemo(() => getPowerLevel(state), [state])
  const recommendation = useMemo(() => getPrimaryRecommendation(state), [state])

  const completeOnboarding = (profile: UserProfile) => {
    const targets = calculateTargets(profile)
    const recommendedProgram = recommendProgram(profile)
    setState({
      ...defaultState,
      profile,
      targets,
      selectedProgramId: recommendedProgram.id,
      savedMeals,
      bodyweightEntries: [{ id: makeId('bw'), date: todayIso(), weightKg: profile.weightKg }],
    })
  }

  const startWorkout = () => {
    if (!selectedProgram || !nextSession) return
    const draft: WorkoutDraft = {
      programId: selectedProgram.id,
      sessionId: nextSession.id,
      startedAt: new Date().toISOString(),
      exercises: nextSession.exercises.map((entry) => ({ exerciseId: entry.exerciseId, target: entry, sets: [] })),
    }
    setState((current) => ({ ...current, activeWorkout: draft }))
    setTab('train')
  }

  const addSet = (exerciseId: string, weightKg: number, reps: number, rir: number, setType: SetType) => {
    if (!state.activeWorkout || reps <= 0) return
    const exerciseTarget = state.activeWorkout.exercises.find((entry) => entry.exerciseId === exerciseId)?.target
    setState((current) => ({
      ...current,
      activeWorkout: current.activeWorkout ? {
        ...current.activeWorkout,
        exercises: current.activeWorkout.exercises.map((entry) =>
          entry.exerciseId === exerciseId
            ? { ...entry, sets: [...entry.sets, { id: makeId('set'), exerciseId, setIndex: entry.sets.length + 1, setType, weightKg, reps, rir, timestamp: new Date().toISOString() }] }
            : entry,
        ),
      } : null,
    }))
    setRestTimer(exerciseTarget?.restSeconds ?? 90)
  }

  const finishWorkout = () => {
    if (!state.activeWorkout || !selectedProgram || !nextSession) return
    const workout = {
      id: makeId('workout'),
      date: todayIso(),
      programId: selectedProgram.id,
      sessionId: nextSession.id,
      sessionName: nextSession.name,
      exercises: state.activeWorkout.exercises.filter((entry) => entry.sets.length > 0),
      durationMinutes: Math.max(25, Math.round((Date.now() - new Date(state.activeWorkout.startedAt).getTime()) / 60000)),
    }
    setState((current) => ({
      ...current,
      workouts: [...current.workouts, workout],
      activeWorkout: null,
      programCursor: { ...current.programCursor, [selectedProgram.id]: (current.programCursor[selectedProgram.id] ?? 0) + 1 },
    }))
    setRestTimer(0)
    setTab('home')
  }

  const addFood = (entry: FoodEntry) => setState((current) => ({ ...current, foodEntries: [...current.foodEntries, entry] }))
  const logBodyweight = (entry: BodyweightEntry) => setState((current) => ({ ...current, bodyweightEntries: [...current.bodyweightEntries, entry], profile: current.profile ? { ...current.profile, weightKg: entry.weightKg } : null }))
  const logMeasurement = (entry: MeasurementEntry) => setState((current) => ({ ...current, measurementEntries: [...current.measurementEntries, entry] }))
  const chooseProgram = (programId: string) => setState((current) => ({ ...current, selectedProgramId: programId }))

  if (!state.profile || !state.targets) {
    return <OnboardingView onComplete={completeOnboarding} />
  }

  return (
    <div className="app-shell">
      {tab === 'home' && <HomeView state={state} nextSession={nextSession} powerLevel={powerLevel} recommendation={recommendation} onStartWorkout={startWorkout} />}
      {tab === 'train' && <TrainView state={state} onStartWorkout={startWorkout} onAddSet={addSet} onFinishWorkout={finishWorkout} restTimer={restTimer} onSkipTimer={() => setRestTimer(0)} />}
      {tab === 'nutrition' && <NutritionView state={state} onAddFood={addFood} />}
      {tab === 'scouter' && <ScouterView state={state} />}
      {tab === 'profile' && <ProfileView state={state} powerLevel={powerLevel} onLogBodyweight={logBodyweight} onLogMeasurement={logMeasurement} onChooseProgram={chooseProgram} />}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App
