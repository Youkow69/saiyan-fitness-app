import React, { useState } from 'react'
import type { UserProfile, OnboardingAnswers, Goal } from '../../types'

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

const weakPointOptions = [
  'Epaules', 'Bras', 'Jambes', 'Dos', 'Poitrine', 'Abdominaux', 'Mollets', 'Fessiers',
]
const supplementOptions = [
  'Creatine', 'Whey', 'Cafeine', 'Omega-3', 'Vitamine D', 'BCAA', 'Pre-workout', 'Aucun',
]
const injuryOptions = [
  'Epaule', 'Genou', 'Dos', 'Poignet', 'Cheville', 'Hanche', 'Coude', 'Aucune',
]

const toggle = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]

interface OnboardingViewProps {
  onComplete: (profile: UserProfile, answers: OnboardingAnswers) => void
}

export const OnboardingView: React.FC<OnboardingViewProps> = React.memo(
  function OnboardingView({ onComplete }) {
    const [step, setStep] = useState(1)
    const [draft, setDraft] = useState<UserProfile>(defaultProfile)
    const [answers, setAnswers] = useState<OnboardingAnswers>(defaultOnboardingAnswers)

    const stepTitles = [
      'Profil de base',
      'Entrainement',
      'Objectifs profonds',
      'Cibles quotidiennes',
    ]

    const step1Invalid =
      draft.name.trim().length < 2 ||
      draft.age < 13 ||
      draft.age > 120 ||
      draft.weightKg < 20 ||
      draft.weightKg > 300 ||
      draft.heightCm < 100 ||
      draft.heightCm > 250

    return (
      <div className="page onboarding-shell">
        <section className="hero-card hero-card--scan">
          <span className="eyebrow">Scouter Scan — Etape {step}/4</span>
          <h1>Saiyan Fitness</h1>
          <p style={{ marginBottom: 0 }}>{stepTitles[step - 1]}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background:
                    s <= step
                      ? 'var(--accent-gold)'
                      : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </section>

        {step === 1 && (
          <section className="panel stack-lg">
            <div className="field-grid">
              <label>
                <span>Nom</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                <span>Age</span>
                <input
                  type="number"
                  value={draft.age}
                  onChange={(e) =>
                    setDraft({ ...draft, age: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                <span>Poids (kg)</span>
                <input
                  type="number"
                  value={draft.weightKg}
                  onChange={(e) =>
                    setDraft({ ...draft, weightKg: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                <span>Taille (cm)</span>
                <input
                  type="number"
                  value={draft.heightCm}
                  onChange={(e) =>
                    setDraft({ ...draft, heightCm: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="choice-group">
              <span className="field-title">Sexe</span>
              <div className="chip-row">
                {(
                  [
                    ['male', 'Homme'],
                    ['female', 'Femme'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${draft.sex === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        sex: v as UserProfile['sex'],
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Objectif principal</span>
              <div className="chip-row">
                {(
                  [
                    ['muscle_gain', 'Prise de masse'],
                    ['fat_loss', 'Perte de gras'],
                    ['recomp', 'Recomposition'],
                    ['strength', 'Force'],
                    ['endurance', 'Endurance'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${draft.goal === v ? 'chip--active' : ''}`}
                    onClick={() => setDraft({ ...draft, goal: v as Goal })}
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="primary-btn"
              onClick={() => setStep(2)}
              type="button"
              disabled={step1Invalid}
            >
              Suivant
            </button>
          </section>
        )}
        {step === 2 && (
          <section className="panel stack-lg">
            <div className="choice-group">
              <span className="field-title">Niveau d'activite</span>
              <div className="chip-row">
                {(
                  [
                    ['sedentary', 'Sedentaire'],
                    ['light', 'Legere'],
                    ['moderate', 'Moderee'],
                    ['high', 'Elevee'],
                    ['athlete', 'Athlete'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${draft.activityLevel === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        activityLevel: v as UserProfile['activityLevel'],
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Niveau d'experience</span>
              <div className="chip-row">
                {(
                  [
                    ['beginner', 'Debutant'],
                    ['intermediate', 'Intermediaire'],
                    ['advanced', 'Avance'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${draft.experienceLevel === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        experienceLevel:
                          v as UserProfile['experienceLevel'],
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Materiel disponible</span>
              <div className="chip-row">
                {(
                  [
                    ['full_gym', 'Full gym'],
                    ['basic_gym', 'Basic gym'],
                    ['home_gym', 'Home gym'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${draft.equipmentAccess === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        equipmentAccess:
                          v as UserProfile['equipmentAccess'],
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-grid">
              <label>
                <span>Jours par semaine</span>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={draft.trainingDaysPerWeek}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      trainingDaysPerWeek: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                <span>Preference alimentaire</span>
                <input
                  value={draft.dietaryPreference}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dietaryPreference: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field-span-2">
                <span>Contraintes / blessures</span>
                <input
                  value={draft.injuryNotes}
                  onChange={(e) =>
                    setDraft({ ...draft, injuryNotes: e.target.value })
                  }
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="ghost-btn"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
                type="button"
              >
                Retour
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={() => setStep(3)}
                type="button"
              >
                Suivant
              </button>
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="panel stack-lg">
            <div className="choice-group">
              <span className="field-title">Points faibles a cibler</span>
              <div className="chip-row">
                {weakPointOptions.map((item) => (
                  <button
                    key={item}
                    className={`chip ${answers.weakPoints.includes(item) ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        weakPoints: toggle(answers.weakPoints, item),
                      })
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Cardio actuel</span>
              <div className="chip-row">
                {(
                  [
                    ['none', 'Aucun'],
                    ['light', 'Leger'],
                    ['moderate', 'Modere'],
                    ['intense', 'Intense'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${answers.currentCardio === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({ ...answers, currentCardio: v })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Style de motivation</span>
              <div className="chip-row">
                {(
                  [
                    ['data', 'Data/Stats'],
                    ['community', 'Communaute'],
                    ['aesthetics', 'Esthetique'],
                    ['performance', 'Performance'],
                    ['health', 'Sante'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${answers.motivationStyle === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({ ...answers, motivationStyle: v })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Supplements utilises</span>
              <div className="chip-row">
                {supplementOptions.map((item) => (
                  <button
                    key={item}
                    className={`chip ${answers.supplementsUsed.includes(item) ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        supplementsUsed: toggle(
                          answers.supplementsUsed,
                          item
                        ),
                      })
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Blessures passees</span>
              <div className="chip-row">
                {injuryOptions.map((item) => (
                  <button
                    key={item}
                    className={`chip ${answers.pastInjuries.includes(item) ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        pastInjuries: toggle(answers.pastInjuries, item),
                      })
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Niveau de stress</span>
              <div className="chip-row">
                {(
                  [
                    ['low', 'Faible'],
                    ['moderate', 'Modere'],
                    ['high', 'Eleve'],
                    ['very_high', 'Tres eleve'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${answers.stressLevel === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({ ...answers, stressLevel: v })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="ghost-btn"
                style={{ flex: 1 }}
                onClick={() => setStep(2)}
                type="button"
              >
                Retour
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={() => setStep(4)}
                type="button"
              >
                Suivant
              </button>
            </div>
          </section>
        )}
        {step === 4 && (
          <section className="panel stack-lg">
            <div className="choice-group">
              <span className="field-title">Objectif de pas quotidien</span>
              <div className="chip-row">
                {(
                  [
                    [8000, '8 000 pas'],
                    [10000, '10 000 pas'],
                    [12000, '12 000 pas'],
                    [15000, '15 000 pas'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={String(v)}
                    className={`chip ${answers.dailyStepGoal === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        dailyStepGoal: v as number,
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Objectif d'hydratation</span>
              <div className="chip-row">
                {(
                  [
                    [1.5, '1.5 L'],
                    [2, '2 L'],
                    [2.5, '2.5 L'],
                    [3, '3 L'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={String(v)}
                    className={`chip ${answers.waterGoalLiters === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        waterGoalLiters: v as number,
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Heures de sommeil cible</span>
              <div className="chip-row">
                {(
                  [
                    [6, '6h'],
                    [7, '7h'],
                    [8, '8h'],
                    [9, '9h+'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={String(v)}
                    className={`chip ${answers.sleepHours === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({ ...answers, sleepHours: v as number })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="choice-group">
              <span className="field-title">Meal prep</span>
              <div className="chip-row">
                {(
                  [
                    ['none', 'Aucun'],
                    ['light', 'Leger'],
                    ['moderate', 'Modere'],
                    ['heavy', 'Full prep'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={`chip ${answers.mealPrepWillingness === v ? 'chip--active' : ''}`}
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        mealPrepWillingness: v,
                      })
                    }
                    type="button"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="ghost-btn"
                style={{ flex: 1 }}
                onClick={() => setStep(3)}
                type="button"
              >
                Retour
              </button>
              <button
                className="primary-btn"
                style={{ flex: 2 }}
                onClick={() => onComplete(draft, answers)}
                type="button"
              >
                Demarrer la premiere Saga
              </button>
            </div>
          </section>
        )}
      </div>
    )
  }
)
