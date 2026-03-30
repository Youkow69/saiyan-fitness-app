import type {
  Exercise,
  Food,
  ProgramTemplate,
  Recipe,
  SavedMeal,
} from './types'

export const exercises: Exercise[] = [
  { id: 'bench_press', name: 'Developpe couche', equipment: 'Barbell', pattern: 'Horizontal press', primaryMuscles: ['Chest'], secondaryMuscles: ['Shoulders', 'Triceps'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Feet planted', 'Upper back tight'], executionCues: ['Control descent', 'Press explosively'], alternatives: ['incline_db_press'] },
  { id: 'incline_db_press', name: 'Developpe incline halteres', equipment: 'Dumbbells', pattern: 'Incline press', primaryMuscles: ['Chest'], secondaryMuscles: ['Shoulders', 'Triceps'], difficulty: 2, stimulusFatigue: 7, setupCues: ['Low incline bench'], executionCues: ['Reach high without shrugging'], alternatives: ['bench_press'] },
  { id: 'lat_pulldown', name: 'Tirage vertical', equipment: 'Cable', pattern: 'Vertical pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Thighs locked'], executionCues: ['Drive elbows down'], alternatives: ['pull_up'] },
  { id: 'pull_up', name: 'Tractions', equipment: 'Bodyweight', pattern: 'Vertical pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps', 'Core'], difficulty: 3, stimulusFatigue: 8, setupCues: ['Brace abs'], executionCues: ['Pull elbows to ribs'], alternatives: ['lat_pulldown'] },
  { id: 'chest_supported_row', name: 'Row poitrine appuyee', equipment: 'Machine', pattern: 'Horizontal pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps', 'Shoulders'], difficulty: 1, stimulusFatigue: 7, setupCues: ['Chest fixed'], executionCues: ['Hold squeeze'], alternatives: ['seated_row'] },
  { id: 'seated_row', name: 'Row assis cable', equipment: 'Cable', pattern: 'Horizontal pull', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Neutral spine'], executionCues: ['Pause and return'], alternatives: ['chest_supported_row'] },
  { id: 'overhead_press', name: 'Developpe militaire', equipment: 'Barbell', pattern: 'Vertical press', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps', 'Core'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Glutes tight'], executionCues: ['Press straight up'], alternatives: ['lateral_raise'] },
  { id: 'lateral_raise', name: 'Elevation laterale', equipment: 'Dumbbells', pattern: 'Shoulder isolation', primaryMuscles: ['Shoulders'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 5, setupCues: ['Soft elbows'], executionCues: ['Lead with elbows'], alternatives: ['overhead_press'] },
  { id: 'barbell_curl', name: 'Curl barre', equipment: 'Barbell', pattern: 'Elbow flexion', primaryMuscles: ['Biceps'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Brace abs'], executionCues: ['Lower under control'], alternatives: ['hammer_curl'] },
  { id: 'rope_pushdown', name: 'Pushdown corde', equipment: 'Cable', pattern: 'Elbow extension', primaryMuscles: ['Triceps'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Elbows pinned'], executionCues: ['Spread rope at bottom'], alternatives: ['overhead_extension'] },
  { id: 'back_squat', name: 'Back squat', equipment: 'Barbell', pattern: 'Squat', primaryMuscles: ['Quads', 'Glutes'], secondaryMuscles: ['Core', 'Hamstrings'], difficulty: 3, stimulusFatigue: 9, setupCues: ['Brace before descent'], executionCues: ['Drive through midfoot'], alternatives: ['leg_press'] },
  { id: 'leg_press', name: 'Leg press', equipment: 'Machine', pattern: 'Squat', primaryMuscles: ['Quads'], secondaryMuscles: ['Glutes', 'Hamstrings'], difficulty: 1, stimulusFatigue: 6, setupCues: ['Brace back into pad'], executionCues: ['Control depth'], alternatives: ['back_squat'] },
  { id: 'romanian_deadlift', name: 'Romanian deadlift', equipment: 'Barbell', pattern: 'Hip hinge', primaryMuscles: ['Hamstrings', 'Glutes'], secondaryMuscles: ['Back'], difficulty: 2, stimulusFatigue: 8, setupCues: ['Soft knees'], executionCues: ['Push hips back'], alternatives: ['hip_thrust'] },
  { id: 'hip_thrust', name: 'Hip thrust', equipment: 'Barbell', pattern: 'Hip extension', primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'], difficulty: 2, stimulusFatigue: 6, setupCues: ['Shins vertical'], executionCues: ['Pause and squeeze'], alternatives: ['romanian_deadlift'] },
  { id: 'calf_raise', name: 'Mollets debout', equipment: 'Machine', pattern: 'Ankle extension', primaryMuscles: ['Calves'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 3, setupCues: ['Full foot on platform'], executionCues: ['Hard top squeeze'], alternatives: [] },
  { id: 'cable_crunch', name: 'Cable crunch', equipment: 'Cable', pattern: 'Spinal flexion', primaryMuscles: ['Core'], secondaryMuscles: [], difficulty: 1, stimulusFatigue: 4, setupCues: ['Hips fixed'], executionCues: ['Crunch spine'], alternatives: ['hanging_leg_raise'] },
  { id: 'hanging_leg_raise', name: 'Hanging leg raise', equipment: 'Bodyweight', pattern: 'Hip flexion', primaryMuscles: ['Core'], secondaryMuscles: [], difficulty: 2, stimulusFatigue: 5, setupCues: ['Posterior pelvic tilt'], executionCues: ['Avoid swinging'], alternatives: ['cable_crunch'] },
]

export const foods: Food[] = [
  { id: 'chicken', name: 'Chicken breast', servingGrams: 100, calories: 165, protein: 31, carbs: 0, fats: 4, tags: ['protein'] },
  { id: 'rice', name: 'Cooked rice', servingGrams: 100, calories: 130, protein: 3, carbs: 28, fats: 0.3, tags: ['carb'] },
  { id: 'oats', name: 'Oats', servingGrams: 100, calories: 389, protein: 17, carbs: 66, fats: 7, tags: ['breakfast'] },
  { id: 'banana', name: 'Banana', servingGrams: 100, calories: 89, protein: 1, carbs: 23, fats: 0.3, tags: ['fruit'] },
  { id: 'salmon', name: 'Salmon', servingGrams: 100, calories: 208, protein: 20, carbs: 0, fats: 13, tags: ['protein'] },
  { id: 'greek_yogurt', name: 'Greek yogurt', servingGrams: 100, calories: 97, protein: 10, carbs: 4, fats: 5, tags: ['snack'] },
  { id: 'egg', name: 'Eggs', servingGrams: 100, calories: 143, protein: 13, carbs: 1, fats: 10, tags: ['protein'] },
  { id: 'potato', name: 'Potato', servingGrams: 100, calories: 77, protein: 2, carbs: 17, fats: 0.1, tags: ['carb'] },
  { id: 'whey', name: 'Whey isolate', servingGrams: 30, calories: 116, protein: 25, carbs: 2, fats: 1, tags: ['protein'] },
  { id: 'almonds', name: 'Almonds', servingGrams: 30, calories: 174, protein: 6, carbs: 6, fats: 15, tags: ['fat'] },
]

export const recipes: Recipe[] = [
  { id: 'senzu_oats', name: 'Senzu overnight oats', category: 'breakfast', prepMinutes: 8, calories: 480, protein: 34, carbs: 58, fats: 12, servings: 1, ingredients: ['80g oats', '200g greek yogurt', 'berries'], steps: ['Mix', 'Chill', 'Eat'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'capsule_omelet', name: 'Capsule omelet', category: 'breakfast', prepMinutes: 10, calories: 420, protein: 32, carbs: 18, fats: 24, servings: 1, ingredients: ['eggs', 'egg whites', 'spinach'], steps: ['Cook', 'Fold', 'Serve'], goalTags: ['muscle_gain', 'recomp', 'strength'] },
  { id: 'namek_rice_bowl', name: 'Namek chicken rice bowl', category: 'lunch', prepMinutes: 18, calories: 620, protein: 48, carbs: 72, fats: 14, servings: 1, ingredients: ['chicken', 'rice', 'broccoli'], steps: ['Cook chicken', 'Steam veg', 'Serve on rice'], goalTags: ['muscle_gain', 'recomp', 'strength', 'endurance'] },
  { id: 'saiyan_wrap', name: 'Saiyan protein wrap', category: 'lunch', prepMinutes: 12, calories: 510, protein: 42, carbs: 45, fats: 16, servings: 1, ingredients: ['wrap', 'chicken', 'veg'], steps: ['Warm wrap', 'Fill', 'Roll'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'frieza_salmon_plate', name: 'Frieza salmon plate', category: 'dinner', prepMinutes: 22, calories: 560, protein: 40, carbs: 38, fats: 26, servings: 1, ingredients: ['salmon', 'potato', 'greens'], steps: ['Bake salmon', 'Roast potato', 'Serve'], goalTags: ['fat_loss', 'recomp', 'strength'] },
  { id: 'gravity_yogurt_bowl', name: 'Gravity yogurt bowl', category: 'snack', prepMinutes: 5, calories: 300, protein: 27, carbs: 28, fats: 8, servings: 1, ingredients: ['yogurt', 'berries', 'granola'], steps: ['Combine', 'Top', 'Eat'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
  { id: 'kaioken_bagel', name: 'Kaioken pre-workout bagel', category: 'pre_workout', prepMinutes: 4, calories: 340, protein: 16, carbs: 57, fats: 5, servings: 1, ingredients: ['bagel', 'jam', 'whey'], steps: ['Toast', 'Spread', 'Drink whey'], goalTags: ['muscle_gain', 'strength', 'endurance'] },
  { id: 'instant_ki_shake', name: 'Instant ki shake', category: 'post_workout', prepMinutes: 3, calories: 270, protein: 31, carbs: 24, fats: 3, servings: 1, ingredients: ['whey', 'banana', 'milk'], steps: ['Blend', 'Drink'], goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength', 'endurance'] },
]

export const savedMeals: SavedMeal[] = [
  { id: 'post_leg_day', name: 'Post leg day stack', category: 'post_workout', calories: 540, protein: 43, carbs: 66, fats: 10 },
  { id: 'lean_lunch', name: 'Lean lunch box', category: 'lunch', calories: 510, protein: 45, carbs: 50, fats: 12 },
]

export const programs: ProgramTemplate[] = [
  {
    id: 'beginner_2d',
    name: 'Beginner 2d',
    saga: 'Saga Saiyan',
    split: 'Full body',
    goalTags: ['muscle_gain', 'fat_loss', 'recomp', 'strength'],
    levelTags: ['beginner'],
    equipmentTags: ['full_gym', 'basic_gym', 'home_gym'],
    daysPerWeek: 2,
    description: 'Low complexity full-body plan to build skill and momentum.',
    sessions: [
      { id: 'a', name: 'Day A', focus: 'Squat, press, row', exercises: [{ exerciseId: 'back_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'bench_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'lat_pulldown', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'rope_pushdown', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'b', name: 'Day B', focus: 'Hinge, press, pull', exercises: [{ exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 90 }, { exerciseId: 'chest_supported_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'fullbody_3d',
    name: 'Full Body 3d',
    saga: 'Saga Namek',
    split: 'Full body',
    goalTags: ['muscle_gain', 'recomp', 'fat_loss'],
    levelTags: ['beginner', 'intermediate'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 3,
    description: 'Balanced frequency with enough volume to grow.',
    sessions: [
      { id: 'a', name: 'Gravity A', focus: 'Chest and quads', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
      { id: 'b', name: 'Gravity B', focus: 'Back and glutes', exercises: [{ exerciseId: 'lat_pulldown', sets: 4, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'c', name: 'Gravity C', focus: 'Shoulders and arms', exercises: [{ exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 90 }, { exerciseId: 'back_squat', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }, { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'upper_lower_4d',
    name: 'Upper Lower 4d',
    saga: 'Saga Cell',
    split: 'Upper Lower',
    goalTags: ['muscle_gain', 'recomp', 'strength'],
    levelTags: ['intermediate', 'advanced'],
    equipmentTags: ['full_gym', 'basic_gym'],
    daysPerWeek: 4,
    description: 'High quality volume with recovery room and clear progression.',
    sessions: [
      { id: 'upper_1', name: 'Upper 1', focus: 'Press and back', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 6, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'overhead_press', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'barbell_curl', sets: 2, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_1', name: 'Lower 1', focus: 'Squat dominant', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'upper_2', name: 'Upper 2', focus: 'Hypertrophy upper', exercises: [{ exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'seated_row', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'lower_2', name: 'Lower 2', focus: 'Posterior chain', exercises: [{ exerciseId: 'leg_press', sets: 3, repMin: 8, repMax: 12, targetRir: 2, restSeconds: 90 }, { exerciseId: 'hip_thrust', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'hanging_leg_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }, { exerciseId: 'calf_raise', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
    ],
  },
  {
    id: 'ppl_5d',
    name: 'PPL 5d',
    saga: 'Tournament of Power',
    split: 'Push Pull Legs',
    goalTags: ['muscle_gain', 'strength'],
    levelTags: ['advanced'],
    equipmentTags: ['full_gym'],
    daysPerWeek: 5,
    description: 'Higher volume split for experienced users who recover well.',
    sessions: [
      { id: 'push', name: 'Push', focus: 'Chest, shoulders, triceps', exercises: [{ exerciseId: 'bench_press', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'incline_db_press', sets: 3, repMin: 8, repMax: 10, targetRir: 2, restSeconds: 90 }, { exerciseId: 'lateral_raise', sets: 4, repMin: 12, repMax: 20, targetRir: 1, restSeconds: 60 }, { exerciseId: 'rope_pushdown', sets: 3, repMin: 10, repMax: 15, targetRir: 1, restSeconds: 60 }] },
      { id: 'pull', name: 'Pull', focus: 'Back and biceps', exercises: [{ exerciseId: 'pull_up', sets: 4, repMin: 5, repMax: 8, targetRir: 2, restSeconds: 150 }, { exerciseId: 'chest_supported_row', sets: 4, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'lat_pulldown', sets: 3, repMin: 8, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'barbell_curl', sets: 3, repMin: 10, repMax: 14, targetRir: 1, restSeconds: 60 }] },
      { id: 'legs', name: 'Legs', focus: 'Quads, glutes, core', exercises: [{ exerciseId: 'back_squat', sets: 4, repMin: 5, repMax: 7, targetRir: 2, restSeconds: 150 }, { exerciseId: 'romanian_deadlift', sets: 3, repMin: 6, repMax: 8, targetRir: 2, restSeconds: 120 }, { exerciseId: 'leg_press', sets: 3, repMin: 10, repMax: 12, targetRir: 1, restSeconds: 90 }, { exerciseId: 'cable_crunch', sets: 3, repMin: 12, repMax: 18, targetRir: 1, restSeconds: 60 }] },
    ],
  },
]
