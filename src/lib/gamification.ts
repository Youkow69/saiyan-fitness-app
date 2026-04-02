// ── Gamification System ─────────────────────────────────────────────────────

import type { AppState, DailyQuest, MainObjective } from '../types'
import { todayIso } from './dates'
import { getDailyNutrition } from './nutrition'
import { countPRs, getPowerLevel, getStreak } from './progression'
import { getWorkoutVolume } from './training'

// ── Exported Types ──────────────────────────────────────────────────────────

export type TransformationLevel = 'goku_base' | 'ssj' | 'ssj2' | 'ssj3' | 'god' | 'blue' | 'kaioken' | 'ui_sign' | 'mui'

export interface Quest {
  id: string
  name: string
  description: string
  requirement: (state: AppState) => number
  target: number
}

export interface Transformation {
  level: TransformationLevel
  name: string
  accent: string
  image: string
  powerThreshold: number
  quests: Quest[]
}

// ── Transformation Data ─────────────────────────────────────────────────────

export const TRANSFORMATIONS: Transformation[] = [
  {
    level: 'goku_base',
    name: 'Goku',
    accent: 'var(--accent-calm)',
    image: 'images/goku.png',
    powerThreshold: 0,
    quests: [],
  },
  {
    level: 'ssj',
    name: 'Super Saiyan',
    accent: 'var(--accent-gold)',
    image: 'images/goku_ssj.png',
    powerThreshold: 2000,
    quests: [
      { id: 'ssj_q1', name: "L'Éveil de la Rage", description: 'Complete 5 séances', requirement: (s) => s.workouts.length, target: 5 },
      { id: 'ssj_q2', name: 'Dépasse tes Limites', description: 'Soulevé 1 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 1000 },
      { id: 'ssj_q3', name: 'Premier Sang', description: 'Bats 1 record personnel', requirement: (s) => countPRs(s), target: 1 },
      { id: 'ssj_daily', name: 'Discipline Saiyan', description: 'Complete 20 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 20 },
    ],
  },
  {
    level: 'ssj2',
    name: 'Super Saiyan 2',
    accent: 'var(--accent-blue)',
    image: 'images/goku_ssj2.png',
    powerThreshold: 8000,
    quests: [
      { id: 'ssj2_q1', name: 'Dépasse ton Pere', description: 'Complete 15 séances', requirement: (s) => s.workouts.length, target: 15 },
      { id: 'ssj2_q2', name: 'Entraînement des Cell Games', description: 'Soulevé 5 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 5000 },
      { id: 'ssj2_q3', name: 'Coups de Foudre', description: 'Bats 5 records personnels', requirement: (s) => countPRs(s), target: 5 },
      { id: 'ssj2_q4', name: 'Guerrier 7 Jours', description: 'Atteins une serie de 7 jours', requirement: (s) => getStreak(s), target: 7 },
      { id: 'ssj2_daily', name: 'Habitude de Champion', description: 'Complete 60 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 60 },
    ],
  },
  {
    level: 'ssj3',
    name: 'Super Saiyan 3',
    accent: 'var(--accent-orange)',
    image: 'images/goku_ssj3.png',
    powerThreshold: 25000,
    quests: [
      { id: 'ssj3_q1', name: 'Au-dela de la Limite', description: 'Complete 30 séances', requirement: (s) => s.workouts.length, target: 30 },
      { id: 'ssj3_q2', name: 'Puissance du Genkidama', description: 'Soulevé 15 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 15000 },
      { id: 'ssj3_q3', name: 'Briseur de Records', description: 'Bats 15 records personnels', requirement: (s) => countPRs(s), target: 15 },
      { id: 'ssj3_q4', name: 'Roi de la Régularité', description: 'Série de 14 jours', requirement: (s) => getStreak(s), target: 14 },
      { id: 'ssj3_daily', name: 'Régularité Absolue', description: 'Complete 150 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 150 },
    ],
  },
  {
    level: 'god',
    name: 'Super Saiyan God',
    accent: 'var(--accent-red)',
    image: 'images/goku_god.png',
    powerThreshold: 60000,
    quests: [
      { id: 'god_q1', name: 'Rituel des Saiyans', description: 'Complete 50 séances', requirement: (s) => s.workouts.length, target: 50 },
      { id: 'god_q2', name: 'Entraînement Divin', description: 'Soulevé 40 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 40000 },
      { id: 'god_q3', name: 'Records Divins', description: 'Bats 30 records personnels', requirement: (s) => countPRs(s), target: 30 },
      { id: 'god_q4', name: 'Volonte de Fer', description: 'Série de 30 jours', requirement: (s) => getStreak(s), target: 30 },
      { id: 'god_daily', name: 'Rituel Divin', description: 'Complete 300 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 300 },
    ],
  },
  {
    level: 'blue',
    name: 'Super Saiyan Blue',
    accent: 'var(--accent-blue)',
    image: 'images/goku_ssj_blue.png',
    powerThreshold: 150000,
    quests: [
      { id: 'blue_q1', name: "Camp d'Entraînement de Whis", description: 'Complete 100 séances', requirement: (s) => s.workouts.length, target: 100 },
      { id: 'blue_q2', name: 'Puissance Universelle', description: 'Soulevé 100 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 100000 },
      { id: 'blue_q3', name: 'Inarrêtable', description: 'Bats 50 records personnels', requirement: (s) => countPRs(s), target: 50 },
      { id: 'blue_q4', name: '60 Jours de Combat', description: 'Série de 60 jours', requirement: (s) => getStreak(s), target: 60 },
      { id: 'blue_daily', name: 'Ki Divin Maîtrise', description: 'Complete 500 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 500 },
    ],
  },
  {
    level: 'kaioken',
    name: 'Kaioken Divin',
    accent: '#ff2222',
    image: 'images/goku_kaioken.png',
    powerThreshold: 350000,
    quests: [
      { id: 'kk_q1', name: 'Maîtrise du Kaioken', description: 'Complete 80 séances', requirement: (s) => s.workouts.length, target: 80 },
      { id: 'kk_q2', name: 'Surcharge Totale', description: 'Soulevé 80 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 80000 },
      { id: 'kk_q3', name: 'Dépassement x20', description: 'Bats 40 records personnels', requirement: (s) => countPRs(s), target: 40 },
      { id: 'kk_q4', name: 'Endurance Kaioken', description: 'Série de 45 jours', requirement: (s) => getStreak(s), target: 45 },
      { id: 'kk_daily', name: 'Corps en Feu', description: 'Complete 400 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 400 },
    ],
  },
  {
    level: 'ui_sign',
    name: 'Ultra Instinct Sign',
    accent: '#c0c0c0',
    image: 'images/goku_ui_sign.png',
    powerThreshold: 650000,
    quests: [
      { id: 'ui_q1', name: 'Tournoi du Pouvoir', description: 'Complete 200 séances', requirement: (s) => s.workouts.length, target: 200 },
      { id: 'ui_q2', name: 'Mouvement Autonome', description: 'Soulevé 250 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 250000 },
      { id: 'ui_q3', name: 'Statut Légendaire', description: 'Bats 100 records personnels', requirement: (s) => countPRs(s), target: 100 },
      { id: 'ui_q4', name: '90 Jours Sans Faille', description: 'Série de 90 jours', requirement: (s) => getStreak(s), target: 90 },
      { id: 'ui_daily', name: 'Instinct Pur', description: 'Complete 1,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 1000 },
    ],
  },
  {
    level: 'mui',
    name: 'Mastered Ultra Instinct',
    accent: '#e8e8ff',
    image: 'images/goku_mui.png',
    powerThreshold: 1500000,
    quests: [
      { id: 'mui_q1', name: 'Maître de Soi', description: 'Complete 365 séances', requirement: (s) => s.workouts.length, target: 365 },
      { id: 'mui_q2', name: 'Au-dela des Dieux', description: 'Soulevé 500 000 kg au total', requirement: (s) => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0), target: 500000 },
      { id: 'mui_q3', name: 'Transcendance', description: 'Bats 200 records personnels', requirement: (s) => countPRs(s), target: 200 },
      { id: 'mui_q4', name: 'Guerrier 1 An', description: 'Série de 365 jours', requirement: (s) => getStreak(s), target: 365 },
      { id: 'mui_daily', name: 'Maîtrise Totale', description: 'Complete 2,000 daily quests', requirement: (s) => countCompletedDailyQuests(s), target: 2000 },
    ],
  },
]

// ── Transformation Helpers ──────────────────────────────────────────────────

/** Returns the transformation name and accent for a given power level. */
export function getTransformation(powerLevel: number) {
  let current = TRANSFORMATIONS[0]
  for (const t of TRANSFORMATIONS) {
    if (powerLevel >= t.powerThreshold) current = t
    else break
  }
  return { name: current.name, accent: current.accent }
}

/** Full transformation info including quest progress and next transformation. */
export function getCurrentTransformationFull(state: AppState) {
  const powerLevel = getPowerLevel(state)
  let currentIndex = 0
  for (let i = 0; i < TRANSFORMATIONS.length; i++) {
    if (powerLevel >= TRANSFORMATIONS[i].powerThreshold) currentIndex = i
    else break
  }

  let unlockedIndex = 0
  for (let i = 1; i < TRANSFORMATIONS.length; i++) {
    const t = TRANSFORMATIONS[i]
    const allQuestsComplete = t.quests.every(q => q.requirement(state) >= q.target)
    if (allQuestsComplete && powerLevel >= t.powerThreshold) unlockedIndex = i
    else break
  }

  return {
    current: TRANSFORMATIONS[Math.min(currentIndex, unlockedIndex)],
    currentIndex: Math.min(currentIndex, unlockedIndex),
    nextTransformation: TRANSFORMATIONS[Math.min(currentIndex, unlockedIndex) + 1] ?? null,
    powerLevel,
    allTransformations: TRANSFORMATIONS,
  }
}

// ── Daily Quest System ──────────────────────────────────────────────────────

export const DAILY_QUESTS: DailyQuest[] = [
  { id: 'steps',    name: '10 000 pas',        description: "Marche 10 000 pas aujourd'hui",              icon: '👟', target: 10000, unit: 'pas',     category: 'activity'  },
  { id: 'water',    name: 'Hydratation',        description: "Bois 2L d'eau",                              icon: '💧', target: 8,     unit: 'verres',  category: 'nutrition' },
  { id: 'protein',  name: 'Protéines',          description: 'Atteins ton objectif protéines',             icon: '🥩', target: 100,   unit: '%',       category: 'nutrition' },
  { id: 'calories', name: 'Calories',           description: 'Reste dans ta cible calorique (±10%)',       icon: '🔥', target: 100,   unit: '%',       category: 'nutrition' },
  { id: 'training', name: 'Entraînement',       description: 'Complète ta séance programmée',              icon: '💪', target: 1,     unit: 'séance',  category: 'training'  },
  { id: 'sleep',    name: 'Sommeil 7h+',        description: 'Dors au moins 7 heures',                     icon: '😴', target: 7,     unit: 'heures',  category: 'recovery'  },
  { id: 'stretch',  name: 'Étirements',         description: "10 min d'étirements ou mobilité",            icon: '🧘', target: 10,    unit: 'min',     category: 'recovery'  },
  { id: 'no_junk',  name: 'Alimentation saine', description: "Pas de junk food aujourd'hui",               icon: '🥗', target: 1,     unit: 'jour',    category: 'nutrition' },
]

/** Total count of completed daily quests across all dates. */
export function countCompletedDailyQuests(state: AppState): number {
  if (!state.completedDailyQuests) return 0
  return Object.values(state.completedDailyQuests).reduce((total, quests) => total + quests.length, 0)
}

/** Returns status of each daily quest for today with current progress. */
export function getDailyQuestStatus(state: AppState) {
  const today = todayIso()
  const progress = (state.dailyQuestProgress ?? []).find(d => d.date === today)
  const completed = (state.completedDailyQuests ?? {})[today] ?? []
  const nutrition = getDailyNutrition(state.foodEntries)
  const todayWorkouts = state.workouts.filter(w => w.date === today)

  return DAILY_QUESTS.map(quest => {
    let current = progress?.quests[quest.id] ?? 0

    if (quest.id === 'protein' && state.targets) {
      current = state.targets.protein > 0 ? Math.round((nutrition.protein / state.targets.protein) * 100) : 0
    } else if (quest.id === 'calories' && state.targets) {
      const ratio = state.targets.calories > 0 ? nutrition.calories / state.targets.calories : 0
      current = (ratio >= 0.9 && ratio <= 1.1) ? 100 : Math.round(ratio * 100)
    } else if (quest.id === 'training') {
      current = todayWorkouts.length > 0 ? 1 : 0
    }

    const isComplete = completed.includes(quest.id) || current >= quest.target
    return { ...quest, current, isComplete }
  })
}

// ── Main Objectives ─────────────────────────────────────────────────────────

/** Generates the main objectives list based on onboarding answers and app state. */
export function generateMainObjectives(state: AppState): MainObjective[] {
  const answers = state.onboardingAnswers
  const objectives: MainObjective[] = []

  objectives.push({
    id: 'first_month', name: '30 Jours de Feu', description: 'Enchaîne les entraînements pendant 30 jours',
    icon: 'F', completed: false,
    milestones: [
      { description: '7 jours', target: 7, unit: 'jours', check: s => getStreak(s) },
      { description: '14 jours', target: 14, unit: 'jours', check: s => getStreak(s) },
      { description: '30 jours', target: 30, unit: 'jours', check: s => getStreak(s) },
    ],
  })

  objectives.push({
    id: 'volume_master', name: 'Maître du Volume', description: 'Accumule du volume total à la barre',
    icon: 'V', completed: false,
    milestones: [
      { description: '10 000 kg', target: 10000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '50 000 kg', target: 50000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
      { description: '100 000 kg', target: 100000, unit: 'kg', check: s => s.workouts.reduce((t, w) => t + getWorkoutVolume(w), 0) },
    ],
  })

  if (!answers) return objectives

  if (answers.weakPoints && answers.weakPoints.length > 0) {
    objectives.push({
      id: 'weak_points', name: 'Corriger les Faiblesses', description: `Focus: ${answers.weakPoints.join(', ')}`,
      icon: 'W', completed: false,
      milestones: [
        { description: '20 séances avec focus', target: 20, unit: 'séances', check: s => s.workouts.length },
        { description: '40 séances avec focus', target: 40, unit: 'séances', check: s => s.workouts.length },
      ],
    })
  }

  if (answers.currentCardio === 'none' || answers.currentCardio === 'light') {
    objectives.push({
      id: 'cardio_boost', name: 'Cardio Warrior', description: 'Améliore ton cardio avec des pas quotidiens',
      icon: 'C', completed: false,
      milestones: [
        { description: '7 jours a 10K pas', target: 7, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
        { description: '30 jours a 10K pas', target: 30, unit: 'jours', check: s => (s.dailyQuestProgress ?? []).filter(d => (d.quests['steps'] ?? 0) >= 10000).length },
      ],
    })
  }

  objectives.push({
    id: 'pr_hunter', name: 'Chasseur de PRs', description: 'Bats tes records sur les mouvements de base',
    icon: 'R', completed: false,
    milestones: [
      { description: '5 PRs battus', target: 5, unit: 'PRs', check: s => countPRs(s) },
      { description: '15 PRs battus', target: 15, unit: 'PRs', check: s => countPRs(s) },
      { description: '30 PRs battus', target: 30, unit: 'PRs', check: s => countPRs(s) },
    ],
  })

  return objectives
}
