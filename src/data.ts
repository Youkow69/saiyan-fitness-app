import type {
  ProgramTemplate,
  Recipe,
  SavedMeal,
} from './types'
import { allExercises } from './data/exercises'
import { allFoods } from './data/foods'

export const exercises = allExercises

export const foods = allFoods

export const recipes: Recipe[] = [
  { id: 'senzu_oats', name: 'Overnight oats Senzu', category: 'breakfast', prepMinutes: 8, calories: 480, protein: 34, carbs: 58, fats: 12, servings: 1, ingredients: ['80g flocons d\'avoine', '200g yaourt grec', 'fruits rouges'], steps: ['Mélanger', 'Réfrigérer', 'Déguster'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'capsule_omelet', name: 'Omelette capsule', category: 'breakfast', prepMinutes: 10, calories: 420, protein: 32, carbs: 18, fats: 24, servings: 1, ingredients: ['oeufs', 'blancs d\'oeufs', 'épinards'], steps: ['Cuire', 'Plier', 'Servir'], goalTags: ['muscle_gain', 'recomp', 'strength'] },
  { id: 'namek_rice_bowl', name: 'Bowl poulet-riz Namek', category: 'lunch', prepMinutes: 18, calories: 620, protein: 48, carbs: 72, fats: 14, servings: 1, ingredients: ['poulet', 'riz', 'brocoli'], steps: ['Cuire le poulet', 'Cuire les légumes à la vapeur', 'Servir sur le riz'], goalTags: ['muscle_gain', 'recomp', 'strength', 'endurance'] },
  { id: 'saiyan_wrap', name: 'Wrap protéiné Saiyan', category: 'lunch', prepMinutes: 12, calories: 510, protein: 42, carbs: 45, fats: 16, servings: 1, ingredients: ['wrap', 'poulet', 'légumes'], steps: ['Chauffer le wrap', 'Garnir', 'Rouler'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'frieza_salmon_plate', name: 'Assiette saumon Freezer', category: 'dinner', prepMinutes: 22, calories: 560, protein: 40, carbs: 38, fats: 26, servings: 1, ingredients: ['saumon', 'patate douce', 'légumes verts'], steps: ['Cuire le saumon au four', 'Rôtir la patate douce', 'Servir'], goalTags: ['fat_loss', 'recomp', 'strength'] },
  { id: 'gravity_yogurt_bowl', name: 'Bowl yaourt gravité', category: 'snack', prepMinutes: 5, calories: 300, protein: 27, carbs: 28, fats: 8, servings: 1, ingredients: ['yaourt', 'fruits rouges', 'granola'], steps: ['Mélanger', 'Garnir', 'Déguster'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'kaioken_bagel', name: 'Bagel pré-séance Kaioken', category: 'pre_workout', prepMinutes: 4, calories: 340, protein: 16, carbs: 57, fats: 5, servings: 1, ingredients: ['bagel', 'confiture', 'whey'], steps: ['Griller', 'Tartiner', 'Boire le whey'], goalTags: ['muscle_gain', 'strength', 'endurance'] },
  { id: 'instant_ki_shake', name: 'Shake ki instantané', category: 'post_workout', prepMinutes: 3, calories: 270, protein: 31, carbs: 24, fats: 3, servings: 1, ingredients: ['whey', 'banane', 'lait'], steps: ['Mixer', 'Boire'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
]

export const savedMeals: SavedMeal[] = [
  { id: 'post_leg_day', name: 'Stack post jambes', category: 'post_workout', calories: 540, protein: 43, carbs: 66, fats: 10 },
  { id: 'lean_lunch', name: 'Box déjeuner léger', category: 'lunch', calories: 510, protein: 45, carbs: 50, fats: 12 },
]

export const programs: ProgramTemplate[] = [
  {
    id: 'beginner_2d',
    name: 'Débutant 2J',
    saga: 'Saga Saiyan',
    split: 'Full Body',
    goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength'],
    levelTags: ['beginner'],
    equipmentTags: ['full_gym', 'basic_gym', 'home_gym'],
    daysPerWeek: 2,
    description: 'Programme full body simple pour développer la technique et la régularité.',
    sessions: [
      { id: 'a', name: 'Séance A', focus: 'Squat, développé, tirage', exercises: [{ exerciseId: 'back_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'barbell_bench_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'rope_pushdown', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'b', name: 'Séance B', focus: 'Soulevé de terre, épaules, tirage', exercises: [{ exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 90 }, { exerciseId: 'chest_supported_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'fullbody_3d',
    name: 'Full Body 3J',
    saga: 'Saga Namek',
    split: 'Full Body',
    goalTags: ['muscle_gain', 'recomp', 'fat_loss'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 3,
    description: 'Fréquence équilibrée avec suffisamment de volume pour progresser.',
    sessions: [
      { id: 'a', name: 'Gravité A', focus: 'Pectoraux et quadriceps', exercises: [{ exerciseId: 'barbell_bench_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row_machine', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise_db', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
      { id: 'b', name: 'Gravité B', focus: 'Dos et fessiers', exercises: [{ exerciseId: 'lat_pulldown_wide', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'db_incline_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'c', name: 'Gravité C', focus: 'Épaules et bras', exercises: [{ exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 90 }, { exerciseId: 'back_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }, { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'upper_lower_4d',
    name: 'Haut/Bas 4J',
    saga: 'Saga Cell',
    split: 'Haut/Bas',
    goalTags: ['muscle_gain', 'recomp', 'strength'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 4,
    description: 'Volume de qualité avec récupération et progression claire.',
    sessions: [
      { id: 'upper_1', name: 'Haut 1', focus: 'Développés et dos', exercises: [{ exerciseId: 'barbell_bench_press', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_1', name: 'Bas 1', focus: 'Dominante squat', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'standing_calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'upper_2', name: 'Haut 2', focus: 'Hypertrophie haut du corps', exercises: [{ exerciseId: 'db_incline_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row_machine', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_2', name: 'Bas 2', focus: 'Chaîne postérieure', exercises: [{ exerciseId: 'leg_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_hip_thrust', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }, { exerciseId: 'standing_calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'ppl_5d',
    name: 'PPL 5J',
    saga: 'Tournoi du Pouvoir',
    split: 'Poussé Tiré Jambes',
    goalTags: ['muscle_gain', 'strength'],
    levelTags: ['advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 5,
    description: 'Split volume élevé pour les pratiquants expérimentés avec bonne récupération.',
    sessions: [
      { id: 'push', name: 'Poussé', focus: 'Pectoraux, épaules, triceps', exercises: [{ exerciseId: 'barbell_bench_press', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'db_incline_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise_db', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'pull', name: 'Tiré', focus: 'Dos et biceps', exercises: [{ exerciseId: 'pull_ups', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'lat_pulldown_wide', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'legs', name: 'Jambes', focus: 'Quadriceps, fessiers, abdominaux', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
    ],
  },
]
