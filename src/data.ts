import type {
  Exercise,
  Food,
  ProgramTemplate,
  Recipe,
  SavedMeal,
} from './types'

export const exercises: Exercise[] = [
  { id: 'bench_press', name: 'Développé couché', equipment: 'Barbell', pattern: 'Horizontal press', primaryMuscles: ['Chest'], secondaryMuscles: ['Shoulders', 'Triceps'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Pieds bien à plat', 'Haut du dos contracté'], executionCues: ['Descente contrôlée', 'Poussée explosive'], alternatives: ['incline_db_press'] },
  { id: 'incline_db_press', name: 'Développé incliné haltères', equipment: 'Dumbbells', pattern: 'Incline press', primaryMuscles: ['Chest'], secondaryMuscles: ['Shoulders', 'Triceps'], difficulty: 2, stimulusFatigue: 7, setupCues: ['Banc faible inclinaison'], executionCues: ['Monter sans hausser les épaules'], alternatives: ['bench_press'] },
  { id: 'lat_pulldown', name: 'Tirage vertical', equipment: 'Cable', pattern: 'Vertical pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Cuisses bloquées'], executionCues: ['Ramener les coudes vers le bas'], alternatives: ['pull_up'] },
  { id: 'pull_up', name: 'Tractions', equipment: 'Bodyweight', pattern: 'Vertical pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps', 'Core'], difficulty: 3, stimulusFatigue: 8, setupCues: ['Abdominaux gainés'], executionCues: ['Tirer les coudes vers les côtes'], alternatives: ['lat_pulldown'] },
  { id: 'chest_supported_row', name: 'Row poitrine appuyée', equipment: 'Machine', pattern: 'Horizontal pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps', 'Shoulders'], difficulty: 1, stimulusFatigue: 7, setupCues: ['Poitrine fixée'], executionCues: ['Maintenir la contraction'], alternatives: ['seated_row'] },
  { id: 'seated_row', name: 'Row assis câble', equipment: 'Cable', pattern: 'Horizontal pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Colonne neutre'], executionCues: ['Pause et retour contrôlé'], alternatives: ['chest_supported_row'] },
  { id: 'overhead_press', name: 'Développé militaire', equipment: 'Barbell', pattern: 'Vertical press', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Core'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Fessiers contractés'], executionCues: ['Pousser droit vers le haut'], alternatives: ['lateral_raise'] },
  { id: 'lateral_raise', name: 'Élévation latérale', equipment: 'Dumbbells', pattern: 'Shoulder isolation', primaryMuscles: ['Shoulders'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 5, setupCues: ['Légère flexion des coudes'], executionCues: ['Mener avec les coudes'], alternatives: ['overhead_press'] },
  { id: 'barbell_curl', name: 'Curl barre', equipment: 'Barbell', pattern: 'Elbow flexion', primaryMuscles: ['Biceps'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Abdominaux gainés'], executionCues: ['Descente contrôlée'], alternatives: ['hammer_curl'] },
  { id: 'rope_pushdown', name: 'Pushdown corde', equipment: 'Cable', pattern: 'Elbow extension', primaryMuscles: ['Triceps'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Coudes plaqués'], executionCues: ['Écarter la corde en bas'], alternatives: ['overhead_extension'] },
  { id: 'back_squat', name: 'Squat barre', equipment: 'Barbell', pattern: 'Squat', primaryMuscles: ['Quads', 'Glutes'], secondaryMuscles: ['Core', 'Hamstrings'], difficulty: 3, stimulusFatigue: 9, setupCues: ['Gainer avant la descente'], executionCues: ['Pousser à travers le milieu du pied'], alternatives: ['leg_press'] },
  { id: 'leg_press', name: 'Presse à cuisses', equipment: 'Machine', pattern: 'Squat', primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes', 'Hamstrings'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Dos plaqué contre le dossier'], executionCues: ['Contrôler la profondeur'], alternatives: ['back_squat'] },
  { id: 'romanian_deadlift', name: 'Soulevé de terre roumain', equipment: 'Barbell', pattern: 'Hip hinge', primaryMuscles: ['Hamstrings', 'Glutes'], secondaryMuscles: ['Back'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Légère flexion des genoux'], executionCues: ['Pousser les hanches vers l\'arrière'], alternatives: ['hip_thrust'] },
  { id: 'hip_thrust', name: 'Hip thrust', equipment: 'Barbell', pattern: 'Hip extension', primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'], difficulty: 2, stimulusFatigue: 6, setupCues: ['Tibias verticaux'], executionCues: ['Pause et contraction en haut'], alternatives: ['romanian_deadlift'] },
  { id: 'calf_raise', name: 'Mollets debout', equipment: 'Machine', pattern: 'Ankle extension', primaryMuscles: ['Calves'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 3, setupCues: ['Pied entier sur la plateforme'], executionCues: ['Contraction forte en haut'], alternatives: [] },
  { id: 'cable_crunch', name: 'Crunch câble', equipment: 'Cable', pattern: 'Spinal flexion', primaryMuscles: ['Core'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Hanches fixes'], executionCues: ['Enrouler la colonne'], alternatives: ['hanging_leg_raise'] },
  { id: 'hanging_leg_raise', name: 'Relevé de jambes suspendu', equipment: 'Bodyweight', pattern: 'Hip flexion', primaryMuscles: ['Core'], secondaryMuscles: [], difficulty: 2, stimulusFatigue: 5, setupCues: ['Bascule pelvienne postérieure'], executionCues: ['Éviter le balancement'], alternatives: ['cable_crunch'] },
]

export const foods: Food[] = [
  { id: 'chicken', name: 'Blanc de poulet', servingGrams: 100, calories: 165, protein: 31, carbs: 0, fats: 4, tags: ['protein'] },
  { id: 'rice', name: 'Riz cuit', servingGrams: 100, calories: 130, protein: 3, carbs: 28, fats: 0.3, tags: ['carb'] },
  { id: 'oats', name: 'Flocons d\'avoine', servingGrams: 100, calories: 389, protein: 17, carbs: 66, fats: 7, tags: ['breakfast'] },
  { id: 'banana', name: 'Banane', servingGrams: 100, calories: 89, protein: 1, carbs: 23, fats: 0.3, tags: ['fruit'] },
  { id: 'salmon', name: 'Filet de saumon', servingGrams: 100, calories: 208, protein: 20, carbs: 0, fats: 13, tags: ['protein'] },
  { id: 'greek_yogurt', name: 'Yaourt grec', servingGrams: 100, calories: 97, protein: 10, carbs: 4, fats: 5, tags: ['snack'] },
  { id: 'egg', name: 'Oeufs entiers', servingGrams: 100, calories: 143, protein: 13, carbs: 1, fats: 10, tags: ['protein'] },
  { id: 'potato', name: 'Patate douce', servingGrams: 100, calories: 86, protein: 2, carbs: 20, fats: 0.1, tags: ['carb'] },
  { id: 'whey', name: 'Whey isolat', servingGrams: 30, calories: 116, protein: 25, carbs: 2, fats: 1, tags: ['protein'] },
  { id: 'almonds', name: 'Amandes', servingGrams: 30, calories: 174, protein: 6, carbs: 6, fats: 15, tags: ['fat'] },
]

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
      { id: 'a', name: 'Séance A', focus: 'Squat, développé, tirage', exercises: [{ exerciseId: 'back_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'bench_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'lat_pulldown', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'rope_pushdown', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
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
      { id: 'a', name: 'Gravité A', focus: 'Pectoraux et quadriceps', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
      { id: 'b', name: 'Gravité B', focus: 'Dos et fessiers', exercises: [{ exerciseId: 'lat_pulldown', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
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
      { id: 'upper_1', name: 'Haut 1', focus: 'Développés et dos', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_1', name: 'Bas 1', focus: 'Dominante squat', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'upper_2', name: 'Haut 2', focus: 'Hypertrophie haut du corps', exercises: [{ exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_2', name: 'Bas 2', focus: 'Chaîne postérieure', exercises: [{ exerciseId: 'leg_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'hip_thrust', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }, { exerciseId: 'calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
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
      { id: 'push', name: 'Poussé', focus: 'Pectoraux, épaules, triceps', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'pull', name: 'Tiré', focus: 'Dos et biceps', exercises: [{ exerciseId: 'pull_up', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'lat_pulldown', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'legs', name: 'Jambes', focus: 'Quadriceps, fessiers, abdominaux', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
    ],
  },
]
